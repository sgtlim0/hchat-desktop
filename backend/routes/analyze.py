import json

from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from backend.services.bedrock import build_converse_params, create_client, validate_model

router = APIRouter()


class AnalyzeCredentials(BaseModel):
    accessKeyId: str
    secretAccessKey: str
    region: str


class AnalyzeRequest(BaseModel):
    url: str
    title: str
    bodyText: str
    selectedText: str = ""
    mode: str = "summarize"  # summarize | explain | research | translate
    credentials: AnalyzeCredentials
    modelId: str


ANALYZE_PROMPTS = {
    "summarize": "Summarize the following web page content in 3-5 sentences.\n\nTitle: {title}\n\n{content}",
    "explain": "Explain the following content in simple terms that a beginner can understand.\n\n{content}",
    "research": "Analyze the following content and provide key insights.\n\nTitle: {title}\n\n{content}",
    "translate": "Translate the following content into Korean naturally.\n\n{content}",
}


@router.post("/analyze")
async def analyze_page(req: AnalyzeRequest):
    """Analyze web page content from Chrome Extension."""
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

    content = req.selectedText if req.selectedText else req.bodyText
    template = ANALYZE_PROMPTS.get(req.mode, ANALYZE_PROMPTS["summarize"])
    prompt = template.format(title=req.title, content=content[:3000])

    return StreamingResponse(
        _analyze_stream(client, req.modelId, prompt),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive"},
    )


async def _analyze_stream(client, model_id: str, prompt: str):
    """Stream analysis result via SSE."""
    try:
        params = build_converse_params(
            model_id=model_id,
            messages=[{"role": "user", "content": prompt}],
        )
        response = client.converse_stream(**params)
        stream = response.get("stream", [])

        for event in stream:
            delta = event.get("contentBlockDelta", {}).get("delta", {})
            text = delta.get("text")
            if text:
                yield f"data: {json.dumps({'type': 'text', 'content': text}, ensure_ascii=False)}\n\n"

            if "messageStop" in event:
                yield f"data: {json.dumps({'type': 'done'})}\n\n"

    except Exception as e:
        yield f"data: {json.dumps({'type': 'error', 'error': str(e)})}\n\n"


async def _error_stream(message: str):
    yield f"data: {json.dumps({'type': 'error', 'error': message})}\n\n"
