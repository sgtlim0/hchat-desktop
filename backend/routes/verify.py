"""Atlassian & Bedrock credential verification endpoints."""
import boto3
import httpx
from fastapi import APIRouter, HTTPException

from backend.models.atlassian_schemas import (
    AtlassianVerifyRequest,
    BedrockVerifyRequest,
    VerifyResponse,
)
from backend.services import atlassian as atl_svc

router = APIRouter(prefix="/verify", tags=["verify"])


@router.post("/atlassian", response_model=VerifyResponse)
async def verify_atlassian(req: AtlassianVerifyRequest):
    url = f"{req.atlassian.domain}/rest/api/3/myself"
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            res = await client.get(url, auth=atl_svc.auth(req.atlassian))
    except httpx.RequestError:
        raise HTTPException(502, "Atlassian 서버 연결 실패: 도메인을 확인하세요.")
    if res.status_code != 200:
        raise HTTPException(401, "Atlassian 인증 실패: 이메일 또는 API 토큰을 확인하세요.")
    d = res.json()
    return VerifyResponse(
        valid=True,
        display_name=d.get("displayName"),
        email=d.get("emailAddress"),
        account_id=d.get("accountId"),
    )


@router.post("/bedrock", response_model=VerifyResponse)
async def verify_bedrock(req: BedrockVerifyRequest):
    try:
        client = boto3.client(
            "bedrock",
            region_name=req.bedrock.aws_region,
            aws_access_key_id=req.bedrock.aws_access_key_id,
            aws_secret_access_key=req.bedrock.aws_secret_access_key,
        )
        client.list_foundation_models(byOutputModality="TEXT")
        return VerifyResponse(
            valid=True,
            region=req.bedrock.aws_region,
            model_id=req.bedrock.model_id,
        )
    except Exception:
        raise HTTPException(401, "AWS Bedrock 인증 실패: Access Key 또는 Region을 확인하세요.")
