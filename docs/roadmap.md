# H Chat PWA — 로드맵

> ✅ **Phase 1-23 전체 완료** (115개 기능) | Phase 21 기획 | 최종 업데이트: 2026-03-07
> 1,479 tests, 121 suites | 68 pages, 65 stores, 62K+ lines | Vercel 배포 완료

---

## 1. 완료된 작업 (2026-03-03)

### 주요 성과

| 항목 | 상태 | 비고 |
|------|------|------|
| **리브랜딩 (H Chat)** | ✅ 완료 | 모든 문서, 파일명, UI 텍스트 일괄 변경 |
| **Phase 1: 비서 마켓플레이스** | ✅ 완료 | HomeScreen 리팩토링, 8개 공식 비서 카드 그리드 |
| **카테고리 필터** | ✅ 완료 | 전체/채팅/업무/번역/정리/보고/그림/글쓰기 8개 |
| **공식/내비서 탭** | ✅ 완료 | 기존 페르소나 시스템 연결 |
| **버그 수정** | ✅ 완료 | 스트리밍 커서 더블 깜박임 해결 |
| **테스트 수정** | ✅ 완료 | debate store vi import 이슈 해결 |

### 구현 파일

```
수정: src/pages/home/HomeScreen.tsx      (비서 마켓플레이스 UI)
신규: src/shared/constants/assistants.ts (8개 비서 프리셋)
신규: src/shared/ui/AssistantCard.tsx    (비서 카드 컴포넌트)
수정: src/shared/i18n/ko.ts, en.ts       (i18n 키 28개 추가)
수정: src/widgets/message-list/MessageBubble.tsx (커서 버그 수정)
```

### 비서 프리셋 (8개)

| ID | 비서명 | 모델 | 프로바이더 | 카테고리 |
|----|--------|------|-----------|----------|
| analyst | 신중한 분석가 | Claude Sonnet 4.6 | Bedrock | 분석 |
| quickChat | 빠른 대화 | Gemini 2.0 Flash | Gemini | 대화 |
| docReview | 문서 검토 | Claude Sonnet 4.6 | Bedrock | 업무 |
| translator | 문서 번역 | GPT-4o | OpenAI | 번역 |
| reportWriter | 보고서 작성 | Claude Sonnet 4.6 | Bedrock | 보고 |
| codeReviewer | 코드 리뷰 | Claude Sonnet 4.6 | Bedrock | 업무 |
| dataAnalyst | 데이터 분석 | GPT-4o | OpenAI | 분석 |
| emailWriter | 이메일 작성 | GPT-4o-mini | OpenAI | 글쓰기 |

---

## 2. 향후 작업 (Phases 2-4)

### Phase 2: 헤더 도구 탭 + 문서 번역 워크플로우 (3일)

#### 2-1. 헤더 도구 탭 (0.5일)

**목표**: 상단 탭 바로 주요 도구 빠른 전환

```
수정: src/app/layouts/MainLayout.tsx
수정: src/shared/types/index.ts (ViewState 확장)
```

**탭 구성**:
- 업무 비서 (chat) — 기본 대화
- 문서 번역 (translate) — 파일 번역
- 문서 작성 (doc-write) — 마법사
- 텍스트 추출 (ocr) — OCR

#### 2-2. 문서 번역 워크플로우 (2.5일)

**목표**: 파일 업로드 → 엔진 선택 → 배치 번역 → 결과 다운로드

```
신규: src/pages/translate/TranslatePage.tsx
신규: src/entities/translate/translate.store.ts
신규: src/shared/lib/translate.ts
수정: src/shared/i18n/ko.ts, en.ts
```

**UI 구조**:
```
┌──────────────────────────────────────┐
│ 문서 번역 도구                        │
│ "디자인/형식 유지하면서 번역..."      │
│ 지원: PDF, DOCX, PPTX, XLSX          │
├──────────────────────────────────────┤
│ ① 번역 시작 → ② 번역 결과            │
├──────────────────────────────────────┤
│ ┌───────────┐ ┌───────────┐         │
│ │ 🔤 LLM    │ │ 🌐 브라우저│         │
│ │ · 고품질   │ │ · 빠른 속도│         │
│ └───────────┘ └───────────┘         │
├──────────────────────────────────────┤
│ 원본: [자동 ▾]  대상: [한국어 ▾]     │
├──────────────────────────────────────┤
│ 📄 파일 업로드 (드래그/클릭)          │
│                     [번역 시작]      │
├──────────────────────────────────────┤
│ 파일명 | 상태 | 진행률 | 다운로드    │
└──────────────────────────────────────┘
```

**기술 스택**:
- LLM 번역: 기존 프로바이더 재사용
- 텍스트 추출: pdf-extractor (기존)
- 진행률: 청크별 완료 퍼센트

**스토어 구조**:
```typescript
interface TranslateState {
  engine: 'llm' | 'browser'
  sourceLang: string
  targetLang: string
  files: TranslateFile[]
  isProcessing: boolean
}

interface TranslateFile {
  id: string
  name: string
  status: 'pending' | 'extracting' | 'translating' | 'done' | 'error'
  progress: number  // 0-100
  originalText?: string
  translatedText?: string
}
```

---

### Phase 3: 문서 작성 마법사 + OCR (3일)

#### 3-1. 문서 작성 마법사 (2일)

**목표**: 5단계 스텝퍼로 AI 문서 초안 작성

```
신규: src/pages/doc-writer/DocWriterPage.tsx
신규: src/entities/doc-writer/doc-writer.store.ts
수정: src/shared/i18n/ko.ts, en.ts
```

**5단계 플로우**:

| 단계 | 내용 | 사용자 액션 |
|------|------|-------------|
| 1. 프로젝트 설정 | 프로젝트명, 문서 종류 | 입력 |
| 2. 배경지식 제공 | 컨텍스트 텍스트/파일 | 업로드 |
| 3. 목차 생성 | AI 목차 초안 생성 | 편집 |
| 4. 내용 작성 | 섹션별 AI 초안 | 편집 |
| 5. 파일 다운로드 | MD/TXT 내보내기 | 다운로드 |

**문서 종류**:
- 보고서 (Report)
- 기획서 (Proposal)
- 제안서 (Presentation)
- 매뉴얼 (Manual)

**스토어 구조**:
```typescript
interface DocProject {
  id: string
  name: string
  type: 'report' | 'proposal' | 'presentation' | 'manual'
  context: string
  outline: OutlineSection[]
  content: Record<string, string>  // sectionId → text
  createdAt: number
}

interface OutlineSection {
  id: string
  level: number  // 1, 2, 3
  title: string
  children?: OutlineSection[]
}
```

#### 3-2. OCR 텍스트 추출 (1일)

**목표**: 이미지 → 텍스트, 배치 처리, 결과 다운로드

```
신규: src/pages/ocr/OcrPage.tsx
신규: src/shared/lib/ocr.ts
설치: tesseract.js
```

**UI 구조**:
```
┌────────────────────────────────────┐
│ 텍스트 추출 (OCR)                   │
│ "이미지에서 글자 자동 탐지"          │
├────────────────────────────────────┤
│ ① 이미지 업로드 → ② 추출 결과      │
├────────────────────────────────────┤
│ 📸 이미지 업로드 (최대 20개)        │
│    드래그 앤 드롭 또는 클릭         │
│                      [추출 시작]   │
├────────────────────────────────────┤
│ 파일명 | 상태 | 진행률 | 다운로드   │
└────────────────────────────────────┘
```

**기술 결정**:
- tesseract.js (클라이언트 OCR, 100+ 언어)
- dynamic import + CDN worker (번들 크기 최적화)
- 배치 처리 (Promise.allSettled)

**위험 요소**:
- wasm 번들 크기 (15MB) → CDN worker로 완화
- 한국어 정확도 → 한국어 학습 데이터 + 후처리

---

### Phase 4: 기능별 사용량 + 마무리 (1일)

#### 4-1. 사용량 추적 확장 (0.5일)

**목표**: 기능별 사용량 분리 추적

```
수정: src/entities/usage/usage.store.ts
수정: src/pages/settings/SettingsScreen.tsx
```

**UsageCategory 확장**:
```typescript
type UsageCategory =
  | 'chat'           // 기본 대화
  | 'translate'      // 문서 번역
  | 'doc-write'      // 문서 작성
  | 'ocr'            // OCR
  | 'image-gen'      // 이미지 생성
  | 'data-analysis'  // 데이터 분석
```

**UI 변경**:
- 설정 > 사용량 탭에 카테고리 필터 추가
- 기능별 비용/토큰 차트

#### 4-2. 문서화 + 테스트 (0.5일)

- i18n 키 검증 (누락 확인)
- Phase 2-3 유닛 테스트 추가
- CLAUDE.md 업데이트

---

## 3. 파일 변경 요약

| Phase | 신규 파일 | 수정 파일 | 설치 |
|-------|-----------|-----------|------|
| Phase 2 | 3 | 3 | - |
| Phase 3 | 4 | 2 | tesseract.js |
| Phase 4 | 0 | 2 | - |
| **합계** | **7** | **7** | **1** |

### 상세 파일 목록

```
# Phase 2
신규: src/pages/translate/TranslatePage.tsx
신규: src/entities/translate/translate.store.ts
신규: src/shared/lib/translate.ts
수정: src/app/layouts/MainLayout.tsx (탭 바 추가)
수정: src/shared/types/index.ts (ViewState 확장)
수정: src/shared/i18n/ko.ts, en.ts (번역 ~30개 키)

# Phase 3
신규: src/pages/doc-writer/DocWriterPage.tsx
신규: src/entities/doc-writer/doc-writer.store.ts
신규: src/pages/ocr/OcrPage.tsx
신규: src/shared/lib/ocr.ts
수정: src/shared/i18n/ko.ts, en.ts (문서작성/OCR ~40개 키)

# Phase 4
수정: src/entities/usage/usage.store.ts (카테고리 추가)
수정: src/pages/settings/SettingsScreen.tsx (필터 UI)
```

---

## 4. 우선순위 + 공수

| Phase | 기능 | 공수 | 임팩트 | 복잡도 |
|-------|------|------|--------|--------|
| **Phase 2** | 헤더 탭 + 문서 번역 | 3일 | 높음 | 중간 |
| **Phase 3** | 문서 작성 + OCR | 3일 | 중간 | 높음 |
| **Phase 4** | 기능별 사용량 | 1일 | 낮음 | 낮음 |
| **합계** | | **7일** | | |

---

## 5. 기술 결정

| 항목 | 선택 | 이유 |
|------|------|------|
| **번역 엔진** | LLM API (기존 프로바이더) | 별도 API 불필요, 인프라 재사용 |
| **OCR** | tesseract.js | 클라이언트 전용, 100+ 언어 지원 |
| **문서 생성** | Markdown → TXT/MD | DOCX 생성 복잡도 높아 추후 고려 |
| **스텝퍼 UI** | 커스텀 구현 | 기존 UI 패턴 활용 |
| **배치 처리** | Web Worker + Promise.allSettled | 메인 스레드 블로킹 방지 |

---

## 6. 위험 요소

| 위험 | 영향 | 완화 방안 |
|------|------|----------|
| tesseract.js 번들 크기 (15MB wasm) | 초기 로딩 지연 | dynamic import + CDN worker |
| LLM 번역 품질 불안정 | 사용자 불만 | 청크 크기 최적화 + 재시도 로직 |
| 5단계 마법사 UX 복잡도 | 이탈률 증가 | 각 단계 저장 + 중간 복귀 지원 |
| OCR 한국어 정확도 | 결과 품질 저하 | 한국어 학습 데이터 + 후처리 |

---

## 7. 성과 지표

### 완료 기준

- [x] Phase 1: 비서 마켓플레이스 (2026-03-03 완료)
- [x] Phase 2: 문서 번역 워크플로우 기능 동작
- [x] Phase 3: 문서 작성 마법사 + OCR 통합
- [x] Phase 4: 기능별 사용량 추적 완료
- [x] 테스트 커버리지 80%+ 유지
- [x] i18n 키 100% 번역 (ko/en)

### 전체 진행률

| 구분 | 완료 | 남은 작업 | 진행률 |
|------|------|-----------|--------|
| Phase 1 | 1/1 | 0 | 100% |
| Phase 2 | 1/1 | 0 | 100% |
| Phase 3 | 2/2 | 0 | 100% |
| Phase 4 | 1/1 | 0 | 100% |
| **전체** | **5/5** | **0** | **100%** |

---

---

## 8. Phase 6: 생산성 자동화 (예정)

### 6-1. 프롬프트 체이닝 (1일)

**목표**: 복잡한 작업을 단계별로 자동 실행

```
신규: src/widgets/prompt-chain/PromptChain.tsx
수정: src/entities/prompt-library/prompt-library.store.ts (체이닝 확장)
```

- 순차 실행 체인 정의 (기존 프롬프트 라이브러리 확장)
- 각 단계 결과 → 다음 단계 입력으로 자동 연결
- 조건부 분기 (IF-THEN-ELSE)
- 실행 진행률 + 중간 결과 수정 가능

### 6-2. 지식베이스 (2일)

**목표**: 재사용 가능한 컨텍스트 중앙 관리

```
신규: src/pages/knowledge/KnowledgeBasePage.tsx
신규: src/entities/knowledge/knowledge.store.ts
수정: src/shared/i18n/ko.ts, en.ts
```

- 문서 업로드 → 자동 청킹 → 임베딩 (브라우저 내)
- 시맨틱 검색 (유사도 기반)
- 태그/카테고리 분류, 버전 관리
- 채팅 시 자동 컨텍스트 주입 옵션

### 6-3. 워크플로우 빌더 (3일)

**목표**: 노코드 AI 작업 자동화 파이프라인

```
신규: src/pages/workflow/WorkflowBuilderPage.tsx
신규: src/entities/workflow/workflow.store.ts
신규: src/widgets/workflow-canvas/WorkflowCanvas.tsx
수정: src/shared/i18n/ko.ts, en.ts
```

- 블록 기반 비주얼 에디터 (드래그앤드롭)
- 사전 정의 블록: 프롬프트, 번역, 요약, 추출, 조건분기
- 트리거: 수동실행, 스케줄, 웹훅
- 변수 시스템: `{{output.previous}}` 체이닝
- 템플릿 갤러리

### 6-4. 실시간 협업 채팅 (2일)

**목표**: 팀원과 AI 세션 공동 작업

```
신규: src/pages/collab/CollabRoomPage.tsx
신규: src/entities/collab/collab.store.ts
수정: backend/app.py (WebRTC 시그널링)
```

- 룸 생성/참여 (링크 공유)
- 실시간 메시지 동기화 (WebRTC)
- 사용자별 커서/타이핑 표시
- 권한 관리 (호스트/참여자)

---

## 9. Phase 7: 인텔리전스 확장 (✅ 완료)

### 7-1. 컨텍스트 매니저 (1일)

```
신규: src/widgets/context-manager/ContextManager.tsx
수정: src/entities/memory/memory.store.ts (확장)
```

- 컨텍스트 윈도우 시각화, 중요도 기반 자동 압축
- 핀 고정 메시지, 컨텍스트 템플릿

### 7-2. AI 인사이트 대시보드 (2일)

```
신규: src/pages/insights/InsightsDashboardPage.tsx
신규: src/entities/insights/insights.store.ts
```

- 프롬프트 품질 점수, 최적 모델 추천
- 비용 절감 기회 식별, 주간/월간 리포트

### 7-3. 플러그인 시스템 (3일)

```
신규: src/core/plugin-system/
신규: src/pages/plugins/PluginMarketplace.tsx
```

- 샌드박스 iframe + postMessage API
- 공식 플러그인: Notion, Google Docs, Jira

### 7-4. 테마 빌더 (1일)

```
신규: src/pages/theme/ThemeBuilderPage.tsx
```

- 실시간 CSS 변수 편집, 테마 내보내기/가져오기

---

## 10. Phase 8: 엔터프라이즈 & 인텔리전스 (✅ 완료)

### 8-1. 배치 프로세싱 큐 (2일)

**목표**: 대량 문서 처리, 멀티모달 분석을 백그라운드 큐에서 병렬 실행

```
신규: src/pages/batch/BatchQueuePage.tsx
신규: src/entities/batch/batch.store.ts
신규: src/widgets/batch-monitor/BatchMonitor.tsx
수정: backend/app.py (POST /api/batch/enqueue, GET /api/batch/status)
```

- Modal Queue 기반 비동기 작업 큐
- 3-tier 우선순위 (high/normal/low), SSE 진행률
- 사용량 예산 연동 (초과 시 저우선순위 일시정지)

### 8-2. 크로스 세션 인사이트 (2일)

**목표**: 전체 세션을 분석하여 반복 패턴, 최적화 기회 자동 제안

```
신규: src/pages/insights/SessionInsightsPage.tsx
신규: src/entities/insights/insights.store.ts
수정: backend/app.py (POST /api/insights/analyze)
```

- LLM 기반 패턴 감지 (Bedrock Haiku 비용 최적화)
- 세션 유사도 클러스터링 (TF-IDF)
- 자동 추천: 프롬프트 템플릿화, Memory 저장 제안

### 8-3. 스마트 응답 캐싱 (2일)

**목표**: 동일/유사 프롬프트 자동 감지 → 캐시 재사용, 비용 대폭 절감

```
신규: src/entities/cache/cache.store.ts
신규: src/widgets/cache-control/CacheControlPanel.tsx
수정: src/widgets/prompt-input/PromptInput.tsx (캐시 힌트)
수정: backend/app.py (캐시 미들웨어, Modal Volume)
```

- 프롬프트 정규화 + SHA-256 해싱 (완전 일치 캐시)
- Modal Volume 영속 캐시 (TTL 7일, LRU eviction)
- 비용 절감 효과 UsageStore 연동 시각화

### 8-4. 엔터프라이즈 감사 로그 (2일)

**목표**: 전체 사용자 활동 로그 기록, 감사 리포트 생성 (GDPR 준수)

```
신규: src/pages/audit/AuditLogPage.tsx
신규: src/entities/audit/audit.store.ts
수정: backend/app.py (POST /api/audit/log, GET /api/audit/query)
```

- Event sourcing (세션/메시지/파일/설정 변경)
- 날짜/액션/모델/비용 범위 필터링
- CSV/JSON 감사 리포트 내보내기

---

## 10-1. Phase 9: 스마트 UX & 멀티모달 확장 (✅ 완료)

### 9-1. AI 대시보드 홈 (2일)

**목표**: 위젯 기반 커스터마이즈 가능한 대시보드

```
신규: src/pages/dashboard/DashboardPage.tsx
신규: src/entities/dashboard/dashboard.store.ts
```

- 위젯 그리드 시스템 (드래그 리사이즈, 순서 변경)
- 위젯 6종: 최근 대화, 사용량 요약, 빠른 비서, 지식베이스, 일정, 즐겨찾기
- 레이아웃 localStorage 영속

### 9-2. 멀티모달 채팅 확장 (2일)

**목표**: 이미지/오디오 입력 지원, 비전 모델 연동

```
수정: src/widgets/prompt-input/PromptInput.tsx (멀티모달 첨부)
수정: src/widgets/message-list/MessageBubble.tsx (인라인 미디어 렌더)
```

- Claude Vision / GPT-4o Vision 이미지 분석
- getUserMedia 카메라 캡처 → AI 분석
- Whisper API 오디오 입력
- 전역 드래그앤드롭 개선

### 9-3. 대화 분석 & 태그 자동화 (1일)

**목표**: AI 기반 자동 태깅, 감정 분석, 스마트 제목

```
수정: src/entities/session/session.store.ts (자동 태깅/제목)
수정: src/entities/tag/tag.store.ts (AI 추천)
```

- AI 자동 태깅 (대화 종료 시 LLM 추천)
- 대화 감정 분석 (긍정/부정/중립)
- 스마트 세션 제목 자동 생성
- "비슷한 대화" 추천

### 9-4. 고급 프롬프트 에디터 (2일)

**목표**: 파워유저를 위한 확장 프롬프트 에디터

```
신규: src/widgets/advanced-prompt/AdvancedPromptEditor.tsx
수정: src/widgets/prompt-input/PromptInput.tsx (확장 모드 토글)
```

- 멀티라인 풀스크린 에디터
- `{{변수}}` 자동완성, `/` 커맨드 스니펫
- 프롬프트 히스토리 탐색
- 마크다운 미리보기 토글

### 9-5. 팀 워크스페이스 (3일)

**목표**: 팀 단위 AI 협업 환경

```
신규: src/pages/workspace/WorkspacePage.tsx
신규: src/entities/workspace/workspace.store.ts
```

- 워크스페이스 생성/참여, 멤버 관리 (3단 권한)
- 공유 프롬프트 라이브러리, 공유 지식베이스
- 활동 피드 타임라인

---

## 11. Phase 진행 현황

| Phase | 기능 | 공수 | 상태 |
|-------|------|------|------|
| **Phase 7** | 컨텍스트 매니저 | 1일 | ✅ 완료 |
| **Phase 7** | AI 인사이트 | 2일 | ✅ 완료 |
| **Phase 7** | 플러그인 시스템 | 3일 | ✅ 완료 |
| **Phase 7** | 테마 빌더 | 1일 | ✅ 완료 |
| **Phase 8** | 배치 큐 | 2일 | ✅ 완료 |
| **Phase 8** | 크로스 세션 인사이트 | 2일 | ✅ 완료 |
| **Phase 8** | 스마트 캐싱 | 2일 | ✅ 완료 |
| **Phase 8** | 감사 로그 | 2일 | ✅ 완료 |
| **Phase 9** | AI 대시보드 홈 | 2일 | ✅ 완료 |
| **Phase 9** | 멀티모달 채팅 확장 | 2일 | ✅ 완료 |
| **Phase 9** | 대화 분석 자동화 | 1일 | ✅ 완료 |
| **Phase 9** | 고급 프롬프트 에디터 | 2일 | ✅ 완료 |
| **Phase 9** | 팀 워크스페이스 | 3일 | ✅ 완료 |
| **Phase 10** | MCP 서버 통합 | 2일 | ✅ 완료 |
| **Phase 10** | AI 에이전트 자율 실행 | 3일 | ✅ 완료 |
| **Phase 10** | 모바일 네이티브 UX | 2일 | ✅ 완료 |
| **Phase 10** | 실시간 데이터 커넥터 | 2일 | ✅ 완료 |
| **Phase 10** | AI 코드 인터프리터 | 3일 | ✅ 완료 |
| **Phase 11** | AI 멘토링 시스템 | 2일 | ✅ 완료 |
| **Phase 11** | 데이터 파이프라인 빌더 | 3일 | ✅ 완료 |
| **Phase 11** | AI 코드 리뷰어 | 2일 | ✅ 완료 |
| **Phase 11** | 스마트 알림 센터 | 1일 | ✅ 완료 |
| **Phase 11** | 비주얼 프롬프트 빌더 | 2일 | ✅ 완료 |
| **Phase 12** | AI 회의록 작성기 | 2일 | ✅ 완료 |
| **Phase 12** | 스마트 보고서 생성기 | 2일 | ✅ 완료 |
| **Phase 12** | AI 학습 경로 추천 | 2일 | ✅ 완료 |
| **Phase 12** | 대화 북마크 & 하이라이트 | 1일 | ✅ 완료 |
| **Phase 12** | AI 번역 메모리 (TM) | 2일 | ✅ 완료 |
| **Phase 13** | AI 프레젠테이션 생성기 | 2일 | ✅ 완료 |
| **Phase 13** | 스마트 요약 피드 | 1일 | ✅ 완료 |
| **Phase 13** | AI 이메일 어시스턴트 | 2일 | ✅ 완료 |
| **Phase 13** | 대화 타임라인 뷰 | 1일 | ✅ 완료 |
| **Phase 13** | AI 마인드맵 생성기 | 2일 | ✅ 완료 |
| **Phase 16** | AI 페어 프로그래밍 | 3일 | ✅ 완료 |
| **Phase 16** | 스마트 대시보드 빌더 | 3일 | ✅ 완료 |
| **Phase 16** | AI 문서 비교 분석기 | 2일 | ✅ 완료 |
| **Phase 16** | 멀티에이전트 디베이트 | 2일 | ✅ 완료 |
| **Phase 16** | AI 포트폴리오 생성기 | 2일 | ✅ 완료 |
| **Phase 17** | AI 실시간 번역 통화 | 3일 | ✅ 완료 |
| **Phase 17** | 스마트 문서 OCR 분석기 | 2일 | ✅ 완료 |
| **Phase 17** | AI 게임화 학습 시스템 | 3일 | ✅ 완료 |
| **Phase 17** | 인터랙티브 데이터 스토리텔링 | 2일 | ✅ 완료 |
| **Phase 17** | AI 감정 일기 & 웰빙 트래커 | 2일 | ✅ 완료 |
| **Phase 18** | AI 화이트보드 협업 | 3일 | ✅ 완료 |
| **Phase 18** | 스마트 계약서 생성기 | 2일 | ✅ 완료 |
| **Phase 18** | AI 사운드스케이프 | 2일 | ✅ 완료 |
| **Phase 18** | 인터랙티브 튜토리얼 빌더 | 2일 | ✅ 완료 |
| **Phase 18** | AI 습관 트래커 & 코치 | 2일 | ✅ 완료 |
| **Phase 19** | AI 여행 플래너 | 3일 | ✅ 완료 |
| **Phase 19** | 스마트 레시피 & 식단 | 2일 | ✅ 완료 |
| **Phase 19** | AI 인터뷰 코치 | 2일 | ✅ 완료 |
| **Phase 19** | 개인 재무 대시보드 | 2일 | ✅ 완료 |
| **Phase 19** | AI 독서 노트 | 2일 | ✅ 완료 |
| **Phase 20** | AI OKR 트래커 | 2일 | ✅ 완료 |
| **Phase 20** | 스마트 CRM | 3일 | ✅ 완료 |
| **Phase 20** | AI 일기 & 저널 | 2일 | ✅ 완료 |
| **Phase 20** | 소셜 미디어 도우미 | 2일 | ✅ 완료 |
| **Phase 20** | AI 프로젝트 타임라인 | 3일 | ✅ 완료 |
| **Phase 21** | AI 화상회의 어시스턴트 | 3일 | ✅ 완료 |
| **Phase 21** | AI API 마켓플레이스 | 3일 | ✅ 완료 |
| **Phase 21** | AI 지식 위키 | 2일 | ✅ 완료 |
| **Phase 21** | AI 코드 놀이터 | 2일 | ✅ 완료 |
| **Phase 21** | AI 보이스 클론 & 나레이션 | 2일 | ✅ 완료 |
| **Phase 22** | AI 가상 공간 디자이너 | 3일 | ✅ 완료 |
| **Phase 22** | AI 게임 시나리오 엔진 | 3일 | ✅ 완료 |
| **Phase 22** | AI 감정 아바타 | 2일 | ✅ 완료 |
| **Phase 22** | AI 3D 데이터 시각화 | 2일 | ✅ 완료 |
| **Phase 22** | AI 오케스트라 | 2일 | ✅ 완료 |
| **Phase 23** | AI 디지털 트윈 | 3일 | ✅ 완료 |
| **Phase 23** | AI 작곡 & 사운드 디자인 | 2일 | ✅ 완료 |
| **Phase 23** | AI 드림 시뮬레이터 | 2일 | ✅ 완료 |
| **Phase 23** | AI 양자 데이터 시각화 | 2일 | ✅ 완료 |
| **Phase 23** | AI 철학자 | 2일 | ✅ 완료 |
| **Phase 24** | AI 시뮬레이션 랩 | 3일 | 📋 기획 |
| **Phase 24** | 스마트 컨트랙트 자동화 | 3일 | 📋 기획 |
| **Phase 24** | AI 영화 시나리오 | 2일 | 📋 기획 |
| **Phase 24** | 뉴로 피드백 대시보드 | 2일 | 📋 기획 |
| **Phase 24** | AI 우주 탐험가 | 2일 | 📋 기획 |
| **Phase 14** | 코드 스니펫 매니저 | 1일 | ✅ 완료 |
| **Phase 14** | API 테스터 | 2일 | ✅ 완료 |
| **Phase 14** | 정규표현식 빌더 | 1일 | ✅ 완료 |
| **Phase 14** | 데이터 변환기 | 1일 | ✅ 완료 |
| **Phase 14** | 다이어그램 에디터 | 2일 | ✅ 완료 |
| **Phase 15** | AI 음성 대화 모드 | 2일 | ✅ 완료 |
| **Phase 15** | 스마트 지식 그래프 | 3일 | ✅ 완료 |
| **Phase 15** | AI 코파일럿 모드 | 2일 | ✅ 완료 |
| **Phase 15** | 멀티모달 캔버스 | 3일 | ✅ 완료 |
| **Phase 15** | AI 자동 워크플로우 | 2일 | ✅ 완료 |

---

## 12. Phase 10: AI 네이티브 & 모바일 퍼스트 (📋 기획)

### 10-1. MCP 서버 통합 (2일)

**목표**: Model Context Protocol 표준으로 외부 도구 동적 로드

- MCP 클라이언트 구현
- 외부 도구 동적 로드 (파일 시스템, 데이터베이스, API)
- 플러그인 시스템 MCP 표준 마이그레이션
- MCP 서버 설정 UI

### 10-2. AI 에이전트 자율 실행 (3일)

**목표**: ReAct 패턴 멀티 스텝 자율 실행

- 도구 자동 선택 + 체이닝
- 실행 트리 시각화 (사고 과정 + 도구 호출)
- 사용자 확인 게이트 (민감 작업 승인)
- 에이전트 실행 히스토리 및 재실행

### 10-3. 모바일 네이티브 UX (2일)

**목표**: 모바일 퍼스트 인터페이스

- 바텀 네비게이션 바, 스와이프 제스처
- 풀스크린 채팅 모드, 음성 중심 인터페이스
- PWA 공유 타겟 (다른 앱에서 텍스트/이미지 수신)

### 10-4. 실시간 데이터 커넥터 (2일)

**목표**: 외부 서비스 실시간 연동

- Google Sheets, Notion, GitHub Issues/PR 연동
- OAuth 인증, 데이터 매핑 UI
- 채팅 시 실시간 데이터 컨텍스트 주입

### 10-5. AI 코드 인터프리터 (3일)

**목표**: 브라우저 내 코드 실행 환경

- Pyodide (Python), JavaScript 샌드박스
- 실행 결과 인라인 렌더링 (차트, 테이블)
- 코드 셀 노트북 모드 (Jupyter 스타일)

---

## 13. Phase 12: 고급 자동화 & 분석 인텔리전스 (📋 기획)

### 12-1. AI 회의록 작성기 (2일)

**목표**: 음성/텍스트 → 자동 회의록 생성, 액션 아이템 추출

```
신규: src/pages/meeting-notes/MeetingNotesPage.tsx
신규: src/entities/meeting-notes/meeting-notes.store.ts
```

- 음성/텍스트 입력 → 자동 회의록 생성
- 액션 아이템 자동 추출 (담당자, 기한)
- 참석자 발언 분석 (발언 비율, 주요 주장)
- 회의록 템플릿 (스탠드업/브레인스토밍/의사결정/회고)
- 내보내기 (MD/PDF)

### 12-2. 스마트 보고서 생성기 (2일)

**목표**: 데이터/대화 기반 자동 보고서, 차트 삽입

```
신규: src/pages/report-generator/ReportGeneratorPage.tsx
신규: src/entities/report-generator/report-generator.store.ts
```

- 데이터/대화 기반 자동 보고서 초안 생성
- 차트/그래프 자동 삽입 (SVG 기반)
- 템플릿 기반 포맷팅 (주간보고/월간보고/프로젝트보고)
- 보고서 버전 관리 + 비교
- 내보내기 (MD/PDF/HTML)

### 12-3. AI 학습 경로 추천 (2일)

**목표**: 사용 패턴 분석 → 개인화 학습 로드맵, 진도 추적

```
신규: src/pages/learning-path/LearningPathPage.tsx
신규: src/entities/learning-path/learning-path.store.ts
```

- 사용 패턴 분석 → 개인화 학습 로드맵 생성
- 주제별 퀴즈 자동 생성 (AI 기반)
- 학습 진도 추적 (완료율, 이해도 점수)
- 학습 리포트 (강점/약점 분석, 추천 자료)

### 12-4. 대화 북마크 & 하이라이트 (1일)

**목표**: 메시지 하이라이트, 북마크 컬렉션, 검색 연동

```
신규: src/entities/bookmark/bookmark.store.ts
수정: src/widgets/message-list/MessageBubble.tsx (하이라이트)
수정: src/widgets/search-modal/SearchModal.tsx (북마크 검색)
```

- 메시지 하이라이트 (드래그 선택 → 형광펜 색상)
- 북마크 컬렉션 (폴더별 정리)
- 태그 기반 북마크 분류
- SearchModal 연동 (북마크 검색 탭)

### 12-5. AI 번역 메모리 (TM) (2일)

**목표**: 번역 쌍 자동 저장, 유사 문장 매칭, 용어집

```
신규: src/pages/translation-memory/TranslationMemoryPage.tsx
신규: src/entities/translation-memory/translation-memory.store.ts
수정: src/pages/translate/TranslatePage.tsx (TM 참조)
```

- 번역 쌍 자동 저장 (원문 ↔ 번역문)
- 유사 문장 매칭 (Levenshtein + TF-IDF)
- 일관성 점수 (동일 용어 번역 일관성 측정)
- 용어집 관리 (도메인별 용어 사전)
- TranslatePage 연동 (번역 시 TM 자동 참조)

---

## 14. Phase 13: 커뮤니케이션 & 크리에이티브 AI (📋 기획)

### 13-1. AI 프레젠테이션 생성기 (2일)

**목표**: 대화/데이터 기반 슬라이드 자동 생성, 발표 노트

```
신규: src/pages/presentation/PresentationPage.tsx
신규: src/entities/presentation/presentation.store.ts
```

- 대화/데이터 기반 슬라이드 자동 생성 (AI 구조화)
- Mermaid/SVG 차트 자동 삽입
- 발표 노트 자동 생성
- HTML 슬라이드쇼 내보내기 (reveal.js 스타일)
- 슬라이드 템플릿 (비즈니스/기술/교육/요약)

### 13-2. 스마트 요약 피드 (1일)

**목표**: 일간/주간 전체 세션 자동 요약, 인사이트 추출

```
신규: src/pages/summary-feed/SummaryFeedPage.tsx
신규: src/entities/summary-feed/summary-feed.store.ts
```

- 일간/주간 전체 세션 자동 요약
- 핵심 인사이트 추출 (주요 결정, 아이디어, 액션)
- 요약 피드 타임라인 UI
- 이메일/Slack 전송 연동

### 13-3. AI 이메일 어시스턴트 (2일)

**목표**: 이메일 초안 작성, 톤/길이 조절, 회신 생성

```
신규: src/pages/email-assistant/EmailAssistantPage.tsx
신규: src/entities/email-assistant/email-assistant.store.ts
```

- 이메일 초안 작성 (주제, 수신자, 톤 입력)
- 톤/길이 조절 (격식/비격식, 짧게/길게)
- 이메일 체인 분석 → 핵심 요약
- 회신 초안 자동 생성, 이메일 템플릿

### 13-4. 대화 타임라인 뷰 (1일)

**목표**: 시각적 대화 히스토리, 주제별 구간 분리

```
신규: src/entities/conversation-timeline/conversation-timeline.store.ts
수정: src/pages/all-chats/AllChatsScreen.tsx (타임라인 탭)
수정: src/pages/chat/ChatPage.tsx (타임라인 사이드패널)
```

- 시각적 대화 히스토리 타임라인
- 주제별 구간 자동 분리 (AI 기반)
- 점프 네비게이션, 구간별 요약 호버

### 13-5. AI 마인드맵 생성기 (2일)

**목표**: 대화/문서 기반 마인드맵 자동 생성

```
신규: src/pages/mindmap/MindMapPage.tsx
신규: src/entities/mindmap/mindmap.store.ts
```

- 대화/문서 기반 마인드맵 자동 생성 (LLM 구조 추출)
- Mermaid mindmap 다이어그램 렌더링
- 노드 편집/추가/삭제 (인터랙티브)
- SVG/PNG 내보내기

---

## 15. 참고 문서

---

## 15. Phase 14: 개발자 도구 & 코드 지원 (✅ 완료)

- ✅ 14-1. 코드 스니펫 매니저 (snippet.store + SnippetPage, 17 tests)
- ✅ 14-2. API 테스터 (api-tester.store + ApiTesterPage, 21 tests)
- ✅ 14-3. 정규표현식 빌더 (regex-builder.store + RegexBuilderPage, 25 tests)
- ✅ 14-4. 데이터 변환기 (data-converter.store + DataConverterPage, 22 tests)
- ✅ 14-5. 다이어그램 에디터 (diagram-editor.store + DiagramEditorPage, 20 tests)

---

## 16. Phase 15: AI 인텔리전스 허브 & 차세대 UX (✅ 완료)

### 15-1. AI 음성 대화 모드 (2일)

**목표**: 실시간 양방향 음성 대화, 핸즈프리 AI 경험

- Whisper STT → LLM → TTS 연속 파이프라인
- 웨이크워드 트리거, 음성 감정 분석
- 자동 트랜스크립트 (타임스탬프), 미니 플레이어 모드

### 15-2. 스마트 지식 그래프 (3일)

**목표**: 대화/문서/지식 간 관계를 인터랙티브 그래프로 시각화

- LLM 기반 엔티티/관계 자동 추출
- Cytoscape.js 노드 맵 (기존 의존성 활용, 추가 설치 불필요)
- 클러스터 탐지, 시간 축 필터, 노드 클릭 → 원본 열기

### 15-3. AI 코파일럿 모드 (2일)

**목표**: 어디서든 AI를 호출할 수 있는 글로벌 플로팅 위젯

- `Cmd/Ctrl+J` 토글, 현재 페이지 컨텍스트 자동 감지
- 인라인 응답 삽입, 퀵 액션 메뉴 (요약/번역/수정)
- 미니/풀 모드 리사이즈

### 15-4. 멀티모달 캔버스 (3일)

**목표**: 텍스트+이미지+코드+다이어그램을 무한 캔버스에서 자유 배치

- 팬/줌/무한 스크롤 (transform matrix)
- 6가지 노드 타입 + 연결선 + AI 인라인 채팅
- 실시간 협업, 캔버스 템플릿, PNG/PDF 내보내기

### 15-5. AI 자동 워크플로우 (2일)

**목표**: 반복 작업 패턴을 감지하여 자동화 제안

- 사용 패턴 분석 (반복 프롬프트, 동일 도구 순서)
- 원클릭 워크플로우 생성, 스마트 스케줄링
- 자동화 효과 대시보드 (절감 시간/토큰/비용)

---

## 17. Phase 17: AI 하이퍼 인텔리전스 & 이머시브 경험 (✅ 완료)

### 17-1. AI 실시간 번역 통화 (3일)
**목표**: 양방향 실시간 음성 번역, 다국어 회의 지원
- STT → 번역 → TTS 파이프라인 (최대 4개 언어)
- 실시간 자막 오버레이, 번역 신뢰도 표시
- 통화 녹음 + 다국어 트랜스크립트 자동 생성

### 17-2. 스마트 문서 OCR 분석기 (2일)
**목표**: 영수증/계약서/명함 자동 인식 + 구조화 데이터 추출
- tesseract.js 기반 OCR + LLM 구조 분석
- 표/차트 이미지 → 데이터 테이블 변환

### 17-3. AI 게임화 학습 시스템 (3일)
**목표**: 게임 요소로 AI 활용 학습 동기 부여
- 퀴즈 배틀, XP/레벨/배지, 일일 챌린지
- 플래시카드 간격 반복, 스킬 트리 시각화

### 17-4. 인터랙티브 데이터 스토리텔링 (2일)
**목표**: 데이터를 몰입형 내러티브로 자동 변환
- AI 내러티브 생성, 스크롤 차트 애니메이션
- 핵심 인사이트 카드, HTML 공유 링크

### 17-5. AI 감정 일기 & 웰빙 트래커 (2일)
**목표**: 대화 감정 패턴 분석 + 웰빙 관리
- 일별/주별 감정 그래프, 마인드풀니스 제안
- 무드 캘린더, 프라이버시 로컬 저장

---

## 18. Phase 18: AI 크리에이티브 스튜디오 & 라이프 인텔리전스 (📋 기획)

### 18-1. AI 화이트보드 협업 (3일)
**목표**: 실시간 멀티 유저 화이트보드 + AI 드로잉 보조
- Canvas API 기반 드로잉 (펜/형상/텍스트/스티커)
- AI 스케치 → 도형 자동 정돈, 보드 템플릿
- 다중 사용자 협업, SVG/PNG 내보내기

### 18-2. 스마트 계약서 생성기 (2일)
**목표**: AI 법률 문서 초안 + 위험 조항 감지
- NDA/고용/서비스/임대 템플릿, 조항 드래그 조합
- 위험 조항 하이라이트, PDF/DOCX 내보내기

### 18-3. AI 사운드스케이프 (2일)
**목표**: 집중/휴식 배경음 + 포모도로 타이머
- 자연음/로파이/화이트노이즈, 볼륨 믹서
- 25분/5분 자동 전환, 집중 시간 통계

### 18-4. 인터랙티브 튜토리얼 빌더 (2일)
**목표**: 단계별 가이드 생성 + 스크린샷 어노테이션
- 스텝 CRUD, AI 설명 자동 생성, HTML 내보내기

### 18-5. AI 습관 트래커 & 코치 (2일)
**목표**: 습관 관리 + AI 동기부여 + 히트맵
- 스트릭 추적, 주간 리포트, GitHub 스타일 캘린더

---

## 19. 참고 문서

| 문서 | 경로 | 용도 |
|------|------|------|
| 스크린샷 분석 | `docs/hchat-screenshot-analysis.md` | H Chat UI 상세 분석 |
| 구현 계획 | `docs/hchat-implementation-plan.md` | Phase별 구현 방안 |
| TODO 리스트 | `docs/todolist.md` | 전체 작업 현황 |
| 비서 프리셋 | `src/shared/constants/assistants.ts` | 8개 비서 데이터 |
| Phase 2 계획 | `docs/phase2-implementation-plan.md` | 헤더 탭 + 문서 번역 상세 |
| Phase 3 계획 | `docs/phase3-implementation-plan.md` | 문서 작성 마법사 + OCR 상세 |
| Phase 4 계획 | `docs/phase4-implementation-plan.md` | 기능별 사용량 추적 상세 |
