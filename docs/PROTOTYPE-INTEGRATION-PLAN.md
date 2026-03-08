# H Chat PWA - 프로토타입 통합 구현 방안서

> 프로토타입 문서 심층분석 결과 + 현재 코드베이스 매핑
> 작성일: 2026-03-08 | 기준: Phase 36 완료, Phase 37~ 대기

---

## 1. 프로토타입 vs 현재 코드베이스 Gap 분석

### 1.1 기능별 매핑 현황

| 프로토타입 모듈 | 현재 hchat-pwa | 재사용률 | Gap |
|---------------|---------------|---------|-----|
| **Token Entropy Encoder** | `token-estimator.ts` (4글자=1토큰 추정만) | 10% | 실제 entropy 계산, stopword 제거, 문장 랭킹 없음 |
| **LLM Client** | Bedrock/OpenAI/Gemini 3-provider SSE 완비 | 95% | Anthropic 직접 SDK 불필요 (이미 Bedrock 경유) |
| **Web Search** | `backend/routes/search.py` DuckDuckGo 프록시 | 70% | 크롤링/본문 추출 없음, 요약 합성 없음 |
| **Prompt Builder** | 없음 (raw 메시지 그대로 전송) | 0% | 압축 파이프라인 전무 |
| **FastAPI Backend** | Modal + FastAPI (9개 라우터, 12+ 엔드포인트) | 90% | 이미 훨씬 고도화됨 |
| **Frontend UI** | React 19 + Zustand 31 store + 35 페이지 | 100% | 프로토타입 HTML 불필요 |

### 1.2 핵심 발견 사항

**이미 프로토타입보다 앞선 부분:**
- Multi-Provider 팩토리 패턴 (Bedrock/OpenAI/Gemini SSE 스트리밍)
- 15-category Intent Router (`router-rules.ts`, Phase 36 완료)
- 3-strategy Swarm 오케스트레이션 (pipeline/parallel/debate)
- 10개 워크플로우 템플릿 (deep-research 포함)
- IndexedDB 영속화 31개 store
- 비용 추적 (UsageStore, 6개 카테고리)
- 응답 캐싱 (CacheStore, TTL 기반)

**프로토타입에서 가져올 핵심 가치:**
1. **Token Entropy Encoder** - 비용 절감 즉효약 (구현 필요)
2. **Prompt Builder** - 압축 미들웨어 (구현 필요)
3. **Content Extraction** - 크롤링 + 본문 추출 (구현 필요)
4. **Research Summarizer** - 다중 출처 LLM 요약 (구현 필요)

---

## 2. 통합 우선순위 매트릭스

| 순위 | 모듈 | 난이도 | 비용 절감 | ROI | 구현 위치 |
|------|------|--------|----------|-----|----------|
| **1** | Prompt Builder (압축 미들웨어) | 1/5 | 즉시 | 10 | Frontend `shared/lib/compression/` |
| **2** | Token Entropy Encoder | 2/5 | 30-50% | 9 | Frontend + Backend |
| **3** | Content Extraction (크롤링) | 2/5 | 간접 | 8 | Backend `routes/research.py` |
| **4** | Research Summarizer | 3/5 | 간접 | 7 | Backend `routes/research.py` |
| **5** | 프론트엔드 통합 UI | 2/5 | UX | 6 | `pages/research/`, `entities/research/` |

---

## 3. 모듈별 구현 방안

### 3.1 Prompt Builder (압축 미들웨어)

> 프로토타입의 `prompt_builder.py`를 Frontend TypeScript로 통합

**현재 문제:** `PromptInput.tsx`에서 채팅 히스토리를 압축 없이 그대로 LLM에 전송

**구현 파일:**
```
src/shared/lib/compression/
  prompt-compressor.ts    # 3단계 압축 파이프라인
  stopwords.ts            # 한/영 불용어 사전
  entropy-encoder.ts      # Shannon Entropy 계산
  context-pruner.ts       # 컨텍스트 윈도우 관리
```

**통합 포인트:** `src/shared/lib/providers/factory.ts`의 `createStream()` 호출 직전에 압축 미들웨어 삽입

```
현재 흐름:   PromptInput → messages[] → createStream(messages) → SSE
개선 흐름:   PromptInput → messages[] → compress(messages) → createStream(compressed) → SSE
                                          ↑
                           CompressionStore.enabled 토글로 on/off
```

**프로토타입과의 차이:**
| 프로토타입 | hchat-pwa 적용 |
|-----------|---------------|
| Python numpy 의존 | TypeScript 순수 구현 (브라우저 실행) |
| 단일 메시지 압축 | 전체 히스토리 + 시스템 프롬프트 압축 |
| 하드코딩 threshold | 모델별 동적 threshold (Zustand 설정) |
| 영어 stopword만 | 한/영 이중 stopword 사전 |

**비용 절감 효과:**
- Stopword 제거만으로 ~25% 토큰 절감
- Entropy 필터 추가 시 ~50% 절감
- 월 $100 API 비용 → $50-60로 예상

### 3.2 Token Entropy Encoder

> 프로토타입의 `entropy_encoder.py`를 Frontend/Backend 이중 구현

**Frontend 경량 버전** (`entropy-encoder.ts`):
- numpy 없이 순수 JS로 Shannon Entropy 계산
- `Math.log2` 기반 빈도 분석
- 50ms 이내 처리 목표 (< 10,000 토큰)
- `CompressionStore`에서 threshold 관리

**Backend 정밀 버전** (`backend/routes/entropy.py`):
- numpy 활용 정밀 엔트로피 분석
- 모델별 최적 threshold 추천
- 압축 전/후 의미 보존도 검증

**현재 `token-estimator.ts`와의 관계:**
```
현재:  estimateTokens(text) → Math.ceil(text.length / 4)  // 4글자=1토큰

개선:  estimateTokens(text) → 기존 유지 (빠른 추정용)
       analyzeEntropy(text) → { entropy, complexity, compressionPotential }  // 신규
       compressPrompt(text) → { compressed, ratio, savedTokens }            // 신규
```

### 3.3 Content Extraction (크롤링)

> 프로토타입의 `crawler.py`를 기존 검색 엔드포인트에 통합

**현재 상태:** `backend/routes/search.py`는 DuckDuckGo snippet만 반환 (본문 추출 없음)

```python
# 현재: title, url, snippet만 반환
return {"results": [{"title": ..., "url": ..., "snippet": ...}]}

# 개선: snippet + 본문 추출 옵션 추가
return {"results": [{"title": ..., "url": ..., "snippet": ..., "content": ...}]}
```

**구현 전략:**
1. `backend/routes/search.py`에 `extractContent: bool = False` 파라미터 추가
2. `extractContent=True`면 상위 N개 URL에서 httpx + BeautifulSoup로 본문 추출
3. Playwright 불필요 (대부분 정적 페이지, 프로토타입 권장 사항과 동일)

**의존성:** `beautifulsoup4>=4.12` (이미 Phase 38 계획에 포함, +5MB)

**기존 `backend/app.py` 이미지에 추가:**
```python
.pip_install("boto3", "fastapi[standard]", "duckduckgo-search",
             "httpx", "openai", "google-genai",
             "beautifulsoup4>=4.12")  # 신규
```

### 3.4 Research Summarizer (다중 출처 요약)

> 프로토타입의 `summarizer.py`를 Deep Research SSE 엔드포인트로 확장

**현재 상태:**
- 검색은 있지만 요약 없음
- Swarm에 `deep-research` 템플릿 있지만 실제 웹 검색 연동 안됨
- Agent 도구 중 `search` 있지만 단순 검색 결과 반환만

**구현 파일:**
```
backend/routes/research.py     # 신규 SSE 엔드포인트
backend/services/research/
  engine.py                    # 리서치 파이프라인 엔진
  extractor.py                 # 본문 추출기
  synthesizer.py               # LLM 요약기
```

**7-step Pipeline (기존 계획 + 프로토타입 반영):**

```
[1] Intent Analysis     → 기존 router-rules.ts analyzeIntent() 재사용
[2] Query Expansion     → LLM으로 1→5개 검색어 확장 (Haiku = 저비용)
[3] Parallel Search     → 기존 DuckDuckGo 5x 동시 검색
[4] Content Extraction  → httpx + BeautifulSoup (프로토타입 방식 채택)
[5] Evidence Ranking    → Source Authority 가중치 (기존 계획)
[6] LLM Synthesis       → Bedrock converse_sync() 재사용
[7] Report Generation   → 마크다운 + 인용 번호
```

**프로토타입의 `summarize_sources()` 대비 개선:**
- SSE 실시간 스트리밍 (프로토타입은 동기 응답)
- 병렬 검색 (프로토타입은 순차)
- Source Authority 가중치 (프로토타입에 없음)
- 한국어 지원 (프로토타입은 영어 중심)

### 3.5 Frontend 통합

**기존 인프라 활용 (신규 작성 최소화):**

| 컴포넌트 | 처리 방안 |
|---------|----------|
| Zustand Store | `compression.store.ts`, `research.store.ts` 신규 |
| 페이지 | `ResearchPage.tsx` 신규 (ViewState에 추가) |
| SSE 파싱 | 기존 패턴 재사용 (swarm.store.ts의 SSE reader) |
| IndexedDB | Dexie 스키마에 테이블 2개 추가 |
| 라우팅 | `route-map.ts`에 lazy import 1줄 추가 |

---

## 4. 구현 일정 (프로토타입 범위 한정)

> 프로토타입 문서의 "2-4주" 목표를 hchat-pwa 기준으로 재산정

### Week 1: Token Compression (Phase 37 일부)

```
Day 1-2: 압축 파이프라인
  - src/shared/lib/compression/stopwords.ts        # 한/영 불용어 500개
  - src/shared/lib/compression/entropy-encoder.ts   # Shannon Entropy (JS)
  - src/shared/lib/compression/prompt-compressor.ts  # 3단계 파이프라인
  - __tests__/ 20+ 테스트

Day 3: Store + 설정 UI
  - src/entities/compression/compression.store.ts   # enabled, threshold, stats
  - Settings 페이지에 압축 토글 + threshold 슬라이더 추가

Day 4: 통합 + 검증
  - PromptInput.tsx에 압축 미들웨어 삽입
  - UsageStore에 savedTokens 필드 추가
  - 압축 전/후 비교 테스트
```

### Week 2: Research Engine (Phase 38 일부)

```
Day 5-6: Backend 크롤링 + 요약
  - backend/app.py에 beautifulsoup4 의존성 추가
  - backend/routes/research.py SSE 엔드포인트
  - backend/services/research/extractor.py 본문 추출
  - backend/services/research/synthesizer.py LLM 요약

Day 7-8: Frontend 연동
  - src/entities/research/research.store.ts
  - src/pages/research/ResearchPage.tsx
  - route-map.ts에 research 라우트 추가
  - ViewState에 'research' 추가

Day 9-10: 테스트 + 안정화
  - Backend 테스트 (검색 → 크롤링 → 요약 E2E)
  - Frontend 테스트 (SSE 수신, 상태 관리)
  - 에러 핸들링 (타임아웃, 크롤링 실패)
```

---

## 5. 프로토타입에서 채택하지 않는 것

| 프로토타입 항목 | 사유 |
|---------------|------|
| `llm_client.py` (Anthropic 직접 SDK) | 이미 Bedrock 경유 3-provider 완비 |
| `frontend/index.html` (바닐라 HTML) | React 19 + 35페이지 이미 존재 |
| `main.py` (독립 FastAPI) | Modal 서버리스 이미 운영 중 |
| Serper API (유료 검색) | DuckDuckGo 무료 프록시 이미 작동 |
| `history` 관리 (인메모리) | IndexedDB + Zustand 31 store 완비 |
| `requirements.txt` | Modal 이미지 빌더 사용 |

---

## 6. 비용 예측 비교

| 항목 | 프로토타입 예측 | hchat-pwa 적용 시 |
|------|-------------|-------------------|
| LLM API (1000 req/일) | $10-30/월 | $5-15/월 (압축 적용) |
| 검색 API | $0-5 (Serper) | $0 (DuckDuckGo 무료) |
| 서버 | $5 (Railway) | $0 (Modal 무료 티어) |
| **합계** | **$15-40/월** | **$5-15/월** |

**비용 절감 요인:**
- Token Entropy Encoder로 40-65% 토큰 절감
- DuckDuckGo 무료 → Serper 유료 불필요
- Modal 무료 티어 → Railway 불필요
- 스마트 캐싱 (CacheStore) 이미 구현됨

---

## 7. 아키텍처 결정 사항

### 7.1 Frontend-First 압축 vs Backend 압축

**결정: Frontend-First (프로토타입과 다른 접근)**

| 기준 | Frontend 압축 | Backend 압축 |
|------|-------------|-------------|
| 지연시간 | 0ms (로컬) | +200ms (API 왕복) |
| 비용 | 무료 | API 호출 비용 |
| 정밀도 | 충분 (JS entropy) | 높음 (numpy) |
| 오프라인 | 동작함 | 불가 |

→ **기본: Frontend JS entropy + 선택적 Backend numpy 정밀 분석**

### 7.2 Research: 독립 엔드포인트 vs Swarm 확장

**결정: 독립 엔드포인트 (프로토타입 방식 채택)**

```
선택지 A: Swarm deep-research 템플릿 활용 → 에이전트가 search 도구 호출
선택지 B: /api/research/start 독립 엔드포인트 → 전용 파이프라인

→ 선택지 B 채택
  이유: Swarm은 범용 오케스트레이션, Research는 전용 최적화 필요
  Swarm 에이전트는 검색 결과 크롤링/랭킹 불가 (LLM 호출만 가능)
```

### 7.3 Stopword 처리: 서버 vs 클라이언트

**결정: 클라이언트 (번들 사이즈 < 5KB)**

```
한국어 stopword: ~200개 (은,는,이,가,의,를,을,에,와,과,도...)
영어 stopword:   ~300개 (the,is,are,a,an,to,of,and,in,on...)
합계:            ~500개 × 평균 3글자 = ~1.5KB gzip
```

---

## 8. 리스크 분석

| 리스크 | 확률 | 영향 | 완화 전략 |
|--------|------|------|----------|
| 압축 후 의미 손실 | 중 | 높 | threshold 0.2 보수적 시작, A/B 테스트 |
| 크롤링 차단 (robots.txt) | 중 | 중 | 존중, User-Agent 명시, fallback to snippet |
| DuckDuckGo 레이트 리밋 | 낮 | 중 | 5개 동시 제한, 캐싱 적용 |
| 한국어 entropy 부정확 | 중 | 중 | 형태소 단위가 아닌 어절 단위 처리 |
| Modal 타임아웃 (600초) | 낮 | 중 | Research depth 제한 (max 3), 단계별 스트리밍 |

---

## 9. 즉시 착수 가능 항목 (Phase 37)

### 파일 생성 목록

```
# 신규 파일 (7개)
src/shared/lib/compression/stopwords.ts
src/shared/lib/compression/entropy-encoder.ts
src/shared/lib/compression/prompt-compressor.ts
src/shared/lib/compression/context-pruner.ts
src/shared/lib/compression/__tests__/entropy-encoder.test.ts
src/shared/lib/compression/__tests__/prompt-compressor.test.ts
src/entities/compression/compression.store.ts

# 수정 파일 (4개)
src/shared/lib/db.ts                    # compressionEntries 테이블 추가
src/widgets/prompt-input/PromptInput.tsx # 압축 미들웨어 삽입
src/entities/usage/usage.store.ts       # savedTokens 필드 추가
src/pages/settings/SettingsPage.tsx      # 압축 설정 UI 추가
```

### 백엔드 의존성 변경

```python
# backend/app.py 이미지 수정
.pip_install(
    "boto3", "fastapi[standard]", "duckduckgo-search",
    "httpx", "openai", "google-genai",
    "numpy>=1.24.0",           # Phase 37: entropy 계산
    "beautifulsoup4>=4.12",    # Phase 38: 크롤링
)
```

---

## 10. 결론

프로토타입은 **독립 실행 가능한 PoC**로 설계되어 있지만, hchat-pwa는 이미 **프로토타입의 70%를 초과 구현**한 상태다.

**프로토타입에서 실질적으로 가져올 것:**
1. Token Entropy Encoder 알고리즘 (Python → TypeScript 포팅)
2. Prompt Builder 개념 (압축 미들웨어 패턴)
3. Content Extraction 로직 (httpx + BeautifulSoup)
4. Research Summarizer 프롬프트 패턴

**가져오지 않을 것:**
- 인프라 (이미 Modal + React 완비)
- LLM 클라이언트 (이미 3-provider 팩토리)
- 프론트엔드 (이미 35페이지 React 앱)
- 검색 API (이미 DuckDuckGo 무료)

**예상 효과:**
- API 비용 40-65% 절감 (Token Entropy)
- Research 기능 추가 (크롤링 + 요약)
- 구현 기간 ~10일 (프로토타입의 2-4주 대비 50% 단축)
- 기존 919+ 테스트에 40+ 신규 테스트 추가

---

*Phase 37 (Token Optimization) → Phase 38 (Research Intelligence) 순서로 착수 권장*
