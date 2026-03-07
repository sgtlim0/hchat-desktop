# H Chat PWA — TODO List

> ✅ **Phase 1-23 전체 완료** (115개 기능) | Phase 21 기획 | 마지막 업데이트: 2026-03-07
> 1,632 tests, 156 suites | 100 stores, 107 pages, 67K lines

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
| 테스트 (Vitest) | ✅ 완료 — 1,440 tests, 116 suites |
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
- [x] 커버리지 80%+ 달성 (Phase 4 기준, 이후 Phase 6-9 추가로 비율 하락)

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
| P0 보안/성능 | 3/3 | 0 | 100% |
| QW 코드 품질 | 5/5 | 0 | 100% |
| Phase 14 | 5/5 | 0 | 100% |
| Phase 10 | 5/5 | 0 | 100% |
| Phase 11 | 5/5 | 0 | 100% |
| Phase 12 | 5/5 | 0 | 100% |
| Phase 13 | 5/5 | 0 | 100% |
| Phase 15 | 5/5 | 0 | 100% |
| 번들 최적화 | 2/2 | 0 | 100% |
| Phase 16 | 5/5 | 0 | 100% |
| Phase 17 | 5/5 | 0 | 100% |
| Phase 18 | 5/5 | 0 | 100% |
| Phase 19 | 5/5 | 0 | 100% |
| **전체** | **145/145** | **0** | **100%** |

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

## ✅ Phase 7 — 인텔리전스 확장

### 7-1. 컨텍스트 매니저 (1일)
- [x] context-manager.store.ts Zustand 스토어
- [x] ContextManagerPage 신규 페이지
- [x] 컨텍스트 윈도우 시각화 (토큰 사용량 프로그레스 바)
- [x] 자동 압축 토글
- [x] 컨텍스트 템플릿 (코딩/글쓰기/분석/일반)
- [x] 핀 메시지 관리

### 7-2. AI 인사이트 대시보드 (2일)
- [x] insights.store.ts Zustand 스토어
- [x] InsightsDashboardPage 신규 페이지
- [x] SessionInsightsPage 신규 페이지
- [x] 프롬프트 품질 점수 (명확성, 구체성)
- [x] 최적 모델 추천 (신뢰도, 예상 비용)
- [x] 비용 절감 기회 식별
- [x] 주간/월간 리포트 생성

### 7-3. 플러그인 시스템 (3일)
- [x] plugin.store.ts Zustand 스토어
- [x] PluginMarketplacePage 신규 페이지
- [x] 플러그인 설치/제거/활성화/비활성화
- [x] API 권한 관리
- [x] 4개 기본 플러그인 (Code Formatter, Grammar Check, Image Analyzer, Data Visualizer)
- [x] 검색 및 탭 필터 (전체/설치됨/마켓플레이스)

### 7-4. 테마 빌더 (1일)
- [x] theme.store.ts Zustand 스토어
- [x] ThemeBuilderPage 신규 페이지
- [x] 실시간 테마 편집기 (CSS 변수 동적 업데이트)
- [x] 5가지 색상 커스터마이징 (기본/배경/서피스/텍스트/테두리)
- [x] 테마 활성화/복제/삭제
- [x] 실시간 미리보기

---

## ✅ Phase 8 — 엔터프라이즈 & 인텔리전스

### 8-1. 배치 프로세싱 큐 (2일)
- [x] batch.store.ts Zustand 스토어
- [x] BatchQueuePage 신규 페이지
- [x] 3-tier 우선순위 (high/normal/low)
- [x] 진행률 추적 (프로그레스 바)
- [x] 일시정지/재개/취소 제어
- [x] 새 작업 모달 (제목/유형/우선순위/모델/입력)

### 8-2. 크로스 세션 인사이트 (2일)
- [x] SessionInsightsPage 신규 페이지 (insights.store.ts 공유)
- [x] 세션 유사도 클러스터링
- [x] 반복 패턴 감지 (빈도, 제안)
- [x] 자동 추천: 템플릿화/메모리 저장/최적화

### 8-3. 스마트 응답 캐싱 (2일)
- [x] cache.store.ts Zustand 스토어
- [x] CacheControlPage 신규 페이지
- [x] 프롬프트 해시 기반 캐시
- [x] TTL 설정 (1-90일)
- [x] 히트 카운트 추적
- [x] 비용/토큰 절감 시각화

### 8-4. 엔터프라이즈 감사 로그 (2일)
- [x] audit.store.ts Zustand 스토어 + 테스트 8개
- [x] AuditLogPage 신규 페이지
- [x] 10가지 액션 타입 기록 (세션/메시지/파일/설정/내보내기/가져오기/가드레일/모델/API)
- [x] 날짜/액션/검색 필터링
- [x] CSV/JSON 감사 리포트 내보내기
- [x] 일괄 삭제 (확인 대화 상자)

---

## ✅ Phase 9 — 스마트 UX & 멀티모달 확장

### 9-1. AI 대시보드 홈 (2일)
- [x] DashboardPage 신규 페이지 (HomeScreen 리팩토링)
- [x] dashboard.store.ts Zustand 스토어
- [x] 위젯 그리드 시스템 (드래그 리사이즈, 순서 변경)
- [x] 위젯 6종: 최근 대화, 사용량 요약, 빠른 비서, 지식베이스 요약, 일정, 즐겨찾기
- [x] 대시보드 레이아웃 localStorage 영속
- [x] i18n 키 추가 (ko/en)

### 9-2. 멀티모달 채팅 확장 (2일)
- [x] 이미지 입력 — Claude Vision, GPT-4o Vision 연동
- [x] 카메라 캡처 — getUserMedia + 촬영 → 분석
- [x] 오디오 입력 — Whisper API 연동 (음성 파일 → 텍스트)
- [x] 파일 드래그앤드롭 개선 — 전역 드롭존, 미리보기 썸네일
- [x] 멀티모달 메시지 렌더러 (이미지/오디오/PDF 인라인 표시)

### 9-3. 대화 분석 & 태그 자동화 (1일)
- [x] AI 자동 태깅 — 대화 종료 시 LLM으로 태그 자동 추천
- [x] 대화 감정 분석 — 긍정/부정/중립 색상 표시
- [x] 스마트 제목 생성 — 첫 3회 메시지 기반 세션 제목 자동 생성
- [x] 대화 유사도 추천 — "비슷한 대화" 사이드바 표시

### 9-4. 고급 프롬프트 에디터 (2일)
- [x] AdvancedPromptEditor 위젯 (PromptInput 대체/확장)
- [x] 멀티라인 확장 에디터 (Shift+Enter → 풀스크린)
- [x] 변수 자동완성 (`{{` 입력 시 변수 팝업)
- [x] 프롬프트 히스토리 (↑/↓ 이전 프롬프트 탐색)
- [x] 프롬프트 스니펫 (/ 커맨드 → 라이브러리 삽입)
- [x] 마크다운 미리보기 토글

### 9-5. 팀 워크스페이스 (3일)
- [x] WorkspacePage 신규 페이지
- [x] workspace.store.ts Zustand 스토어
- [x] 워크스페이스 생성/참여 (이름, 아바타, 역할)
- [x] 공유 프롬프트 라이브러리 (팀 공용 템플릿)
- [x] 공유 지식베이스 (팀 문서 공유)
- [x] 멤버 관리 (관리자/편집자/뷰어 3단 권한)
- [x] 활동 피드 (최근 팀 활동 타임라인)

---

## ✅ P0 보안 & 성능 개선 (2026-03-05)

### 자격증명 암호화
- [x] `shared/lib/crypto.ts` — Web Crypto API (AES-GCM 256-bit)
- [x] 암호화 키 IndexedDB 저장 (localStorage 분리)
- [x] `settings.store.ts` — 자격증명 저장/로드 async 전환
- [x] `decryptWithMigration()` — 평문→암호화 자동 마이그레이션
- [x] Web Crypto 미지원 환경 base64 폴백

### SSE 스트리밍 쓰로틀
- [x] `shared/lib/stream-throttle.ts` — rAF 기반 쓰로틀 (~60fps)
- [x] `PromptInput.tsx` — throttle.update/flush 적용
- [x] 100+/sec SSE → ~60fps UI 업데이트 최적화

### 0% 커버리지 파일 테스트 추가
- [x] `search-intent.test.ts` — 7 tests (키워드/정규식 검색 의도 감지)
- [x] `web-search.test.ts` — 7 tests (DuckDuckGo fetch + formatSearchResults)
- [x] `stream-throttle.test.ts` — 6 tests (rAF 배칭, flush, cancel)
- [x] `parser.test.ts` — 8 tests (XML 도구 호출 파싱/스트리핑)
- [x] `tools.test.ts` — 11 tests (에이전트 도구: calculate, datetime, web_search, fetch_url)
- [x] `proxy-sse.test.ts` — 8 tests (SSE 파서: text, error, usage, chunked, malformed)
- [x] `ToastContainer.test.tsx` — 5 tests (토스트 UI: 렌더링, 색상, 닫기)
- [x] 테스트 54개 추가 (919 → 973 tests, 56 → 63 suites)

---

## ✅ Phase 10 — AI 네이티브 & 모바일 퍼스트 (2026-03-07)

### 10-1. MCP 서버 통합 (2일)
- [x] mcp.store.ts — 서버 CRUD, 연결/해제, 도구 동적 로드
- [x] McpServersPage — 서버 목록, 상세 패널, 도구 표시
- [x] 테스트 9개 추가

### 10-2. AI 에이전트 자율 실행 (3일)
- [x] autonomous-agent.store.ts — ReAct 패턴, 실행 트리, 일시정지/재개
- [x] AutonomousAgentPage — 목표 입력, 실행 트리 시각화, 승인 게이트
- [x] 테스트 10개 추가

### 10-3. 모바일 네이티브 UX (2일)
- [x] mobile-ux.store.ts — 바텀 네비, 풀스크린 채팅, 스와이프 설정

### 10-4. 실시간 데이터 커넥터 (2일)
- [x] data-connector.store.ts — Google Sheets/Notion/GitHub 커넥터 CRUD
- [x] DataConnectorsPage — 커넥터 카드 그리드, 동기화
- [x] 테스트 8개 추가

### 10-5. AI 코드 인터프리터 (3일)
- [x] code-interpreter.store.ts — 노트북/셀 CRUD, JS 실행, Pyodide 준비
- [x] CodeInterpreterPage — Jupyter 스타일 노트북 UI
- [x] 테스트 12개 추가

---

## 🟤 Phase 11 — AI 고도화 & 데이터 인텔리전스 (예정)

### 11-1. AI 멘토링 시스템 (2일)
- [ ] MentoringPage 신규 페이지
- [ ] mentoring.store.ts Zustand 스토어
- [ ] 학습 목표 설정 (주제, 난이도, 기간)
- [ ] AI 튜터 대화 — 소크라테스식 질문, 힌트 제공, 단계적 설명
- [ ] 학습 진행률 추적 (퀴즈, 이해도 체크)
- [ ] 학습 리포트 생성 (강점/약점 분석)
- [ ] i18n 키 추가 (ko/en)

### 11-2. 데이터 파이프라인 빌더 (3일)
- [ ] DataPipelinePage 신규 페이지
- [ ] data-pipeline.store.ts Zustand 스토어
- [ ] 데이터 소스 연결 (CSV/JSON/API/DB)
- [ ] 변환 블록 (필터/정렬/집계/피벗/조인)
- [ ] AI 자동 변환 제안 (데이터 구조 분석 → 변환 추천)
- [ ] 실시간 데이터 미리보기 (테이블/차트)
- [ ] 파이프라인 스케줄링 (자동 실행)
- [ ] i18n 키 추가 (ko/en)

### 11-3. AI 코드 리뷰어 (2일)
- [ ] CodeReviewPage 신규 페이지
- [ ] code-review.store.ts Zustand 스토어
- [ ] 코드 붙여넣기 / 파일 업로드
- [ ] 다중 관점 리뷰 (보안/성능/가독성/베스트프랙티스)
- [ ] 인라인 코멘트 + 수정 제안
- [ ] 리뷰 히스토리 및 개선 추적
- [ ] i18n 키 추가 (ko/en)

### 11-4. 스마트 알림 센터 (1일)
- [ ] NotificationCenterPage 신규 페이지
- [ ] notification.store.ts Zustand 스토어
- [ ] 알림 카테고리 (스케줄/워크플로우/협업/시스템)
- [ ] 알림 규칙 설정 (임계치, 트리거 조건)
- [ ] 알림 히스토리 + 읽음/안읽음 관리
- [ ] 브라우저 Push Notification 연동
- [ ] i18n 키 추가 (ko/en)

### 11-5. 비주얼 프롬프트 빌더 (2일)
- [ ] VisualPromptBuilderPage 신규 페이지
- [ ] visual-prompt.store.ts Zustand 스토어
- [ ] 드래그앤드롭 프롬프트 블록 (지시/컨텍스트/제약/출력형식)
- [ ] 블록 연결 → 프롬프트 자동 생성
- [ ] 프롬프트 품질 점수 실시간 표시
- [ ] 템플릿 저장/공유
- [ ] i18n 키 추가 (ko/en)

---

## ✅ Phase 12 — 고급 자동화 & 분석 인텔리전스 (2026-03-07)

- [x] AI 회의록 (meeting-notes.store + MeetingNotesPage, 8 tests)
- [x] 스마트 보고서 (report-generator.store + ReportGeneratorPage, 6 tests)
- [x] AI 학습 경로 (learning-path.store + LearningPathPage, 7 tests)
- [x] 북마크 & 하이라이트 (bookmark.store + BookmarkPage, 8 tests)
- [x] 번역 메모리 (translation-memory.store + TranslationMemoryPage, 8 tests)

---

## ✅ Phase 13 — 커뮤니케이션 & 크리에이티브 AI (2026-03-07)

- [x] AI 프레젠테이션 (presentation.store + PresentationPage, 7 tests)
- [x] 스마트 요약 피드 (summary-feed.store + SummaryFeedPage, 6 tests)
- [x] AI 이메일 어시스턴트 (email-assistant.store + EmailAssistantPage, 6 tests)
- [x] 대화 타임라인 (conversation-timeline.store + ConversationTimelinePage, 6 tests)
- [x] AI 마인드맵 (mindmap.store + MindMapPage, 7 tests)

---

## ✅ Phase 16 — AI 에이전시 & 인터랙티브 인텔리전스 (2026-03-07)

- [x] AI 페어 프로그래밍 (pair-programming.store + PairProgrammingPage, 8 tests)
- [x] 스마트 대시보드 빌더 (dashboard-builder.store + DashboardBuilderPage, 8 tests)
- [x] AI 문서 비교 (doc-compare.store + DocComparePage, 7 tests)
- [x] 멀티에이전트 디베이트 (multi-agent-debate.store + MultiAgentDebatePage, 9 tests)
- [x] AI 포트폴리오 (portfolio.store + PortfolioPage, 7 tests)

---

## ✅ Phase 17 — AI 하이퍼 인텔리전스 & 이머시브 경험 (2026-03-07)

> 몰입형 AI 경험 — 실시간 번역 통화, 문서 OCR 분석, 게임화 학습, 데이터 스토리텔링, 감정 웰빙

### 17-1. AI 실시간 번역 통화 (3일)
- [x] LiveTranslatePage 신규 페이지
- [ ] live-translate.store.ts Zustand 스토어
- [ ] 양방향 실시간 음성 번역 (STT → 번역 → TTS 파이프라인)
- [ ] 다국어 회의 모드 (최대 4개 언어 동시 지원)
- [ ] 실시간 자막 오버레이 (원문 + 번역문 동시 표시)
- [ ] 번역 품질 신뢰도 표시 (높음/중간/낮음)
- [ ] 통화 녹음 + 다국어 트랜스크립트 자동 생성
- [ ] 전문 용어 사전 연동 (번역 메모리 활용)
- [ ] i18n 키 추가 (ko/en)

### 17-2. 스마트 문서 OCR 분석기 (2일)
- [ ] DocAnalyzerPage 신규 페이지
- [ ] doc-analyzer.store.ts Zustand 스토어
- [ ] 영수증/인보이스 자동 인식 → 구조화 데이터 추출 (금액, 날짜, 항목)
- [ ] 계약서/법률 문서 AI 분석 (핵심 조항, 위험 조항 하이라이트)
- [ ] 명함 OCR → 연락처 자동 생성 (이름/회사/이메일/전화)
- [ ] 표/차트 이미지 → 데이터 테이블 자동 변환
- [ ] 배치 처리 (여러 문서 동시 분석)
- [ ] i18n 키 추가 (ko/en)

### 17-3. AI 게임화 학습 시스템 (3일)
- [ ] GamifiedLearningPage 신규 페이지
- [ ] gamified-learning.store.ts Zustand 스토어
- [ ] AI 퀴즈 배틀 (사용자 vs AI, 실시간 점수 경쟁)
- [ ] 학습 스트릭 & 레벨 시스템 (XP, 레벨업, 배지)
- [ ] 일일 챌린지 (AI가 매일 새로운 문제 생성)
- [ ] 리더보드 (로컬 기록 기반 순위)
- [ ] 학습 카드 (플래시카드 자동 생성, 간격 반복)
- [ ] 주제별 스킬 트리 (시각적 진행 맵)
- [ ] i18n 키 추가 (ko/en)

### 17-4. 인터랙티브 데이터 스토리텔링 (2일)
- [ ] DataStoryPage 신규 페이지
- [ ] data-story.store.ts Zustand 스토어
- [ ] 데이터 → AI 내러티브 자동 생성 ("이 데이터가 말하는 것은...")
- [ ] 스크롤 기반 인터랙티브 차트 (스크롤에 따라 차트 애니메이션)
- [ ] 핵심 인사이트 자동 추출 + 카드 뷰
- [ ] 공유 가능한 스토리 링크 생성 (HTML 내보내기)
- [ ] 데이터 소스: CSV/JSON 업로드 + 기존 사용량 데이터
- [ ] i18n 키 추가 (ko/en)

### 17-5. AI 감정 일기 & 웰빙 트래커 (2일)
- [ ] WellbeingPage 신규 페이지
- [ ] wellbeing.store.ts Zustand 스토어
- [ ] 대화 감정 패턴 자동 분석 (일별/주별 감정 그래프)
- [ ] AI 감정 일기 — 하루 대화 요약 + 감정 리플렉션
- [ ] 주간 웰빙 리포트 (스트레스 지수, 생산성 점수, 감정 트렌드)
- [ ] 마인드풀니스 제안 (감정 패턴 기반 맞춤 조언)
- [ ] 무드 보드 (시각적 감정 캘린더)
- [ ] 프라이버시 보호 — 모든 데이터 로컬 저장
- [ ] i18n 키 추가 (ko/en)

---

## ✅ Phase 18 — AI 크리에이티브 스튜디오 & 라이프 인텔리전스 (2026-03-07)

> 크리에이티브 도구 + 라이프스타일 AI — 화이트보드, 계약서, 사운드, 튜토리얼, 습관 코칭

### 18-1. AI 화이트보드 협업 (3일)
- [x] WhiteboardPage + whiteboard.store.ts
- [x] Canvas API 드로잉 (펜/형상/텍스트/스티커)
- [x] AI 스케치→도형 자동 정돈, 보드 템플릿
- [x] 다중 사용자 협업, SVG/PNG 내보내기

### 18-2. 스마트 계약서 생성기 (2일)
- [x] ContractPage + contract.store.ts
- [x] AI 법률 문서 초안 (NDA/고용/서비스/임대)
- [x] 조항 템플릿 + 위험 조항 자동 감지
- [x] PDF/DOCX 내보내기

### 18-3. AI 사운드스케이프 (2일)
- [x] SoundscapePage + soundscape.store.ts
- [x] 집중/휴식 배경음 (자연음/로파이/화이트노이즈)
- [x] 포모도로 타이머 (25분/5분), 볼륨 믹서
- [x] 집중 시간 통계

### 18-4. 인터랙티브 튜토리얼 빌더 (2일)
- [x] TutorialBuilderPage + tutorial.store.ts
- [x] 단계별 가이드 + 스크린샷 어노테이션
- [x] AI 설명 자동 생성, HTML 내보내기

### 18-5. AI 습관 트래커 & 코치 (2일)
- [x] HabitTrackerPage + habit.store.ts
- [x] 습관 CRUD, 스트릭 추적, 일일 체크인
- [x] AI 동기부여 메시지, 주간 리포트
- [x] GitHub 스타일 히트맵 캘린더

---

## ✅ Phase 19 — AI 유니버설 어시스턴트 & 스마트 라이프 (2026-03-07)

> 생활 밀착형 AI — 여행, 식단, 면접, 재무, 독서

### 19-1. AI 여행 플래너 (3일)
- [x] TravelPlannerPage + travel.store.ts
- [x] 여행 일정 자동 생성 (출발/도착, 기간, 예산)
- [x] 일자별 스케줄 (장소, 시간, 이동 수단)
- [x] 예산 자동 계산 (교통/숙박/식비/관광)
- [x] 날씨/환율 정보 통합

### 19-2. 스마트 레시피 & 식단 (2일)
- [x] RecipePage + recipe.store.ts
- [x] AI 레시피 추천 (재료 기반)
- [x] 영양 분석 (칼로리/단백질/탄수화물)
- [x] 주간 식단 플래너, 장보기 목록 자동 생성

### 19-3. AI 인터뷰 코치 (2일)
- [x] InterviewCoachPage + interview.store.ts
- [x] 직무별 모의 면접 (AI 면접관)
- [x] 답변 분석 + 피드백 리포트
- [x] 질문 은행 (기술/행동/상황 분류)

### 19-4. 개인 재무 대시보드 (2일)
- [x] FinancePage + finance.store.ts
- [x] 수입/지출 트래커 (카테고리별)
- [x] 예산 관리 + AI 절약 제안
- [x] 차트 시각화 (월별 추이, 카테고리 비율)

### 19-5. AI 독서 노트 (2일)
- [x] ReadingNotePage + reading.store.ts
- [x] 책 정보 관리 (제목/저자/장르)
- [x] AI 요약 + 인용구 수집
- [x] 독서 통계 (월별 권수, 장르별 비율)

---

## 🟣 Phase 20 — AI 슈퍼 프로덕티비티 & 소셜 인텔리전스 (예정)

> 생산성 극대화 + 소셜 AI — OKR, CRM, 저널, 소셜 미디어, 프로젝트 타임라인

### 20-1. AI OKR 트래커 (2일)
- [ ] OkrPage + okr.store.ts
- [x] 목표(Objective) + 핵심결과(Key Result) CRUD
- [x] 진행률 자동 추적 (0-100%)
- [x] AI 달성 전략 제안, 분기별 리뷰

### 20-2. 스마트 CRM (3일)
- [x] CrmPage + crm.store.ts
- [x] 연락처 CRUD (이름/회사/이메일/전화/태그)
- [x] 상호작용 기록 (미팅/이메일/전화 로그)
- [x] AI 팔로우업 제안, 관계 점수 계산

### 20-3. AI 일기 & 저널 (2일)
- [x] JournalPage + journal.store.ts
- [x] 매일 AI 질문 (성찰/감사/목표)
- [x] 감정 분석 + 성장 추적 그래프
- [x] 감사 일기 + 3가지 좋은 일 패턴

### 20-4. 소셜 미디어 도우미 (2일)
- [x] SocialMediaPage + social-media.store.ts
- [x] 게시물 초안 생성 (LinkedIn/Twitter/Instagram)
- [x] 해시태그 추천, 톤 조절 (전문/캐주얼/유머)
- [x] 최적 게시 시간 제안

### 20-5. AI 프로젝트 타임라인 (3일)
- [x] ProjectTimelinePage + project-timeline.store.ts
- [x] 간트 차트 (SVG 기반)
- [x] 마일스톤 + 의존성 관리
- [x] AI 일정 최적화 (병목 감지, 리소스 배분)

---

## ✅ Phase 21 — AI 엔터프라이즈 플랫폼 & 차세대 협업 (2026-03-07)

> 엔터프라이즈 협업 + 차세대 AI 경험 — 화상회의, API 마켓, 지식 위키, 코드 놀이터, 보이스 클론

### 21-1. AI 화상회의 어시스턴트 (3일)
- [ ] VideoMeetingPage + video-meeting.store.ts
- [ ] 실시간 회의 트랜스크립트 (Web Speech API)
- [ ] AI 실시간 요약 (발언자별 키포인트)
- [ ] 액션 아이템 자동 추출 + 슬랙 전송
- [ ] 회의 녹화 → AI 하이라이트 클립 생성

### 21-2. AI API 마켓플레이스 (3일)
- [ ] ApiMarketplacePage + api-marketplace.store.ts
- [ ] 서드파티 AI 모델 마켓 (Hugging Face, Replicate 연동)
- [ ] 모델 벤치마크 비교 (속도/품질/비용)
- [ ] 원클릭 모델 전환, 커스텀 모델 엔드포인트 등록

### 21-3. AI 지식 위키 (2일)
- [ ] WikiPage + wiki.store.ts
- [ ] 위키 페이지 CRUD (마크다운, 링크, 카테고리)
- [ ] AI 자동 크로스 링크 (관련 페이지 자동 연결)
- [ ] 버전 히스토리 + diff 비교
- [ ] 전문 검색 (전체 텍스트 + 태그)

### 21-4. AI 코드 놀이터 (2일)
- [ ] CodePlaygroundPage + playground.store.ts
- [ ] 멀티탭 코드 에디터 (HTML/CSS/JS 분리)
- [ ] 실시간 미리보기 (sandboxed iframe)
- [ ] AI 코드 자동 완성 + 에러 수정
- [ ] 스니펫 공유 링크 생성

### 21-5. AI 보이스 클론 & 나레이션 (2일)
- [ ] VoiceClonePage + voice-clone.store.ts
- [ ] 텍스트 → 커스텀 보이스 나레이션 (Web Speech + 피치/속도 조절)
- [ ] 프리셋 보이스 캐릭터 (뉴스앵커/교수/내레이터/DJ)
- [ ] 오디오 내보내기 (WAV)
- [ ] 팟캐스트 스타일 대화 생성 (2인 보이스)

---


## ✅ Phase 22 — AI 메타버스 & 차세대 경험 (2026-03-07)

> 몰입형 AI 경험 — AR 공간, 게임 엔진, 감정 아바타, 3D 시각화, AI 오케스트라

### 22-1. AI 가상 공간 디자이너 (3일)
- [ ] VirtualSpacePage + virtual-space.store.ts
- [ ] 3D 공간 레이아웃 편집 (그리드 기반, 가구/오브젝트 배치)
- [ ] AI 인테리어 제안 (스타일/색상/배치 자동 추천)
- [ ] 공간 템플릿 (사무실/카페/갤러리/교실)
- [ ] 3D 뷰어 (CSS 3D transforms, 회전/줌)

### 22-2. AI 게임 시나리오 엔진 (3일)
- [ ] GameScenarioPage + game-scenario.store.ts
- [ ] 인터랙티브 텍스트 어드벤처 (선택지 기반 분기)
- [ ] AI 스토리 자동 생성 (장르/배경/캐릭터 설정)
- [ ] 캐릭터 대화 시스템 (NPC AI 대화)
- [ ] 세이브/로드 시스템, 복수 엔딩

### 22-3. AI 감정 아바타 (2일)
- [ ] EmotionAvatarPage + emotion-avatar.store.ts
- [ ] SVG 기반 아바타 생성 (표정/헤어/의상 커스터마이징)
- [ ] 대화 감정에 따른 실시간 표정 변화
- [ ] 아바타 프리셋 (기쁨/슬픔/분노/놀람/중립)
- [ ] 아바타 PNG 내보내기

### 22-4. AI 3D 데이터 시각화 (2일)
- [ ] Data3DPage + data-3d.store.ts
- [ ] 3D 바차트/파이차트/산점도 (CSS 3D)
- [ ] 데이터 소스 연결 (CSV/JSON)
- [ ] 회전/줌 인터랙션
- [ ] 스크린샷 내보내기

### 22-5. AI 오케스트라 (2일)
- [ ] OrchestraPage + orchestra.store.ts
- [ ] 멀티 AI 에이전트 협업 오케스트레이션
- [ ] 에이전트 역할 배정 (리서처/작가/편집자/검토자)
- [ ] 파이프라인 실행 시각화 (노드 그래프)
- [ ] 결과 병합 + 품질 투표

---


## ✅ Phase 23 — AI 유니버스 & 초지능 경험 (2026-03-07)

> 초지능 AI 경험 — 디지털 트윈, AI 작곡, 드림 시뮬레이터, 양자 시각화, AI 철학자

### 23-1. AI 디지털 트윈 (3일)
- [ ] DigitalTwinPage + digital-twin.store.ts
- [ ] 사용자 행동 패턴 학습 (대화 스타일, 선호도, 습관)
- [ ] AI 분신이 대신 응답 (부재 시 자동 답변)
- [ ] 성격 파라미터 조절 (창의성/정확성/유머 슬라이더)
- [ ] 트윈 학습 히스토리 + 정확도 피드백

### 23-2. AI 작곡 & 사운드 디자인 (2일)
- [ ] MusicComposerPage + music-composer.store.ts
- [ ] 텍스트→멜로디 생성 (분위기/템포/장르 설정)
- [ ] 코드 진행 자동 생성 (C-Am-F-G 스타일)
- [ ] 비트 패턴 에디터 (드럼 시퀀서 그리드)
- [ ] MIDI 미리보기 (Web Audio API)

### 23-3. AI 드림 시뮬레이터 (2일)
- [ ] DreamSimPage + dream-sim.store.ts
- [ ] 시나리오 기반 사고 실험 ("만약 ~라면" 시뮬레이션)
- [ ] 평행 우주 분기 트리 시각화
- [ ] AI 결과 예측 + 확률 분석
- [ ] 인터랙티브 선택지 네비게이션

### 23-4. AI 양자 데이터 시각화 (2일)
- [ ] QuantumVizPage + quantum-viz.store.ts
- [ ] 고차원 데이터 → 2D/3D 투영 (t-SNE 스타일)
- [ ] 클러스터 자동 감지 + 라벨링
- [ ] 시간축 애니메이션 (데이터 변화 과정)
- [ ] 인터랙티브 탐색 (호버/클릭/필터)

### 23-5. AI 철학자 & 소크라테스 대화 (2일)
- [ ] PhilosopherPage + philosopher.store.ts
- [ ] 소크라테스식 대화 (질문으로 사고 유도)
- [ ] 논증 구조 시각화 (전제→결론 트리)
- [ ] 사고 실험 라이브러리 (트롤리 문제, 동굴 비유 등)
- [ ] 토론 기록 + 사고 성장 추적

---

## 🔶 Quick Wins — 코드 품질 & 인프라 (예정)

> Phase 기능과 별도로 진행 가능한 기술 부채 해소 및 인프라 개선 항목

### QW-1. 테스트 커버리지 복원 (2일)
- [x] Phase 6-9 추가 페이지 테스트 (PromptChainPage, KnowledgeBasePage 등) — 12개 스토어 + 6개 페이지 테스트 추가
- [x] Phase 7-8 스토어 테스트 (plugin, theme, batch, cache, context-manager)
- [x] 위젯 테스트 확장 (ArtifactPanel, MultimodalInput, AdvancedPromptEditor)
- [x] 커버리지 목표: 54% → 76.49% 달성

### QW-2. Zustand useShallow 최적화 (0.5일)
- [x] 모든 스토어 훅 호출에 `useShallow` 적용 (불필요 리렌더링 방지) — 20+ 파일 적용
- [x] 성능 병목 컴포넌트 식별 및 우선 적용 (MessageList, Sidebar)

### QW-3. 번들 크기 최적화 (1일)
- [ ] Mermaid dynamic import 개선 (트리 쉐이킹)
- [ ] react-syntax-highlighter 경량 빌드 전환
- [ ] 미사용 i18n 키 정리
- [ ] Lighthouse PWA 성능 점수 90+ 달성

### QW-4. E2E 테스트 확장 (1일)
- [ ] 문서 번역 워크플로우 E2E
- [ ] 에이전트 모드 E2E
- [ ] 그룹 채팅 E2E
- [ ] Playwright E2E: 24 → 40+ tests

### QW-5. 에러 바운더리 & 모니터링 (0.5일)
- [x] React Error Boundary 최상위 적용 — ErrorBoundary.tsx + MainLayout 적용
- [x] 페이지별 Suspense fallback 개선
- [x] 콘솔 에러 로깅 → Toast 알림 전환
- [x] 네트워크 에러 재시도 로직 통합

---

## ✅ Phase 14 — 개발자 도구 & 코드 지원 (2026-03-06)

### 14-1. 코드 스니펫 매니저 (1일)
- [x] snippet.store.ts — 코드 조각 CRUD, 언어/태그별 분류
- [x] SnippetPage.tsx — 스니펫 목록/검색/편집 UI
- [x] 구문 강조 미리보기 + ViewState `snippets` 추가
- [x] 테스트 17개 추가

### 14-2. API 테스터 (2일)
- [x] api-tester.store.ts — 요청 히스토리, 컬렉션 관리
- [x] ApiTesterPage.tsx — REST API 요청 빌더 (method/URL/headers/body)
- [x] 응답 뷰어 (JSON 포맷팅, 상태 코드) + ViewState `apiTester` 추가
- [x] 테스트 21개 추가

### 14-3. 정규표현식 빌더 (1일)
- [x] regex-builder.store.ts — 패턴 저장/히스토리
- [x] RegexBuilderPage.tsx — AI 정규식 생성 + 실시간 매칭 테스트
- [x] 매칭 그룹 시각화 + ViewState `regexBuilder` 추가
- [x] 테스트 25개 추가

### 14-4. 데이터 변환기 (1일)
- [x] data-converter.store.ts — 변환 히스토리, 스키마 저장
- [x] DataConverterPage.tsx — JSON ↔ YAML 변환, diff, AI 스키마 추론
- [x] ViewState `dataConverter` 추가
- [x] 테스트 22개 추가

### 14-5. 다이어그램 에디터 (2일)
- [x] diagram-editor.store.ts — 다이어그램 CRUD, 템플릿
- [x] DiagramEditorPage.tsx — Mermaid 실시간 편집 + 미리보기
- [x] AI 다이어그램 생성, SVG/PNG 내보내기 + ViewState `diagramEditor` 추가
- [x] 테스트 20개 추가

---

## ✅ 번들 최적화 (2026-03-06)

- [x] .gitignore에 `.env*` 추가 (시크릿 커밋 방지)
- [x] vite.config.ts 함수 기반 `manualChunks` — 5개 vendor 청크 분리
  - vendor-react (193KB), vendor-markdown (160KB lazy), vendor-syntax (624KB lazy)
  - vendor-icons (594KB), vendor-state (96KB)
- [x] ChatPage **651KB → 27KB** (-96%) — react-syntax-highlighter lazy 분리
- [x] index **500KB → 222KB** (-56%) — React/Zustand/Dexie 별도 청크

---

## ✅ Phase 15 — AI 인텔리전스 허브 & 차세대 UX (2026-03-06)

### 15-1. AI 음성 대화 모드 (2일)
- [x] voice-chat.store.ts Zustand 스토어
- [x] VoiceChatPage — Whisper STT → LLM → TTS 파이프라인
- [x] 핸즈프리 UX, 자동 듣기, 언어 전환 (ko/en)
- [x] 테스트 9개 추가

### 15-2. 스마트 지식 그래프 (3일)
- [x] knowledge-graph.store.ts Zustand 스토어
- [x] KnowledgeGraphPage — Cytoscape.js 인터랙티브 노드 맵
- [x] 노드/엣지 CRUD, 타입별 필터, 검색, 상세 패널
- [x] 테스트 9개 추가

### 15-3. AI 코파일럿 모드 (2일)
- [x] copilot.store.ts Zustand 스토어
- [x] CopilotPanel 글로벌 플로팅 위젯 (우하단)
- [x] `Cmd/Ctrl+J` 단축키, 미니/풀 모드, 컨텍스트 자동 감지
- [x] 테스트 12개 추가

### 15-4. 멀티모달 캔버스 (3일)
- [x] canvas.store.ts Zustand 스토어
- [x] CanvasPage — 무한 캔버스 (팬/줌/transform matrix)
- [x] 6종 노드(텍스트/코드/이미지/다이어그램/채팅/링크), 드래그 배치, 연결선
- [x] 테스트 12개 추가

### 15-5. AI 자동 워크플로우 (2일)
- [x] auto-workflow.store.ts Zustand 스토어
- [x] AutoWorkflowPage — 패턴 감지, 수락/무시, 절감 대시보드
- [x] 반복 프롬프트 자동 분석, 워크플로우 제안
- [x] 테스트 11개 추가
