import json

from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from backend.services.bedrock import (
    converse_sync,
    create_client,
    validate_model,
)

router = APIRouter()


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

    async def generate():
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
                    system_prompt += (
                        f"\n\nPrevious agents' outputs:\n{context}"
                    )

                result = converse_sync(
                    client=client,
                    model_id=req.modelId,
                    messages=[{"role": "user", "content": req.task}],
                    system=system_prompt,
                )

                yield _sse({
                    "type": "agent_text",
                    "role": role,
                    "content": result,
                })

                context_parts.append(f"[{role}]: {result}")

                yield _sse({"type": "agent_done", "role": role})

            yield _sse({"type": "swarm_done"})

        except Exception as e:
            yield _sse({"type": "error", "error": str(e)})

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    )


def _sse(data: dict) -> str:
    return f"data: {json.dumps(data)}\n\n"


async def _error_stream(message: str):
    yield f"data: {json.dumps({'type': 'error', 'error': message})}\n\n"
