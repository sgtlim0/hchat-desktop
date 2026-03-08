import asyncio
import json
from concurrent.futures import ThreadPoolExecutor

from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from backend.services.bedrock import (
    converse_sync,
    create_client,
    validate_model,
)

router = APIRouter()

_executor = ThreadPoolExecutor(max_workers=5)


class Credentials(BaseModel):
    accessKeyId: str
    secretAccessKey: str
    region: str


class SwarmAgentDef(BaseModel):
    role: str
    prompt: str


class SwarmExecuteRequest(BaseModel):
    agents: list[SwarmAgentDef]
    task: str
    modelId: str
    credentials: Credentials
    strategy: str = "pipeline"  # pipeline | parallel | debate


@router.post("/swarm/execute")
async def execute_swarm(req: SwarmExecuteRequest):
    try:
        validate_model(req.modelId)
    except ValueError as e:
        return StreamingResponse(
            _error_stream(str(e)),
            media_type="text/event-stream",
        )

    client = create_client(
        access_key_id=req.credentials.accessKeyId,
        secret_access_key=req.credentials.secretAccessKey,
        region=req.credentials.region,
    )

    if req.strategy == "parallel":
        gen = _parallel_strategy(client, req)
    elif req.strategy == "debate":
        gen = _debate_strategy(client, req)
    else:
        gen = _pipeline_strategy(client, req)

    return StreamingResponse(
        gen,
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    )


async def _pipeline_strategy(client, req: SwarmExecuteRequest):
    """Sequential execution: each agent receives previous agents' context."""
    context_parts: list[str] = []

    try:
        for agent in req.agents:
            role = agent.role
            yield _sse({"type": "agent_start", "role": role})

            system_prompt = (
                f"You are a {role} agent. {agent.prompt}\n\n"
                f"Task: {req.task}"
            )
            if context_parts:
                context = "\n\n---\n\n".join(context_parts)
                system_prompt += f"\n\nPrevious agents' outputs:\n{context}"

            result = await _run_agent(client, req.modelId, req.task, system_prompt)

            yield _sse({"type": "agent_text", "role": role, "content": result})
            context_parts.append(f"[{role}]: {result}")
            yield _sse({"type": "agent_done", "role": role})

        yield _sse({"type": "swarm_done"})
    except Exception as e:
        yield _sse({"type": "error", "error": str(e)})


async def _parallel_strategy(client, req: SwarmExecuteRequest):
    """Parallel execution: first agent plans, middle agents run in parallel, last synthesizes."""
    agents = req.agents
    if len(agents) < 2:
        async for event in _pipeline_strategy(client, req):
            yield event
        return

    try:
        # Step 1: First agent (planner) runs sequentially
        planner = agents[0]
        yield _sse({"type": "agent_start", "role": planner.role})

        planner_prompt = (
            f"You are a {planner.role} agent. {planner.prompt}\n\n"
            f"Task: {req.task}"
        )
        planner_result = await _run_agent(client, req.modelId, req.task, planner_prompt)

        yield _sse({"type": "agent_text", "role": planner.role, "content": planner_result})
        yield _sse({"type": "agent_done", "role": planner.role})

        # Step 2: Middle agents run in parallel
        middle_agents = agents[1:-1] if len(agents) > 2 else []
        synthesizer = agents[-1] if len(agents) > 1 else None

        parallel_results: dict[str, str] = {}

        if middle_agents:
            for a in middle_agents:
                yield _sse({"type": "agent_start", "role": a.role})

            tasks = []
            for a in middle_agents:
                system_prompt = (
                    f"You are a {a.role} agent. {a.prompt}\n\n"
                    f"Task: {req.task}\n\n"
                    f"Context from planner:\n{planner_result}"
                )
                tasks.append(_run_agent(client, req.modelId, req.task, system_prompt))

            results = await asyncio.gather(*tasks, return_exceptions=True)

            for agent_def, result in zip(middle_agents, results):
                if isinstance(result, Exception):
                    yield _sse({"type": "agent_text", "role": agent_def.role, "content": f"Error: {result}"})
                else:
                    parallel_results[agent_def.role] = result
                    yield _sse({"type": "agent_text", "role": agent_def.role, "content": result})
                yield _sse({"type": "agent_done", "role": agent_def.role})

        # Step 3: Last agent (synthesizer) merges results
        if synthesizer:
            yield _sse({"type": "agent_start", "role": synthesizer.role})

            all_context = f"[{planner.role}]: {planner_result}"
            for role_name, result in parallel_results.items():
                all_context += f"\n\n---\n\n[{role_name}]: {result}"

            synth_prompt = (
                f"You are a {synthesizer.role} agent. {synthesizer.prompt}\n\n"
                f"Task: {req.task}\n\n"
                f"All agents' outputs:\n{all_context}\n\n"
                f"Synthesize the above outputs into a coherent final result."
            )
            synth_result = await _run_agent(client, req.modelId, req.task, synth_prompt)

            yield _sse({"type": "agent_text", "role": synthesizer.role, "content": synth_result})
            yield _sse({"type": "agent_done", "role": synthesizer.role})

        yield _sse({"type": "swarm_done"})
    except Exception as e:
        yield _sse({"type": "error", "error": str(e)})


async def _debate_strategy(client, req: SwarmExecuteRequest):
    """Debate: agents take turns arguing, last agent judges."""
    agents = req.agents
    if len(agents) < 2:
        async for event in _pipeline_strategy(client, req):
            yield event
        return

    try:
        debaters = agents[:-1]
        judge = agents[-1]
        rounds = 2
        debate_history: list[str] = []

        for round_num in range(1, rounds + 1):
            for agent_def in debaters:
                role_label = f"{agent_def.role} (round {round_num})"
                yield _sse({"type": "agent_start", "role": role_label})

                history_text = "\n\n---\n\n".join(debate_history) if debate_history else "No prior arguments."
                system_prompt = (
                    f"You are a {agent_def.role} agent. {agent_def.prompt}\n\n"
                    f"Task: {req.task}\n\n"
                    f"Debate round {round_num}. Prior arguments:\n{history_text}\n\n"
                    f"Present your perspective. If this is round 2+, respond to other arguments."
                )

                result = await _run_agent(client, req.modelId, req.task, system_prompt)

                yield _sse({"type": "agent_text", "role": role_label, "content": result})
                debate_history.append(f"[{agent_def.role} R{round_num}]: {result}")
                yield _sse({"type": "agent_done", "role": role_label})

        # Judge synthesizes
        yield _sse({"type": "agent_start", "role": judge.role})
        full_debate = "\n\n---\n\n".join(debate_history)
        judge_prompt = (
            f"You are a {judge.role} agent. {judge.prompt}\n\n"
            f"Task: {req.task}\n\n"
            f"Full debate:\n{full_debate}\n\n"
            f"Evaluate all arguments and provide a balanced final verdict."
        )
        judge_result = await _run_agent(client, req.modelId, req.task, judge_prompt)

        yield _sse({"type": "agent_text", "role": judge.role, "content": judge_result})
        yield _sse({"type": "agent_done", "role": judge.role})

        yield _sse({"type": "swarm_done"})
    except Exception as e:
        yield _sse({"type": "error", "error": str(e)})


async def _run_agent(client, model_id: str, task: str, system_prompt: str) -> str:
    """Run a single agent call in thread pool (converse_sync is blocking)."""
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(
        _executor,
        converse_sync,
        client,
        model_id,
        [{"role": "user", "content": task}],
        system_prompt,
    )


def _sse(data: dict) -> str:
    return f"data: {json.dumps(data)}\n\n"


async def _error_stream(message: str):
    yield f"data: {json.dumps({'type': 'error', 'error': message})}\n\n"
