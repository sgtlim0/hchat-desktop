# Confluence/Jira 백엔드 마이그레이션 계획

## A. 기존 백엔드 분석 (hchat-pwa backend/)

### 현재 구조
```
backend/
  app.py                    # Modal 진입점, ASGI FastAPI 앱 생성
  __init__.py
  services/
    __init__.py
    bedrock.py              # boto3 클라이언트 생성, converse/converse_stream 래퍼
  routes/
    __init__.py
    health.py               # GET /api/health
    chat.py                 # POST /api/chat (SSE), POST /api/chat/test
    search.py               # POST /api/search (DuckDuckGo)
    memory.py               # POST /api/extract-memory (Bedrock Haiku)
    schedule.py             # POST /api/schedule/execute
    swarm.py                # POST /api/swarm/execute (SSE, 3 전략)
    channels.py             # POST /api/channels/notify
    openai_proxy.py         # POST /api/openai/chat (SSE)
    gemini_proxy.py         # POST /api/gemini/chat (SSE)
    research.py             # POST /api/research/start, /api/research/quick (SSE)
    analyze.py              # POST /api/analyze (SSE, Chrome Extension용)
    tools.py                # POST /api/tools/test-connection, /api/tools/search, /api/tools/create-jira-issue
```

### 핵심 패턴
- **Modal Image**: `debian_slim(python_version="3.12")` + pip_install
- **CORS**: localhost:5173, localhost:4173, hchat-desktop.vercel.app
- **Bedrock 서비스** (`services/bedrock.py`):
  - `create_client(access_key_id, secret_access_key, region)` — boto3 클라이언트 생성
  - `validate_model(model_id)` — 허용 모델 화이트리스트 (Sonnet/Opus/Haiku)
  - `build_converse_params(model_id, messages, system, max_tokens)` — Converse API 파라미터 구성
  - `converse_sync(client, model_id, messages, system, max_tokens)` — 비스트리밍 호출 (텍스트 반환)
- **인증 방식**: 모든 요청에 AWS 자격증명을 클라이언트에서 직접 전달 (서버 시크릿 아님)
- **SSE 형식**: `data: {"type":"text|done|error|usage", ...}\n\n`

### 기존 tools.py 현황 (중요!)
이미 `/api/tools/` 라우터가 존재하며, 기본적인 Confluence/Jira 검색 기능이 구현되어 있음:
- `POST /api/tools/test-connection` — Atlassian 연결 테스트 (Basic Auth)
- `POST /api/tools/search` — Confluence + Jira 통합 검색 (CQL/JQL)
- `POST /api/tools/create-jira-issue` — Jira 이슈 생성

**문제점:**
1. AI 요약/분석 기능 없음 (단순 검색만)
2. Confluence 페이지 요약 기능 없음
3. Jira 티켓 분석 기능 없음
4. Bedrock 인증 검증 엔드포인트 없음
5. ADF(Atlassian Document Format) 파서 없음
6. HTML 클리너 없음 (BeautifulSoup 미사용)
7. 페이지 ID 직접 조회 미지원
8. Space 키 / Project 키 필터링 미지원

### 프론트엔드 연동 현황
- `tool-connector.ts`: `/api/tools/test-connection`, `/api/tools/search` 호출
- `tool-context-injector.ts`: 검색 결과를 시스템 프롬프트에 주입
- `InternalSearchPage.tsx`: 사내 검색 전용 페이지 (현재 Mock 데이터!)
- `ToolSelector.tsx`: 세션별 Confluence/Jira 토글
- `ToolIntegrationSection.tsx`: Settings에서 자격증명 관리

---

## B. 신규 엔드포인트 목록

### B-1. POST /api/verify/atlassian — Atlassian 인증 검증

```python
# 입력
class AtlassianCreds(BaseModel):
    domain: str       # "https://company.atlassian.net"
    email: str
    api_token: str

class AtlassianVerifyRequest(BaseModel):
    atlassian: AtlassianCreds

# 출력
class VerifyResponse(BaseModel):
    valid: bool
    display_name: str | None = None
    email: str | None = None
    account_id: str | None = None
```

**로직**: `GET {domain}/rest/api/3/myself` 호출, 200 → valid, 그 외 → HTTPException(401)

### B-2. POST /api/verify/bedrock — AWS Bedrock 인증 검증

```python
# 입력
class BedrockCreds(BaseModel):
    aws_access_key_id: str
    aws_secret_access_key: str
    aws_region: str = "us-east-1"
    model_id: str = "anthropic.claude-3-5-sonnet-20241022-v2:0"

class BedrockVerifyRequest(BaseModel):
    bedrock: BedrockCreds

# 출력: VerifyResponse (동일)
```

**로직**: `boto3.client("bedrock").list_foundation_models(byOutputModality="TEXT")` 호출

### B-3. POST /api/confluence/search — Confluence 고급 검색

```python
# 입력
class ConfluenceSearchRequest(BaseModel):
    atlassian: AtlassianCreds
    bedrock: BedrockCreds       # AI 요약용
    query: str
    space_keys: list[str] = []  # Space 필터
    page_ids: list[str] = []    # 직접 조회할 페이지 ID
    max_results: int = 8
    ai_summary: bool = True

# 출력
class ConfluencePage(BaseModel):
    id: str
    title: str
    space: str
    space_key: str
    link: str
    excerpt: str
    last_modified: str
    source: Literal["direct", "search"]

class ConfluenceSearchResponse(BaseModel):
    query: str
    total: int
    results: list[ConfluencePage]
    ai_overview: str | None = None
```

**로직**:
1. `page_ids`로 직접 조회 (중복 제거)
2. CQL 검색: `text ~ "{query}" AND space IN (...) AND type="page" ORDER BY lastmodified DESC`
3. (선택) AI 개요: Bedrock로 상위 6건 요약

### B-4. POST /api/confluence/summarize — Confluence 페이지 요약

```python
# 입력
class PageSummarizeRequest(BaseModel):
    atlassian: AtlassianCreds
    bedrock: BedrockCreds
    page_id: str
    user_query: str = "이 문서의 핵심 내용을 구조화하여 요약해 주세요."

# 출력
class PageSummaryResponse(BaseModel):
    page_id: str
    page_title: str
    space_name: str
    page_link: str
    version: str
    last_modified: str
    summary: str
    char_count: int
```

**로직**: 페이지 body.storage HTML 가져오기 → `clean_html()` 파싱 → Bedrock 요약

### B-5. POST /api/jira/search — Jira 고급 검색

```python
# 입력
class JiraSearchRequest(BaseModel):
    atlassian: AtlassianCreds
    bedrock: BedrockCreds
    query: str
    project_keys: list[str] = []
    ticket_ids: list[str] = []
    max_results: int = 8
    ai_summary: bool = True

# 출력
class JiraTicket(BaseModel):
    key: str
    id: str
    summary: str
    status: str
    status_category: str
    assignee: str
    priority: str
    issue_type: str
    project: str
    project_key: str
    updated: str
    labels: list[str]
    link: str
    source: Literal["direct", "search"]

class JiraSearchResponse(BaseModel):
    query: str
    total: int
    results: list[JiraTicket]
    ai_overview: str | None = None
```

**로직**:
1. `ticket_ids`로 직접 조회
2. JQL 검색: `text ~ "{query}" AND project IN (...) ORDER BY updated DESC`
3. (선택) AI 개요: 상위 6건 패턴 요약

### B-6. POST /api/jira/summarize — Jira 티켓 분석

```python
# 입력
class TicketAnalyzeRequest(BaseModel):
    atlassian: AtlassianCreds
    bedrock: BedrockCreds
    issue_key: str
    user_query: str = "이 티켓의 현재 상황, 주요 논의 사항, 다음 액션 아이템을 정리해 주세요."

# 출력
class TicketAnalysisResponse(BaseModel):
    issue_key: str
    summary: str
    status: str
    assignee: str
    reporter: str
    priority: str
    issue_type: str
    created: str
    updated: str
    labels: list[str]
    total_comments: int
    link: str
    ai_analysis: str
```

**로직**: 티켓 + 댓글(최근 30개) 조회 → ADF 파싱 → Bedrock 분석 (## 현재 상황 / ## 주요 논의 / ## 미해결 쟁점 / ## 다음 액션)

---

## C. 코드 이식 전략

### C-1. 파일 구조 계획

app2/의 7개 파일을 hchat-pwa backend/의 모듈 구조에 맞춰 분리:

```
backend/
  services/
    bedrock.py              # [기존] + invoke_text() 추가
    atlassian.py            # [신규] app2/atlassian.py 이식
  routes/
    tools.py                # [대체] 기존 tools.py를 확장 또는 교체
    verify.py               # [신규] app2/auth.py 이식
    confluence.py           # [신규] app2/confluence.py 이식
    jira.py                 # [신규] app2/jira.py 이식
  models/
    atlassian_schemas.py    # [신규] app2/schemas.py 이식
  app.py                    # [수정] 신규 라우터 등록
```

### C-2. Bedrock 호출 코드 — 재활용 + 확장

**현재 hchat-pwa의 `services/bedrock.py`**는 Converse API를 사용하고, **app2의 `bedrock.py`**는 InvokeModel API(구 Messages API)를 사용함. 두 방식의 차이:

| 항목 | hchat-pwa (Converse) | app2 (InvokeModel) |
|------|---------------------|--------------------|
| API | `converse()` / `converse_stream()` | `invoke_model()` |
| 포맷 | 범용 Bedrock 포맷 | Anthropic 전용 JSON |
| 장점 | 프로바이더 무관, 최신 권장 | 단순, 직접적 |

**전략**: 기존 `converse_sync()` 재활용. app2의 `invoke()` 대신 `converse_sync()` 래퍼를 사용하도록 이식.

```python
# services/bedrock.py에 추가할 헬퍼
def invoke_text(
    access_key_id: str,
    secret_access_key: str,
    region: str,
    model_id: str,
    prompt: str,
    max_tokens: int = 2048,
) -> str:
    """단일 프롬프트 → 텍스트 응답. Confluence/Jira 요약에 사용."""
    client = create_client(access_key_id, secret_access_key, region)
    return converse_sync(
        client=client,
        model_id=model_id,
        messages=[{"role": "user", "content": prompt}],
        max_tokens=max_tokens,
    )
```

이렇게 하면 app2의 `bk_svc.invoke(req.bedrock, prompt, max_tokens)` 호출을 다음으로 대체:

```python
# AS-IS (app2)
summary = bk_svc.invoke(req.bedrock, prompt, max_tokens=2048)

# TO-BE (hchat-pwa)
summary = invoke_text(
    access_key_id=req.bedrock.aws_access_key_id,
    secret_access_key=req.bedrock.aws_secret_access_key,
    region=req.bedrock.aws_region,
    model_id=req.bedrock.model_id,
    prompt=prompt,
    max_tokens=2048,
)
```

### C-3. Atlassian 서비스 이식

`app2/atlassian.py` → `backend/services/atlassian.py`로 거의 그대로 이식.

**변경 사항**:
- import 경로: `apps.api.models.schemas` → `backend.models.atlassian_schemas`
- `auth()` 함수: httpx 기본 인증 대신 `(email, api_token)` 튜플 반환 — 동일하게 유지 가능 (httpx의 `auth` 파라미터와 호환)

```python
# backend/services/atlassian.py
import re
from bs4 import BeautifulSoup


def auth(creds) -> tuple[str, str]:
    """httpx auth 파라미터용 (email, api_token) 튜플"""
    return (creds.email, creds.api_token)


def clean_html(html: str) -> str:
    """Confluence HTML → LLM 친화적 텍스트"""
    # app2/atlassian.py의 clean_html() 그대로 이식
    ...

def parse_adf(nodes: list) -> str:
    """Atlassian Document Format → 순수 텍스트 (재귀)"""
    # app2/atlassian.py의 parse_adf() 그대로 이식
    ...

def build_page(data: dict, domain: str, source: str) -> dict:
    # app2/atlassian.py의 build_page() 그대로 이식
    ...

def build_ticket(issue: dict, domain: str, source: str) -> dict:
    # app2/atlassian.py의 build_ticket() 그대로 이식
    ...
```

### C-4. Pydantic 모델 통합

`backend/models/` 디렉토리를 신설하고 `atlassian_schemas.py` 배치:

```python
# backend/models/__init__.py
# (비어 있음)

# backend/models/atlassian_schemas.py
# app2/schemas.py의 19개 모델 그대로 이식
# 단, model_id 기본값을 hchat-pwa 허용 모델로 변경:
class BedrockCreds(BaseModel):
    aws_access_key_id: str
    aws_secret_access_key: str
    aws_region: str = "us-east-1"
    model_id: str = "us.anthropic.claude-haiku-4-5-20251001-v1:0"  # 요약용 경량 모델
```

### C-5. 기존 tools.py 처리 전략

**방안: 기존 tools.py 유지 + 신규 라우터 별도 추가**

이유:
- 기존 `tools.py`의 `/api/tools/test-connection`, `/api/tools/search`는 프론트엔드 `tool-connector.ts`에서 사용 중
- 신규 6개 엔드포인트는 `/api/verify/*`, `/api/confluence/*`, `/api/jira/*` prefix로 분리
- 기존 기능은 "경량 통합 검색", 신규 기능은 "고급 검색 + AI 분석"으로 역할 분리

향후 프론트엔드가 완전히 마이그레이션되면 기존 tools.py의 중복 기능 제거 가능.

---

## D. 의존성 분석

### D-1. 새로 필요한 Python 패키지

| 패키지 | 용도 | app2에서 사용 위치 |
|--------|------|-------------------|
| `beautifulsoup4` | Confluence HTML → 텍스트 파싱 | `atlassian.py: clean_html()` |
| `lxml` | BeautifulSoup HTML 파서 백엔드 | `clean_html(html, "lxml")` |

### D-2. 이미 포함된 패키지

| 패키지 | 현재 용도 |
|--------|----------|
| `boto3` | Bedrock 호출 (chat, memory, swarm, research) |
| `httpx` | DuckDuckGo 검색, 웹 페이지 fetch, 채널 webhook |
| `fastapi[standard]` | 모든 라우터 |
| `pydantic` | fastapi에 포함 |

### D-3. Modal Image 수정

```python
# AS-IS
image = (
    modal.Image.debian_slim(python_version="3.12")
    .pip_install("boto3", "fastapi[standard]", "duckduckgo-search", "httpx", "openai", "google-genai", "numpy>=1.24.0")
    .add_local_python_source("backend")
)

# TO-BE
image = (
    modal.Image.debian_slim(python_version="3.12")
    .pip_install(
        "boto3", "fastapi[standard]", "duckduckgo-search", "httpx",
        "openai", "google-genai", "numpy>=1.24.0",
        "beautifulsoup4", "lxml",  # 신규 추가
    )
    .add_local_python_source("backend")
)
```

---

## E. 보안 개선사항

### E-1. CQL/JQL 인젝션 방지

app2의 현재 코드에 **심각한 인젝션 취약점** 존재:

```python
# 취약 코드 (app2/confluence.py:36)
cql = f'text ~ "{req.query}"{space_clause} AND type="page" ORDER BY lastmodified DESC'

# 취약 코드 (app2/jira.py:40)
jql = f'text ~ "{req.query}"{proj_clause} ORDER BY updated DESC'
```

공격 벡터: `query = 'test" OR type="attachment'` → CQL 구문 탈출

**수정 방안**:

```python
import re

def sanitize_query(query: str) -> str:
    """CQL/JQL 인젝션 방지: 특수문자 이스케이프"""
    # Atlassian CQL/JQL에서 위험한 문자 제거/이스케이프
    # 큰따옴표, 백슬래시, 세미콜론 제거
    sanitized = re.sub(r'["\\\;]', '', query)
    # 연속 공백 정리
    sanitized = re.sub(r'\s+', ' ', sanitized).strip()
    # 최대 길이 제한 (200자)
    return sanitized[:200]

def sanitize_key(key: str) -> str:
    """Space key / Project key 검증: 영문+숫자+하이픈만 허용"""
    if not re.match(r'^[A-Za-z0-9_-]+$', key):
        raise ValueError(f"Invalid key format: {key}")
    return key

def sanitize_page_id(page_id: str) -> str:
    """Page ID 검증: 숫자만 허용"""
    if not re.match(r'^\d+$', page_id):
        raise ValueError(f"Invalid page ID: {page_id}")
    return page_id

def sanitize_issue_key(issue_key: str) -> str:
    """Issue key 검증: PROJECT-123 형식만 허용"""
    if not re.match(r'^[A-Z][A-Z0-9]+-\d+$', issue_key):
        raise ValueError(f"Invalid issue key: {issue_key}")
    return issue_key
```

적용 예시:

```python
# 안전한 CQL 구성
query = sanitize_query(req.query)
space_clause = ""
if req.space_keys:
    keys = ", ".join(f'"{sanitize_key(k)}"' for k in req.space_keys)
    space_clause = f" AND space IN ({keys})"
cql = f'text ~ "{query}"{space_clause} AND type="page" ORDER BY lastmodified DESC'
```

### E-2. 입력 검증 강화

Pydantic 모델에 Field 제약 추가:

```python
from pydantic import BaseModel, Field, field_validator
import re

class AtlassianCreds(BaseModel):
    domain: str = Field(..., min_length=10, max_length=200)
    email: str = Field(..., max_length=254)
    api_token: str = Field(..., min_length=10, max_length=500)

    @field_validator("domain")
    @classmethod
    def validate_domain(cls, v: str) -> str:
        if not v.startswith("https://"):
            raise ValueError("Domain must start with https://")
        if not re.match(r'^https://[\w.-]+\.atlassian\.net$', v):
            raise ValueError("Invalid Atlassian domain format")
        return v.rstrip("/")

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        if "@" not in v:
            raise ValueError("Invalid email format")
        return v

class ConfluenceSearchRequest(BaseModel):
    atlassian: AtlassianCreds
    bedrock: BedrockCreds
    query: str = Field(..., min_length=1, max_length=200)
    space_keys: list[str] = Field(default=[], max_length=10)
    page_ids: list[str] = Field(default=[], max_length=20)
    max_results: int = Field(default=8, ge=1, le=50)
    ai_summary: bool = True
```

### E-3. CORS 설정

기존 CORS 설정은 3개 origin만 허용 — 그대로 유지. 추가 조치 불필요.

### E-4. 자격증명 보안

- 자격증명은 모든 요청마다 클라이언트에서 전달 (서버 저장 없음) — 기존 패턴 유지
- 응답에 자격증명 절대 포함 금지
- 에러 메시지에 자격증명 노출 금지: `str(e)` 대신 일반화된 메시지 사용

```python
except Exception as e:
    # BAD: raise HTTPException(500, f"오류: {e}")  # 자격증명 노출 가능
    # GOOD:
    error_msg = str(e)
    if any(kw in error_msg.lower() for kw in ["access_key", "secret", "token", "password"]):
        error_msg = "인증 관련 오류가 발생했습니다."
    raise HTTPException(500, error_msg)
```

---

## F. 성능 최적화

### F-1. boto3 클라이언트 재사용

app2의 `bedrock.py`는 매 요청마다 `boto3.client()`를 새로 생성 — **비효율적**.

hchat-pwa의 `services/bedrock.py`도 동일 문제가 있으나, Modal의 서버리스 특성상 컨테이너 수명이 짧아 영향이 제한적.

**최적화 방안** (선택적):

```python
# services/bedrock.py에 간단한 캐시 추가
from functools import lru_cache

@lru_cache(maxsize=8)
def _get_client(access_key_id: str, secret_access_key: str, region: str):
    """동일 자격증명의 클라이언트 재사용 (컨테이너 수명 내)"""
    return boto3.client(
        "bedrock-runtime",
        region_name=region,
        aws_access_key_id=access_key_id,
        aws_secret_access_key=secret_access_key,
        config=Config(read_timeout=600),
    )
```

**주의**: `lru_cache`에 secret_access_key가 캐시 키로 들어가므로, 보안 관점에서 Modal 컨테이너의 짧은 수명에 의존. 프로덕션에서는 TTL 캐시가 더 적절.

### F-2. httpx 비동기 활용

app2의 코드는 이미 `httpx.AsyncClient`를 사용하지만, 매 요청마다 새 클라이언트를 생성:

```python
# AS-IS (매 요청마다 새 클라이언트)
async with httpx.AsyncClient(timeout=15) as client:
    ...
```

**최적화 방안**: 라우터 레벨에서 공유 클라이언트 사용은 Modal 서버리스에서는 복잡도 대비 이득이 적음. 현재 패턴 유지하되 타임아웃만 명확히 설정.

### F-3. 타임아웃 설정

```python
# Atlassian API 호출 (검색, 인증)
ATLASSIAN_TIMEOUT = httpx.Timeout(
    connect=5.0,    # 연결 타임아웃
    read=15.0,      # 읽기 타임아웃
    write=5.0,      # 쓰기 타임아웃
    pool=5.0,       # 풀 타임아웃
)

# Confluence 페이지 본문 조회 (큰 페이지)
CONTENT_FETCH_TIMEOUT = httpx.Timeout(
    connect=5.0,
    read=20.0,      # 큰 페이지 대비
    write=5.0,
    pool=5.0,
)
```

### F-4. AI 요약 비동기 처리

Bedrock `converse_sync()`는 블로킹 호출이므로, `asyncio.get_event_loop().run_in_executor()` 사용 (research.py, swarm.py와 동일 패턴):

```python
from concurrent.futures import ThreadPoolExecutor

_executor = ThreadPoolExecutor(max_workers=3)

async def _invoke_text_async(
    access_key_id: str, secret_access_key: str, region: str,
    model_id: str, prompt: str, max_tokens: int = 2048,
) -> str:
    """비동기 래퍼 — 이벤트 루프 블로킹 방지"""
    loop = asyncio.get_event_loop()
    client = create_client(access_key_id, secret_access_key, region)
    return await loop.run_in_executor(
        _executor,
        converse_sync,
        client, model_id,
        [{"role": "user", "content": prompt}],
        None,  # system
        max_tokens,
    )
```

### F-5. HTML 파싱 최적화

`clean_html()`에서 `lxml` 파서 사용은 정확하나, 매우 큰 페이지(>16KB) 방지:

```python
def clean_html(html: str) -> str:
    if not html:
        return ""
    # 입력 크기 제한 (100KB) — 극단적 페이지 방어
    html = html[:100_000]
    soup = BeautifulSoup(html, "lxml")
    ...
    return re.sub(r"\n{3,}", "\n\n", text)[:16000]  # 출력도 제한
```

---

## G. 구현 순서 (단계별)

### Phase 1: 기반 인프라 (의존성 0)

**1-1. Modal Image 업데이트**
- `app.py`에 `beautifulsoup4`, `lxml` 추가
- `modal serve backend/app.py`로 로컬 검증

**1-2. 디렉토리 구조 생성**
```bash
mkdir -p backend/models
touch backend/models/__init__.py
```

**1-3. Pydantic 스키마 이식**
- `backend/models/atlassian_schemas.py` 생성
- app2/schemas.py의 19개 모델 + 보안 validator 추가

**1-4. Bedrock 서비스 확장**
- `backend/services/bedrock.py`에 `invoke_text()` 추가
- 기존 `converse_sync()` 활용

### Phase 2: Atlassian 서비스 (Phase 1 의존)

**2-1. `backend/services/atlassian.py` 생성**
- `auth()`, `clean_html()`, `parse_adf()`, `build_page()`, `build_ticket()` 이식
- 입력 검증 유틸리티 (`sanitize_query`, `sanitize_key` 등) 포함

**2-2. 단위 테스트**
- `clean_html()` 테스트 (script 제거, 테이블 변환, 16KB 자르기)
- `parse_adf()` 테스트 (text, hardBreak, codeBlock, 중첩 노드)
- `sanitize_query()` 테스트 (인젝션 벡터)

### Phase 3: 인증 라우터 (Phase 1-2 의존)

**3-1. `backend/routes/verify.py` 생성**
- `POST /api/verify/atlassian`
- `POST /api/verify/bedrock`

**3-2. app.py에 라우터 등록**
```python
from backend.routes.verify import router as verify_router
web_app.include_router(verify_router, prefix="/api")
```

**3-3. 수동 테스트**: `modal serve` → curl/Postman으로 검증

### Phase 4: Confluence 라우터 (Phase 1-3 의존)

**4-1. `backend/routes/confluence.py` 생성**
- `POST /api/confluence/search`
- `POST /api/confluence/summarize`

**4-2. AI 요약은 `_invoke_text_async()` 래퍼 사용**

**4-3. 통합 테스트**: 실제 Atlassian 인스턴스로 검증

### Phase 5: Jira 라우터 (Phase 1-3 의존, Phase 4와 병렬 가능)

**5-1. `backend/routes/jira.py` 생성**
- `POST /api/jira/search`
- `POST /api/jira/summarize`

**5-2. ADF 파싱 + 댓글 처리 검증**

### Phase 6: 통합 + 배포 (Phase 3-5 의존)

**6-1. `app.py` 최종 수정**
```python
from backend.routes.verify import router as verify_router
from backend.routes.confluence import router as confluence_router
from backend.routes.jira import router as jira_router

web_app.include_router(verify_router, prefix="/api")
web_app.include_router(confluence_router, prefix="/api")
web_app.include_router(jira_router, prefix="/api")
```

**6-2. E2E 테스트 (전체 흐름)**

**6-3. `modal deploy backend/app.py`**

### Phase 7: 프론트엔드 연결 (Phase 6 이후)

- `InternalSearchPage.tsx`의 Mock 데이터를 실제 API 호출로 교체
- `tool-connector.ts`에 신규 엔드포인트 함수 추가
- `ToolIntegrationSection.tsx`에 인증 검증 버튼 연결

---

## H. 테스트 전략

### H-1. 단위 테스트

| 대상 | 테스트 항목 | 방법 |
|------|------------|------|
| `sanitize_query()` | `"`, `\`, `;`, 공백, 200자 초과 | pytest 직접 호출 |
| `sanitize_key()` | 영문숫자 통과, 특수문자 거부 | pytest 직접 호출 |
| `sanitize_issue_key()` | `PROJ-123` 통과, `../etc` 거부 | pytest 직접 호출 |
| `clean_html()` | script 제거, 테이블 `|` 변환, heading `#` 변환, 16KB 자르기 | pytest + HTML 픽스처 |
| `parse_adf()` | text, hardBreak, codeBlock, paragraph, 중첩, null 입력 | pytest + ADF JSON 픽스처 |
| `build_page()` | 필수 필드 매핑, 링크 조합 | pytest + mock data |
| `build_ticket()` | 필수 필드 매핑, null assignee 처리 | pytest + mock data |
| `invoke_text()` | converse_sync 호출 위임 확인 | pytest + mock boto3 |

### H-2. 통합 테스트 (httpx + respx)

```python
import pytest
from httpx import AsyncClient
import respx

@pytest.fixture
def mock_confluence():
    with respx.mock:
        # CQL 검색 모킹
        respx.get("https://test.atlassian.net/wiki/rest/api/search").respond(
            200, json={"results": [{"content": {"id": "123", "title": "Test Page"}, ...}]}
        )
        # 페이지 본문 모킹
        respx.get("https://test.atlassian.net/wiki/rest/api/content/123").respond(
            200, json={"title": "Test", "body": {"storage": {"value": "<p>Hello</p>"}}, ...}
        )
        yield

@pytest.mark.asyncio
async def test_confluence_search(mock_confluence):
    from backend.routes.confluence import search
    # ... FastAPI TestClient로 엔드포인트 테스트
```

### H-3. Bedrock 모킹

```python
from unittest.mock import patch, MagicMock

@patch("backend.services.bedrock.create_client")
@patch("backend.services.bedrock.converse_sync")
def test_invoke_text(mock_converse, mock_client):
    mock_converse.return_value = "요약된 내용입니다."
    result = invoke_text(
        "fake_key", "fake_secret", "us-east-1",
        "us.anthropic.claude-haiku-4-5-20251001-v1:0",
        "테스트 프롬프트"
    )
    assert result == "요약된 내용입니다."
    mock_converse.assert_called_once()
```

### H-4. E2E 수동 테스트 체크리스트

```
[ ] POST /api/verify/atlassian — 유효한 자격증명 → valid: true
[ ] POST /api/verify/atlassian — 잘못된 토큰 → 401
[ ] POST /api/verify/bedrock — 유효한 AWS 키 → valid: true
[ ] POST /api/confluence/search — 검색어로 검색 → results 반환
[ ] POST /api/confluence/search — page_ids 직접 조회 → direct 결과
[ ] POST /api/confluence/search — ai_summary=true → ai_overview 포함
[ ] POST /api/confluence/search — ai_summary=false → ai_overview: null
[ ] POST /api/confluence/summarize — 유효 page_id → summary 반환
[ ] POST /api/confluence/summarize — 잘못된 page_id → 에러
[ ] POST /api/jira/search — 검색어로 검색 → results 반환
[ ] POST /api/jira/search — ticket_ids 직접 조회 → direct 결과
[ ] POST /api/jira/search — ai_summary=true → ai_overview 포함
[ ] POST /api/jira/summarize — 유효 issue_key → ai_analysis 반환
[ ] POST /api/jira/summarize — 댓글 30개 이상 → 최근 30개만 처리
[ ] CQL 인젝션 시도 → 특수문자 제거 확인
[ ] JQL 인젝션 시도 → 특수문자 제거 확인
[ ] 잘못된 domain 형식 → Pydantic 검증 오류
```

---

## I. 배포 전략

### I-1. 개발 단계 (modal serve)

```bash
# 1. 의존성 확인
cd /Users/yhlim/workspace/hchat-pwa
modal serve backend/app.py

# 2. 로컬에서 beautifulsoup4 + lxml 정상 로드 확인
# 3. 각 Phase 완료 시마다 curl로 검증
```

### I-2. 스테이징 배포

```bash
# Phase 6 완료 후
modal deploy backend/app.py

# 프로덕션 URL에서 health check
curl https://sgtlim0--hchat-api-api.modal.run/api/health
```

### I-3. 환경변수 / Secrets

**추가 Secrets 불필요!**

이유: Confluence/Jira 자격증명과 Bedrock 자격증명은 모두 프론트엔드에서 매 요청마다 전달됨. 서버 측 환경변수 불필요.

기존 `hchat-api-keys` Secret (OpenAI/Gemini용)은 변경 없음.

### I-4. 배포 순서

```
1. backend/models/__init__.py, atlassian_schemas.py 생성
2. backend/services/atlassian.py 생성
3. backend/services/bedrock.py 수정 (invoke_text 추가)
4. backend/routes/verify.py 생성
5. backend/routes/confluence.py 생성
6. backend/routes/jira.py 생성
7. backend/app.py 수정 (라우터 등록 + image 의존성)
8. modal serve → 로컬 테스트
9. modal deploy → 프로덕션 배포
10. 프론트엔드 연결 (별도 커밋)
```

### I-5. 롤백 계획

기존 엔드포인트에 영향 없음 (신규 라우터만 추가). 문제 발생 시:
1. `app.py`에서 신규 라우터 3줄 주석 처리
2. `modal deploy` 재실행
3. 기존 `/api/tools/*` 엔드포인트는 영향받지 않음

### I-6. 최종 파일 변경 요약

| 파일 | 변경 유형 | 설명 |
|------|-----------|------|
| `backend/app.py` | 수정 | image에 bs4/lxml 추가, 라우터 3개 등록 |
| `backend/services/bedrock.py` | 수정 | `invoke_text()` 추가 |
| `backend/services/atlassian.py` | 신규 | HTML/ADF 파서, 빌더, sanitize |
| `backend/models/__init__.py` | 신규 | 빈 파일 |
| `backend/models/atlassian_schemas.py` | 신규 | 19개 Pydantic 모델 |
| `backend/routes/verify.py` | 신규 | 인증 검증 2개 엔드포인트 |
| `backend/routes/confluence.py` | 신규 | 검색 + 요약 2개 엔드포인트 |
| `backend/routes/jira.py` | 신규 | 검색 + 분석 2개 엔드포인트 |

**신규 파일: 5개 | 수정 파일: 2개 | 삭제 파일: 0개**
