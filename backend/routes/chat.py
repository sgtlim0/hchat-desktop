import json

from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from backend.services.bedrock import (
    build_converse_params,
    create_client,
    validate_model,
)

router = APIRouter()


class Credentials(BaseModel):
    accessKeyId: str
    secretAccessKey: str
    region: str


class ChatRequest(BaseModel):
    credentials: Credentials
    modelId: str
    messages: list[dict]
    system: str | None = None


class TestRequest(BaseModel):
    credentials: Credentials
    modelId: str


@router.post("/chat")
async def chat(req: ChatRequest):
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

    params = build_converse_params(
        model_id=req.modelId,
        messages=req.messages,
        system=req.system,
    )

    async def generate():
        try:
            response = client.converse_stream(**params)
            stream = response.get("stream", [])

            for event in stream:
                delta = event.get("contentBlockDelta", {}).get("delta", {})
                text = delta.get("text")
                if text:
                    data = json.dumps({"type": "text", "content": text})
                    yield f"data: {data}\n\n"

                metadata = event.get("metadata")
                if metadata:
                    usage = metadata.get("usage")
                    if usage:
                        usage_data = json.dumps({
                            "type": "usage",
                            "inputTokens": usage.get("inputTokens", 0),
                            "outputTokens": usage.get("outputTokens", 0),
                        })
                        yield f"data: {usage_data}\n\n"

                if "messageStop" in event:
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


@router.post("/chat/test")
async def chat_test(req: TestRequest):
    try:
        validate_model(req.modelId)

        client = create_client(
            access_key_id=req.credentials.accessKeyId,
            secret_access_key=req.credentials.secretAccessKey,
            region=req.credentials.region,
        )

        params = build_converse_params(
            model_id=req.modelId,
            messages=[{"role": "user", "content": "Hi"}],
            max_tokens=1,
        )

        response = client.converse_stream(**params)
        stream = response.get("stream", [])

        for _event in stream:
            pass

        return {"success": True}

    except Exception as e:
        return {"success": False, "error": str(e)}


async def _error_stream(message: str):
    yield f"data: {json.dumps({'type': 'error', 'error': message})}\n\n"
