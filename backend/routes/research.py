import asyncio
import json
from concurrent.futures import ThreadPoolExecutor

import httpx
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from backend.services.bedrock import converse_sync, create_client, validate_model

router = APIRouter()
_executor = ThreadPoolExecutor(max_workers=5)

SOURCE_AUTHORITY: dict[str, float] = {
    "docs.aws.amazon.com": 0.95,
    "learn.microsoft.com": 0.95,
    "developer.mozilla.org": 0.95,
    "arxiv.org": 0.90,
    "github.com": 0.85,
    "stackoverflow.com": 0.80,
    "wikipedia.org": 0.75,
    "medium.com": 0.60,
    "dev.to": 0.60,
    "reddit.com": 0.40,
}


class Credentials(BaseModel):
    accessKeyId: str
    secretAccessKey: str
    region: str


class ResearchRequest(BaseModel):
    query: str
    credentials: Credentials
    modelId: str
    depth: int = Field(default=1, ge=1, le=3)
    maxSources: int = Field(default=5, ge=1, le=10)


class QuickResearchRequest(BaseModel):
    query: str
    credentials: Credentials
    modelId: str
    maxSources: int = Field(default=3, ge=1, le=5)


@router.post("/research/start")
async def start_research(req: ResearchRequest):
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

    return StreamingResponse(
        _research_pipeline(client, req),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive"},
    )


@router.post("/research/quick")
async def quick_research(req: QuickResearchRequest):
    """Quick 3-step research: search -> extract -> summarize (no query expansion)."""
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

    return StreamingResponse(
        _quick_pipeline(client, req),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive"},
    )


async def _quick_pipeline(client, req: QuickResearchRequest):
    """3-step Quick Research pipeline."""
    try:
        yield _sse({"type": "research_start", "query": req.query, "mode": "quick"})

        # Step 1: Direct search (no query expansion)
        yield _sse({"type": "research_status", "step": "searching", "message": "Quick searching..."})
        all_results = await _parallel_search([req.query], req.maxSources)
        yield _sse({
            "type": "research_search_done",
            "totalResults": len(all_results),
            "results": [{"title": r["title"], "url": r["url"], "snippet": r["snippet"]} for r in all_results[:5]],
        })

        # Step 2: Content extraction
        evidence = await _extract_content(all_results, req.maxSources)
        evidence.sort(key=lambda e: e["authority"], reverse=True)
        yield _sse({
            "type": "research_evidence",
            "count": len(evidence),
            "sources": [{"url": e["url"], "title": e["title"], "score": e["authority"]} for e in evidence],
        })

        # Step 3: Quick summarize
        yield _sse({"type": "research_status", "step": "synthesizing", "message": "Generating quick summary..."})
        report = await _synthesize_report(client, req.modelId, req.query, evidence)
        yield _sse({"type": "research_report", "content": report})

        yield _sse({"type": "done"})

    except Exception as e:
        yield _sse({"type": "error", "error": str(e)})


async def _research_pipeline(client, req: ResearchRequest):
    """7-step Deep Research pipeline with SSE streaming."""
    try:
        yield _sse({"type": "research_start", "query": req.query})

        # Step 1: Query Expansion — LLM generates sub-queries
        yield _sse({"type": "research_status", "step": "query_expansion", "message": "Expanding query..."})
        queries = await _expand_query(client, req.modelId, req.query)
        yield _sse({"type": "research_queries", "queries": queries})

        # Step 2: Parallel Search — DuckDuckGo for each query
        yield _sse({"type": "research_status", "step": "searching", "message": f"Searching {len(queries)} queries..."})
        all_results = await _parallel_search(queries, req.maxSources)
        yield _sse({
            "type": "research_search_done",
            "totalResults": len(all_results),
            "results": [{"title": r["title"], "url": r["url"], "snippet": r["snippet"]} for r in all_results[:10]],
        })

        # Step 3: Content Extraction — fetch top URLs
        yield _sse({"type": "research_status", "step": "extracting", "message": f"Extracting content from {min(len(all_results), req.maxSources)} sources..."})
        evidence = await _extract_content(all_results, req.maxSources)
        yield _sse({
            "type": "research_evidence",
            "count": len(evidence),
            "sources": [{"url": e["url"], "title": e["title"], "score": e["authority"]} for e in evidence],
        })

        # Step 4: Evidence Ranking — score by authority
        evidence.sort(key=lambda e: e["authority"], reverse=True)

        # Step 5: LLM Synthesis — generate report
        yield _sse({"type": "research_status", "step": "synthesizing", "message": "Synthesizing report..."})
        report = await _synthesize_report(client, req.modelId, req.query, evidence)
        yield _sse({"type": "research_report", "content": report})

        # Step 6: Done
        yield _sse({"type": "done"})

    except Exception as e:
        yield _sse({"type": "error", "error": str(e)})


async def _expand_query(client, model_id: str, query: str) -> list[str]:
    """Use LLM to expand a single query into 3-5 sub-queries."""
    system = (
        "You are a research query expander. Given a user query, generate 3-5 diverse "
        "search queries that would help thoroughly research the topic. "
        "Return ONLY a JSON array of strings, nothing else. Example: [\"query1\", \"query2\", \"query3\"]"
    )
    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(
        _executor,
        converse_sync,
        client,
        model_id,
        [{"role": "user", "content": query}],
        system,
        512,
    )

    try:
        # Extract JSON array from response
        text = result.strip()
        start = text.find("[")
        end = text.rfind("]") + 1
        if start >= 0 and end > start:
            queries = json.loads(text[start:end])
            if isinstance(queries, list):
                return [query] + [str(q) for q in queries[:4]]
    except (json.JSONDecodeError, ValueError):
        pass

    return [query]


async def _parallel_search(queries: list[str], max_per_query: int) -> list[dict]:
    """Search DuckDuckGo for each query in parallel."""
    from duckduckgo_search import DDGS

    loop = asyncio.get_event_loop()
    seen_urls: set[str] = set()
    all_results: list[dict] = []

    def _search_one(q: str) -> list[dict]:
        try:
            with DDGS() as ddgs:
                return list(ddgs.text(q, max_results=max_per_query))
        except Exception:
            return []

    tasks = [loop.run_in_executor(_executor, _search_one, q) for q in queries]
    results_lists = await asyncio.gather(*tasks, return_exceptions=True)

    for results in results_lists:
        if isinstance(results, Exception):
            continue
        for r in results:
            url = r.get("href", "")
            if url and url not in seen_urls:
                seen_urls.add(url)
                all_results.append({
                    "title": r.get("title", ""),
                    "url": url,
                    "snippet": r.get("body", ""),
                })

    return all_results


async def _extract_content(results: list[dict], limit: int) -> list[dict]:
    """Fetch page content from top URLs using httpx."""
    evidence: list[dict] = []
    urls_to_fetch = results[:limit]

    async with httpx.AsyncClient(
        timeout=10.0,
        follow_redirects=True,
        headers={"User-Agent": "Mozilla/5.0 (compatible; HChatResearch/1.0)"},
    ) as client:
        tasks = [_fetch_page(client, r) for r in urls_to_fetch]
        fetched = await asyncio.gather(*tasks, return_exceptions=True)

    for item in fetched:
        if isinstance(item, Exception) or item is None:
            continue
        evidence.append(item)

    return evidence


async def _fetch_page(client: httpx.AsyncClient, result: dict) -> dict | None:
    """Fetch and extract text from a single URL."""
    url = result["url"]
    try:
        resp = await client.get(url)
        resp.raise_for_status()

        text = _extract_text_from_html(resp.text)
        if not text or len(text) < 50:
            text = result.get("snippet", "")

        authority = _get_authority(url)

        return {
            "url": url,
            "title": result.get("title", ""),
            "content": text[:3000],
            "authority": authority,
        }
    except Exception:
        # Fallback to snippet if fetch fails
        return {
            "url": url,
            "title": result.get("title", ""),
            "content": result.get("snippet", ""),
            "authority": _get_authority(url) * 0.5,
        }


def _extract_text_from_html(html: str) -> str:
    """Extract readable text from HTML. Uses basic parsing without BeautifulSoup."""
    import re

    # Remove script, style, nav, footer, header tags and content
    for tag in ["script", "style", "nav", "footer", "header", "aside"]:
        html = re.sub(rf"<{tag}[^>]*>.*?</{tag}>", "", html, flags=re.DOTALL | re.IGNORECASE)

    # Remove all HTML tags
    text = re.sub(r"<[^>]+>", " ", html)

    # Decode common HTML entities
    text = text.replace("&amp;", "&").replace("&lt;", "<").replace("&gt;", ">")
    text = text.replace("&nbsp;", " ").replace("&quot;", '"')

    # Collapse whitespace
    text = re.sub(r"\s+", " ", text).strip()

    return text


def _get_authority(url: str) -> float:
    """Score URL authority based on domain."""
    for domain, score in SOURCE_AUTHORITY.items():
        if domain in url:
            return score
    return 0.50


async def _synthesize_report(
    client, model_id: str, query: str, evidence: list[dict]
) -> str:
    """Use LLM to synthesize evidence into a research report."""
    context_parts = []
    for i, e in enumerate(evidence, 1):
        content = e.get("content", e.get("snippet", ""))[:1000]
        context_parts.append(f"[Source {i}] {e['title']} (authority: {e['authority']:.2f})\nURL: {e['url']}\n{content}")

    context = "\n\n---\n\n".join(context_parts)

    system = (
        "You are a research analyst. Based on the provided sources, write a comprehensive "
        "research report answering the query. Requirements:\n"
        "- Cite sources using [Source N] format\n"
        "- Prioritize high-authority sources\n"
        "- Note any conflicting information\n"
        "- Include a brief summary at the top\n"
        "- Use markdown formatting\n"
        "- If information is insufficient, state what's missing\n"
        "- Write in the same language as the query"
    )

    user_prompt = f"Query: {query}\n\nSources:\n{context}"

    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(
        _executor,
        converse_sync,
        client,
        model_id,
        [{"role": "user", "content": user_prompt}],
        system,
        4096,
    )


def _sse(data: dict) -> str:
    return f"data: {json.dumps(data, ensure_ascii=False)}\n\n"


async def _error_stream(message: str):
    yield f"data: {json.dumps({'type': 'error', 'error': message})}\n\n"
