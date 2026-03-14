# AI Browser OS -- Deep Analysis & TODO Roadmap

> H Chat Chrome Extension v2.0을 "AI Browser OS"로 진화시키기 위한 종합 분석 문서
> AutoResearch(karpathy) 패러다임 + Browser-native Intelligence 설계

---

## 1. Architecture Gap Analysis

### 1.1 Page Intelligence Engine

| 항목 | 현재 상태 (v2.0) | 목표 상태 (AI Browser OS) | Gap |
|------|------------------|--------------------------|-----|
| DOM 파싱 | `page-extractor.ts` (51줄) — `innerText` + noise selector 제거 | Readability 알고리즘 + semantic section 분리 + metadata 추출 | **Critical** |
| 잡음 제거 | 14개 static CSS selector (`nav`, `footer`, `.ad` 등) | ML 기반 content density scoring + dynamic noise detection | **High** |
| 구조 분석 | 없음 | heading hierarchy 파싱, section boundary 탐지, 의미 단위 chunking | **Critical** |
| 메타데이터 | `url` + `title` + `text` (3필드) | OpenGraph, JSON-LD, Schema.org, author, date, language, reading time | **High** |
| 텍스트 길이 | 100KB hard truncation | Adaptive chunking (section 단위), progressive loading | **Medium** |

**현재 코드 분석** (`packages/extension/src/content/page-extractor.ts`):
```
extractPageContent() → clone body → remove noise → innerText → truncate 100KB
```
- 장점: 단순하고 빠름, 모든 사이트에서 동작
- 단점: 구조 정보 완전 소실, 테이블/리스트 구분 불가, 이미지/링크 컨텍스트 무시

### 1.2 Dataset Discovery Engine

| 항목 | 현재 상태 | 목표 상태 | Gap |
|------|----------|----------|-----|
| 반복 DOM 패턴 탐지 | 없음 | CSS selector 자동 추론, sibling pattern matching | **Critical** |
| 데이터 밀도 분석 | 없음 | Text/tag ratio, information density heatmap | **Critical** |
| 구조 유사성 | 없음 | DOM subtree fingerprinting, structural clustering | **Critical** |
| 테이블 감지 | 없음 | `<table>`, CSS grid, flexbox repeat 패턴 인식 | **High** |
| 페이지네이션 | 없음 | Next/prev link 탐지, infinite scroll interception | **Medium** |

### 1.3 DataFrame Engine

| 항목 | 현재 상태 | 목표 상태 | Gap |
|------|----------|----------|-----|
| 테이블 추출 | 없음 | HTML table → structured JSON, header 자동 추론 | **Critical** |
| 리스트 추출 | 없음 | `<ul>/<ol>`, custom list 패턴 → array 변환 | **High** |
| 카드 추출 | 없음 | Repeated div 패턴 → record array 변환 | **High** |
| 데이터 정제 | 없음 | 타입 추론 (number/date/string), null 처리, normalization | **Medium** |
| 백엔드 연동 | `/api/analyze` 존재 (4가지 mode) | DataFrame 변환 → Pandas 분석 → 차트 생성 | **High** |

### 1.4 Browser Agent

| 항목 | 현재 상태 | 목표 상태 | Gap |
|------|----------|----------|-----|
| 페이지 조작 | `floating-button.ts` (선택 텍스트만) | 클릭, 스크롤, 입력, 탭 전환 (chrome.scripting) | **Critical** |
| 자율 탐색 | 없음 | LLM 기반 action planning → DOM 조작 루프 | **Critical** |
| 스크린샷 | 없음 | `chrome.tabs.captureVisibleTab()` → Vision 분석 | **High** |
| 멀티탭 | `tab-tracker.ts` (active tab URL만) | 탭 간 context 공유, parallel data collection | **Medium** |
| 보안 샌드박스 | 없음 | 위험 URL 차단, 비용 제한, action allowlist | **Critical** |

### 1.5 Multi-Agent Research System

| 항목 | 현재 상태 | 목표 상태 | Gap |
|------|----------|----------|-----|
| Research pipeline | `backend/routes/research.py` (7단계 SSE) | Planner → Search → Web → Data → Analysis → Report (6 agent) | **Medium** |
| Query expansion | LLM 기반 3-5 sub-queries | + 페이지 컨텍스트 반영, 대화 히스토리 활용 | **Low** |
| Content extraction | httpx + regex HTML 파싱 | + BeautifulSoup (이미 설치됨) + Readability 알고리즘 | **Low** |
| 소스 평가 | 12개 도메인 authority score | + citation verification, cross-reference, freshness score | **Medium** |
| 실험 루프 | 없음 | AutoResearch 패턴: 가설 → 실행 → 평가 → 개선/롤백 | **High** |

---

## 2. Technical Feasibility

### 2.1 Chrome Extension에서 가능한 것 (Content Script + Background SW)

| 기능 | API | 제약 |
|------|-----|------|
| DOM 읽기/수정 | Content Script (full DOM access) | Same-origin policy 없음 (extension 권한) |
| 페이지 스크린샷 | `chrome.tabs.captureVisibleTab()` | Visible tab만, 전체 페이지 X |
| 네트워크 요청 | `chrome.webRequest` / `fetch` in background | CORS 무시 가능 (background SW) |
| 탭 관리 | `chrome.tabs.*` | 이미 `activeTab` 권한 보유 |
| DOM 조작 | `chrome.scripting.executeScript()` | 이미 `scripting` 권한 보유 |
| 스토리지 | `chrome.storage.local` (10MB), IndexedDB (무제한) | Dexie v4 이미 사용중 |
| 클립보드 | `navigator.clipboard` | 사용자 gesture 필요 |

**추가 필요 권한** (manifest.json 수정):
```json
"permissions": [
  "tabs",          // 탭 URL/title 접근 (현재 activeTab만)
  "webNavigation", // 페이지 로딩 이벤트
  "offscreen"      // Offscreen document for heavy computation
]
```

### 2.2 반드시 백엔드가 필요한 것

| 기능 | 이유 | 현재 백엔드 상태 |
|------|------|-----------------|
| LLM inference | API key 보안, 비용 제어 | Modal FastAPI (/api/chat, /api/openai/chat, /api/gemini/chat) |
| Pandas DataFrame 분석 | Python 전용, 무거운 연산 | 신규 필요 (`/api/dataframe/analyze`) |
| 대규모 HTML 파싱 | BeautifulSoup + lxml (이미 설치됨) | 신규 필요 (`/api/page/parse`) |
| Web scraping (외부) | IP rotation, rate limit 관리 | httpx 이미 사용중 (research.py) |
| 차트 생성 | matplotlib/plotly → image/SVG | 신규 필요 (`/api/dataframe/chart`) |
| Playwright agent | Headless browser, GPU/memory | 신규 필요 (Phase 3+, 별도 서비스) |

### 2.3 Extension vs Backend 경계 설계

```
[Content Script]          [Background SW]           [Modal Backend]
  DOM 읽기                  SSE relay                LLM inference
  테이블 감지               Tab 관리                 DataFrame 분석
  반복 패턴 탐지             메시지 라우팅             HTML deep parse
  데이터 추출 (경량)         캐시 관리                Web scraping
  UI overlay               Agent loop 조율           차트 생성
                           스크린샷 캡처              Research pipeline
```

---

## 3. AutoResearch Loop Mapping

### 3.1 Karpathy AutoResearch 원리

```
while True:
    context = read_full_code()        # 630줄 전체를 컨텍스트에
    suggestion = LLM(context)          # 코드 수정 제안
    apply(suggestion)                  # train.py 수정
    result = run_experiment(5min)      # GPU 실험
    if result > best:
        git_commit(result)             # 개선 → 저장
    else:
        git_rollback()                 # 실패 → 롤백
```

핵심 원칙: **전체 컨텍스트가 LLM 윈도우 안에 들어감**

### 3.2 Browser Context 매핑

| AutoResearch | AI Browser OS |
|-------------|---------------|
| `train.py` (630줄) | 현재 탭의 DOM (structured extraction, ~10K tokens) |
| `run_experiment()` | Browser Agent action 실행 (클릭, 스크롤, 추출) |
| `evaluate(result)` | LLM이 추출 결과 품질 평가 (completeness, accuracy) |
| `git_commit()` | 성공적 추출 패턴을 IndexedDB에 저장 (재사용 가능) |
| `git_rollback()` | 실패한 selector/strategy 폐기 |
| 126번 반복 | 사용자 세션 동안 extraction 전략 반복 개선 |

### 3.3 Browser Research Loop 구현

```typescript
interface ResearchLoop {
  // Phase 1: 관찰
  observe(): PageIntelligence          // DOM → structured data

  // Phase 2: 가설
  hypothesize(context: PageIntelligence): ExtractionStrategy

  // Phase 3: 실행
  execute(strategy: ExtractionStrategy): ExtractionResult

  // Phase 4: 평가
  evaluate(result: ExtractionResult): QualityScore

  // Phase 5: 학습
  learn(strategy: ExtractionStrategy, score: QualityScore): void
  // score > threshold → 패턴 저장 (commit)
  // score < threshold → 전략 폐기 (rollback)
}
```

### 3.4 핵심 차이점

| AutoResearch | Browser Research | 시사점 |
|-------------|-----------------|--------|
| 코드 630줄 고정 | DOM 수천~수만 줄, 매 페이지 다름 | 적응형 extraction 필수 |
| GPU 5분 실험 | DOM 조작 즉시 결과 | 실시간 피드백 가능, 더 많은 반복 |
| 단일 메트릭 (loss) | 다차원 품질 (completeness, structure, noise) | 복합 평가 함수 필요 |
| 오프라인 단독 실행 | 사용자와 상호작용 | Human-in-the-loop 활용 가능 |

---

## 4. Competitive Positioning

### 4.1 상세 비교

| 기능 | Perplexity | Arc Browser | NotebookLM | Sider/Monica | **H Chat AI Browser OS** |
|------|-----------|-------------|------------|-------------|--------------------------|
| **검색** | 핵심 기능, 실시간 웹 | 없음 | 없음 | 기본 | DuckDuckGo + LLM expansion + 페이지 컨텍스트 |
| **페이지 분석** | 없음 | 요약 (Basic) | 업로드 문서만 | 요약/번역 | DOM 구조 분석 + 테이블 추출 + 데이터셋 발견 |
| **데이터 추출** | 없음 | 없음 | 없음 | 없음 | **차별점**: 테이블/리스트/카드 자동 DataFrame 변환 |
| **멀티 모델** | 자체 모델 | 없음 | Gemini만 | GPT/Claude | Claude + GPT + Gemini (3 provider factory) |
| **Research 파이프라인** | 1-step 답변 | 없음 | 문서 QA | 없음 | 7-step deep research (이미 구현) |
| **브라우저 에이전트** | 없음 | Boost (제한적) | 없음 | 없음 | LLM 자율 탐색 (Phase 3) |
| **프라이버시** | 서버 전송 | 로컬 | Google 서버 | 서버 전송 | 선택적: 로컬 추출 + 서버 분석 분리 |
| **가격** | $20/월 | 무료 | 무료 (제한) | $10-20/월 | BYOK (Bring Your Own Key), 서버 비용만 |
| **확장성** | 닫힌 생태계 | 브라우저 전용 | Google 전용 | 플러그인 | 오픈 Extension + Modal 백엔드 |

### 4.2 핵심 차별화 전략

1. **"Search → Research" 패러다임**: 단순 검색이 아닌, 현재 보고 있는 웹페이지를 데이터셋으로 변환
2. **Browser-native**: 별도 앱/사이트 불필요, Chrome 사이드패널에서 모든 작업
3. **Multi-provider**: Claude + GPT + Gemini, 작업 유형에 따라 자동 라우팅
4. **Data Intelligence**: 테이블/리스트/카드를 구조화된 데이터로 변환 (경쟁사 없음)
5. **BYOK 모델**: 자체 API 키 사용으로 비용 투명성 보장

### 4.3 타겟 사용자

| 페르소나 | 핵심 니즈 | H Chat OS 제공 가치 |
|---------|----------|-------------------|
| 데이터 분석가 | 웹 데이터 수집 → 분석 | Dataset Discovery + DataFrame Engine |
| 리서처 | 다중 소스 종합 | Multi-Agent Research + Citation |
| 기업 사용자 | 사내 문서 분석 + 보안 | Confluence/Jira 통합 (이미 구현) + BYOK |
| 개발자 | 문서 검색 + 코드 이해 | Page Intelligence + Agent Mode |

---

## 5. Risk Assessment

### 5.1 기술 리스크

| 리스크 | 확률 | 영향 | 대응 |
|--------|------|------|------|
| Content Script 성능 병목 | **높음** | DOM 분석이 무거운 페이지에서 UI 프리징 | Offscreen Document로 heavy computation 분리, Web Worker 활용 |
| Chrome Extension API 제약 | **중간** | `chrome.debugger` 없이 네트워크 인터셉션 불가 | Background SW의 `fetch` proxy 패턴 유지, `webRequest` 관찰만 |
| MV3 Service Worker 수명 | **높음** | Background SW 30초 후 종료 → 장시간 agent loop 불가 | `chrome.alarms` + offscreen document로 keep-alive, 또는 백엔드 위임 |
| LLM 비용 폭발 | **높음** | Agent loop가 반복할수록 토큰 소비 급증 | Haiku 4.5 우선 사용, 토큰 예산 제한, 캐싱 전략 |
| DOM 구조 다양성 | **중간** | 사이트마다 완전히 다른 구조 → 범용 추출기 난이도 높음 | Heuristic + LLM fallback 조합, 사이트별 패턴 학습 |

### 5.2 스코프 리스크

| 리스크 | 확률 | 영향 | 대응 |
|--------|------|------|------|
| MVP 2주 초과 | **높음** | 5개 엔진 동시 개발은 비현실적 | Engine 1 (Page Intelligence) + Engine 3 (DataFrame) 집중, 나머지 후순위 |
| 기존 Extension v2.0 회귀 | **중간** | 새 기능 추가 중 기존 Chat/History/Settings 깨짐 | 기존 파일 최소 수정, 새 페이지/모듈로 분리 |
| 백엔드 Modal 비용 | **낮음** | 새 엔드포인트 추가 시 cold start 증가 | Route 레벨 분리 유지, concurrent worker 활용 |

### 5.3 프라이버시 리스크

| 리스크 | 확률 | 영향 | 대응 |
|--------|------|------|------|
| 페이지 내용 서버 전송 | **확정** | 민감한 페이지 (은행, 메일) 내용 노출 | Sensitive URL blocklist, 사용자 명시적 동의 UI |
| API 키 노출 | **낮음** | Extension storage에 저장된 키 탈취 | `chrome.storage.session` (메모리 전용) 옵션 제공 |
| 스크린샷 데이터 | **중간** | Vision API로 전송 시 화면 내용 노출 | 로컬 프리뷰 + 전송 전 확인 다이얼로그 |

### 5.4 성능 리스크

| 리스크 | 확률 | 영향 | 대응 |
|--------|------|------|------|
| Extension 번들 크기 | **중간** | 현재 Vite build, 새 모듈 추가 시 증가 | Tree-shaking 유지, lazy import 패턴 |
| IndexedDB 데이터 증가 | **중간** | 추출 결과 + 패턴 학습 데이터 누적 | TTL 기반 자동 정리, 용량 모니터링 |
| 백엔드 cold start | **중간** | Modal serverless 특성상 첫 요청 3-5초 | warm-up ping, keep-alive 전략 |

---

## 6. 2-Week MVP TODO List

### Day 1-2: Page Intelligence Engine v1

**목표**: DOM 구조 분석 + 메타데이터 추출 + semantic section 분리

#### 파일 수정

| 파일 | 작업 | 예상 줄수 |
|------|------|----------|
| `packages/extension/src/content/page-extractor.ts` | 기존 51줄 → 완전 재작성 | ~250줄 |
| `packages/extension/src/content/metadata-extractor.ts` | **신규** — OpenGraph, JSON-LD, Schema.org 파싱 | ~120줄 |
| `packages/extension/src/content/section-parser.ts` | **신규** — heading hierarchy 기반 section 분리 | ~180줄 |
| `packages/extension/src/content/content-density.ts` | **신규** — text/tag ratio로 main content 영역 탐지 | ~100줄 |
| `packages/extension/src/shared/types.ts` | PageContext 타입 확장 (sections, metadata, tables) | +40줄 |
| `packages/extension/src/content/content-script.ts` | 새 extractor 연동 | +20줄 |

#### page-extractor.ts 재설계

```typescript
// 현재
interface PageContent {
  url: string; title: string; text: string
}

// 목표
interface PageIntelligence {
  readonly url: string
  readonly title: string
  readonly metadata: PageMetadata          // OG, JSON-LD, author, date, language
  readonly sections: ReadonlyArray<Section> // heading hierarchy 기반 분할
  readonly tables: ReadonlyArray<TableData> // <table> 자동 감지
  readonly lists: ReadonlyArray<ListData>   // <ul>/<ol> 구조화
  readonly links: ReadonlyArray<LinkData>   // 외부 링크 + 앵커 텍스트
  readonly images: ReadonlyArray<ImageData> // alt text + src
  readonly readingTime: number              // 예상 읽기 시간 (분)
  readonly contentDensity: number           // 0-1 점수
  readonly rawText: string                  // 기존 호환
}

interface Section {
  readonly level: number   // h1=1, h2=2, ...
  readonly heading: string
  readonly content: string
  readonly children: ReadonlyArray<Section>
}
```

#### 의존성 변경
- 없음 (순수 DOM API만 사용, 외부 라이브러리 불필요)

---

### Day 3-4: DataFrame Engine v1 (테이블 추출)

**목표**: 현재 페이지의 `<table>` 요소를 구조화된 데이터로 변환

#### 파일 목록

| 파일 | 작업 | 예상 줄수 |
|------|------|----------|
| `packages/extension/src/content/table-extractor.ts` | **신규** — `<table>` → JSON records, header 자동 추론 | ~200줄 |
| `packages/extension/src/content/list-extractor.ts` | **신규** — `<ul>/<ol>` + custom list 패턴 | ~120줄 |
| `packages/extension/src/content/data-cleaner.ts` | **신규** — 타입 추론 (숫자, 날짜, URL), trim, null 처리 | ~100줄 |
| `backend/routes/dataframe.py` | **신규** — DataFrame 분석 엔드포인트 | ~200줄 |
| `backend/services/dataframe_service.py` | **신규** — numpy 기반 통계 + 차트 | ~250줄 |
| `packages/extension/src/pages/DataPage.tsx` | **신규** — 추출된 데이터 테이블 뷰 + 분석 UI | ~250줄 |
| `packages/extension/src/components/ExtDataTable.tsx` | **신규** — 반응형 테이블 렌더러 | ~150줄 |

#### 백엔드 API 설계

```python
# POST /api/dataframe/analyze
class DataFrameRequest(BaseModel):
    data: list[dict]           # [{col1: val1, col2: val2}, ...]
    columns: list[str]         # 컬럼명
    operation: str             # describe | groupby | filter | sort | chart
    params: dict = {}          # operation별 파라미터

# POST /api/dataframe/chart
class ChartRequest(BaseModel):
    data: list[dict]
    chart_type: str            # bar | line | pie | scatter
    x_column: str
    y_column: str
    title: str = ""
```

#### 의존성 변경
- Backend: `numpy` 이미 설치됨, `matplotlib` 추가 필요 (pip_install에 추가)

---

### Day 5-6: Dataset Discovery Engine v1

**목표**: 반복 DOM 패턴 자동 탐지 → 데이터셋 후보 하이라이트

#### 파일 목록

| 파일 | 작업 | 예상 줄수 |
|------|------|----------|
| `packages/extension/src/content/pattern-detector.ts` | **신규** — sibling 반복 패턴 탐지 알고리즘 | ~250줄 |
| `packages/extension/src/content/dom-fingerprint.ts` | **신규** — DOM subtree → 구조 해시 (tag path fingerprint) | ~120줄 |
| `packages/extension/src/content/dataset-candidate.ts` | **신규** — 패턴 클러스터링 → 데이터셋 후보 리스트 | ~150줄 |
| `packages/extension/src/content/highlight-overlay.ts` | **신규** — 탐지된 데이터셋 영역에 시각적 하이라이트 overlay | ~100줄 |
| `packages/extension/src/pages/DatasetPage.tsx` | **신규** — 발견된 데이터셋 후보 목록 + 원클릭 추출 | ~200줄 |

#### 알고리즘 설계

```typescript
// 1. DOM subtree fingerprinting
function fingerprint(el: Element): string {
  // tag + class count + children count → hash
  // "div.3c.2ch" = div with 3 classes, 2 children
}

// 2. 반복 패턴 탐지
function detectRepeatingPatterns(root: Element): Pattern[] {
  // parent의 children 중 같은 fingerprint가 3개+ 이면 패턴
  // 최소 3개 반복 + 최소 30자 텍스트 포함
}

// 3. 데이터 밀도 점수
function scoreDensity(pattern: Pattern): number {
  // textLength / totalNodeCount → 높을수록 데이터성
  // 숫자 포함률, 링크 포함률 등 가중
}
```

---

### Day 7-8: Side Panel UI 확장 + Research Mode

**목표**: 새 페이지 타입 추가, NavBar 확장, Research 연동

#### 파일 수정

| 파일 | 작업 | 예상 줄수 |
|------|------|----------|
| `packages/extension/src/shared/types.ts` | `ExtPage` 타입에 `'data' \| 'dataset' \| 'research'` 추가 | +5줄 |
| `packages/extension/src/sidepanel/App.tsx` | `renderPage()` 분기 추가 | +15줄 |
| `packages/extension/src/components/ExtNavBar.tsx` | 탭 5개로 확장 (기존 4개 + Data/Research 토글) | +30줄 |
| `packages/extension/src/pages/ResearchPage.tsx` | **신규** — Research mode UI (query → pipeline → report) | ~300줄 |
| `packages/extension/src/hooks/useResearch.ts` | **신규** — Research SSE 연동 (기존 backend 활용) | ~120줄 |
| `packages/extension/src/hooks/useDataExtraction.ts` | **신규** — 페이지 데이터 추출 + DataFrame 분석 통합 | ~100줄 |
| `packages/extension/src/components/ExtResearchProgress.tsx` | **신규** — Research 단계별 진행 표시 | ~120줄 |
| `packages/extension/src/components/ExtSourceCard.tsx` | **신규** — 검색 결과 소스 카드 | ~80줄 |

#### NavBar 확장 설계

```
기존:  [Chat] [History] [Prompt] [Settings]
목표:  [Chat] [Data] [Research] [History] [Settings]
```
- `Data` 탭: PageContext + Dataset Discovery + DataFrame 통합
- `Research` 탭: Deep Research + Quick Research + Page Analysis

---

### Day 9-10: Page Context 강화 + Chat 연동

**목표**: 강화된 Page Intelligence를 Chat에 통합

#### 파일 수정

| 파일 | 작업 | 예상 줄수 |
|------|------|----------|
| `packages/extension/src/pages/PageContextPage.tsx` | 기존 92줄 → 완전 재작성 (섹션별 뷰, 테이블 프리뷰, 메타데이터 표시) | ~280줄 |
| `packages/extension/src/hooks/usePageContext.ts` | 기존 28줄 → 확장 (PageIntelligence 타입, section 선택, 테이블 선택) | ~80줄 |
| `packages/extension/src/hooks/useChat.ts` | Page context injection 옵션 추가 | +30줄 |
| `packages/extension/src/components/ExtPageContextBanner.tsx` | 재설계 — 섹션 선택기, 테이블 선택기 추가 | +80줄 |
| `packages/extension/src/stores/page-intelligence.store.ts` | **신규** — 추출 결과 캐싱, 패턴 학습 저장 | ~120줄 |
| `packages/extension/src/components/ExtSectionViewer.tsx` | **신규** — heading tree 네비게이션 | ~100줄 |

---

### Day 11-12: AutoResearch Loop 통합 + 실험

**목표**: "실행 → 평가 → 개선" 루프를 페이지 분석에 적용

#### 파일 목록

| 파일 | 작업 | 예상 줄수 |
|------|------|----------|
| `packages/extension/src/lib/research-loop.ts` | **신규** — observe → hypothesize → execute → evaluate → learn 루프 | ~200줄 |
| `packages/extension/src/lib/extraction-strategy.ts` | **신규** — 추출 전략 타입 + selector 조합 생성 | ~120줄 |
| `packages/extension/src/lib/quality-evaluator.ts` | **신규** — 추출 결과 품질 점수 (completeness, structure, noise ratio) | ~100줄 |
| `packages/extension/src/stores/pattern-learning.store.ts` | **신규** — 도메인별 성공 패턴 IndexedDB 저장 | ~100줄 |
| `backend/routes/page_intelligence.py` | **신규** — LLM 기반 추출 전략 제안 + 품질 평가 | ~180줄 |

#### 실험 루프 설계

```typescript
async function runExtractionLoop(
  url: string,
  maxIterations: number = 5
): AsyncGenerator<LoopIteration> {
  let bestScore = 0
  let bestResult: ExtractionResult | null = null

  for (let i = 0; i < maxIterations; i++) {
    // 1. 현재 페이지 구조 관찰
    const intelligence = await observe()

    // 2. LLM에게 추출 전략 제안 요청
    const strategy = await hypothesize(intelligence, previousAttempts)

    // 3. 전략 실행 (DOM 조작)
    const result = await execute(strategy)

    // 4. 품질 평가
    const score = evaluate(result)

    yield { iteration: i, strategy, result, score }

    // 5. 학습
    if (score > bestScore) {
      bestScore = score
      bestResult = result
      await savePattern(url, strategy)  // "commit"
    }
    // score < bestScore → 자동 "rollback" (bestResult 유지)
  }
}
```

---

### Day 13-14: 통합 테스트 + Polish + 문서

**목표**: E2E 테스트, 성능 최적화, 엣지 케이스 처리

#### 파일 목록

| 파일 | 작업 | 예상 줄수 |
|------|------|----------|
| `packages/extension/src/__tests__/page-extractor.test.ts` | **신규** — Page Intelligence 단위 테스트 | ~200줄 |
| `packages/extension/src/__tests__/table-extractor.test.ts` | **신규** — 테이블 추출 테스트 (다양한 HTML 구조) | ~200줄 |
| `packages/extension/src/__tests__/pattern-detector.test.ts` | **신규** — 반복 패턴 탐지 테스트 | ~150줄 |
| `packages/extension/src/__tests__/data-cleaner.test.ts` | **신규** — 데이터 정제 테스트 | ~100줄 |
| `backend/tests/test_dataframe.py` | **신규** — DataFrame API 테스트 | ~150줄 |
| `backend/tests/test_page_intelligence.py` | **신규** — Page Intelligence API 테스트 | ~100줄 |

#### 성능 최적화
- Content Script: DOM 분석을 `requestIdleCallback`으로 분산
- 대형 테이블 (100+ rows): virtual scrolling 적용 (이미 react-window 패턴 존재)
- 패턴 탐지: 최대 depth 제한 (5레벨), 최대 sibling 제한 (1000개)

---

## 7. Phase Roadmap

### Phase 1: MVP (2주) -- "Page Intelligence + Data Extraction"

**결과물**: Chrome Extension v3.0
- Page Intelligence Engine v1 (구조 분석 + 메타데이터)
- DataFrame Engine v1 (테이블/리스트 추출)
- Dataset Discovery Engine v1 (반복 패턴 탐지)
- Research Mode UI (기존 백엔드 연동)
- AutoResearch Loop v1 (추출 전략 반복 개선)

**예상 새 파일**: ~25개
**예상 새 코드**: ~5,000줄
**수정 파일**: ~8개
**테스트**: ~800줄 (6개 테스트 파일)

### Phase 2: "Smart Agent + Deep Analysis" (3주)

| 기능 | 설명 | 파일 | 줄수 |
|------|------|------|------|
| Browser Agent v1 | LLM 기반 페이지 내 자율 조작 (클릭, 스크롤, 입력) | 5개 | ~800줄 |
| Screenshot Analysis | `captureVisibleTab` → Vision API 분석 | 3개 | ~400줄 |
| Multi-page Collection | 링크 따라가기 + 여러 페이지 데이터 수집 | 3개 | ~500줄 |
| Advanced DataFrame | 피벗, 그룹핑, 시계열 분석, 차트 생성 | 4개 | ~600줄 |
| 패턴 학습 DB | 도메인별 성공 패턴 영구 저장 + 추천 | 2개 | ~300줄 |
| Sensitive URL Guard | 은행, 메일 등 민감 사이트 자동 차단 | 1개 | ~80줄 |

**핵심 의존성**:
- manifest.json: `"permissions": ["tabs", "webNavigation"]` 추가
- backend: `matplotlib`, `plotly` pip_install 추가

### Phase 3: "Autonomous Research" (4주)

| 기능 | 설명 | 파일 | 줄수 |
|------|------|------|------|
| Multi-Agent Orchestrator | Planner → Search → Web → Data → Analysis → Report | 6개 | ~1,200줄 |
| Playwright Integration | 백엔드 headless browser (외부 사이트 scraping) | 4개 | ~800줄 |
| Cross-tab Context | 여러 탭의 데이터를 하나의 분석으로 통합 | 3개 | ~500줄 |
| Auto-pagination | 자동 페이지네이션 탐지 + 전체 데이터 수집 | 2개 | ~400줄 |
| Research Report Export | PDF/HTML/Markdown 리포트 생성 | 3개 | ~500줄 |
| Citation Verification | 인용 교차 검증 + 신뢰도 점수 | 2개 | ~300줄 |

**핵심 의존성**:
- backend: `playwright`, `pdfkit` 추가
- 별도 Modal function (Playwright용 GPU/memory)

### Phase 4: "AI Browser OS Platform" (6주)

| 기능 | 설명 |
|------|------|
| Plugin System | 사용자가 커스텀 extractor 플러그인 작성 |
| Workflow Automation | "매일 이 사이트에서 데이터 수집" 스케줄링 |
| Team Collaboration | 추출 패턴 + 리서치 결과 팀 공유 |
| API Gateway | 외부 앱에서 H Chat OS 기능 호출 |
| Local LLM Support | Ollama/LM Studio 연동으로 완전 오프라인 |
| Browser Extension Marketplace | Chrome Web Store 배포 |

---

## 8. 파일 구조 요약

### 신규 파일 (Phase 1 MVP)

```
packages/extension/src/
├── content/
│   ├── page-extractor.ts          (재작성 ~250줄)
│   ├── metadata-extractor.ts      (신규 ~120줄)
│   ├── section-parser.ts          (신규 ~180줄)
│   ├── content-density.ts         (신규 ~100줄)
│   ├── table-extractor.ts         (신규 ~200줄)
│   ├── list-extractor.ts          (신규 ~120줄)
│   ├── data-cleaner.ts            (신규 ~100줄)
│   ├── pattern-detector.ts        (신규 ~250줄)
│   ├── dom-fingerprint.ts         (신규 ~120줄)
│   ├── dataset-candidate.ts       (신규 ~150줄)
│   └── highlight-overlay.ts       (신규 ~100줄)
├── lib/
│   ├── research-loop.ts           (신규 ~200줄)
│   ├── extraction-strategy.ts     (신규 ~120줄)
│   └── quality-evaluator.ts       (신규 ~100줄)
├── pages/
│   ├── DataPage.tsx               (신규 ~250줄)
│   ├── DatasetPage.tsx            (신규 ~200줄)
│   └── ResearchPage.tsx           (신규 ~300줄)
├── components/
│   ├── ExtDataTable.tsx           (신규 ~150줄)
│   ├── ExtResearchProgress.tsx    (신규 ~120줄)
│   ├── ExtSourceCard.tsx          (신규 ~80줄)
│   └── ExtSectionViewer.tsx       (신규 ~100줄)
├── hooks/
│   ├── useResearch.ts             (신규 ~120줄)
│   └── useDataExtraction.ts       (신규 ~100줄)
├── stores/
│   ├── page-intelligence.store.ts (신규 ~120줄)
│   └── pattern-learning.store.ts  (신규 ~100줄)
└── __tests__/
    ├── page-extractor.test.ts     (신규 ~200줄)
    ├── table-extractor.test.ts    (신규 ~200줄)
    ├── pattern-detector.test.ts   (신규 ~150줄)
    └── data-cleaner.test.ts       (신규 ~100줄)

backend/
├── routes/
│   ├── dataframe.py               (신규 ~200줄)
│   └── page_intelligence.py       (신규 ~180줄)
├── services/
│   └── dataframe_service.py       (신규 ~250줄)
└── tests/
    ├── test_dataframe.py          (신규 ~150줄)
    └── test_page_intelligence.py  (신규 ~100줄)
```

**총계**: 신규 ~30개 파일, ~5,500줄 코드 + ~1,100줄 테스트

### 수정 파일

| 파일 | 변경 내용 |
|------|----------|
| `packages/extension/src/shared/types.ts` | PageIntelligence 타입, ExtPage 확장 |
| `packages/extension/src/content/content-script.ts` | 새 extractor 연동 |
| `packages/extension/src/sidepanel/App.tsx` | renderPage 분기 추가 |
| `packages/extension/src/components/ExtNavBar.tsx` | 탭 추가 |
| `packages/extension/src/pages/PageContextPage.tsx` | 완전 재작성 |
| `packages/extension/src/hooks/usePageContext.ts` | PageIntelligence 연동 |
| `packages/extension/src/hooks/useChat.ts` | Page context injection |
| `packages/extension/manifest.json` | 권한 추가 |
| `backend/app.py` | 새 라우터 등록 |

---

## 9. 우선순위 매트릭스

| 엔진 | 임팩트 | 난이도 | 기존 자산 활용 | MVP 포함 |
|------|--------|--------|--------------|---------|
| Page Intelligence | **10/10** | 중 | page-extractor.ts 재작성 | **Yes** |
| DataFrame | **9/10** | 중 | numpy, backend 구조 | **Yes** |
| Dataset Discovery | **8/10** | 상 | 없음 (완전 신규) | **Yes** |
| Research System | **7/10** | 하 | research.py 이미 7단계 | **Yes** |
| AutoResearch Loop | **8/10** | 상 | 없음 (완전 신규) | **Yes (기본)** |
| Browser Agent | **9/10** | 상 | scripting 권한만 | **No (Phase 2)** |

---

## 10. 성공 지표 (MVP)

| 메트릭 | 목표 | 측정 방법 |
|--------|------|----------|
| 테이블 추출 정확도 | 80%+ (상위 100 사이트) | 수동 검증 + 자동 구조 비교 |
| 페이지 분석 속도 | < 500ms (일반 페이지) | Performance API 측정 |
| 데이터셋 탐지율 | 70%+ (반복 패턴 있는 페이지) | 10개 카테고리 사이트 테스트 |
| Research 보고서 품질 | 사용자 만족도 4/5+ | 5명 내부 테스터 피드백 |
| 테스트 커버리지 | 80%+ (신규 모듈) | Vitest coverage |
| 번들 크기 증가 | < 50KB 추가 | Vite build stats |
