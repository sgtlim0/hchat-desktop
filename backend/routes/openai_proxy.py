import json

from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

router = APIRouter()


class OpenAIChatRequest(BaseModel):
    apiKey: str
    modelId: str
    messages: list[dict]
    system: str | None = None


@router.post("/openai/chat")
async def openai_chat(req: OpenAIChatRequest):
    async def generate():
        try:
            from openai import OpenAI

            client = OpenAI(api_key=req.apiKey)

            messages = []
            if req.system:
                messages.append({"role": "system", "content": req.system})
            messages.extend(req.messages)

            response = client.chat.completions.create(
                model=req.modelId,
                messages=messages,
                stream=True,
                stream_options={"include_usage": True},
            )

            for chunk in response:
                if chunk.choices:
                    delta = chunk.choices[0].delta
                    if delta.content:
                        data = json.dumps({"type": "text", "content": delta.content})
                        yield f"data: {data}\n\n"

                if chunk.usage:
                    usage_data = json.dumps({
                        "type": "usage",
                        "inputTokens": chunk.usage.prompt_tokens,
                        "outputTokens": chunk.usage.completion_tokens,
                    })
                    yield f"data: {usage_data}\n\n"

            yield f"data: {json.dumps({'type': 'done'})}\n\n"

        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'error': str(e)})}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    )
