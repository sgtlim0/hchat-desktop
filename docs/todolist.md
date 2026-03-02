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
| 테스트 (Vitest) | ✅ 완료 — 83 tests, 6 suites |
| 접근성 (a11y) | ✅ 완료 — aria-label, focus-visible |
| 사용량 추적 | ✅ 완료 — 토큰 추정, 비용 대시보드 |
| 프롬프트 라이브러리 | ✅ 완료 — CRUD, 변수, 카테고리 |
| 페르소나 시스템 | ✅ 완료 — 5 프리셋, 커스텀, 시스템 프롬프트 |
| 성능 최적화 | ✅ 완료 — memo, manualChunks, lazy |
| 오프라인 UI | ✅ 완료 — useOnlineStatus, 배너 |

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

### P2 — 고급 기능
- [x] 사용량 추적 — 토큰 추정, 모델별 비용 대시보드, 설정 탭
- [x] 프롬프트 라이브러리 — CRUD, 카테고리 필터, `{{variable}}` 템플릿
- [x] 페르소나 시스템 — 5 프리셋, 커스텀 CRUD, 시스템 프롬프트 주입

---

## 🟡 P1 — 남은 작업

### 내보내기 UI 통합
- [ ] ChatHeader에 내보내기 버튼 추가 (현재 컨텍스트 메뉴에서만 접근 가능)
- [ ] AllChatsScreen에 일괄 내보내기 기능
- [ ] PDF 내보내기 (jspdf 라이브러리)

### 자동 모델 라우팅
- [ ] `providers/router.ts` — 프롬프트 분석 기반 모델 자동 선택
- [ ] 코딩 → Sonnet, 간단한 질문 → Haiku, 복잡한 분석 → Opus

### 테스트 확장
- [ ] UI 컴포넌트 테스트 (`shared/ui/` 11개)
- [ ] Playwright E2E 설정 + 핵심 플로우 테스트
- [ ] 커버리지 80%+ 달성

### 접근성 확장
- [ ] SearchModal 포커스 트랩 구현
- [ ] skip-to-content 링크 추가
- [ ] 색상 대비 WCAG AA 검증
- [ ] `eslint-plugin-jsx-a11y` 추가

---

## 🟢 P2 — 중간 우선순위

### PDF 채팅
- [ ] PDF 업로드 → 텍스트 추출 (`pdf.js`)
- [ ] 문서 컨텍스트 기반 대화

### 웹 검색 + RAG
- [ ] DuckDuckGo/Brave Search 연동
- [ ] 검색 결과 → 컨텍스트 주입
- [ ] 출처 인용 표시

### 크로스 모델 토론
- [ ] 2-3개 모델 간 자동 토론 (3라운드)
- [ ] 최종 합의 요약

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
- [ ] 일별/주별/월별 차트 시각화
- [ ] 예산 알림 설정

---

## 🔵 P3 — 낮은 우선순위

### 대화 포크
- [ ] 특정 메시지에서 분기하여 새 대화 시작

### OCR / 비전 UI
- [ ] 이미지 업로드 전용 분석 모드
- [ ] 스크린샷 붙여넣기 지원

### TTS / STT
- [ ] 음성 입력 (Web Speech API)
- [ ] 음성 출력 (TTS)

### 메시지 가상화
- [ ] 100+ 메시지 목록에 `react-window` 적용
- [ ] 스크롤 성능 최적화

### IndexedDB 확장
- [ ] Memory, Schedule, Swarm, Channel 스토어 영속성 연결
- [ ] 데이터 백업/복원 기능

### UI 폴리시
- [ ] 다크 모드 세부 색상 조정
- [ ] 모바일 반응형 레이아웃 개선
- [ ] 애니메이션/트랜지션 개선 (페이지 전환, 사이드바 등)
- [ ] 토스트 알림 시스템 추가

---

## 구현 진행률

| 우선순위 | 완료 | 남은 항목 | 진행률 |
|----------|------|-----------|--------|
| P0 | 7/7 | 0 | 100% |
| P1 | 7/14 | 7 | 50% |
| P2 | 3/11 | 8 | 27% |
| P3 | 0/7 | 7 | 0% |
| **전체** | **17/39** | **22** | **44%** |
