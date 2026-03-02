# H Chat PWA — TODO List

> 마지막 업데이트: 2026-03-02

## 현재 상태 요약

| 영역 | 상태 |
|------|------|
| 멀티 프로바이더 (Bedrock/OpenAI/Gemini) | ✅ 완료 |
| Modal 백엔드 (Bedrock 프록시) | ✅ 완료 — 배포됨 |
| 그룹 채팅 | ✅ 완료 |
| 채팅 내보내기 (MD/HTML/JSON/TXT) | ✅ 완료 |
| 검색 | ✅ 완료 |
| IndexedDB 영속성 | ✅ 완료 |
| i18n (한국어/영어) | ✅ 완료 |
| PWA (설치/캐시) | ✅ 완료 |
| 테스트 | ❌ 없음 (0%) |

---

## 🔴 P0 — 필수 (프로덕션 블로커)

### 테스트 프레임워크 구축
- [ ] Vitest + React Testing Library 설치
- [ ] 유틸리티 단위 테스트 (`export-chat.ts`, `time.ts`, `model-meta.ts`)
- [ ] i18n 테스트 (번역 키 누락 검증)
- [ ] Zustand 스토어 통합 테스트 (`session.store`, `settings.store`)
- [ ] UI 컴포넌트 테스트 (`shared/ui/` 11개)
- [ ] Playwright E2E 설정 + 핵심 플로우 테스트
- [ ] 목표: 80%+ 커버리지

### 접근성 (a11y)
- [ ] 아이콘 전용 버튼에 `aria-label` 추가 (Send, Stop, Menu 등)
- [ ] `:focus-visible` 포커스 링 추가 (모든 인터랙티브 요소)
- [ ] SearchModal 포커스 트랩 구현
- [ ] skip-to-content 링크 추가
- [ ] 색상 대비 WCAG AA 검증
- [ ] `eslint-plugin-jsx-a11y` 추가

### CLAUDE.md 업데이트
- [ ] Phase 1 → Phase 3 반영
- [ ] Mock vs 실제 기능 구분 명시
- [ ] IndexedDB 영속성 반영 ("데이터 새로고침 시 손실" 삭제)

---

## 🟡 P1 — 높은 우선순위 (사용자 경험)

### 미완성 핸들러
- [ ] `HomeScreen.tsx` — 빠른 액션 클릭 핸들러 구현 (TODO)
- [ ] `QuickChatPage.tsx` — 메시지 전송 로직 구현 (TODO)

### 채팅 가져오기 (Import)
- [ ] JSON 형식 대화 가져오기
- [ ] 기존 세션 병합 or 새 세션 생성 선택

### 내보내기 UI 통합
- [ ] ChatHeader에 내보내기 버튼 추가
- [ ] AllChatsScreen에 일괄 내보내기 기능
- [ ] PDF 내보내기 (jspdf 라이브러리 추가)

### 자동 모델 라우팅
- [ ] `providers/router.ts` — 프롬프트 분석 기반 모델 자동 선택
- [ ] 코딩 → Sonnet, 간단한 질문 → Haiku, 복잡한 분석 → Opus

### 오프라인 UI 피드백
- [ ] 네트워크 상태 감지 (`navigator.onLine`)
- [ ] 오프라인 시 배너/토스트 표시
- [ ] 채팅 전송 버튼 비활성화

### 성능 최적화
- [ ] 코드 스플리팅 — `React.lazy()` 페이지별 적용
- [ ] AWS SDK 동적 임포트 (`@aws-sdk/client-bedrock-runtime`)
- [ ] `manualChunks` 설정으로 번들 분리
- [ ] 완료된 메시지 마크다운 렌더링 `useMemo` 적용

---

## 🟢 P2 — 중간 우선순위 (고급 기능)

### 사용량 추적
- [ ] 토큰 사용량 카운트 (프로바이더별)
- [ ] 비용 추정 대시보드
- [ ] 세션별/모델별 사용 통계

### 프롬프트 라이브러리
- [ ] 자주 쓰는 프롬프트 저장/재사용
- [ ] 카테고리별 분류
- [ ] 프롬프트 변수 (`{{variable}}`) 지원

### 페르소나 시스템
- [ ] AI 역할 프리셋 (코딩 도우미, 번역가, 작가 등)
- [ ] 커스텀 시스템 프롬프트 + 아바타
- [ ] 세션별 페르소나 지정

### PDF 채팅
- [ ] PDF 업로드 → 텍스트 추출
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

### OpenAI/Gemini 백엔드 프록시 (보안)
- [ ] Modal에 `/api/openai`, `/api/gemini` 엔드포인트 추가
- [ ] API 키를 Modal Secrets에 저장
- [ ] 클라이언트 직접 호출 → 서버 프록시로 전환

---

## 🔵 P3 — 낮은 우선순위 (폴리시)

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

---

## 완료된 항목 (이번 세션)

- [x] Modal 서버리스 백엔드 구축 (`backend/`)
- [x] `VITE_API_BASE_URL` 환경변수 분기 적용
- [x] Modal 프로덕션 배포 (https://sgtlim0--hchat-api-api.modal.run)
- [x] Vercel 환경변수 설정 + 프로덕션 배포
- [x] CORS `allow_origin_regex` 수정
- [x] 연결 테스트 모델 ID 수정 (`claude-haiku-3.5` → `claude-haiku-4.5`)
- [x] 프로젝트 전체 + src 하위 디렉토리 README.md 생성
- [x] 연결 테스트 + 채팅 스트리밍 검증 완료
