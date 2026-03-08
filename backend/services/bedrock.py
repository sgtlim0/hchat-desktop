import boto3
from botocore.config import Config

ALLOWED_MODELS = {
    "us.anthropic.claude-sonnet-4-6",
    "us.anthropic.claude-opus-4-6-v1",
    "us.anthropic.claude-haiku-4-5-20251001-v1:0",
}


def validate_model(model_id: str) -> None:
    if model_id not in ALLOWED_MODELS:
        raise ValueError(f"Model not allowed: {model_id}")


def create_client(
    access_key_id: str,
    secret_access_key: str,
    region: str,
):
    return boto3.client(
        "bedrock-runtime",
        region_name=region,
        aws_access_key_id=access_key_id,
        aws_secret_access_key=secret_access_key,
        config=Config(read_timeout=600),
    )


def build_converse_params(
    model_id: str,
    messages: list[dict],
    system: str | None = None,
    max_tokens: int | None = None,
) -> dict:
    bedrock_messages = [
        {"role": m["role"], "content": [{"text": m["content"]}]}
        for m in messages
    ]

    params: dict = {
        "modelId": model_id,
        "messages": bedrock_messages,
    }

    if system:
        params["system"] = [{"text": system}]

    if max_tokens:
        params["inferenceConfig"] = {"maxTokens": max_tokens}

    return params


def converse_sync(
    client,
    model_id: str,
    messages: list[dict],
    system: str | None = None,
    max_tokens: int = 4096,
) -> str:
    """Non-streaming converse call. Returns the response text."""
    params = build_converse_params(
        model_id=model_id,
        messages=messages,
        system=system,
        max_tokens=max_tokens,
    )

    response = client.converse(**params)

    output = response.get("output", {})
    message = output.get("message", {})
    content_blocks = message.get("content", [])

    parts: list[str] = []
    for block in content_blocks:
        text = block.get("text")
        if text:
            parts.append(text)

    return "\n".join(parts)


def invoke_text(
    access_key_id: str,
    secret_access_key: str,
    region: str,
    model_id: str,
    prompt: str,
    max_tokens: int = 2048,
) -> str:
    """Single prompt → text response. Used for Confluence/Jira AI summaries."""
    client = create_client(access_key_id, secret_access_key, region)
    return converse_sync(
        client=client,
        model_id=model_id,
        messages=[{"role": "user", "content": prompt}],
        max_tokens=max_tokens,
    )
