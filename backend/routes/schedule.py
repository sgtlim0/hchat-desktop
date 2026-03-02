from datetime import datetime, timezone

from fastapi import APIRouter
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


class ScheduleExecuteRequest(BaseModel):
    prompt: str
    modelId: str
    credentials: Credentials
    webhookUrl: str | None = None


@router.post("/schedule/execute")
async def execute_schedule(req: ScheduleExecuteRequest):
    try:
        validate_model(req.modelId)

        client = create_client(
            access_key_id=req.credentials.accessKeyId,
            secret_access_key=req.credentials.secretAccessKey,
            region=req.credentials.region,
        )

        result = converse_sync(
            client=client,
            model_id=req.modelId,
            messages=[{"role": "user", "content": req.prompt}],
        )

        executed_at = datetime.now(timezone.utc).isoformat()

        if req.webhookUrl:
            try:
                import httpx

                async with httpx.AsyncClient(timeout=10) as http:
                    await http.post(
                        req.webhookUrl,
                        json={
                            "text": f"Schedule executed:\n{result}",
                        },
                    )
            except Exception:
                pass  # Webhook delivery is best-effort

        return {
            "success": True,
            "result": result,
            "executedAt": executed_at,
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "executedAt": datetime.now(timezone.utc).isoformat(),
        }
