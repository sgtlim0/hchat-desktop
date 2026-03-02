import modal

image = (
    modal.Image.debian_slim(python_version="3.12")
    .pip_install("boto3", "fastapi[standard]", "duckduckgo-search", "httpx", "openai", "google-genai")
    .add_local_python_source("backend")
)

app = modal.App("hchat-api", image=image)

# Optional secrets — if created, env vars (OPENAI_API_KEY, GEMINI_API_KEY) are injected automatically
# Create with: modal secret create hchat-api-keys OPENAI_API_KEY=sk-... GEMINI_API_KEY=...
# Then uncomment: secrets=[modal.Secret.from_name("hchat-api-keys")]


@app.function(timeout=600)
@modal.concurrent(max_inputs=100)
@modal.asgi_app()
def api():
    from fastapi import FastAPI
    from fastapi.middleware.cors import CORSMiddleware

    from backend.routes.chat import router as chat_router
    from backend.routes.health import router as health_router
    from backend.routes.search import router as search_router
    from backend.routes.memory import router as memory_router
    from backend.routes.schedule import router as schedule_router
    from backend.routes.swarm import router as swarm_router
    from backend.routes.channels import router as channels_router
    from backend.routes.openai_proxy import router as openai_router
    from backend.routes.gemini_proxy import router as gemini_router

    web_app = FastAPI(title="H Chat API")

    web_app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:5173",
            "http://localhost:4173",
        ],
        allow_origin_regex=r"https://.*\.(vercel\.app|github\.io)",
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

    return web_app
