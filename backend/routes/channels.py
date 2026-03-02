import httpx
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class SlackNotifyConfig(BaseModel):
    webhookUrl: str


class TelegramNotifyConfig(BaseModel):
    botToken: str
    chatId: str


class ChannelNotifyRequest(BaseModel):
    channel: str  # "slack" | "telegram"
    message: str
    config: dict


@router.post("/channels/notify")
async def notify_channel(req: ChannelNotifyRequest):
    try:
        if req.channel == "slack":
            webhook_url = req.config.get("webhookUrl")
            if not webhook_url:
                return {"success": False, "error": "webhookUrl is required"}

            async with httpx.AsyncClient(timeout=10) as client:
                response = await client.post(
                    webhook_url,
                    json={"text": req.message},
                )
                response.raise_for_status()

            return {"success": True}

        elif req.channel == "telegram":
            bot_token = req.config.get("botToken")
            chat_id = req.config.get("chatId")
            if not bot_token or not chat_id:
                return {
                    "success": False,
                    "error": "botToken and chatId are required",
                }

            url = f"https://api.telegram.org/bot{bot_token}/sendMessage"

            async with httpx.AsyncClient(timeout=10) as client:
                response = await client.post(
                    url,
                    json={"chat_id": chat_id, "text": req.message},
                )
                response.raise_for_status()

            return {"success": True}

        else:
            return {"success": False, "error": f"Unknown channel: {req.channel}"}

    except Exception as e:
        return {"success": False, "error": str(e)}
