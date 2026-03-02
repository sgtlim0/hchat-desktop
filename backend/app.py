import modal

image = (
    modal.Image.debian_slim(python_version="3.12")
    .pip_install("boto3", "fastapi[standard]")
    .add_local_python_source("backend")
)

app = modal.App("hchat-api", image=image)


@app.function(timeout=600)
@modal.concurrent(max_inputs=100)
@modal.asgi_app()
def api():
    from fastapi import FastAPI
    from fastapi.middleware.cors import CORSMiddleware

    from backend.routes.chat import router as chat_router
    from backend.routes.health import router as health_router

    web_app = FastAPI(title="H Chat API")

    web_app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:5173",
            "http://localhost:4173",
            "https://*.vercel.app",
            "https://*.github.io",
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    web_app.include_router(health_router, prefix="/api")
    web_app.include_router(chat_router, prefix="/api")

    return web_app
