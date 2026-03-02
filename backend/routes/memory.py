import json

from fastapi import APIRouter
from pydantic import BaseModel

from backend.services.bedrock import create_client, build_converse_params

router = APIRouter()

EXTRACTION_SYSTEM_PROMPT = """You are a memory extraction assistant. Analyze the conversation and extract key facts, user preferences, and important information.

Return ONLY a valid JSON array of objects with this structure:
[
  { "key": "short descriptive label", "value": "the extracted fact or preference", "scope": "session" }
]

Rules:
- Extract only concrete, useful facts (names, preferences, technical details, decisions)
- Skip greetings, small talk, and generic statements
- Use "session" scope for conversation-specific facts
- Use "global" scope for user preferences that apply broadly
- Return an empty array [] if no meaningful facts found
- Return ONLY the JSON array, no markdown, no explanation"""

EXTRACTION_MODEL = "us.anthropic.claude-haiku-4-5-20251001-v1:0"


class Credentials(BaseModel):
    accessKeyId: str
    secretAccessKey: str
    region: str


class ExtractMemoryRequest(BaseModel):
    messages: list[dict]
    credentials: Credentials


@router.post("/extract-memory")
async def extract_memory(req: ExtractMemoryRequest):
    try:
        client = create_client(
            access_key_id=req.credentials.accessKeyId,
            secret_access_key=req.credentials.secretAccessKey,
            region=req.credentials.region,
        )

        # Build conversation summary for extraction
        conversation_text = "\n".join(
            f"{m.get('role', 'user')}: {m.get('content', '')}"
            for m in req.messages
            if m.get("content")
        )

        params = build_converse_params(
            model_id=EXTRACTION_MODEL,
            messages=[
                {
                    "role": "user",
                    "content": f"Extract key facts from this conversation:\n\n{conversation_text}",
                }
            ],
            system=EXTRACTION_SYSTEM_PROMPT,
            max_tokens=2048,
        )

        response = client.converse(**params)

        # Extract text from response
        output = response.get("output", {})
        message = output.get("message", {})
        content_blocks = message.get("content", [])

        raw_text = ""
        for block in content_blocks:
            if "text" in block:
                raw_text += block["text"]

        # Parse JSON from response
        raw_text = raw_text.strip()
        if raw_text.startswith("```"):
            # Strip markdown code fences
            lines = raw_text.split("\n")
            raw_text = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])

        memories = json.loads(raw_text)

        if not isinstance(memories, list):
            return {"memories": [], "error": "LLM returned non-array response"}

        # Validate each entry
        validated = []
        for mem in memories:
            if isinstance(mem, dict) and "key" in mem and "value" in mem:
                validated.append(
                    {
                        "key": str(mem["key"]),
                        "value": str(mem["value"]),
                        "scope": mem.get("scope", "session"),
                    }
                )

        return {"memories": validated}

    except json.JSONDecodeError:
        return {"memories": [], "error": "Failed to parse LLM response as JSON"}
    except Exception as e:
        return {"memories": [], "error": str(e)}
