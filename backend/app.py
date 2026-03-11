import modal
from collections import defaultdict
import time
from typing import Dict, List

image = (
    modal.Image.debian_slim(python_version="3.12")
    .pip_install("boto3", "fastapi[standard]", "duckduckgo-search", "httpx", "openai", "google-genai", "numpy>=1.24.0", "beautifulsoup4", "lxml")
    .add_local_python_source("backend")
)

app = modal.App("hchat-api", image=image)

# Optional secrets — if created, env vars (OPENAI_API_KEY, GEMINI_API_KEY) are injected automatically
# Create with: modal secret create hchat-api-keys OPENAI_API_KEY=sk-... GEMINI_API_KEY=...
# Then uncomment: secrets=[modal.Secret.from_name("hchat-api-keys")]


class SimpleRateLimiter:
    """Simple in-memory rate limiter for serverless environments."""

    def __init__(self):
        self.requests: Dict[str, List[float]] = defaultdict(list)

    def check(self, key: str, limit: int, window: int = 60) -> tuple[bool, int]:
        """
        Check if request is allowed under rate limit.
        Returns (is_allowed, remaining_requests).
        """
        now = time.time()
        # Clean up old requests outside the window
        self.requests[key] = [t for t in self.requests[key] if now - t < window]

        current_count = len(self.requests[key])
        remaining = max(0, limit - current_count)

        if current_count >= limit:
            return False, 0

        self.requests[key].append(now)
        return True, remaining - 1


# Endpoint-specific rate limits (per minute)
RATE_LIMITS = {
    "/api/chat": 30,
    "/api/search": 20,
    "/api/extract-memory": 10,
    "/api/swarm/execute": 5,
    # Default for all other endpoints
    "default": 60
}


@app.function(timeout=600)
@modal.concurrent(max_inputs=100)
@modal.asgi_app()
def api():
    from fastapi import FastAPI, Request, Response
    from fastapi.middleware.cors import CORSMiddleware
    from fastapi.responses import JSONResponse
    from starlette.middleware.base import BaseHTTPMiddleware

    from backend.routes.chat import router as chat_router
    from backend.routes.health import router as health_router
    from backend.routes.search import router as search_router
    from backend.routes.memory import router as memory_router
    from backend.routes.schedule import router as schedule_router
    from backend.routes.swarm import router as swarm_router
    from backend.routes.channels import router as channels_router
    from backend.routes.openai_proxy import router as openai_router
    from backend.routes.gemini_proxy import router as gemini_router
    from backend.routes.research import router as research_router
    from backend.routes.analyze import router as analyze_router
    from backend.routes.tools import router as tools_router
    from backend.routes.verify import router as verify_router
    from backend.routes.confluence import router as confluence_router
    from backend.routes.jira_routes import router as jira_router

    # Initialize rate limiter
    rate_limiter = SimpleRateLimiter()

    class RateLimitMiddleware(BaseHTTPMiddleware):
        """Middleware to enforce rate limiting per endpoint."""

        async def dispatch(self, request: Request, call_next):
            # Get client IP (considering proxy headers)
            client_ip = request.client.host
            if "x-forwarded-for" in request.headers:
                client_ip = request.headers["x-forwarded-for"].split(",")[0].strip()
            elif "x-real-ip" in request.headers:
                client_ip = request.headers["x-real-ip"]

            # Get the path without query params
            path = request.url.path

            # Find the appropriate rate limit
            limit = RATE_LIMITS.get("default", 60)
            for endpoint, endpoint_limit in RATE_LIMITS.items():
                if endpoint != "default" and path.startswith(endpoint):
                    limit = endpoint_limit
                    break

            # Create rate limit key (IP + path pattern)
            rate_limit_key = f"{client_ip}:{path}"

            # Check rate limit
            is_allowed, remaining = rate_limiter.check(rate_limit_key, limit)

            if not is_allowed:
                return JSONResponse(
                    status_code=429,
                    content={"error": "Too Many Requests", "message": f"Rate limit exceeded. Please try again later."},
                    headers={
                        "X-RateLimit-Limit": str(limit),
                        "X-RateLimit-Remaining": "0",
                        "Retry-After": "60"  # 60 seconds
                    }
                )

            # Process the request
            response = await call_next(request)

            # Add rate limit headers
            response.headers["X-RateLimit-Limit"] = str(limit)
            response.headers["X-RateLimit-Remaining"] = str(remaining)

            return response

    web_app = FastAPI(title="H Chat API")

    # Add rate limiting middleware first (before CORS)
    web_app.add_middleware(RateLimitMiddleware)

    web_app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:5173",
            "http://localhost:4173",
            "https://hchat-desktop.vercel.app",
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    web_app.include_router(health_router, prefix="/api")
    web_app.include_router(chat_router, prefix="/api")
    web_app.include_router(search_router, prefix="/api")
    web_app.include_router(memory_router, prefix="/api")
    web_app.include_router(schedule_router, prefix="/api")
    web_app.include_router(swarm_router, prefix="/api")
    web_app.include_router(channels_router, prefix="/api")
    web_app.include_router(openai_router, prefix="/api")
    web_app.include_router(gemini_router, prefix="/api")
    web_app.include_router(research_router, prefix="/api")
    web_app.include_router(analyze_router, prefix="/api")
    web_app.include_router(tools_router, prefix="/api")
    web_app.include_router(verify_router, prefix="/api")
    web_app.include_router(confluence_router, prefix="/api")
    web_app.include_router(jira_router, prefix="/api")

    return web_app