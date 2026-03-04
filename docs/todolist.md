# H Chat PWA — TODO List

> ✅ **전체 완료** (70/70 + Phase 1-6) | 마지막 업데이트: 2026-03-05
> 863 tests, 52 suites | 빌드 성공

## 현재 상태 요약

| 영역 | 상태 |
|------|------|
| 멀티 프로바이더 (Bedrock/OpenAI/Gemini) | ✅ 완료 |
| Modal 백엔드 (Bedrock 프록시) | ✅ 완료 — 배포됨 |
| 그룹 채팅 | ✅ 완료 |
| 채팅 내보내기 (MD/HTML/JSON/TXT) | ✅ 완료 |
| 채팅 가져오기 (JSON) | ✅ 완료 |
| 검색 | ✅ 완료 |
| IndexedDB 영속성 | ✅ 완료 |
| i18n (한국어/영어) | ✅ 완료 |
| PWA (설치/캐시) | ✅ 완료 |
| 테스트 (Vitest) | ✅ 완료 — 667 tests, 41 suites |
| 접근성 (a11y) | ✅ 완료 — focus-trap, skip-to-content, ARIA |
| 사용량 추적 | ✅ 완료 — 토큰 추정, 비용 대시보드, 일별/주별 차트 |
| 프롬프트 라이브러리 | ✅ 완료 — CRUD, 변수, 카테고리 |
| 페르소나 시스템 | ✅ 완료 — 5 프리셋, 커스텀, 시스템 프롬프트 |
| 크로스 모델 토론 | ✅ 완료 — 3라운드 자동 토론, 합의 요약 |
| PDF 채팅 | ✅ 완료 — pdfjs-dist, 시스템 프롬프트 주입 |
| 성능 최적화 | ✅ 완료 — memo, manualChunks, lazy |
| 오프라인 UI | ✅ 완료 — useOnlineStatus, 배너 |
| 자동 모델 라우팅 | ✅ 완료 — 프롬프트 분석 기반 자동 선택 |
| 내보내기 UI | ✅ 완료 — ChatHeader 직접 버튼 |
| v2-extension 분석 | ✅ 완료 — 기능 분석, 화면 설계, 구현 계획 |
| H Chat 분석 | ✅ 완료 — 기능 분석, 화면 설계, 구현 계획 |

---

## ✅ 완료된 항목

### P0 — 필수
- [x] Vitest + React Testing Library 설치
- [x] 유틸리티 단위 테스트 (`export-chat.ts`, `time.ts`, `model-meta.ts`)
- [x] i18n 테스트 (번역 키 누락 검증)
- [x] Zustand 스토어 통합 테스트 (`session.store`, `settings.store`)
- [x] 아이콘 전용 버튼에 `aria-label` 추가
- [x] `:focus-visible` 포커스 링 추가
- [x] CLAUDE.md Phase 3 반영

### P1 — UX 개선
- [x] `HomeScreen.tsx` — 빠른 액션 클릭 핸들러 구현
- [x] `QuickChatPage.tsx` — 메시지 전송 → `pendingPrompt` + 세션 생성
- [x] JSON 형식 대화 가져오기 (`AllChatsScreen`)
- [x] 오프라인 네트워크 상태 감지 + 배너 표시 + 전송 버튼 비활성화
- [x] `React.lazy()` 페이지별 코드 스플리팅
- [x] `manualChunks` 설정 (react, markdown, ui 번들 분리)
- [x] 완료된 메시지 마크다운 렌더링 `memo`/`useMemo` 적용
- [x] ChatHeader에 내보내기 직접 버튼 추가 (드롭다운 4포맷)
- [x] 자동 모델 라우팅 PromptInput 연동 (`effectiveModel`)
- [x] SearchModal 포커스 트랩 구현
- [x] skip-to-content 링크 추가
- [x] P2 스토어 테스트 확장 (token-estimator, prompt-template, usage/prompt-library/persona store)

### P2 — 고급 기능
- [x] 사용량 추적 — 토큰 추정, 모델별 비용 대시보드, 설정 탭
- [x] 프롬프트 라이브러리 — CRUD, 카테고리 필터, `{{variable}}` 템플릿
- [x] 페르소나 시스템 — 5 프리셋, 커스텀 CRUD, 시스템 프롬프트 주입
- [x] 크로스 모델 토론 — 2-3 모델, 3라운드 자동 토론, 합의 요약 생성
- [x] 사용량 차트 시각화 — SVG 바차트, 일별/주별 토글, 최근 30일
- [x] PDF 채팅 — `pdfjs-dist` 텍스트 추출, 시스템 프롬프트 주입, 동적 import

### 문서 & 설계
- [x] v2-extension 25개 기능 분석 + 18개 이식 가능 기능 우선순위 분류
- [x] v2 화면 설계 MD + pwa.pen 프레임 4개 (에이전트, AI 도구, TTS/STT, 폴더/태그)
- [x] v2 구현 계획 (Phase 1~3, 14개 신규 + 19개 수정 파일)
- [x] H Chat 릴리즈 노트 분석 + 12개 적용 가능 기능 설계
- [x] H Chat 구현 계획 + pwa.pen 프레임 2개 (Thinking Depth/가드레일, 문서 검사/데이터 분석)

---

## 🟡 P1 — 남은 작업

### v2-extension 포팅 (즉시 구현)
> 📋 상세: `docs/v2-implementation-plan.md` Phase 1

- [x] TTS (음성 출력) — Web Speech API, MessageBubble에 읽기 버튼
- [x] STT (음성 입력) — Web Speech Recognition, PromptInput에 마이크 버튼
- [x] AI 대화 요약 — LLM 1회 호출, ChatHeader에서 요약 생성
- [x] 대화 포크 (Fork) — 특정 메시지에서 분기하여 새 대화 시작
- [x] ChatGPT/Claude 가져오기 확장 — 형식 자동 감지 + 변환

### H Chat 포팅 (즉시 구현)
> 📋 상세: `docs/hchat-implementation-plan.md` Phase 1

- [x] Thinking Depth 모드 — fast/balanced/deep 3단 토글
- [x] 사용량 예산 경고 — 월간 예산 설정, 70% 임계치 알림

### 내보내기 확장
- [x] AllChatsScreen에 일괄 내보내기 기능
- [x] PDF 내보내기 (jspdf 라이브러리)

### 테스트 확장
- [x] guardrail + import-chat 유닛 테스트 추가
- [x] UI 컴포넌트 테스트 (`shared/ui/` 11개) — 158 tests
- [x] Playwright E2E 설정 + 핵심 플로우 테스트 — 24 tests
- [x] 커버리지 80%+ 달성 — 83% stmts, 79% branches, 91% funcs, 82% lines

### 접근성 확장
- [x] 색상 대비 WCAG AA 검증 — text-tertiary, warning, danger, primary(dark) 수정
- [x] `eslint-plugin-jsx-a11y` 추가

---

## 🟢 P2 — 중간 우선순위

### v2-extension 포팅 (중간 복잡도)
> 📋 상세: `docs/v2-implementation-plan.md` Phase 2

- [x] 에이전트 모드 — XML tool call 파싱, 4개 도구, 다단계 실행 루프
- [x] 웹 검색 + RAG — DuckDuckGo 프록시, 검색 의도 감지, 에이전트 도구 연동
- [x] AI 도구 패널 — 글쓰기 11종 + 문법 검사 + 요약 + 문서 건강 검사

### H Chat 포팅 (중간 복잡도)
> 📋 상세: `docs/hchat-implementation-plan.md` Phase 2~3

- [x] AI 가드레일 — 민감 데이터 Regex 감지, 전송 전 경고/마스킹 (P1에서 완료)
- [x] 문서 건강 검사 — AI 도구 패널 내 통합 (맞춤법/문법/가독성/일관성 종합 분석)
- [x] ROI 측정 대시보드 — 프로바이더별/모델별 비용, 생산성 지표, 설정 > 사용량 탭
- [x] Excel/CSV 분석 — SheetJS 파싱, PromptInput 통합, AI 분석
- [x] 이미지 생성 UI — DALL-E 3 통합, Gemini Imagen 준비

### 백엔드 실행 연동
- [x] Memory — LLM 기반 자동 컨텍스트 추출 (Bedrock Haiku, /api/extract-memory)
- [x] Schedule — /api/schedule/execute 비동기 프롬프트 실행
- [x] Swarm — /api/swarm/execute 멀티에이전트 SSE 파이프라인
- [x] Channel — /api/channels/notify Slack 웹훅 + Telegram Bot API

### OpenAI/Gemini 백엔드 프록시 (보안 강화)
- [x] Modal에 `/api/openai`, `/api/gemini` 엔드포인트 추가
- [x] API 키를 Modal Secrets에 저장 — hchat-api-keys Secret, 서버 환경변수 우선순위
- [x] 클라이언트 직접 호출 → 서버 프록시로 전환 (VITE_API_BASE_URL 설정 시)

### 사용량 추적 고도화
- [x] 백엔드 SSE `usage` 이벤트에서 실제 토큰 수 수신 (Bedrock metadata)

---

## 🔵 P3 — 낮은 우선순위

### v2-extension 포팅 (대화 정리)
> 📋 상세: `docs/v2-implementation-plan.md` Phase 3

- [x] 대화 폴더 — CRUD, 컬러 코딩, 사이드바 필터링
- [x] 대화 태그 — CRUD, 컬러 태그, ChatHeader 선택기
- [x] 스토리지 관리 — IndexedDB 분석 + 설정 > Storage 탭 + 정리 기능

### 메시지 가상화
- [x] 100+ 메시지 목록에 `react-window` 적용 — v2, 50+ 메시지 시 자동 활성화
- [x] 스크롤 성능 최적화 — 동적 import, 높이 추정 heuristic

### IndexedDB 확장
- [x] Memory, Schedule, Swarm, Channel 스토어 영속성 연결 — Dexie v4, hydrate() 패턴
- [x] 데이터 백업/복원 기능 — 13개 전체 테이블 JSON 내보내기/가져오기 (v4)

### UI 폴리시
- [x] 다크 모드 세부 색상 조정 — CSS 변수 개선 (success, amber, sidebar, shadow)
- [x] 모바일 반응형 레이아웃 개선 — 사이드바 오버레이, 뒷배경, 자동 닫기
- [x] 애니메이션/트랜지션 개선 — slide-in-left, fade-backdrop
- [x] 토스트 알림 시스템 — Zustand store, 4종 타입, 자동 닫기

---

## 설계 문서 인덱스

| 문서 | 내용 |
|------|------|
| `docs/v2-feature-analysis.md` | v2-extension 25개 기능 분석, 이식 우선순위 |
| `docs/v2-screen-design.md` | v2 신규 화면 와이어프레임 (에이전트, TTS/STT, 도구, 폴더/태그) |
| `docs/v2-implementation-plan.md` | v2 Phase 1~3 구현 상세 (코드 패턴, 파일 목록, 위험 요소) |
| `docs/hchat-feature-design.md` | H Chat 12개 기능 분석 + 5개 화면 설계 |
| `docs/hchat-implementation-plan.md` | H Chat Phase 1~3 구현 상세 (코드 패턴, 파일 목록) |
| `pwa.pen` | Pencil MCP 화면 설계 — 28+ 프레임 (v2 4개 + hchat 2개 + Phase 1) |
| `docs/roadmap.md` | 향후 로드맵 (Phase 2~4: 번역, 문서작성, OCR) |
| `docs/phase2-implementation-plan.md` | Phase 2 헤더 탭 + 문서 번역 상세 구현 계획 |
| `docs/phase3-implementation-plan.md` | Phase 3 문서 작성 마법사 + OCR 상세 구현 계획 |
| `docs/phase4-implementation-plan.md` | Phase 4 기능별 사용량 추적 상세 구현 계획 |

---

## 구현 진행률

| 우선순위 | 완료 | 남은 항목 | 진행률 |
|----------|------|-----------|--------|
| P0 | 7/7 | 0 | 100% |
| P1 | 27/27 | 0 | 100% |
| P2 | 22/22 | 0 | 100% |
| P3 | 9/9 | 0 | 100% |
| 문서/설계 | 5/5 | 0 | 100% |
| **전체** | **70/70** | **0** | **100%** |

> **모든 TODO 항목 완료.** 배포: `modal deploy backend/app.py` + `vercel --prod`
> Secret 설정: `modal secret create hchat-api-keys OPENAI_API_KEY=sk-... GEMINI_API_KEY=...`

---

## ✅ Phase 1 확장 — 비서 마켓플레이스 (2026-03-03)

- [x] HomeScreen 비서 카드 그리드 리팩토링 (QuickAction 칩 → AssistantCard)
- [x] 8개 공식 비서 프리셋 (`src/shared/constants/assistants.ts`)
- [x] 8개 카테고리 필터 (전체/대화/업무/번역/분석/보고/그림/글쓰기)
- [x] 공식/내 비서 탭 토글 (페르소나 시스템 연동)
- [x] AssistantCard 컴포넌트 (`src/shared/ui/AssistantCard.tsx`)
- [x] i18n 키 28개 추가 (ko/en)
- [x] 스트리밍 커서 더블 깜박임 버그 수정
- [x] debate.store.test.ts vi import 누락 수정
- [x] 리브랜딩 완료 (H Chat 통일)
- [x] Vercel 프로덕션 배포 완료

---

## ✅ Phase 2 — 헤더 도구 탭 + 문서 번역 워크플로우

- [x] 헤더 도구 탭 구현 (업무 비서/문서 번역/문서 작성/텍스트 추출)
- [x] ViewState 확장 ('translate' | 'docWriter' | 'ocr')
- [x] TranslatePage 구현 (파일 업로드, 엔진 선택, 배치 번역)
- [x] TranslateStore Zustand 스토어 (진행률, LLM/브라우저 엔진)
- [x] translate.ts 유틸리티 (텍스트 추출, 청크 분할, LLM 호출)
- [x] i18n 키 추가 (문서 번역 관련)
- [x] 테스트 추가 (TranslatePage, TranslateStore)

---

## ✅ Phase 3 — 문서 작성 마법사 + OCR

- [x] DocWriterPage 5단계 스텝퍼 구현 (프로젝트/배경/목차/내용/다운로드)
- [x] DocWriterStore Zustand 스토어 (프로젝트, 목차, 내용)
- [x] 4가지 문서 종류 (보고서/기획서/제안서/매뉴얼)
- [x] AI 목차 생성 + 섹션별 내용 작성
- [x] OcrPage 구현 (이미지 업로드, tesseract.js, 배치 처리)
- [x] ocr.ts 유틸리티 (tesseract.js 동적 import, CDN worker)
- [x] i18n 키 추가 (문서 작성, OCR 관련)
- [x] 테스트 추가 (DocWriterPage, OcrPage)

---

## ✅ Phase 4 — 기능별 사용량 추적 + 마무리

- [x] UsageCategory 확장 (chat/translate/doc-write/ocr/image-gen/data-analysis)
- [x] 기능별 사용량 분리 추적
- [x] 설정 > 사용량 탭 카테고리 필터 UI
- [x] 기능별 비용/토큰 차트
- [x] i18n 키 검증 (누락 확인)
- [x] Phase 2-4 테스트 추가
- [x] CLAUDE.md/roadmap.md/todolist.md 업데이트
- [x] 테스트 커버리지 80%+ 유지 (854 tests, 51 suites)

---

## ✅ Phase 6 — 생산성 자동화

### 6-1. 프롬프트 체이닝 (1일)
- [x] 순차 실행 체인 정의 UI
- [x] 단계별 결과 → 다음 단계 입력 자동 연결
- [x] 조건부 분기 (IF-THEN-ELSE)
- [x] 실행 진행률 + 중간 결과 수정
- [x] 기존 프롬프트 라이브러리 연동
- [x] prompt-chain.store.ts Zustand 스토어
- [x] PromptChainPage UI (타임라인 시각화)
- [x] i18n 키 51개 추가 (ko/en)
- [x] 테스트 9개 추가

### 6-2. 지식베이스 (2일)
- [x] KnowledgeBasePage 신규 페이지
- [x] knowledge.store.ts Zustand 스토어
- [x] 문서 업로드 → 자동 청킹 (~500자 문단 기반)
- [x] 키워드 검색 (청크 내용 기반)
- [x] 태그/카테고리 분류 (4개 카테고리)
- [x] 문서 상세 뷰 (미리보기, 청크 목록)
- [x] 파일 업로드 (PDF/TXT/MD)
- [x] i18n 키 28개 추가 (ko/en)

### 6-3. 워크플로우 빌더 (3일)
- [x] WorkflowBuilderPage 신규 페이지
- [x] workflow.store.ts Zustand 스토어
- [x] 블록 기반 파이프라인 에디터 (6개 블록 타입)
- [x] 사전 정의 블록: 프롬프트, 번역, 요약, 추출, 조건분기, 출력
- [x] 트리거: 수동실행, 스케줄, 웹훅
- [x] 인라인 블록 편집기
- [x] 템플릿 갤러리 (일일보고서, 문서리뷰, 번역체인)
- [x] i18n 키 48개 추가 (ko/en)

### 6-4. 실시간 협업 채팅 (2일)
- [x] CollabRoomPage 신규 페이지
- [x] collab.store.ts Zustand 스토어
- [x] 룸 생성/참여 (초대 코드 XXX-XXXX)
- [x] 로컬 채팅 메시지 시뮬레이션
- [x] 사용자별 타이핑 표시
- [x] 권한 관리 (호스트/참여자)
- [x] i18n 키 27개 추가 (ko/en)

---

## 🔵 Phase 7 — 인텔리전스 확장 (예정)

### 7-1. 컨텍스트 매니저 (1일)
- [ ] ContextManager 위젯 (기존 메모리 스토어 확장)
- [ ] 컨텍스트 윈도우 시각화
- [ ] 중요도 기반 자동 압축
- [ ] 컨텍스트 템플릿 (코딩/글쓰기/분석)
- [ ] 핀 고정 메시지

### 7-2. AI 인사이트 대시보드 (2일)
- [ ] InsightsDashboardPage 신규 페이지
- [ ] insights.store.ts Zustand 스토어
- [ ] 프롬프트 품질 점수 (명확성, 구체성)
- [ ] 최적 모델 추천 (작업별 성능 분석)
- [ ] 비용 절감 기회 식별
- [ ] 주간/월간 리포트 자동 생성

### 7-3. 플러그인 시스템 (3일)
- [ ] 플러그인 마켓플레이스 UI
- [ ] 샌드박스 iframe + postMessage API
- [ ] API 권한 관리
- [ ] 공식 플러그인: Notion, Google Docs, Jira
- [ ] 커스텀 플러그인 SDK

### 7-4. 테마 빌더 (1일)
- [ ] ThemeBuilderPage 신규 페이지
- [ ] 실시간 테마 편집기 (CSS 변수 동적 업데이트)
- [ ] 색상/폰트/간격 커스터마이징
- [ ] 테마 내보내기/가져오기

---

## 🟣 Phase 8 — 엔터프라이즈 & 인텔리전스 (예정)

### 8-1. 배치 프로세싱 큐 (2일)
- [ ] BatchQueuePage 신규 페이지
- [ ] batch.store.ts Zustand 스토어
- [ ] BatchMonitor 위젯 (실시간 진행률)
- [ ] Modal Queue 기반 비동기 작업 큐
- [ ] 3-tier 우선순위 (high/normal/low)
- [ ] SSE 기반 진행률 스트리밍
- [ ] 사용량 예산 연동 (초과 시 저우선순위 일시정지)

### 8-2. 크로스 세션 인사이트 (2일)
- [ ] SessionInsightsPage 신규 페이지
- [ ] insights.store.ts Zustand 스토어
- [ ] LLM 기반 패턴 감지 (반복 질문, 프롬프트 패턴)
- [ ] 세션 유사도 클러스터링 (TF-IDF)
- [ ] 자동 추천: 프롬프트 템플릿화, Memory 저장 제안
- [ ] 주간/월간 사용 패턴 리포트

### 8-3. 스마트 응답 캐싱 (2일)
- [ ] cache.store.ts Zustand 스토어
- [ ] CacheControlPanel 위젯 (설정 > 캐시 탭)
- [ ] 프롬프트 정규화 + SHA-256 해싱 (완전 일치 캐시)
- [ ] Modal Volume 영속 캐시 (TTL 7일, LRU eviction)
- [ ] PromptInput 캐시 힌트 UI
- [ ] 비용 절감 효과 시각화 (UsageStore 연동)

### 8-4. 엔터프라이즈 감사 로그 (2일)
- [ ] AuditLogPage 신규 페이지
- [ ] audit.store.ts Zustand 스토어
- [ ] Event sourcing (세션/메시지/파일/설정 변경 기록)
- [ ] 날짜/액션/모델/비용 범위 필터링
- [ ] CSV/JSON 감사 리포트 내보내기 (GDPR 준수)
- [ ] 가드레일 트리거 이벤트 검색
