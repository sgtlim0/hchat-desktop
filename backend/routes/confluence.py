"""Confluence search & summarize endpoints."""
import asyncio
from concurrent.futures import ThreadPoolExecutor

import httpx
from fastapi import APIRouter, HTTPException

from backend.models.atlassian_schemas import (
    ConfluenceSearchRequest,
    ConfluenceSearchResponse,
    PageSummarizeRequest,
    PageSummaryResponse,
    sanitize_query,
    sanitize_key,
    sanitize_page_id,
)
from backend.services import atlassian as atl_svc
from backend.services.bedrock import invoke_text

router = APIRouter(prefix="/confluence", tags=["confluence"])
_executor = ThreadPoolExecutor(max_workers=3)


async def _invoke_async(
    access_key_id: str, secret_access_key: str, region: str,
    model_id: str, prompt: str, max_tokens: int = 2048,
) -> str:
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(
        _executor, invoke_text,
        access_key_id, secret_access_key, region, model_id, prompt, max_tokens,
    )


@router.post("/search", response_model=ConfluenceSearchResponse)
async def search(req: ConfluenceSearchRequest):
    auth = atl_svc.auth(req.atlassian)
    results, seen = [], set()

    async with httpx.AsyncClient(timeout=15) as client:
        # 1. Direct page ID lookup
        for pid in req.page_ids:
            try:
                safe_pid = sanitize_page_id(pid)
            except ValueError:
                continue
            res = await client.get(
                f"{req.atlassian.domain}/wiki/rest/api/content/{safe_pid}",
                params={"expand": "space,version"},
                auth=auth,
            )
            if res.status_code == 200 and safe_pid not in seen:
                seen.add(safe_pid)
                results.append(atl_svc.build_page(res.json(), req.atlassian.domain, "direct"))

        # 2. CQL search
        query = sanitize_query(req.query)
        space_clause = ""
        if req.space_keys:
            keys = ", ".join(f'"{sanitize_key(k)}"' for k in req.space_keys)
            space_clause = f" AND space IN ({keys})"
        cql = f'text ~ "{query}"{space_clause} AND type="page" ORDER BY lastmodified DESC'

        res = await client.get(
            f"{req.atlassian.domain}/wiki/rest/api/search",
            params={"cql": cql, "limit": req.max_results, "excerpt": "highlight"},
            auth=auth,
        )
        if res.status_code != 200:
            raise HTTPException(res.status_code, "Confluence 검색 중 오류가 발생했습니다.")

        for item in res.json().get("results", []):
            content = item.get("content", {})
            pid = content.get("id", "")
            if pid and pid not in seen:
                seen.add(pid)
                results.append({
                    "id": pid,
                    "title": content.get("title", ""),
                    "space": item.get("resultGlobalContainer", {}).get("title", ""),
                    "space_key": "",
                    "link": f"{req.atlassian.domain}/wiki{item.get('url', '')}",
                    "excerpt": item.get("excerpt", ""),
                    "last_modified": "",
                    "source": "search",
                })

    # 3. AI overview
    overview = None
    if req.ai_summary and results:
        titles = "\n".join(f"- [{r['space']}] {r['title']}" for r in results[:6])
        overview = await _invoke_async(
            req.bedrock.aws_access_key_id, req.bedrock.aws_secret_access_key,
            req.bedrock.aws_region, req.bedrock.model_id,
            f'"{req.query}" 검색 결과:\n{titles}\n\n'
            '가장 관련성 높은 문서와 이유, 공통 주제를 2-3문장 한국어로 설명하세요.',
            512,
        )

    return ConfluenceSearchResponse(
        query=req.query, total=len(results),
        results=results[:req.max_results], ai_overview=overview,
    )


@router.post("/summarize", response_model=PageSummaryResponse)
async def summarize(req: PageSummarizeRequest):
    auth = atl_svc.auth(req.atlassian)
    try:
        safe_pid = sanitize_page_id(req.page_id)
    except ValueError:
        raise HTTPException(400, "잘못된 페이지 ID 형식입니다.")

    async with httpx.AsyncClient(timeout=20) as client:
        res = await client.get(
            f"{req.atlassian.domain}/wiki/rest/api/content/{safe_pid}",
            params={"expand": "body.storage,version,space"},
            auth=auth,
        )
    if res.status_code != 200:
        raise HTTPException(res.status_code, "페이지를 불러올 수 없습니다.")

    data = res.json()
    raw_html = data.get("body", {}).get("storage", {}).get("value", "")
    parsed = atl_svc.clean_html(raw_html)
    title = data.get("title", "")
    space = data.get("space", {}).get("name", "")

    summary = await _invoke_async(
        req.bedrock.aws_access_key_id, req.bedrock.aws_secret_access_key,
        req.bedrock.aws_region, req.bedrock.model_id,
        f"제목: {title}\n공간: {space}\n\n<document>\n{parsed}\n</document>\n\n"
        f"요청: {req.user_query}\n\n문서에 없는 내용은 추측 금지. 마크다운 한국어로 답변.",
        2048,
    )

    return PageSummaryResponse(
        page_id=safe_pid, page_title=title, space_name=space,
        page_link=f"{req.atlassian.domain}/wiki{data['_links']['webui']}",
        version=str(data.get("version", {}).get("number", "")),
        last_modified=data.get("version", {}).get("when", ""),
        summary=summary, char_count=len(parsed),
    )
