# H Chat AI Platform - 구현 방안서

> Phase 36~40: Token Entropy Encoder, Deep Research, Multi-Agent v2, Self-Improving Loop, Browser Agent

---

## 1. 현재 코드베이스 Gap Analysis

### 6개 모듈 매핑 현황

| 모듈 | 현재 상태 | 재사용률 | 핵심 기존 파일 |
|------|----------|---------|---------------|
| **Token Entropy Encoder** | 기본 토큰 추정만 | 70% | `token-estimator.ts`, `perf-optimizer.ts`, `cache.store.ts` |
| **Deep Research Engine** | DuckDuckGo 단순 검색 | 60% | `web-search.ts`, `search-intent.ts`, `backend/routes/search.py` |
| **AI Browser Agent** | 미구현 | 30% | `agent-v2.ts`, `agent/tools.ts` |
| **Multi-Agent System** | Swarm 순차 실행 | 85% | `swarm.store.ts`, `backend/routes/swarm.py` |
| **Self-Improving Loop** | 프롬프트 체인만 | 50% | `prompt-chain.store.ts`, `insights.store.ts`, `workflow-automation.ts` |
| **Model Router** | 패턴 매칭 기반 | 80% | `providers/router.ts`, `analytics-engine.ts` |

### 주요 Gap 요약

**이미 있는 것:**
- SSE 스트리밍 인프라 (4개 엔드포인트)
- Zustand + IndexedDB 영속화 패턴
- Multi-Provider 팩토리 (Bedrock/OpenAI/Gemini)
- Swarm 오케스트레이션 기초
- 토큰 추정기 (한/영 구분)
- DuckDuckGo 검색 프록시
- 응답 캐싱 (해시 기반, TTL)

**부족한 것:**
- 실제 토큰 압축/엔트로피 인코딩
- 재귀적 Deep Research (한 번 검색만 수행)
- 진정한 병렬 에이전트 실행 (순차만)
- 피드백 기반 자기 개선 루프
- 브라우저 자동화 (Playwright)
- 실시간 성능 데이터 기반 모델 라우팅

---

## 2. 우선순위 매트릭스

| 순위 | 모듈 | 난이도 | 영향도 | ROI | 작업량 | Phase |
|------|------|--------|--------|-----|--------|-------|
| 1 | **Multi-Agent v2** | 2/5 | 4/5 | 9.5 | 2-3일 | 36 |
| 2 | **Model Router v2** | 2/5 | 4/5 | 9.0 | 2일 | 36 |
| 3 | **Token Entropy Encoder** | 3/5 | 5/5 | 8.5 | 3-4일 | 37 |
| 4 | **Deep Research Engine** | 4/5 | 4/5 | 7.0 | 5-6일 | 38 |
| 5 | **Self-Improving Loop** | 4/5 | 3/5 | 6.0 | 5-6일 | 39 |
| 6 | **AI Browser Agent** | 5/5 | 3/5 | 5.0 | 7-8일 | 40 |

**결정 근거:** ROI = (영향도 × 재사용률) / (난이도 × 작업량)

---

## 3. 통합 아키텍처

### Frontend / Backend 역할 분리

```
Frontend (React + Zustand)              Backend (Modal + FastAPI)
├─ UI/UX 렌더링                         ├─ Token Entropy 계산 (numpy)
├─ Zustand 상태 관리                     ├─ Deep Research 크롤링 (httpx)
├─ IndexedDB 캐싱 (Dexie)               ├─ Browser Agent (Playwright)
├─ SSE 이벤트 구독                       ├─ LLM API 프록시 (SSE)
└─ 실시간 시각화                         └─ 코드 샌드박스 (RestrictedPython)
```

### FSD 레이어별 신규 파일 배치

```
src/
├── entities/                           # 신규 스토어 4개
│   ├── research/
│   │   ├── research.store.ts           # Deep Research 상태
│   │   └── __tests__/
│   ├── compression/
│   │   ├── compression.store.ts        # Token Entropy 상태
│   │   └── __tests__/
│   ├── learning/
│   │   ├── learning.store.ts           # Self-Improving 상태
│   │   └── __tests__/
│   └── swarm/
│       ├── swarm.store.ts              # 확장 (병렬 실행)
│       ├── swarm-templates.ts          # 신규 (10개 템플릿)
│       └── swarm-orchestrator.ts       # 신규 (오케스트레이션)
│
├── pages/                              # 신규 페이지 2개
│   └── research/
│       └── ResearchPage.tsx            # Deep Research 대시보드
│
├── shared/
│   └── lib/
│       ├── providers/
│       │   ├── router.ts               # 확장 (의도 분류기)
│       │   ├── router-rules.ts         # 신규 (15개 카테고리)
│       │   └── router-analytics.ts     # 신규 (벤치마크)
│       ├── compression/
│       │   ├── entropy-encoder.ts      # 신규 (Shannon Entropy)
│       │   ├── prompt-compressor.ts    # 신규 (3단계 압축)
│       │   └── context-pruner.ts       # 신규 (컨텍스트 정리)
│       ├── research/
│       │   ├── research-agent.ts       # 신규 (리서치 에이전트)
│       │   ├── source-validator.ts     # 신규 (출처 검증)
│       │   └── report-generator.ts     # 신규 (보고서 생성)
│       └── sse-client.ts              # 신규 (통합 SSE 클라이언트)
│
backend/
├── routes/
│   ├── entropy.py                      # 신규 (토큰 엔트로피 API)
│   ├── research.py                     # 신규 (Deep Research SSE)
│   └── improvement.py                  # 신규 (자기 개선 API)
└── services/
    ├── entropy/
    │   └── encoder.py                  # 신규 (엔트로피 계산)
    ├── research/
    │   └── engine.py                   # 신규 (리서치 엔진)
    └── improvement/
        └── loop.py                     # 신규 (피드백 루프)
```

### 신규 API 엔드포인트

| 엔드포인트 | 메서드 | 스트리밍 | Phase | 목적 |
|-----------|--------|---------|-------|------|
| `/api/entropy/encode` | POST | - | 37 | 프롬프트 압축 |
| `/api/entropy/analyze` | POST | - | 37 | 엔트로피 분석 |
| `/api/research/start` | POST | SSE | 38 | Deep Research 실행 |
| `/api/research/status/{id}` | GET | - | 38 | 연구 상태 조회 |
| `/api/improvement/track` | POST | - | 39 | 성능 메트릭 수집 |
| `/api/improvement/suggest` | GET | - | 39 | 개선 제안 조회 |

### 신규 SSE 이벤트 타입

```typescript
type SSEEventType =
  | 'text' | 'done' | 'error' | 'usage'           // 기존
  | 'research_start'                                // 연구 시작
  | 'research_search'                               // 검색 단계
  | 'research_analyze'                              // 분석 단계
  | 'research_finding'                              // 발견 사항
  | 'research_report'                               // 최종 보고서
  | 'agent_parallel_start'                          // 병렬 에이전트 시작
  | 'agent_parallel_result'                         // 병렬 에이전트 결과
```

---

## 4. Phase별 상세 구현 계획

### Phase 36: Quick Wins (3일)

> Multi-Agent v2 + Model Router v2 — 기존 코드 85% 재사용

#### 36-1. Multi-Agent 병렬 실행

**변경 대상:** `backend/routes/swarm.py`

```python
# 현재: 순차 실행
for agent in agents:
    result = converse_sync(...)  # 블로킹

# 개선: asyncio.gather 병렬 실행
import asyncio

async def run_parallel_agents(agents, task):
    tasks = [run_agent(agent, task) for agent in agents]
    results = await asyncio.gather(*tasks, return_exceptions=True)
    return merge_results(results)
```

**신규 파일:**
- `src/entities/swarm/swarm-templates.ts` — 10개 프리셋 워크플로우
- `src/entities/swarm/swarm-orchestrator.ts` — 3가지 전략 (pipeline/parallel/debate)

**SSE 이벤트 확장:**
```python
# agent_parallel_start: 병렬 시작 알림
# agent_parallel_result: 각 에이전트 결과 (순서 무관)
# swarm_consensus: 결과 합의/병합
```

#### 36-2. Model Router 고도화

**변경 대상:** `src/shared/lib/providers/router.ts`

**신규 파일:**
- `router-rules.ts` — 15개 의도 카테고리 + 규칙 엔진
- `router-analytics.ts` — 실시간 벤치마크 수집

```typescript
// router-rules.ts
const ROUTING_RULES: Record<IntentCategory, ModelPreference> = {
  'code-generation':  { primary: 'claude-opus', fallback: 'gpt-4o' },
  'code-review':      { primary: 'claude-sonnet', fallback: 'gpt-4o-mini' },
  'creative-writing': { primary: 'claude-opus', fallback: 'gemini-pro' },
  'data-analysis':    { primary: 'gpt-4o', fallback: 'claude-sonnet' },
  'translation':      { primary: 'gpt-4o-mini', fallback: 'gemini-flash' },
  'summarization':    { primary: 'gpt-4o-mini', fallback: 'claude-haiku' },
  'reasoning':        { primary: 'claude-opus', fallback: 'gpt-4o' },
  'math':             { primary: 'claude-opus', fallback: 'gemini-pro' },
  'search-query':     { primary: 'gpt-4o-mini', fallback: 'claude-haiku' },
  'casual-chat':      { primary: 'claude-haiku', fallback: 'gpt-4o-mini' },
  // ...
}
```

---

### Phase 37: Token Optimization (4일)

> 프롬프트 압축으로 API 비용 40~60% 절감

#### 37-1. Frontend: 압축 파이프라인

**신규 파일:** `src/shared/lib/compression/`

```typescript
// entropy-encoder.ts
export class EntropyEncoder {
  private threshold: number

  encode(text: string): CompressedResult {
    const tokens = this.tokenize(text)
    const entropy = this.computeEntropy(tokens)
    const filtered = tokens.filter(t => entropy[t] >= this.threshold)
    return {
      compressed: this.detokenize(filtered),
      ratio: filtered.length / tokens.length,
      savedTokens: tokens.length - filtered.length,
    }
  }

  private computeEntropy(tokens: string[]): Map<string, number> {
    const freq = new Map<string, number>()
    for (const t of tokens) freq.set(t, (freq.get(t) ?? 0) + 1)
    const total = tokens.length
    const result = new Map<string, number>()
    for (const [t, f] of freq) {
      const p = f / total
      result.set(t, -p * Math.log2(p))
    }
    return result
  }
}

// prompt-compressor.ts — 3단계 파이프라인
export class PromptCompressor {
  compress(prompt: string): CompressedPrompt {
    const step1 = this.removeStopwords(prompt)      // 불용어 제거
    const step2 = this.entropyFilter(step1)          // 엔트로피 필터
    const step3 = this.sentenceRank(step2)           // 문장 랭킹
    return { original: prompt, compressed: step3, ratio: ... }
  }
}
```

#### 37-2. Backend: 엔트로피 분석 API

**신규 파일:** `backend/routes/entropy.py`

```python
@router.post("/entropy/analyze")
async def analyze_entropy(req: EntropyRequest):
    tokens = tokenize(req.text)
    entropy_scores = compute_entropy(tokens)
    return {
        "entropy": float(np.mean(list(entropy_scores.values()))),
        "complexity": classify_complexity(entropy_scores),
        "recommendedModel": select_model(entropy_scores),
        "estimatedTokens": len(tokens),
        "compressionPotential": estimate_compression(entropy_scores),
    }
```

**의존성 추가:** `numpy>=1.24.0` (+30MB)

#### 37-3. Zustand Store

```typescript
// src/entities/compression/compression.store.ts
interface CompressionState {
  enabled: boolean
  threshold: number              // 0.2~0.4
  totalSavedTokens: number
  totalSavedCost: number
  compressionHistory: CompressionEntry[]

  compress: (prompt: string) => CompressedPrompt
  setThreshold: (t: number) => void
  hydrate: () => void
}
```

#### 성능 목표

| 단계 | 토큰 수 (1000토큰 기준) | 절감률 |
|------|------------------------|--------|
| 원본 | 1,000 | 0% |
| Stopword 제거 | 750 | 25% |
| Entropy 필터 | 500 | 50% |
| Sentence 랭킹 | 350 | 65% |

---

### Phase 38: Research Intelligence (5일)

> Deep Research 자동 리서치 엔진

#### 38-1. 리서치 파이프라인

```
User Query
    ↓
[1] Intent Analysis        기존 search-intent.ts 확장
    ↓
[2] Query Expansion        1개 → 5~10개 검색어 생성
    ↓
[3] Parallel Search        기존 DuckDuckGo API (5개 동시)
    ↓
[4] Content Extraction     httpx + HTML 파싱 (backend)
    ↓
[5] Evidence Ranking       출처 신뢰도 가중치
    ↓
[6] LLM Synthesis          Bedrock/OpenAI로 종합 분석
    ↓
[7] Report Generation      마크다운 보고서 + 인용
```

#### 38-2. Backend SSE 엔드포인트

```python
# backend/routes/research.py
@router.post("/research/start")
async def start_research(req: ResearchRequest):
    async def research_stream():
        yield sse({"type": "research_start", "query": req.query})

        # Step 1: Query Expansion
        queries = await expand_query(req.query, req.credentials)
        yield sse({"type": "research_search", "queries": queries})

        # Step 2: Parallel Search
        all_results = []
        for q in queries:
            results = search_web(q)
            all_results.extend(results)
            yield sse({"type": "research_finding", "query": q, "count": len(results)})

        # Step 3: Content Extraction (httpx)
        evidence = []
        for url in top_urls(all_results, limit=10):
            text = await extract_content(url)
            evidence.append({"url": url, "text": text[:2000]})

        # Step 4: LLM Synthesis
        report = await synthesize(req.query, evidence, req.credentials)
        yield sse({"type": "research_report", "content": report, "sources": len(evidence)})
        yield sse({"type": "done"})

    return StreamingResponse(research_stream(), media_type="text/event-stream")
```

#### 38-3. Frontend Store + Page

```typescript
// src/entities/research/research.store.ts
interface ResearchState {
  sessions: ResearchSession[]
  currentSession: string | null
  isResearching: boolean

  startResearch: (query: string, depth: number) => void
  cancelResearch: () => void
  exportReport: (sessionId: string, format: 'md' | 'pdf') => void
  hydrate: () => void
}

// src/pages/research/ResearchPage.tsx
// - 연구 대시보드 UI
// - 실시간 진행 상황 (SSE)
// - 검색 결과 카드 뷰
// - 마크다운 보고서 렌더링
```

#### Source Authority 기준

```typescript
const SOURCE_AUTHORITY: Record<string, number> = {
  'docs.aws.amazon.com': 0.95,
  'learn.microsoft.com': 0.95,
  'arxiv.org': 0.90,
  'github.com': 0.85,
  'stackoverflow.com': 0.80,
  'medium.com': 0.60,
  'reddit.com': 0.40,
}
```

---

### Phase 39: Learning System (5일)

> 사용자 피드백 기반 자기 개선 루프

#### 39-1. 피드백 수집

```typescript
// src/entities/learning/learning.store.ts
interface LearningState {
  feedbacks: Feedback[]               // 사용자 평가 (thumbs up/down)
  promptPatterns: PromptPattern[]     // 학습된 프롬프트 패턴
  qualityMetrics: QualityMetrics      // 응답 품질 메트릭
  suggestions: Suggestion[]           // 자동 개선 제안

  submitFeedback: (messageId: string, rating: 'good' | 'bad', reason?: string) => void
  analyzePatterns: () => PromptPattern[]
  generateSuggestions: () => Suggestion[]
  hydrate: () => void
}
```

#### 39-2. 개선 엔진

```
Feedback Collection
    ↓
Pattern Analysis        빈번한 실패 패턴 탐지
    ↓
Quality Scoring         응답 품질 점수화
    ↓
Improvement Suggestion  모델/프롬프트/설정 개선 제안
    ↓
A/B Testing            제안 적용 효과 검증
    ↓
Auto-Apply             검증된 개선 자동 적용
```

#### 39-3. Backend 메트릭 API

```python
# backend/routes/improvement.py
@router.post("/improvement/track")
async def track_metrics(req: MetricsRequest):
    # 응답 시간, 토큰 수, 사용자 평가 저장
    return {"tracked": True}

@router.get("/improvement/suggest")
async def get_suggestions():
    # 축적된 데이터 기반 개선 제안
    return {"suggestions": [...]}
```

---

### Phase 40: Browser Automation (7일, 선택)

> Playwright 기반 웹 자동화 — 높은 복잡도, 신중히 판단

#### Modal 환경 제약사항

| 항목 | 제약 | 대응 |
|------|------|------|
| 메모리 | Playwright+Chromium ~400MB | `.memory(1024)` 설정 |
| 타임아웃 | 600초 기본 | `timeout=1800` 커스텀 |
| 이미지 크기 | +250MB (Chromium) | 콜드스타트 30-60초 |
| 동시성 | 브라우저 인스턴스 리소스 | `max_inputs=20`으로 제한 |

#### 권장: httpx + BeautifulSoup 대안

```python
# 대부분의 크롤링은 Playwright 없이 가능
import httpx
from bs4 import BeautifulSoup

async def extract_page(url: str) -> str:
    async with httpx.AsyncClient() as client:
        resp = await client.get(url, follow_redirects=True, timeout=15)
        soup = BeautifulSoup(resp.text, "html.parser")
        for tag in soup(["script", "style", "nav", "footer", "header"]):
            tag.decompose()
        return soup.get_text(separator=" ", strip=True)[:5000]
```

**Playwright는 동적 JS 렌더링 필수 사이트에만 사용.**

---

## 5. Backend 의존성 변경 계획

### 단계별 pip 의존성

```python
# Phase 37 추가
"numpy>=1.24.0"              # 엔트로피 계산 (+30MB)

# Phase 38 추가
"beautifulsoup4>=4.12"       # HTML 파싱 (+5MB)

# Phase 39 추가
"RestrictedPython>=5.3"      # 코드 샌드박스 (+5MB)

# Phase 40 추가 (선택)
"playwright>=1.40.0"         # 브라우저 자동화 (+250MB)
```

### 이미지 크기 변화

| Phase | 추가 | 누적 크기 | 콜드스타트 |
|-------|------|----------|-----------|
| 현재 | - | ~155MB | ~15초 |
| 37 | numpy | ~185MB | ~20초 |
| 38 | bs4 | ~190MB | ~20초 |
| 39 | RestrictedPython | ~195MB | ~22초 |
| 40 | Playwright | ~445MB | ~45초 |

---

## 6. IndexedDB 스키마 확장

```typescript
// src/shared/lib/db.ts 확장
// Dexie v2 스키마 추가

// Phase 37
compressionEntries: '++id, originalHash, ratio, createdAt'

// Phase 38
researchSessions: '++id, topic, status, createdAt'
researchEvidence: '++id, sessionId, url, score'

// Phase 39
feedbacks: '++id, messageId, rating, createdAt'
qualityMetrics: '++id, sessionId, score, createdAt'
```

---

## 7. 성능 벤치마크 목표

### 토큰 최적화 (Phase 37)

| 지표 | 목표 |
|------|------|
| 프롬프트 압축률 | 40~65% |
| API 비용 절감 | 30~50% |
| 응답 정확도 유지 | > 95% |
| 압축 처리 시간 | < 50ms |

### Deep Research (Phase 38)

| 지표 | 목표 |
|------|------|
| 참조 출처 수 | 5~15개 |
| 교차 검증 | 최소 3개 출처 |
| 전체 리서치 시간 | 30~90초 |
| 보고서 품질 | 인용 포함 구조화 |

### 시스템 전체 (Phase 40 완료 후)

| 지표 | 현재 | 목표 | 개선율 |
|------|------|------|--------|
| API 비용/월 | $100 | $40 | -60% |
| 평균 응답 속도 | 3.2초 | 1.8초 | -44% |
| 작업 완료율 | 75% | 92% | +23% |

---

## 8. 리스크 & 완화 전략

### Token Entropy Encoder

| 리스크 | 완화 방안 |
|--------|----------|
| 의미 손실 | threshold 보수적 설정 (0.2~0.4), 원본 보관 7일 |
| 맥락 끊김 | 문장 단위 처리, semantic 검증 |
| Tokenizer 불일치 | 모델별 threshold 분리 |

### Deep Research

| 리스크 | 완화 방안 |
|--------|----------|
| 허위 정보 | Authority Ranking + 교차 검증 |
| 크롤링 차단 | Rate Limiting, User-Agent 설정 |
| 비용 폭증 | LLM 호출 수 상한 (depth 1~5) |
| 타임아웃 | 단계별 분할 실행, 600초 내 완료 |

### Multi-Agent

| 리스크 | 완화 방안 |
|--------|----------|
| 결과 불일치 | Critic Agent 검증 단계 |
| 비용 과다 | 경량 모델 (Haiku) 우선 사용 |
| 무한 루프 | 최대 반복 횟수 제한 (3~5회) |

### 전체 시스템

| 리스크 | 완화 방안 |
|--------|----------|
| Modal 콜드스타트 | 워밍업 cron job |
| 동시성 한계 | 요청 큐잉 + 배치 처리 |
| Feature Flag | 단계별 활성화, 10% 사용자부터 |

---

## 9. 일정 요약

```
Phase 36 (3일)  ─── Quick Wins ─────────── Multi-Agent v2 + Router v2
     ↓
Phase 37 (4일)  ─── Token Optimization ──── Entropy Encoder + 압축 파이프라인
     ↓
Phase 38 (5일)  ─── Research Intelligence ─ Deep Research + 보고서 생성
     ↓
Phase 39 (5일)  ─── Learning System ─────── Self-Improving + 피드백 루프
     ↓
Phase 40 (7일)  ─── Browser Automation ──── Playwright (선택) / httpx 대안
```

**총 예상 기간: 24일 (약 5주)**

---

## 10. 즉시 시작 가능한 작업

### Phase 36 착수 항목

1. `src/entities/swarm/swarm-templates.ts` — 10개 워크플로우 템플릿
2. `src/entities/swarm/swarm-orchestrator.ts` — parallel/pipeline/debate 전략
3. `src/shared/lib/providers/router-rules.ts` — 15개 의도 카테고리
4. `backend/routes/swarm.py` — `asyncio.gather` 병렬 실행 리팩토링

### 백엔드 준비

```python
# backend/app.py — 의존성 추가 준비
image = (
    modal.Image.debian_slim(python_version="3.12")
    .pip_install(
        "boto3", "fastapi[standard]", "duckduckgo-search",
        "httpx", "openai", "google-genai",
        "numpy>=1.24.0",           # Phase 37
        "beautifulsoup4>=4.12",    # Phase 38
    )
    .add_local_python_source("backend")
)
```

---

*문서 생성일: 2026-03-08 | 기준: hchat-pwa Phase 1-35 완료 (120 features)*
