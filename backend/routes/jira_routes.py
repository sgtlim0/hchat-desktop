"""Jira search & analyze endpoints."""
import asyncio
from concurrent.futures import ThreadPoolExecutor

import httpx
from fastapi import APIRouter, HTTPException

from backend.models.atlassian_schemas import (
    JiraSearchRequest,
    JiraSearchResponse,
    TicketAnalyzeRequest,
    TicketAnalysisResponse,
    sanitize_query,
    sanitize_key,
    sanitize_issue_key,
)
from backend.services import atlassian as atl_svc
from backend.services.bedrock import invoke_text

router = APIRouter(prefix="/jira", tags=["jira"])
_executor = ThreadPoolExecutor(max_workers=3)

ISSUE_FIELDS = [
    "summary", "status", "assignee", "priority",
    "updated", "project", "issuetype", "labels",
]


async def _invoke_async(
    access_key_id: str, secret_access_key: str, region: str,
    model_id: str, prompt: str, max_tokens: int = 2048,
) -> str:
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(
        _executor, invoke_text,
        access_key_id, secret_access_key, region, model_id, prompt, max_tokens,
    )


@router.post("/search", response_model=JiraSearchResponse)
async def search(req: JiraSearchRequest):
    auth = atl_svc.auth(req.atlassian)
    results, seen = [], set()

    async with httpx.AsyncClient(timeout=15) as client:
        # 1. Direct ticket lookup
        for key in req.ticket_ids:
            try:
                safe_key = sanitize_issue_key(key)
            except ValueError:
                continue
            res = await client.get(
                f"{req.atlassian.domain}/rest/api/3/issue/{safe_key}",
                params={"fields": ",".join(ISSUE_FIELDS)},
                auth=auth,
            )
            if res.status_code == 200:
                d = res.json()
                if d["key"] not in seen:
                    seen.add(d["key"])
                    results.append(atl_svc.build_ticket(d, req.atlassian.domain, "direct"))

        # 2. JQL search
        query = sanitize_query(req.query)
        proj_clause = ""
        if req.project_keys:
            keys = ", ".join(f'"{sanitize_key(k)}"' for k in req.project_keys)
            proj_clause = f" AND project IN ({keys})"
        jql = f'text ~ "{query}"{proj_clause} ORDER BY updated DESC'

        res = await client.post(
            f"{req.atlassian.domain}/rest/api/3/search",
            json={"jql": jql, "maxResults": req.max_results, "fields": ISSUE_FIELDS},
            auth=auth,
        )
        if res.status_code != 200:
            raise HTTPException(res.status_code, "Jira 검색 중 오류가 발생했습니다.")

        for issue in res.json().get("issues", []):
            if issue["key"] not in seen:
                seen.add(issue["key"])
                results.append(atl_svc.build_ticket(issue, req.atlassian.domain, "search"))

    # 3. AI overview
    overview = None
    if req.ai_summary and results:
        items = "\n".join(
            f"- [{r['key']}] {r['summary']} (상태: {r['status']}, 담당: {r['assignee']})"
            for r in results[:6]
        )
        overview = await _invoke_async(
            req.bedrock.aws_access_key_id, req.bedrock.aws_secret_access_key,
            req.bedrock.aws_region, req.bedrock.model_id,
            f'Jira 검색어: "{req.query}"\n{items}\n\n'
            '주요 패턴/공통 이슈와 주목할 티켓을 2-3문장 한국어로 요약하세요.',
            512,
        )

    return JiraSearchResponse(
        query=req.query, total=len(results),
        results=results[:req.max_results], ai_overview=overview,
    )


@router.post("/summarize", response_model=TicketAnalysisResponse)
async def summarize(req: TicketAnalyzeRequest):
    auth = atl_svc.auth(req.atlassian)
    try:
        safe_key = sanitize_issue_key(req.issue_key)
    except ValueError:
        raise HTTPException(400, "잘못된 이슈 키 형식입니다. (예: PROJECT-123)")

    async with httpx.AsyncClient(timeout=20) as client:
        res = await client.get(
            f"{req.atlassian.domain}/rest/api/3/issue/{safe_key}",
            params={
                "fields": "summary,status,assignee,priority,description,"
                          "comment,created,updated,project,issuetype,labels,reporter"
            },
            auth=auth,
        )
    if res.status_code != 200:
        raise HTTPException(res.status_code, "티켓을 조회할 수 없습니다.")

    data = res.json()
    f = data.get("fields", {})

    # Parse description
    desc_raw = f.get("description")
    description = (
        atl_svc.parse_adf(desc_raw.get("content", []))
        if isinstance(desc_raw, dict) else str(desc_raw or "")
    )

    # Parse comments (last 30)
    comments = f.get("comment", {}).get("comments", [])
    history = []
    for c in comments[-30:]:
        body = c.get("body", {})
        text = (
            atl_svc.parse_adf(body.get("content", []))
            if isinstance(body, dict) else str(body)
        ).strip()
        if text:
            author = c.get("author", {}).get("displayName", "?")
            date = c.get("created", "")[:10]
            history.append(f"[{date}] {author}: {text[:500]}")

    prompt = (
        f"티켓: {safe_key}\n"
        f"상태: {f.get('status', {}).get('name', '')} | "
        f"담당: {(f.get('assignee') or {}).get('displayName', '미배정')} | "
        f"우선순위: {(f.get('priority') or {}).get('name', '')}\n"
        f"제목: {f.get('summary', '')}\n\n"
        f"설명:\n{description[:3000]}\n\n"
        f"댓글 ({len(comments)}개 중 최근 {len(history)}개):\n"
        f"{chr(10).join(history)}\n\n"
        f"요청: {req.user_query}\n\n"
        "## 현재 상황\n## 주요 논의 사항\n## 미해결 쟁점\n## 다음 액션 아이템\n\n"
        "위 형식으로 한국어 마크다운 분석."
    )

    ai_analysis = await _invoke_async(
        req.bedrock.aws_access_key_id, req.bedrock.aws_secret_access_key,
        req.bedrock.aws_region, req.bedrock.model_id,
        prompt, 2048,
    )

    return TicketAnalysisResponse(
        issue_key=safe_key,
        summary=f.get("summary", ""),
        status=f.get("status", {}).get("name", ""),
        assignee=(f.get("assignee") or {}).get("displayName", "미배정"),
        reporter=(f.get("reporter") or {}).get("displayName", ""),
        priority=(f.get("priority") or {}).get("name", ""),
        issue_type=(f.get("issuetype") or {}).get("name", ""),
        created=(f.get("created") or "")[:10],
        updated=(f.get("updated") or "")[:10],
        labels=f.get("labels", []),
        total_comments=len(comments),
        link=f"{req.atlassian.domain}/browse/{safe_key}",
        ai_analysis=ai_analysis,
    )
