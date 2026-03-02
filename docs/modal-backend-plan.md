# H Chat PWA — Modal 백엔드 구현 방안

## 1. 배경 및 문제점

### 현재 구조
```
[브라우저] → /api/chat → [Vite 개발 서버 미들웨어] → [AWS Bedrock]
                          (bedrock-plugin.ts)
```

- Vite 개발 서버의 미들웨어(`src/server/bedrock-plugin.ts`)가 프록시 역할
- `npm run dev`에서만 동작하며, 정적 배포(Vercel/GitHub Pages)에서는 백엔드 없음
- 배포 환경에서 연결 테스트 및 채팅 기능 불가

### 목표 구조
```
[브라우저] → https://xxx.modal.run/api/chat → [Modal 서버리스] → [AWS Bedrock]
(Vercel/GitHub Pages)                          (Python/FastAPI)
```

---

## 2. 왜 Modal인가

| 항목 | Modal | Vercel Serverless | AWS Lambda |
|------|-------|-------------------|------------|
| **콜드 스타트** | ~1초 | ~3-5초 | ~3-10초 |
| **스트리밍 SSE** | 네이티브 지원 | 제한적 | API Gateway 필요 |
| **타임아웃** | 최대 24시간 | 10초 (Hobby) | 15분 |
| **가격** | $30/월 무료 크레딧 | 무료 제한적 | 요청당 과금 |
| **배포** | `modal deploy` 한 줄 | Git push | SAM/CDK 필요 |
| **Python boto3** | 네이티브 | Node.js만 | 네이티브 |

**Modal 선택 이유:**
- Claude 응답이 길 수 있어 긴 타임아웃 필수
- SSE 스트리밍이 핵심 기능
- boto3(Python)로 Bedrock 호출이 가장 안정적
- 무료 티어로 시작 가능

---

## 3. 사용 모델

| 모델 | Bedrock Model ID | 용도 | 비용 (1M tokens) |
|------|-------------------|------|-------------------|
| Claude Sonnet 4.6 | `us.anthropic.claude-sonnet-4-6` | 기본 (권장) | $3 / $15 |
| Claude Opus 4.6 | `us.anthropic.claude-opus-4-6-v1` | 최고 성능 | $15 / $75 |
| Claude Haiku 4.5 | `us.anthropic.claude-haiku-4-5-20251001-v1:0` | 빠른 응답 | $0.8 / $4 |

---

## 4. 아키텍처

### 4.1 디렉토리 구조

```
hchat-pwa/
├── modal/                          # Modal 백엔드 (새로 추가)
│   ├── app.py                      # 메인 엔트리포인트
│   ├── routes/
│   │   ├── chat.py                 # /api/chat — 스트리밍 채팅
│   │   └── health.py               # /api/health — 헬스체크
│   ├── services/
│   │   └── bedrock.py              # Bedrock 클라이언트 래퍼
│   └── requirements.txt            # Python 의존성 (참고용)
├── src/
│   ├── shared/
│   │   └── lib/
│   │       └── bedrock-client.ts   # 수정: API URL을 Modal 엔드포인트로
│   └── ...
└── ...
```

### 4.2 API 엔드포인트

| Method | Path | 설명 |
|--------|------|------|
| `POST` | `/api/chat` | 스트리밍 채팅 (SSE) |
| `POST` | `/api/chat/test` | 연결 테스트 |
| `GET` | `/api/health` | 헬스체크 |

### 4.3 요청/응답 포맷

**POST /api/chat**
```json
// Request
{
  "credentials": {
    "accessKeyId": "AKIA...",
    "secretAccessKey": "...",
    "region": "us-east-1"
  },
  "modelId": "us.anthropic.claude-sonnet-4-6",
  "messages": [
    { "role": "user", "content": "Hello" }
  ],
  "system": "You are a helpful assistant."
}

// Response (SSE stream)
data: {"type": "text", "content": "Hello"}
data: {"type": "text", "content": "! How"}
data: {"type": "text", "content": " can I help?"}
data: {"type": "done"}
```

**POST /api/chat/test**
```json
// Request
{
  "credentials": { "accessKeyId": "...", "secretAccessKey": "...", "region": "us-east-1" },
  "modelId": "us.anthropic.claude-sonnet-4-6"
}

// Response
{ "success": true }
// or
{ "success": false, "error": "AccessDeniedException: ..." }
```

---

## 5. 구현

### 5.1 Modal 메인 앱 (`modal/app.py`)

```python
import modal
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

image = modal.Image.debian_slim(python_version="3.12").pip_install(
    "boto3>=1.35.0",
    "fastapi[standard]>=0.115.0",
)

app = modal.App("hchat-backend", image=image)
web_app = FastAPI(title="H Chat Backend")

# CORS — 프론트엔드 도메인 허용
web_app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://hchat-desktop.vercel.app",
        "https://sgtlim0.github.io",
        "http://localhost:5173",  # 로컬 개발
    ],
    allow_credentials=True,
    allow_methods=["POST", "GET", "OPTIONS"],
    allow_headers=["*"],
)

# --- Routes ---

from routes.chat import router as chat_router
from routes.health import router as health_router

web_app.include_router(chat_router, prefix="/api")
web_app.include_router(health_router, prefix="/api")


@app.function(
    allow_concurrent_inputs=100,
    timeout=600,  # 10분
)
@modal.asgi_app()
def create_app():
    return web_app
```

### 5.2 Bedrock 서비스 (`modal/services/bedrock.py`)

```python
import json
import boto3
import botocore.config

ALLOWED_MODELS = {
    "us.anthropic.claude-sonnet-4-6",
    "us.anthropic.claude-opus-4-6-v1",
    "us.anthropic.claude-haiku-4-5-20251001-v1:0",
}


def create_client(credentials: dict) -> boto3.client:
    """사용자 자격 증명으로 Bedrock 클라이언트 생성."""
    config = botocore.config.Config(
        read_timeout=600,
        retries={"max_attempts": 2, "mode": "adaptive"},
    )
    return boto3.client(
        "bedrock-runtime",
        region_name=credentials.get("region", "us-east-1"),
        aws_access_key_id=credentials["accessKeyId"],
        aws_secret_access_key=credentials["secretAccessKey"],
        config=config,
    )


def validate_model(model_id: str) -> bool:
    """허용된 모델인지 검증."""
    return model_id in ALLOWED_MODELS


def build_converse_params(
    model_id: str,
    messages: list[dict],
    system: str | None = None,
    max_tokens: int = 4096,
) -> dict:
    """ConverseStream API 파라미터 빌드."""
    bedrock_messages = [
        {
            "role": msg["role"],
            "content": [{"text": msg["content"]}],
        }
        for msg in messages
    ]

    params = {
        "modelId": model_id,
        "messages": bedrock_messages,
        "inferenceConfig": {"maxTokens": max_tokens},
    }

    if system:
        params["system"] = [{"text": system}]

    return params
```

### 5.3 채팅 라우트 (`modal/routes/chat.py`)

```python
import json
from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse, JSONResponse
from services.bedrock import create_client, validate_model, build_converse_params

router = APIRouter()


@router.post("/chat")
async def chat_stream(request: Request):
    """스트리밍 채팅 엔드포인트 (SSE)."""
    body = await request.json()
    credentials = body.get("credentials")
    model_id = body.get("modelId")
    messages = body.get("messages", [])
    system = body.get("system")

    if not credentials or not model_id:
        return JSONResponse(
            status_code=400,
            content={"error": "credentials and modelId are required"},
        )

    if not validate_model(model_id):
        return JSONResponse(
            status_code=400,
            content={"error": f"Model not allowed: {model_id}"},
        )

    def generate():
        try:
            client = create_client(credentials)
            params = build_converse_params(model_id, messages, system)
            response = client.converse_stream(**params)

            for event in response.get("stream", []):
                if "contentBlockDelta" in event:
                    text = event["contentBlockDelta"]["delta"].get("text", "")
                    if text:
                        yield f"data: {json.dumps({'type': 'text', 'content': text})}\n\n"

                if "messageStop" in event:
                    yield f"data: {json.dumps({'type': 'done'})}\n\n"

                if "metadata" in event:
                    usage = event["metadata"].get("usage", {})
                    yield f"data: {json.dumps({'type': 'usage', 'usage': usage})}\n\n"

        except Exception as e:
            error_msg = str(e)
            yield f"data: {json.dumps({'type': 'error', 'error': error_msg})}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.post("/chat/test")
async def test_connection(request: Request):
    """연결 테스트 엔드포인트."""
    body = await request.json()
    credentials = body.get("credentials")
    model_id = body.get("modelId")

    if not credentials or not model_id:
        return JSONResponse(
            status_code=400,
            content={"success": False, "error": "credentials and modelId are required"},
        )

    if not validate_model(model_id):
        return JSONResponse(
            status_code=400,
            content={"success": False, "error": f"Model not allowed: {model_id}"},
        )

    try:
        client = create_client(credentials)
        params = build_converse_params(
            model_id,
            [{"role": "user", "content": "Hi"}],
            max_tokens=1,
        )
        response = client.converse_stream(**params)

        # 스트림 소비하여 요청 완료
        for _ in response.get("stream", []):
            pass

        return {"success": True}

    except Exception as e:
        return JSONResponse(
            status_code=400,
            content={"success": False, "error": str(e)},
        )
```

### 5.4 헬스체크 (`modal/routes/health.py`)

```python
from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
async def health():
    return {"status": "ok", "service": "hchat-backend"}
```

---

## 6. 프론트엔드 수정

### 6.1 환경 변수 추가

```env
# .env.production
VITE_API_BASE_URL=https://sgtlim0s-projects--hchat-backend-create-app.modal.run

# .env.development (기존 Vite 프록시 유지)
VITE_API_BASE_URL=
```

### 6.2 bedrock-client.ts 수정

```typescript
// src/shared/lib/bedrock-client.ts

const API_BASE = import.meta.env.VITE_API_BASE_URL || ''

export async function* streamChat(params: StreamChatParams): AsyncGenerator<ChatStreamEvent> {
  const bedrockModelId = BEDROCK_MODEL_MAP[params.modelId] ?? params.modelId

  const response = await fetch(`${API_BASE}/api/chat`, {
    // ... 기존 코드 동일
  })
  // ... 나머지 동일
}

export async function testConnection(
  credentials: AwsCredentials,
  modelId: string,
): Promise<{ success: boolean; error?: string }> {
  const bedrockModelId = BEDROCK_MODEL_MAP[modelId] ?? modelId

  try {
    const response = await fetch(`${API_BASE}/api/chat/test`, {
      // ... 기존 코드 동일
    })
    return await response.json()
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Connection failed'
    return { success: false, error: message }
  }
}
```

### 6.3 Vite 설정 (`vite.config.ts`)

개발 환경에서는 기존 Vite 미들웨어 유지, 프로덕션에서는 Modal 사용:

```typescript
// vite.config.ts
export default defineConfig({
  plugins: [
    react(),
    // 개발 환경에서만 로컬 프록시 사용
    bedrockProxy(),
    VitePWA({ ... }),
  ],
  // ...
})
```

---

## 7. 배포 절차

### 7.1 최초 설정 (1회)

```bash
# 1. Modal CLI 설치
pip install modal

# 2. Modal 인증
modal setup

# 3. 디렉토리 이동
cd modal/

# 4. 로컬 테스트
modal serve app.py
# → http://localhost:8000/api/health 에서 확인

# 5. 프로덕션 배포
modal deploy app.py
# → https://sgtlim0s-projects--hchat-backend-create-app.modal.run
```

### 7.2 Vercel 환경 변수 설정

```bash
# Vercel에 Modal API URL 등록
vercel env add VITE_API_BASE_URL production
# 값: https://sgtlim0s-projects--hchat-backend-create-app.modal.run

# 재배포
vercel --prod
```

### 7.3 업데이트 배포

```bash
# Modal 백엔드 업데이트
cd modal/
modal deploy app.py

# 프론트엔드 업데이트 (기존과 동일)
git push origin main
```

---

## 8. 보안 고려사항

### 8.1 현재 방식 (사용자 자격 증명 전달)

```
[브라우저 localStorage] → credentials → [Modal] → [Bedrock]
```

- 사용자가 자신의 AWS 자격 증명을 직접 입력
- Modal 서버는 자격 증명을 저장하지 않음 (요청마다 전달)
- HTTPS로 암호화된 전송

### 8.2 권장 보안 조치

| 조치 | 설명 | 우선순위 |
|------|------|----------|
| **CORS 제한** | 허용 도메인만 접근 | 필수 |
| **모델 화이트리스트** | 허용된 3개 모델만 호출 가능 | 필수 |
| **Rate Limiting** | 분당 요청 제한 (Modal 기본 200 req/s) | 권장 |
| **요청 크기 제한** | messages 배열 크기 검증 | 권장 |
| **API Key 인증** | `X-API-Key` 헤더로 추가 인증 | 선택 |

### 8.3 향후 개선 (서버 자격 증명 방식)

```
[브라우저] → JWT 토큰 → [Modal (AWS 자격 증명 보유)] → [Bedrock]
```

- Modal Secrets에 AWS 자격 증명 저장
- 사용자는 JWT 토큰으로만 인증
- AWS 키가 클라이언트에 노출되지 않음

---

## 9. 비용 예상

### Modal 비용

| 항목 | 사양 | 비용 |
|------|------|------|
| CPU | 0.25 cores | ~$0.0000033/초 |
| 메모리 | 256 MB | ~$0.0000006/초 |
| 요청당 | 평균 30초 | ~$0.000117 |
| 일 100 요청 | | ~$0.012/일 |
| 월 3,000 요청 | | ~$0.35/월 |

**무료 크레딧 $30/월로 충분히 커버** (약 25만 요청/월 가능)

### Bedrock 비용 (별도)

| 모델 | 입력 1K tokens | 출력 1K tokens | 평균 대화 (2K in / 1K out) |
|------|----------------|----------------|---------------------------|
| Sonnet 4.6 | $0.003 | $0.015 | ~$0.021 |
| Opus 4.6 | $0.015 | $0.075 | ~$0.105 |
| Haiku 4.5 | $0.0008 | $0.004 | ~$0.0056 |

---

## 10. 구현 일정

| 단계 | 작업 | 소요 |
|------|------|------|
| 1 | Modal 프로젝트 초기화 + 헬스체크 | 30분 |
| 2 | `/api/chat/test` 연결 테스트 구현 | 1시간 |
| 3 | `/api/chat` 스트리밍 채팅 구현 | 1시간 |
| 4 | 프론트엔드 `API_BASE_URL` 적용 | 30분 |
| 5 | CORS, 모델 화이트리스트, 에러 핸들링 | 30분 |
| 6 | Vercel 환경 변수 + 배포 검증 | 30분 |
| **합계** | | **~4시간** |

---

## 11. 검증 체크리스트

- [ ] `modal serve app.py` — 로컬에서 헬스체크 응답 확인
- [ ] `POST /api/chat/test` — 3개 모델 모두 연결 성공
- [ ] `POST /api/chat` — 스트리밍 응답 정상 수신
- [ ] Vercel 배포 후 — 설정 > 연결 테스트 성공
- [ ] Vercel 배포 후 — 채팅 메시지 송수신 정상
- [ ] GitHub Pages — 동일 기능 정상 동작
- [ ] CORS — 허용 도메인 외 차단 확인
- [ ] 에러 — 잘못된 자격 증명 시 명확한 에러 메시지
