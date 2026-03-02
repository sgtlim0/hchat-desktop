import json
import os

from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

router = APIRouter()


class GeminiChatRequest(BaseModel):
    apiKey: str | None = None
    modelId: str
    messages: list[dict]
    system: str | None = None


@router.post("/gemini/chat")
async def gemini_chat(req: GeminiChatRequest):
    async def generate():
        try:
            from google import genai
            from google.genai import types

            api_key = req.apiKey or os.environ.get("GEMINI_API_KEY")
            if not api_key:
                yield f"data: {json.dumps({'type': 'error', 'error': 'Gemini API key not configured'})}\n\n"
                return

            client = genai.Client(api_key=api_key)

            contents = []
            for msg in req.messages:
                role = "model" if msg["role"] == "assistant" else "user"
                contents.append(
                    types.Content(
                        role=role,
                        parts=[types.Part.from_text(text=msg["content"])],
                    )
                )

            config = types.GenerateContentConfig()
            if req.system:
                config.system_instruction = req.system

            response = client.models.generate_content_stream(
                model=req.modelId,
                contents=contents,
                config=config,
            )

            input_tokens = 0
            output_tokens = 0

            for chunk in response:
                text = chunk.text
                if text:
                    data = json.dumps({"type": "text", "content": text})
                    yield f"data: {data}\n\n"

                if chunk.usage_metadata:
                    input_tokens = chunk.usage_metadata.prompt_token_count or 0
                    output_tokens = chunk.usage_metadata.candidates_token_count or 0

            if input_tokens or output_tokens:
                usage_data = json.dumps({
                    "type": "usage",
                    "inputTokens": input_tokens,
                    "outputTokens": output_tokens,
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
