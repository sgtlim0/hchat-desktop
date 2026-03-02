# H Chat PWA — TODO List

> 마지막 업데이트: 2026-03-02

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
| 테스트 (Vitest) | ✅ 완료 — 231 tests, 16 suites |
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
| Works AI 분석 | ✅ 완료 — 기능 분석, 화면 설계, 구현 계획 |

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
- [x] Works AI 릴리즈 노트 분석 + 12개 적용 가능 기능 설계
- [x] Works AI 구현 계획 + pwa.pen 프레임 2개 (Thinking Depth/가드레일, 문서 검사/데이터 분석)

---

## 🟡 P1 — 남은 작업

### v2-extension 포팅 (즉시 구현)
> 📋 상세: `docs/v2-implementation-plan.md` Phase 1

- [x] TTS (음성 출력) — Web Speech API, MessageBubble에 읽기 버튼
- [x] STT (음성 입력) — Web Speech Recognition, PromptInput에 마이크 버튼
- [x] AI 대화 요약 — LLM 1회 호출, ChatHeader에서 요약 생성
- [x] 대화 포크 (Fork) — 특정 메시지에서 분기하여 새 대화 시작
- [x] ChatGPT/Claude 가져오기 확장 — 형식 자동 감지 + 변환

### Works AI 포팅 (즉시 구현)
> 📋 상세: `docs/wrks-implementation-plan.md` Phase 1

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
- [ ] 웹 검색 + RAG — DuckDuckGo 프록시, 검색 의도 감지, 컨텍스트 주입
- [x] AI 도구 패널 — 글쓰기 11종 + 문법 검사 + 요약 + 문서 건강 검사

### Works AI 포팅 (중간 복잡도)
> 📋 상세: `docs/wrks-implementation-plan.md` Phase 2~3

- [x] AI 가드레일 — 민감 데이터 Regex 감지, 전송 전 경고/마스킹 (P1에서 완료)
- [x] 문서 건강 검사 — AI 도구 패널 내 통합 (맞춤법/문법/가독성/일관성 종합 분석)
- [x] ROI 측정 대시보드 — 프로바이더별/모델별 비용, 생산성 지표, 설정 > 사용량 탭
- [x] Excel/CSV 분석 — SheetJS 파싱, PromptInput 통합, AI 분석
- [x] 이미지 생성 UI — DALL-E 3 통합, Gemini Imagen 준비

### 백엔드 실행 연동
- [ ] Memory — LLM 기반 자동 컨텍스트 추출
- [ ] Schedule — 실제 cron 실행 (Modal scheduled function)
- [ ] Swarm — 다중 에이전트 오케스트레이션 실행
- [ ] Channel — Slack/Telegram 실제 웹훅 연동

### OpenAI/Gemini 백엔드 프록시 (보안 강화)
- [ ] Modal에 `/api/openai`, `/api/gemini` 엔드포인트 추가
- [ ] API 키를 Modal Secrets에 저장
- [ ] 클라이언트 직접 호출 → 서버 프록시로 전환

### 사용량 추적 고도화
- [ ] 백엔드 SSE `usage` 이벤트에서 실제 토큰 수 수신 (현재 추정치)

---

## 🔵 P3 — 낮은 우선순위

### v2-extension 포팅 (대화 정리)
> 📋 상세: `docs/v2-implementation-plan.md` Phase 3

- [x] 대화 폴더 — CRUD, 컬러 코딩, 사이드바 필터링
- [x] 대화 태그 — CRUD, 컬러 태그, ChatHeader 선택기
- [x] 스토리지 관리 — IndexedDB 분석 + 설정 > Storage 탭 + 정리 기능

### 메시지 가상화
- [ ] 100+ 메시지 목록에 `react-window` 적용
- [ ] 스크롤 성능 최적화

### IndexedDB 확장
- [ ] Memory, Schedule, Swarm, Channel 스토어 영속성 연결
- [x] 데이터 백업/복원 기능 — JSON 내보내기/가져오기, 폴더/태그 IndexedDB 마이그레이션

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
| `docs/wrks-feature-design.md` | Works AI 12개 기능 분석 + 5개 화면 설계 |
| `docs/wrks-implementation-plan.md` | Works AI Phase 1~3 구현 상세 (코드 패턴, 파일 목록) |
| `pwa.pen` | Pencil MCP 화면 설계 — 6개 신규 프레임 (v2 4개 + wrks 2개) |

---

## 구현 진행률

| 우선순위 | 완료 | 남은 항목 | 진행률 |
|----------|------|-----------|--------|
| P0 | 7/7 | 0 | 100% |
| P1 | 27/27 | 0 | 100% |
| P2 | 13/22 | 9 | 59% |
| P3 | 8/9 | 1 | 89% |
| 문서/설계 | 5/5 | 0 | 100% |
| **전체** | **60/70** | **10** | **86%** |

> **참고**: P0, P1 완료. P2 남은 항목은 백엔드 연동(Memory/Schedule/Swarm/Channel, OpenAI/Gemini 프록시, 사용량 SSE)과 웹검색+RAG.
> P3 남은 항목: 메시지 가상화, Memory/Schedule/Swarm/Channel IndexedDB 영속성.
