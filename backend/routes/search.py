from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter()


class SearchRequest(BaseModel):
    query: str
    maxResults: int = Field(default=5, ge=1, le=20)


@router.post("/search")
async def search(req: SearchRequest):
    try:
        from duckduckgo_search import DDGS

        with DDGS() as ddgs:
            raw_results = ddgs.text(req.query, max_results=req.maxResults)

        results = [
            {
                "title": r.get("title", ""),
                "url": r.get("href", ""),
                "snippet": r.get("body", ""),
            }
            for r in raw_results
        ]

        return {"results": results}

    except Exception as e:
        return {"results": [], "error": str(e)}
