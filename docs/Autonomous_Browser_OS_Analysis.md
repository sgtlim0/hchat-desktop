# Autonomous Browser OS — 심층 분석 및 Todo List

> **원문**: "자율형 리서치 패러다임 — 검색의 시대를 넘어, 엔터프라이즈 AI 브라우저 OS와 자율형 에이전트의 미래"
> **핵심 명제**: "The Browser is the New OS."
> **분석일**: 2026-03-14

---

## 1. 문서 구조 요약 (15 슬라이드)

| # | 제목 | 핵심 메시지 |
|---|------|-----------|
| 1 | 자율형 리서치 패러다임 | 브라우저 = 수동 뷰어 → 실행 엔진 |
| 2 | 3단계 진화 | Information Retrieval → Contextual AI → **Autonomous Research** |
| 3 | Karpathy AutoResearch | 630줄, 하룻밤 126회 자율 실험, BPB 메트릭 |
| 4 | AI Browser Landscape | Atlas(Workflow) / Comet(Research) / Arc(Synthesis) |
| 5 | Agentic Cloud Showdown | rtrvr.ai 81.39% / Skyvern 64.4% / Browser Use 43.9% |
| 6 | Pillar 1: Perception | Vision(비싸고 느림) vs **Smart DOM**(노이즈 60-70% 제거) |
| 7 | Pillar 2: Automation | Selenium(HTTP) vs **Playwright CDP**(WebSocket 양방향) |
| 8 | Pillar 3: Stealth | CDP 봇 탐지 문제 vs **Hybrid Chrome Extension**(세션 충실도) |
| 9 | MARS 오케스트레이션 | **LangGraph**(State&Logic) + **CrewAI**(Role-based) |
| 10 | Dynamic Multi-Model | Orchestrator → 5개 전문 모델 동적 할당 (19개까지 확장) |
| 11 | Self-Healing | Signal→Diagnosis→Healing→Verification, 복구시간 55-70%↓ |
| 12 | Enterprise Governance | H Chat Ecosystem: Zero Trust + Teams + Data Sovereignty |
| 13 | 14-Day MVP Roadmap | Week1 기반인프라 + Week2 자율지능 |
| 14 | H Chat AI Browser OS | **4-Layer Stack** 최종 합성 |
| 15 | The Browser is the New OS | 검색을 넘어선 자율형 리서치 시대 선언 |

---

## 2. 핵심 개념 심층 분석

### 2.1 자율형 리서치 3단계 진화

| 단계 | 시대 | 대표 | 특성 |
|------|------|------|------|
| **Stage 1** Information Retrieval | 과거 | Google, 전통 검색 | 정적 쿼리, 수동 정보 합성 |
| **Stage 2** Contextual AI | 현재 | ChatGPT Atlas, Arc Search | 작업 흐름 내 보조 역할 |
| **Stage 3** Autonomous Research | 미래 | **Perplexity Computer, H Chat OS** | 목표 설정 → 웹 탐색 → 결론 도출 → 실행. 엔드투엔드 자율 |

**핵심 전환**: "단순한 답변 생성을 넘어, 목표를 설정하고 웹을 탐색하며 스스로 결론을 도출하는 '실행'의 시대"

### 2.2 Karpathy AutoResearch — 촉매제

```
┌─────────────────────────────────────────┐
│          Infinity Loop (무한 루프)        │
│                                         │
│   1. Hypothesis ──→ 2. 5-Min Sprint     │
│      (가설 설정)       (단일 GPU 훈련)    │
│         ↑                  ↓            │
│   4. Commit/Rollback ←── 3. Measure BPB │
│      (결과 반영)         (성능 측정)      │
│                                         │
│         Continuous Cycle (반복)           │
└─────────────────────────────────────────┘
```

| 지표 | 값 |
|------|---|
| Lines of Code | **630줄** 미니멀리즘 아키텍처 |
| 최적화 메트릭 | BPB (Bits-Per-Byte) = Validation Loss / ln(2) |
| 처리량 | 하룻밤 **126회** 자율 실험 |
| 엔터프라이즈 임팩트 | Shopify — 소형 모델 성능 **19% 향상** |

**시사점**: 630줄로 충분히 자율 연구 루프를 구현할 수 있다. LLM 컨텍스트 윈도우에 최적화된 미니멀리즘이 핵심.

### 2.3 Three Pillars — 자율 브라우저의 3대 기둥

#### Pillar 1: Perception (인지) — Vision vs Smart DOM

| 비교 | Vision (Skyvern) | **Smart DOM (H Chat/rtrvr.ai)** |
|------|-----------------|--------------------------------|
| 접근법 | 스크린샷 → GPT-4V OCR | DOM Tree → 시맨틱 파싱 |
| 노이즈 처리 | 오버레이/팝업 OCR 오류 | Readability.js로 **60-70% 노이즈 제거** |
| 데이터 추출 | 픽셀 기반 불안정 | **RQFP 알고리즘** — 구조적 유사성 기반 관계형 데이터 추출 |
| 비용 | ~$1.00/작업 | **$0.12/작업** |
| 속도 | 12.49분 | **0.9분** |
| 인식 수준 | 픽셀 | **시맨틱 데이터베이스** |

#### Pillar 2: Automation Protocol (자동화 프로토콜)

```
Legacy: Selenium
  Code ···→ HTTP Requests (JSON Wire) ···→ Browser Driver ···→ Browser
  문제: 병목, 수동 대기(Explicit Waits)

Modern: Playwright
  Code ←→ Persistent WebSocket (CDP) ←→ Browser
  장점: 실시간 양방향, Auto-waiting
```

**결론**: CDP(Chrome DevTools Protocol) 기반 실시간 통신이 에이전트 실행력의 필수 기반.

#### Pillar 3: Stealth & Execution (은밀 실행) — 봇 탐지 우회

| CDP 문제 (Browser Use, Skyvern) | **Hybrid Chrome Extension (H Chat OS)** |
|-------------------------------|---------------------------------------|
| `window.cdc_` CDP 식별자 노출 | 네이티브 크롬 확장 API로 브라우저 내부 직접 실행 |
| `navigator.webdriver=true` → Cloudflare 차단 | 실제 사용자 쿠키/세션 충실도(Session Fidelity) 유지 |
| 헤드리스 브라우저 탐지 | 봇 탐지 우회, 사내 인트라넷/보안 시스템 안전 접근 |

### 2.4 MARS — Multi-Agent Research Systems

```
┌─ LangGraph (State & Logic) ──┐   ┌─ CrewAI (Role-based) ──────┐
│ - 상태 기반 + 조건부 엣지       │   │ - Market Analyst             │
│ - 중간 검증, 일시정지, 재탐색    │   │ - Technical Writer           │
│ - 복잡한 파이프라인에 최적       │   │ - Researcher                 │
└──────────────────────────────┘   │ - Editor, Comsonator         │
                                    │ - 동적 협업 → 최종 보고서      │
                                    └──────────────────────────────┘

파이프라인: Planner → Search → Web → Data → Analysis → Report
```

### 2.5 Dynamic Multi-Model Orchestration

```
                    ┌─────────────────────┐
                    │  Deep Research       │
                    │  (Gemini)            │
                    └────────┬────────────┘
┌─────────────────┐          │          ┌──────────────────┐
│ Reasoning Engine │    ┌────┴────┐     │ Image Generation  │
│ (Claude Opus 4.6)├───►│Orchestr.├────►│ (Nano Banana)     │
└─────────────────┘    │  Node   │     └──────────────────┘
                       └────┬────┘
┌─────────────────┐         │          ┌──────────────────┐
│ Long-context    │         │          │ Lightweight/Fast  │
│ (ChatGPT 5.2)  ├─────────┘          │ (Grok)            │
└─────────────────┘                    └──────────────────┘
```

**핵심**: "단일 모델 의존성의 종말. '어떤 모델이 가장 좋은가?'에서 **'이 특정 작업에 어떤 모델이 가장 적합한가?'**로의 전환. 모델 선택은 이제 전략이 아닌 **동적 라우팅 인프라**."

### 2.6 Self-Healing Software Systems

```
Signal → Diagnosis → Healing → Verification → Passed?
                                                 ├─ YES → Deployment / Flag for Review
                                                 └─ NO  → (루프 재시작)
```

| Biological Metaphor | Software Mapping |
|--------------------|------------------|
| Sensors (Pain) | Logs, Traces, Metrics (Datadog, Prometheus) |
| Brain | AI Orchestration Engine (LLM / RAG / RL) |
| Immune System | Healing Repair Agents |
| Memory | Version History / Observability Store |

**성과 지표**: 수동 디버깅 대비 복구 시간 **55-70% 단축**, 구문 오류 수정 성공률 **85-90%**

### 2.7 H Chat AI Browser OS — 4-Layer Stack

```
┌────────────────────────────────────────────┐
│  Layer 4: MARS (Multi-Agent Orchestration) │
│  복잡한 연구 목표를 계획, 실행, 분석하는     │
│  다중 에이전트 두뇌                         │
├────────────────────────────────────────────┤
│  Layer 3: DataFrame Engine                 │
│  추출된 HTML 웹 데이터를 즉시 분석 가능한     │
│  구조화된 Pandas DataFrame으로 변환          │
├────────────────────────────────────────────┤
│  Layer 2: Page Intelligence & Smart DOM    │
│  노이즈 제거 + 시맨틱 데이터 자율 발견       │
│  (Readability.js + RQFP)                   │
├────────────────────────────────────────────┤
│  Layer 1: Hybrid Chrome Extension          │
│  & Playwright                              │
│  봇 탐지 우회 + 실시간 브라우저 제어         │
└────────────────────────────────────────────┘
```

---

## 3. Enterprise Data Governance & Zero Trust

### Hyundai AutoEver H Chat Ecosystem

| Key Pillar | 내용 |
|-----------|------|
| **Zero Trust 보안** | 민감한 기업 환경을 위한 완벽한 내부 데이터 유출 방지 및 안전한 LLM 연결 |
| **접근성 극대화** | Microsoft Teams와의 매끄러운 연동으로 익숙한 대화형 인터페이스 |
| **데이터 주권** | EAI(엔터프라이즈 AI)의 핵심, 기업 내부 데이터의 완벽한 통제권 확보 |

---

## 4. 14-Day MVP 로드맵

| 기간 | 트랙 | 내용 |
|------|------|------|
| **Week 1** (Day 1-7) | Foundation & Data Layer | FastAPI 서버 + Chrome Extension 프레임워크, Page Intelligence + DOM 파싱(Readability.js) |
| **Week 2** (Day 8-14) | Intelligence & Autonomy | DataFrame 변환 엔진 + 데이터 추출 자동화, MARS 연동 + 테스트 런 |

**전략**: 투트랙. 브라우저 확장 프로그램 기반으로 기존 시스템 수정 없이 **2주 내 가시적 ROI 창출**.

---

## 5. 이전 문서(Agentic Enterprise)와의 교차 분석

| 영역 | Agentic Enterprise | Autonomous Browser OS | 시너지 |
|------|-------------------|----------------------|-------|
| 인지 계층 | Smart DOM (개념) | Smart DOM + **Readability.js + RQFP** (구체적) | Browser OS가 구현 상세 제공 |
| 오케스트레이션 | LangGraph 단독 | **LangGraph + CrewAI** 결합 | CrewAI 역할 기반 협업 추가 |
| 모델 라우팅 | 86개 모델 정적 라우팅 | **Orchestrator Node** 동적 할당 (19개 모델) | 동적 라우팅으로 업그레이드 |
| Self-Healing | 61% 복구율 목표 | **85-90%** 구문 오류 수정, 55-70% 시간 단축 | 더 높은 목표치 제시 |
| 로드맵 | 28주 (7개월) | **14일 MVP** | MVP 우선 후 점진적 확장 |
| 봇 탐지 | 미언급 | **Hybrid Extension 모델** (핵심 차별점) | 사내 시스템 자동화의 실현 가능성 |
| DataFrame | 미언급 | **HTML → Pandas DataFrame** 변환 | 웹 데이터 분석의 새로운 축 |

---

## 6. 전략적 Todo List

### Phase 0: 14-Day MVP (즉시 착수)

#### Week 1: Foundation & Data Layer

- [ ] **FastAPI 서버 프레임워크 구축**
  - [ ] `apps/ai-core` 확장: `/api/v1/browser-os/` 라우터 추가
  - [ ] WebSocket 엔드포인트 (Extension ↔ Backend 실시간 통신)
  - [ ] 세션 관리 및 작업 큐 시스템

- [ ] **Chrome Extension 에이전틱 확장**
  - [ ] 기존 `apps/extension` MV3 구조에 Smart DOM Parser 내장
  - [ ] Background Service Worker ↔ Side Panel ↔ Content Script 통신 파이프라인
  - [ ] 봇 탐지 우회: 네이티브 Chrome API 기반 실행 (CDP 식별자 회피)
  - [ ] 사용자 세션 충실도(Session Fidelity) 유지 메커니즘

- [ ] **Page Intelligence 엔진 탑재**
  - [ ] Readability.js 통합 — 노이즈 60-70% 제거
  - [ ] RQFP 알고리즘 구현 — 구조적 유사성 기반 반복 패턴 마이닝
  - [ ] 시맨틱 DOM Tree 구조화 출력

#### Week 2: Intelligence & Autonomy

- [ ] **DataFrame 변환 엔진**
  - [ ] HTML 테이블/리스트 → 구조화 JSON/CSV 자동 변환
  - [ ] `apps/ai-core`에 DataFrame 생성 API 구현
  - [ ] 프론트엔드 데이터 미리보기 컴포넌트

- [ ] **MARS 기본 파이프라인**
  - [ ] Planner → Search → Web → Data → Analysis → Report 파이프라인
  - [ ] LangGraph State Graph 기본 구현 (intake → plan → execute → report)
  - [ ] 단일 에이전트 PoC (Document Researcher)

- [ ] **MVP 통합 테스트 및 데모**
  - [ ] E2E 시나리오: "경쟁사 A의 최신 제품 정보를 수집하여 분석 보고서 작성"
  - [ ] 성공 기준: 자율 웹 탐색 → 데이터 추출 → DataFrame 변환 → 보고서 생성

### Phase 1: 3 Pillars 완성 (4주)

- [ ] **Pillar 1: Smart DOM 고도화**
  - [ ] RQFP 관계형 데이터 추출 정밀도 향상 (목표: 80%+)
  - [ ] 동적 SPA 페이지 대응 (MutationObserver 기반 실시간 DOM 변경 추적)
  - [ ] 사내 시스템 전용 DOM 파서 프로필 (Confluence, Jira, SAP)

- [ ] **Pillar 2: Playwright CDP 통합**
  - [ ] Headless Playwright 서버사이드 백업 자동화
  - [ ] Auto-waiting + 실시간 양방향 이벤트 스트리밍
  - [ ] Chrome Extension ↔ Playwright Fallback 전환 로직

- [ ] **Pillar 3: Stealth & Execution 강화**
  - [ ] CDP 식별자 완전 제거 검증 (window.cdc_, navigator.webdriver)
  - [ ] Cloudflare/PerimeterX 통과 테스트 스위트
  - [ ] 사내 인트라넷 보안 시스템 안전 접근 검증

### Phase 2: MARS 멀티 에이전트 (4주)

- [ ] **LangGraph + CrewAI 하이브리드 오케스트레이션**
  - [ ] LangGraph: 상태 기반 파이프라인 (조건부 엣지, 중간 검증, 재탐색)
  - [ ] CrewAI: 역할 기반 에이전트 팀 (Market Analyst, Technical Writer, Researcher, Editor)
  - [ ] 두 프레임워크 결합 아키텍처 설계

- [ ] **에이전트 역할 정의 및 구현**
  - [ ] Market Analyst: 시장 조사, 경쟁사 분석
  - [ ] Technical Writer: 기술 문서, 보고서 작성
  - [ ] Researcher: 심층 데이터 수집 및 검증
  - [ ] Editor: 품질 검토, 일관성 확인
  - [ ] Comsonator: 최종 합성 및 보고서 생성

- [ ] **Human-in-the-Loop 통합**
  - [ ] 중간 결과 검증 체크포인트
  - [ ] Teams 승인 알림 연동
  - [ ] 에이전트 실행 일시정지/재개 메커니즘

### Phase 3: Dynamic Multi-Model Orchestration (4주)

- [ ] **Orchestrator Node 구현**
  - [ ] 작업 유형별 최적 모델 자동 선택 라우팅 엔진
  - [ ] 기존 LLM Router (86모델) → Orchestrator 패턴으로 업그레이드
  - [ ] 모델별 전문 영역 프로필 DB

- [ ] **전문 모델 연동**
  - [ ] Reasoning Engine: Claude Opus 4.6 (복잡한 추론)
  - [ ] Deep Research: Gemini (광범위 탐색)
  - [ ] Long-context Retrieval: ChatGPT 5.2 (장문 분석)
  - [ ] Lightweight/Fast Ops: Grok (빠른 분류/필터링)
  - [ ] Image Generation: Nano Banana (시각 콘텐츠)

- [ ] **동적 라우팅 정책**
  - [ ] 비용 최적화: 작업 복잡도에 따른 모델 자동 선택
  - [ ] Fallback 체인: 1차 모델 실패 시 자동 전환
  - [ ] 실시간 모델 성능 모니터링 및 라우팅 가중치 자동 조정

### Phase 4: Self-Healing & Governance (4주)

- [ ] **Self-Healing 루프 고도화**
  - [ ] Signal → Diagnosis → Healing → Verification 자동화
  - [ ] AI Orchestration Engine (LLM + RAG + RL) 기반 진단
  - [ ] Healing Repair Agents 구현
  - [ ] Refactoring & Test Generation 자동화
  - [ ] 목표: 복구 시간 55-70% 단축, 구문 오류 수정 85-90%

- [ ] **Memory Store 구축**
  - [ ] Version History + Observability Store 통합
  - [ ] 과거 장애 패턴 임베딩 DB
  - [ ] 유사 장애 자동 인식 및 선제 대응

- [ ] **Enterprise Governance 강화**
  - [ ] Zero Trust 보안 프레임워크 적용
  - [ ] 데이터 주권 컴플라이언스 (한국 PIPA, GDPR)
  - [ ] 에이전트 행동 감사 로그 100% 커버리지

---

## 7. 기술 구현 Todo List

### 7.1 4-Layer Stack 구현 매핑

| Layer | 기술 | 신규/확장 | 기존 H Chat 자산 |
|-------|------|---------|----------------|
| L1 Hybrid Extension | Chrome MV3 + Playwright CDP | 확장 | `apps/extension` |
| L2 Smart DOM | Readability.js + RQFP | 신규 | Content Script |
| L3 DataFrame | HTML→JSON/CSV 변환 | 신규 | `apps/ai-core` |
| L4 MARS | LangGraph + CrewAI | 신규 | `apps/ai-core/agents` |

### 7.2 신규 패키지/모듈

```
apps/ai-core/
├── routers/
│   ├── browser_os.py       # Browser OS 라우터 (신규)
│   ├── mars.py             # MARS 오케스트레이션 (신규)
│   └── dataframe.py        # DataFrame 변환 (신규)
├── agents/
│   ├── orchestrator.py     # Orchestrator Node (신규)
│   ├── market_analyst.py   # Market Analyst (신규)
│   ├── researcher.py       # Researcher (신규)
│   ├── writer.py           # Technical Writer (신규)
│   └── editor.py           # Editor + Comsonator (신규)
└── intelligence/
    ├── smart_dom.py        # Smart DOM 서버사이드 (신규)
    ├── readability.py      # Readability 래퍼 (신규)
    ├── rqfp.py             # RQFP 알고리즘 (신규)
    └── dataframe_engine.py # DataFrame 엔진 (신규)

apps/extension/src/
├── content/
│   ├── smartDomParser.ts   # Smart DOM Parser (신규)
│   ├── readability.ts      # Readability.js 통합 (신규)
│   └── rqfp.ts             # RQFP 클라이언트 (신규)
├── background/
│   ├── taskQueue.ts        # 에이전트 작업 큐 (신규)
│   └── stealthEngine.ts    # 봇 탐지 우회 (신규)
└── sidepanel/
    └── AgentPanel.tsx      # 에이전트 제어 UI (신규)
```

---

## 8. 리스크 및 대응

| 리스크 | 영향 | 확률 | 대응 |
|--------|------|------|------|
| 봇 탐지 시스템 우회 실패 | 높음 | 중간 | Hybrid Extension + Playwright Fallback 이중 전략 |
| Smart DOM 파싱 정확도 부족 | 중간 | 중간 | RQFP + Vision Fallback + 사이트별 커스텀 파서 |
| 멀티 모델 라우팅 비용 폭증 | 중간 | 높음 | Grok(경량) 우선, Opus(중량)는 복잡한 작업에만 |
| MARS 에이전트 간 교착 상태 | 중간 | 낮음 | LangGraph 타임아웃 + 상태 머신 기반 데드락 방지 |
| 14일 MVP 일정 초과 | 낮음 | 중간 | Core 기능(L1+L2)만 MVP, L3+L4는 Phase 1로 |

---

## 9. 실행 우선순위

```
[긴급 + 중요 — 14일 MVP] ━━━━━━━━━━━━━━━━━━
  1. Chrome Extension Hybrid 모델 (Stealth + Session Fidelity)
  2. Readability.js + Smart DOM Parser 내장
  3. FastAPI WebSocket 엔드포인트
  4. 단일 에이전트 PoC (Researcher)

[중요 + 계획적 — Phase 1-2] ━━━━━━━━━━━━━━━━
  5. RQFP 관계형 데이터 추출
  6. DataFrame 변환 엔진
  7. MARS 멀티 에이전트 (LangGraph + CrewAI)
  8. Dynamic Multi-Model Orchestrator

[전략적 투자 — Phase 3-4] ━━━━━━━━━━━━━━━━━
  9. Self-Healing 85-90% 복구율
  10. Enterprise Governance + Zero Trust
  11. Karpathy AutoResearch 스타일 자율 실험 루프
```

---

## 10. KPI 종합

| 영역 | 지표 | 목표 |
|------|------|------|
| Smart DOM | 노이즈 제거율 | 60-70% |
| Web Automation | 자동화 성공률 | 81%+ (rtrvr.ai 기준) |
| Web Automation | 작업당 비용 | < $0.12 |
| Web Automation | 평균 소요시간 | < 1분 |
| MARS | 보고서 품질 점수 | 85%+ (Human 평가) |
| Multi-Model | 최적 모델 선택 정확도 | 90%+ |
| Self-Healing | 복구 시간 단축 | 55-70% |
| Self-Healing | 구문 오류 수정 | 85-90% |
| Stealth | 봇 탐지 우회율 | 95%+ |
| MVP | 2주 내 데모 | Day 14 완료 |

---

> **"The Browser is the New OS. 웹은 더 이상 읽기 위한 공간이 아닙니다. AI 에이전트가 활동하는 지능형 환경(Intelligent Environment)입니다."**
>
> **"검색을 넘어선 자율형 리서치의 시대. 귀사의 엔터프라이즈 인프라는 준비되었습니까?"**

---

## 11. H Chat 코드베이스 통합 매핑 (Worker A 분석 결과)

### 4-Layer → 기존 코드 매핑

| Browser OS Layer | 기존 파일 | 핵심 함수/컴포넌트 | 활용 방안 |
|-----------------|----------|------------------|---------|
| **L1 Hybrid Extension** | `apps/extension/src/utils/sanitize.ts` | `sanitizePII()` (7패턴) | DOM 추출 시 PII 자동 마스킹 |
| | `apps/extension/src/utils/blocklist.ts` | `shouldBlockExtraction()` (20도메인+6패턴) | 민감 도메인 자동 차단 |
| | `apps/extension/src/utils/messaging.ts` | `sendMessage<T>()`, `sendTabMessage<T>()` | Content Script ↔ Background 타입 안전 통신 |
| | `apps/extension/src/types/messages.ts` | `ExtensionMessage<T>`, `ExtensionResponse<T>` | 타입 안전 메시징 계약 |
| **L2 Smart DOM** | `apps/ai-core/routers/analyze.py` | `analyze()` (4모드: summarize/explain/research/translate) | DOM 텍스트 분석 엔드포인트 |
| | `packages/ui/src/llm-router/services/streamingService.ts` | `streamChatCompletion()`, `estimateTokens()` | 토큰 단위 스트림 분해 |
| **L3 DataFrame** | `apps/ai-core/services/llm_client.py` | `chat()`, `chat_stream()` (OpenAI/Anthropic/Google) | 멀티 프로바이더 LLM 라우팅 |
| | `apps/ai-core/optimizer/prompt_builder.py` | `build_chat_prompt()` | 메시지 압축 & 프롬프트 최적화 |
| | `packages/ui/src/llm-router/services/streamingService.ts` | `calculateCost()` | 실시간 KRW 비용 산출 |
| **L4 MARS** | `packages/ui/src/desktop/SwarmPanel.tsx` | `SwarmPanel` | 멀티 에이전트 진행상황 시각화 |
| | `packages/ui/src/desktop/AgentCard.tsx` | `AgentCard` | 에이전트 상태 UI |
| | `packages/ui/src/desktop/DebateArena.tsx` | `DebateArena` | 3-컬럼 찬/반/사회자 토론 |
| | `packages/ui/src/utils/circuitBreaker.ts` | `createCircuitBreaker()` | 장애 격리 (CLOSED→OPEN→HALF_OPEN) |
| | `packages/ui/src/utils/errorMonitoring.ts` | `captureError()`, `addBreadcrumb()` | Sentry 트레이싱 |
| | `packages/ui/src/utils/healthCheck.ts` | `checkServiceHealth()` | 엔드포인트 폴링 & 레이턴시 |

### 확장/수정 우선순위

| 파일 | 필요한 확장 | 우선순위 |
|------|-----------|---------|
| `apps/extension/src/types/messages.ts` | `domContextType`, `retryPolicy` 필드 추가 | HIGH |
| `apps/extension/src/services/extensionChatService.ts` | 재시도 로직, 로컬 캐싱 통합 | HIGH |
| `apps/ai-core/routers/analyze.py` | 멀티 랭귀지, 캐싱 레이어, `domSelector` 추가 | HIGH |
| `packages/ui/src/utils/healthCheck.ts` | 메트릭 수집기 (Prometheus 형식) | HIGH |
| `packages/ui/src/desktop/types.ts` | `retryPolicy`, `capabilities` 필드 | MEDIUM |
| `packages/ui/src/desktop/SwarmPanel.tsx` | `estimatedTimeMs`, 실시간 토큰 카운트 | MEDIUM |
| `apps/ai-core/services/llm_client.py` | Exponential backoff, 타임아웃 재설정 | MEDIUM |

---

## 12. Agentic Enterprise 교차 분석 (Worker B 분석 결과)

### 시너지 포인트

| 영역 | Agentic Enterprise | Browser OS | 시너지 |
|------|-------------------|------------|--------|
| Smart DOM | 개념 수준 설계 | **Readability.js + RQFP** 구현 상세 | Browser OS가 구현체 제공 |
| 오케스트레이션 | LangGraph 단독 | **LangGraph + CrewAI** 결합 | CrewAI 역할 기반 협업 추가 |
| 모델 라우팅 | 86개 정적 라우팅 | **Orchestrator Node** 동적 할당 | 작업 중 실시간 모델 전환 |
| Self-Healing | 61% 복구율 | **85-90%** 구문 오류, 55-70% 시간↓ | 목표 상향 |
| 로드맵 | 28주 (7개월) | **14일 MVP** | Sprint 0으로 삽입 |

### Browser OS 고유 개념 (블루프린트에 누락)

| 개념 | 추가 필요성 |
|------|-----------|
| **Browser = New OS** | "The Hands"를 보조 모듈 → **플랫폼 레이어**로 격상 |
| **4-Layer Stack** | Extension → Smart DOM → DataFrame → MARS 계층 분리 |
| **Stealth & Execution** | 봇 탐지 우회 (CDP 식별자, Cloudflare 차단 대응) |
| **DataFrame Engine** | 소버린 데이터(IMPL-01)와 Smart DOM(IMPL-03) 사이 누락 레이어 |
| **Karpathy AutoResearch** | 630줄 자율 실험 루프 — 에이전트 카탈로그에 `AutoResearcher` 추가 |
| **CrewAI 역할 협업** | LangGraph + CrewAI 하이브리드 패턴 |
| **Dynamic Multi-Model** | 정적 → 작업 단계별 실시간 모델 전환 |

### 통합 로드맵 권고: Sprint 0 삽입

```
14일 MVP (Browser OS)                    28주 엔터프라이즈 (블루프린트)
━━━━━━━━━━━━━━━━━━━━                    ━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Week 1: Extension + Smart DOM    →→→    P1 기반(8주)의 "Sprint 0"
  Week 2: MARS + Self-Healing      →→→    P2 핵심(8주)의 선행 검증
```

| 단계 | 기간 | 내용 |
|------|------|------|
| **Sprint 0 (신규)** | 2주 | Browser OS 14일 MVP. 기술 검증 + 팀 학습 |
| P1 기반 | 8주 | Sprint 0 결과 → 소버린 데이터 + 오케스트레이션 PoC |
| P2 핵심 | 8주 | CrewAI 추가, DataFrame Engine, 동적 멀티모델 |
| P3 통합 | 8주 | Stealth, AutoResearch, HITL |
| P4 프로덕션 | 4주 | 통합 테스트, 보안 심사, Canary |
| **총 기간** | **30주** | 2주 추가로 기술 리스크 대폭 감소 |

### 실행 권고 3가지

1. **Sprint 0 삽입** — 28주 착수 전 14일 MVP로 Smart DOM + MARS 기술 타당성 실증
2. **IMPL-03 격상** — "The Hands"를 보조 모듈에서 **플랫폼 레이어**로 재정의, 4-Layer Stack 채택
3. **동적 모델 라우팅** — 86개 모델 정적 라우팅 → 작업 단계별 실시간 전환으로 업그레이드
