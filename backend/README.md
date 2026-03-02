# backend/ — Modal 서버리스 백엔드

Modal(modal.com) 위에서 동작하는 Python + FastAPI 서버리스 백엔드. AWS Bedrock API를 프록시하여 프로덕션 환경에서 채팅 스트리밍을 제공합니다.

## 파일 구조

```
backend/
├── __init__.py              # 패키지 초기화
├── app.py                   # Modal 엔트리포인트 + FastAPI 앱
├── routes/
│   ├── __init__.py
│   ├── chat.py              # 채팅 엔드포인트
│   └── health.py            # 헬스체크
└── services/
    ├── __init__.py
    └── bedrock.py            # Bedrock 클라이언트 래퍼
```

## 엔드포인트

| 메서드 | 경로 | 설명 |
|--------|------|------|
| `GET` | `/api/health` | 헬스체크 → `{"status": "ok"}` |
| `POST` | `/api/chat` | SSE 스트리밍 채팅 |
| `POST` | `/api/chat/test` | 자격증명 연결 테스트 |

## SSE 프로토콜

Vite 개발 프록시(`bedrock-plugin.ts`)와 100% 호환되는 이벤트 포맷:

```
data: {"type":"text","content":"Hello"}\n\n
data: {"type":"text","content":" world"}\n\n
data: {"type":"done"}\n\n
```

에러 시:
```
data: {"type":"error","error":"에러 메시지"}\n\n
```

## 모델 화이트리스트

`services/bedrock.py`에 정의된 허용 모델:

| 모델 ID |
|---------|
| `us.anthropic.claude-sonnet-4-6` |
| `us.anthropic.claude-opus-4-6-v1` |
| `us.anthropic.claude-haiku-4-5-20251001-v1:0` |

## CORS 설정

```python
allow_origins=["http://localhost:5173", "http://localhost:4173"]
allow_origin_regex=r"https://.*\.(vercel\.app|github\.io)"
```

> FastAPI CORSMiddleware는 `allow_origins`에 와일드카드(`*.vercel.app`)를 지원하지 않으므로 `allow_origin_regex`를 사용합니다.

## 명령어

```bash
pip install modal              # Modal CLI 설치 (최초 1회)
modal setup                    # Modal 인증 (최초 1회)
modal serve backend/app.py     # 로컬 개발 서버
modal deploy backend/app.py    # 프로덕션 배포
```

## 프로덕션

- **URL**: https://sgtlim0--hchat-api-api.modal.run
- **Dashboard**: https://modal.com/apps/sgtlim0/main/deployed/hchat-api
- **Runtime**: Python 3.12, debian_slim, boto3, FastAPI
- **설정**: `timeout=600`, `max_inputs=100` (동시 요청)
