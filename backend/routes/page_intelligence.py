"""Page Intelligence endpoint — LLM-based extraction strategy suggestion."""

import asyncio
import json
from concurrent.futures import ThreadPoolExecutor

from fastapi import APIRouter
from pydantic import BaseModel, Field

from backend.services.bedrock import converse_sync, create_client, validate_model

router = APIRouter()
_executor = ThreadPoolExecutor(max_workers=3)


class Credentials(BaseModel):
    accessKeyId: str
    secretAccessKey: str
    region: str


class StrategySuggestionRequest(BaseModel):
    domSummary: str = Field(..., description="Compact DOM structure summary")
    existingStrategies: str = Field("", description="Already tried strategies")
    url: str = Field("", description="Page URL for context")
    credentials: Credentials
    modelId: str


class QualityEvalRequest(BaseModel):
    extractedData: list[dict] = Field(..., description="Extracted records")
    columns: list[str] = Field(..., description="Column names")
    pageTitle: str = Field("", description="Page title for context")
    credentials: Credentials
    modelId: str


STRATEGY_SYSTEM_PROMPT = """You are a web data extraction expert. Given a DOM structure summary,
suggest CSS selectors for extracting structured data.

Return ONLY a JSON object with this format:
{
  "strategies": [
    {
      "name": "descriptive name",
      "type": "table|list|card|article",
      "container": "CSS selector for parent container",
      "item": "CSS selector for repeating items",
      "fields": [
        {"name": "field_name", "selector": "CSS selector relative to item", "type": "text|number|link|image", "attribute": "textContent|href|src"}
      ]
    }
  ]
}

Rules:
- Suggest 1-3 strategies, prioritized by data density
- Use specific CSS selectors (prefer classes over tag-only selectors)
- Each strategy must have at least 2 fields
- Focus on repeating data patterns (product lists, search results, tables)
- If the DOM has no clear repeating patterns, return {"strategies": []}"""


QUALITY_SYSTEM_PROMPT = """You are a data quality analyst. Evaluate the extracted data and provide
feedback for improving extraction quality.

Return ONLY a JSON object:
{
  "qualityScore": 0.0-1.0,
  "issues": ["list of identified issues"],
  "suggestions": ["list of improvement suggestions"],
  "missingFields": ["fields that might be missing"],
  "noiseFields": ["fields that seem like noise/irrelevant data"]
}"""


@router.post("/page-intelligence/suggest-strategy")
async def suggest_strategy(req: StrategySuggestionRequest):
    """Use LLM to suggest extraction strategies for a page."""
    try:
        validate_model(req.modelId)
    except ValueError as e:
        return {"strategies": [], "error": str(e)}

    client = create_client(
        access_key_id=req.credentials.accessKeyId,
        secret_access_key=req.credentials.secretAccessKey,
        region=req.credentials.region,
    )

    user_prompt = f"""Analyze this DOM structure and suggest data extraction strategies.

URL: {req.url}

DOM Structure:
{req.domSummary[:3000]}

Already tried strategies:
{req.existingStrategies or 'None'}

Suggest new/better extraction strategies that haven't been tried yet."""

    loop = asyncio.get_event_loop()
    try:
        result = await loop.run_in_executor(
            _executor,
            converse_sync,
            client,
            req.modelId,
            [{"role": "user", "content": user_prompt}],
            STRATEGY_SYSTEM_PROMPT,
            2048,
        )

        # Parse JSON from response
        text = result.strip()
        start = text.find("{")
        end = text.rfind("}") + 1
        if start >= 0 and end > start:
            parsed = json.loads(text[start:end])
            return parsed

        return {"strategies": []}

    except Exception as e:
        return {"strategies": [], "error": str(e)}


@router.post("/page-intelligence/evaluate-quality")
async def evaluate_quality(req: QualityEvalRequest):
    """Use LLM to evaluate extraction quality and suggest improvements."""
    try:
        validate_model(req.modelId)
    except ValueError as e:
        return {"qualityScore": 0, "error": str(e)}

    client = create_client(
        access_key_id=req.credentials.accessKeyId,
        secret_access_key=req.credentials.secretAccessKey,
        region=req.credentials.region,
    )

    # Build data preview (first 5 rows)
    preview_rows = req.extractedData[:5]
    data_preview = json.dumps(preview_rows, indent=2, ensure_ascii=False)

    user_prompt = f"""Evaluate this extracted data from "{req.pageTitle}".

Columns: {', '.join(req.columns)}
Total rows: {len(req.extractedData)}

Data preview (first 5 rows):
{data_preview}

Assess the quality and suggest improvements."""

    loop = asyncio.get_event_loop()
    try:
        result = await loop.run_in_executor(
            _executor,
            converse_sync,
            client,
            req.modelId,
            [{"role": "user", "content": user_prompt}],
            QUALITY_SYSTEM_PROMPT,
            1024,
        )

        text = result.strip()
        start = text.find("{")
        end = text.rfind("}") + 1
        if start >= 0 and end > start:
            return json.loads(text[start:end])

        return {"qualityScore": 0.5, "issues": [], "suggestions": []}

    except Exception as e:
        return {"qualityScore": 0, "error": str(e)}
