# H Chat Desktop

AI 모델(Claude, GPT, Gemini)과 대화하는 Progressive Web App. 멀티 프로바이더, 실시간 스트리밍, 80개 AI 기능, 65개 스토어, 68개 페이지, 로컬 저장, PWA 지원.

**Phase 1-17 완료** (85개 기능) | **65K 코드** | **70 스토어 · 73 페이지** | **1,518 tests** | [**Live Demo**](https://hchat-desktop.vercel.app)

---

## 주요 기능

### 비서 마켓플레이스 (홈 화면)

- **8개 공식 비서** — 신중한 분석가, 빠른 대화, 문서 검토, 문서 번역, 보고서 작성, 코드 리뷰, 데이터 분석, 이메일 작성
- **카테고리 필터** — 전체/대화/업무/번역/분석/보고/그림/글쓰기 8개 카테고리
- **내 비서 탭** — 커스텀 페르소나를 비서로 활용 (페르소나 시스템 연동)
- **원클릭 세션** — 비서 카드 클릭 → 해당 모델 + 시스템 프롬프트로 즉시 대화 시작

### 문서 도구 (Phase 2-3)

- **헤더 도구 탭** — 업무 비서/문서 번역/문서 작성/텍스트 추출 4개 탭으로 빠른 전환
- **문서 번역** — 파일 업로드(PDF/TXT/MD) → LLM 청크 번역 → 진행률 바 → 결과 다운로드
- **문서 작성 마법사** — 5단계 스텝퍼 (프로젝트 설정 → 배경지식 → AI 목차 생성 → 섹션별 AI 작성 → MD/TXT 내보내기)
- **OCR 텍스트 추출** — tesseract.js 기반 이미지→텍스트, 배치 처리(최대 20개), 4개 언어(한+영/영/일+영/중+영)

### 사용량 카테고리 추적 (Phase 4)

- **기능별 사용량** — chat/translate/doc-write/ocr/image-gen/data-analysis 6개 카테고리
- **카테고리 필터** — 설정 > 사용량 탭에서 기능별 필터링
- **도넛 차트** — 기능별 비용 비율 시각화

### Canvas / Artifacts (Phase 5)

- **사이드 패널** — 채팅 오른쪽에 코드/HTML/SVG/Mermaid 미리보기 패널 (Claude Artifacts 스타일)
- **자동 감지** — 스트리밍 완료 후 코드 블록 자동 파싱 (5줄 이상 코드, HTML/SVG/Mermaid 즉시)
- **"캔버스에서 열기"** — 코드 블록마다 PanelRightOpen 아이콘 버튼, 클릭 시 패널 오픈
- **HTML/SVG 미리보기** — sandboxed iframe 렌더링 (XSS 제거)
- **Mermaid 다이어그램** — lazy import로 필요 시에만 1.5MB 로드, 다이어그램 렌더링
- **버전 히스토리** — 아티팩트별 버전 관리, 이전 버전 전환
- **드래그 리사이즈** — 패널 너비 자유 조절 (320-960px, localStorage 영속)
- **모바일 오버레이** — 768px 미만에서 fixed overlay 모드
- **다운로드/복사** — 아티팩트 파일 다운로드, 코드 복사
- **아티팩트 선택** — 세션 내 다중 아티팩트 드롭다운 전환

### 생산성 자동화 (Phase 6)

- **프롬프트 체이닝** — 순차 실행 체인 정의, 단계별 결과 자동 연결, 조건부 분기 (IF-THEN-ELSE)
- **지식베이스** — 문서 업로드 → 자동 청킹, 키워드 검색, 태그/카테고리 관리
- **워크플로우 빌더** — 노코드 블록 파이프라인 에디터, 6개 블록 타입, 3개 트리거, 템플릿 갤러리
- **실시간 협업** — 룸 생성/참여, 초대 코드 공유, 채팅 메시지, 호스트/참여자 권한

### 인텔리전스 확장 (Phase 7)

- **컨텍스트 매니저** — 토큰 사용량 시각화, 자동 압축 토글, 핀 메시지 관리, 컨텍스트 템플릿(코딩/글쓰기/분석/일반)
- **AI 인사이트 대시보드** — 프롬프트 품질 점수(명확성/구체성), 최적 모델 추천, 주간/월간 리포트 생성, 비용 절감 분석
- **플러그인 마켓플레이스** — 플러그인 설치/제거/활성화, 권한 관리, 검색/필터, 4개 기본 플러그인
- **테마 빌더** — 커스텀 테마 생성/편집, 5가지 색상 변수, 실시간 미리보기, 테마 활성화/복제

### 엔터프라이즈 & 인텔리전스 (Phase 8)

- **배치 프로세싱 큐** — 대량 작업 병렬 처리, 3단계 우선순위, 진행률 추적, 일시정지/재개
- **크로스 세션 인사이트** — 세션 클러스터 분석, 반복 패턴 감지, 최적화 제안(템플릿화/메모리/최적화)
- **스마트 응답 캐싱** — 프롬프트 해시 기반 캐시, TTL 설정, 히트 카운트, 비용/토큰 절감 시각화
- **엔터프라이즈 감사 로그** — 10가지 액션 타입, 날짜/액션/모델 필터, CSV/JSON 내보내기, GDPR 준수

### 스마트 UX & 멀티모달 확장 (Phase 9)

- **AI 대시보드 홈** — 위젯 그리드 시스템, 6종 위젯(최근 대화/사용량/비서/지식베이스/일정/즐겨찾기), 레이아웃 CRUD
- **멀티모달 채팅** — Vision 이미지 분석(Claude/GPT-4o), 카메라 캡처, Whisper 오디오, 드래그앤드롭 개선
- **대화 분석 자동화** — AI 자동 태깅, 감정 분석(긍정/부정/중립), 스마트 제목 생성, 유사 대화 추천
- **고급 프롬프트 에디터** — 풀스크린 에디터, 변수 자동완성, 프롬프트 히스토리, / 커맨드 스니펫, 마크다운 미리보기
- **팀 워크스페이스** — 워크스페이스 생성/관리, 공유 프롬프트/지식베이스, 멤버 관리(관리자/편집자/뷰어), 활동 피드

### AI 네이티브 & 모바일 퍼스트 (Phase 10)

- **MCP 서버 통합** — Model Context Protocol 클라이언트, 서버 CRUD, 도구 동적 로드, 연결/해제
- **AI 에이전트 자율 실행** — ReAct 패턴 멀티 스텝, 실행 트리 시각화, 일시정지/재개, 승인 게이트
- **모바일 네이티브 UX** — 바텀 네비게이션, 풀스크린 채팅 모드, 스와이프 제스처 설정
- **실시간 데이터 커넥터** — Google Sheets/Notion/GitHub 연동, 커넥터 CRUD, 동기화
- **AI 코드 인터프리터** — Jupyter 스타일 노트북, JS 샌드박스 실행, Pyodide Python 지원

### AI 고도화 & 데이터 인텔리전스 (Phase 11)

- **AI 멘토링 시스템** — 학습 목표 관리, 난이도별 진행률 추적, 단계별 학습
- **데이터 파이프라인 빌더** — 6개 블록 타입 (source/filter/sort/aggregate/pivot/output), 파이프라인 실행
- **AI 코드 리뷰어** — 보안/성능/가독성 다중 관점 리뷰, 인라인 코멘트, 수정 제안
- **스마트 알림 센터** — 4개 카테고리, 읽음/안읽음, Push Notification, 필터링
- **비주얼 프롬프트 빌더** — 블록 기반 프롬프트 에디터, 품질 점수 실시간 계산, 미리보기

### 고급 자동화 & 분석 인텔리전스 (Phase 12)

- **AI 회의록 작성기** — 4개 템플릿, 액션 아이템 관리, 참석자 발언 분석
- **스마트 보고서 생성기** — 주간/월간/프로젝트 보고서, 버전 관리, MD/PDF 내보내기
- **AI 학습 경로 추천** — 개인화 로드맵, 스텝 관리, 진행률 추적
- **대화 북마크 & 하이라이트** — 형광펜 4색, 태그 분류, 메모, 검색 연동
- **AI 번역 메모리 (TM)** — 번역 쌍 저장, 유사 문장 매칭, 용어집 관리

### 커뮤니케이션 & 크리에이티브 AI (Phase 13)

- **AI 프레젠테이션 생성기** — 슬라이드 에디터, 발표 노트, 4개 템플릿
- **스마트 요약 피드** — 일간/주간 세션 요약, 핵심 인사이트 추출
- **AI 이메일 어시스턴트** — 톤/길이 조절, 회신 생성, 이메일 템플릿
- **대화 타임라인 뷰** — 주제별 구간 분리, 점프 네비게이션, 요약 미리보기
- **AI 마인드맵 생성기** — 노드 트리 관리, Mermaid 코드 생성, SVG/PNG 내보내기

### 개발자 도구 & 코드 지원 (Phase 14)

- **코드 스니펫 매니저** — 코드 조각 CRUD, 언어/태그별 분류, 구문 강조, 채팅 `/snippet` 삽입
- **API 테스터** — REST API 요청 빌더 (method/URL/headers/body), JSON 응답 뷰어, cURL 임포트
- **정규표현식 빌더** — AI 기반 정규식 생성, 실시간 매칭 테스트, 그룹 시각화, 치트시트
- **데이터 변환기** — JSON ↔ YAML ↔ CSV 변환, AI 스키마 추론, TypeScript/Zod 타입 생성
- **다이어그램 에디터** — Mermaid 실시간 편집 + 미리보기, AI 다이어그램 생성, SVG/PNG 내보내기

### 핵심 채팅

- **멀티 프로바이더** — AWS Bedrock (Claude Opus/Sonnet/Haiku), OpenAI (GPT-4o/4 Turbo), Google Gemini Pro 지원
- **실시간 스트리밍** — SSE 기반 토큰 단위 응답 스트리밍 (rAF 기반 렌더링 쓰로틀링, ~60fps)
- **자동 모델 라우팅** — 프롬프트 길이/복잡도 분석하여 최적 모델 자동 선택
- **대화 포크** — 특정 메시지에서 분기하여 새로운 대화 시작 (탐색적 AI 워크플로우 지원)
- **대화 요약** — LLM 기반 자동 요약 생성 (1회 호출, 복잡한 논의 이해 용이)
- **다국어** — 한국어/영어 전환 (커스텀 i18n 시스템)

### 그룹 및 협업

- **그룹 채팅** — 여러 모델에 동시 질문, 응답 병렬 비교
- **크로스 모델 토론** — 3가지 모델, 3라운드 자동 토론, 합의 요약 생성 (다각도 분석)
- **대화 폴더** — CRUD, 컬러 코딩, 사이드바 필터링 (수백 개 대화 체계적 정리)
- **대화 태그** — 컬러 태그 시스템, ChatHeader 선택기 (유연한 분류)

### 고급 AI 도구

- **에이전트 모드** — XML 도구 호출 파싱, 다단계 실행 루프 (자동화된 작업 수행)
  - 웹 검색 (DuckDuckGo 프록시 연동)
  - 코드 실행 시뮬레이션
  - RAG (Retrieval-Augmented Generation)

- **AI 도구 패널** — 11가지 글쓰기 기능 + 문법 검사 + 요약 + 문서 건강 검사
  - 요약, 확장, 단순화, 톤 변경 (격식체↔존댓말), 길이 조정
  - 핵심 포인트 추출, 불릿 포인트화
  - 맞춤법/문법 검사 (AI 기반)
  - 가독성/일관성 분석 (문서 건강 점수)

- **PDF 채팅** — pdfjs-dist 텍스트 추출, 시스템 프롬프트 주입 (PDF 콘텐츠 AI 분석)
- **Excel/CSV 분석** — SheetJS 파싱, PromptInput 통합 (데이터 분석 자동화)
- **이미지 생성** — DALL-E 3 통합, Gemini Imagen 준비 (텍스트→이미지)
- **음성 기능** — TTS (Text-to-Speech), STT (Speech-to-Text) Web Speech API 지원

### 프롬프트 및 페르소나

- **프롬프트 라이브러리** — 템플릿 CRUD, 카테고리 필터, `{{variable}}` 지원 (재사용 가능한 프롬프트)
- **페르소나 시스템** — 5가지 프리셋 + 커스텀 생성, 시스템 프롬프트 자동 주입 (일관된 AI 성격)

### 데이터 관리

- **로컬 저장** — IndexedDB (Dexie v7)로 모든 대화 영구 저장 (오프라인 접근)
- **전체 백업/복원** — 23개 테이블 JSON 내보내기/가져오기 (데이터 포팅 용이)
- **채팅 가져오기** — ChatGPT/Claude 대화 형식 자동 감지 + 변환
- **채팅 내보내기** — Markdown, HTML, JSON, TXT, PDF 포맷 지원
- **스토리지 관리** — IndexedDB 분석 + 설정 탭 정리 기능 (저장 공간 최적화)

### 사용량 및 비용

- **사용량 추적** — 모델별/프로바이더별 토큰 추정, 비용 계산
- **ROI 대시보드** — 일별/주별 차트, 최근 30일 분석 (지출 시각화)
- **사용량 예산** — 월간 예산 설정, 70% 임계치 알림 (비용 제어)

### AI 안전

- **AI 가드레일** — 민감 데이터 Regex 감지 (PII: 주민번호, 신용카드, 이메일 등)
- **전송 전 경고** — 민감 정보 감지 시 경고/마스킹 옵션 제공 (데이터 보호)

### 고급 옵션

- **Thinking Depth 모드** — fast/balanced/deep 3단 토글 (Claude에서 extended thinking)
- **메모리 시스템** — 컨텍스트 자동 추출 (Bedrock Haiku), CRUD 관리
- **스케줄 매니저** — 비동기 프롬프트 실행, 시간 기반 태스크 (예약 작업)
- **에이전트 Swarm** — 멀티에이전트 오케스트레이션 (병렬 작업)
- **채널 연동** — Slack 웹훅, Telegram Bot API (외부 연동)

### 보안 & 성능

- **자격증명 암호화** — Web Crypto API (AES-GCM 256-bit), 키는 IndexedDB 저장 (localStorage 분리)
- **스트리밍 쓰로틀** — requestAnimationFrame 기반 렌더링 쓰로틀 (~60fps, 100+/sec SSE → 최적화)
- **자동 마이그레이션** — 평문 자격증명 → 암호화 자동 전환 (데이터 손실 없음)

### PWA 및 UX

- **PWA 지원** — 설치 가능, 오프라인 지원, 서비스 워커 캐싱 (앱처럼 사용)
- **다크 모드** — CSS 변수 기반 라이트/다크 테마 (사용자 선호 존중)
- **메시지 가상화** — react-window 기반 (100+ 메시지도 부드러운 스크롤)
- **토스트 알림** — Zustand 스토어 기반, 4가지 타입, 자동 닫기
- **접근성** — Focus trap, skip-to-content, ARIA labels, WCAG AA 준수

### 키보드 단축키

| 단축키 | 기능 |
|--------|------|
| `Cmd/Ctrl + K` | 검색 모달 |
| `Cmd/Ctrl + B` | 사이드바 토글 |
| `Cmd/Ctrl + ,` | 설정 토글 |
| `Cmd/Ctrl + J` | AI 코파일럿 토글 |

---

## 기술 스택

| 영역 | 기술 | 버전 |
|------|------|------|
| **Frontend** | React | 19.2 |
| | TypeScript | 5.9 |
| | Vite | 7 |
| | Tailwind CSS | 3 |
| **상태관리** | Zustand | 5 |
| **DB (Local)** | Dexie (IndexedDB) | 4.3 (v7 schema) |
| **Markdown** | react-markdown | 10.1 |
| | react-syntax-highlighter | 16.1 |
| | remark-gfm | 4.0 |
| **문서 처리** | pdfjs-dist | 5.5 |
| | jspdf | 4.2 |
| | xlsx (SheetJS) | 0.18 |
| **OCR** | tesseract.js | 7.0 |
| **다이어그램** | mermaid | 11.12 |
| **UI** | Lucide React | 0.575 |
| | Radix UI (기초) | - |
| **성능** | react-window | 2.2 |
| **PWA** | vite-plugin-pwa | 1.2 |
| **Backend** | Python | 3.10+ |
| | FastAPI | - |
| | Modal | (Serverless) |
| **AI APIs** | AWS Bedrock | - |
| | OpenAI API | - |
| | Google Gemini | - |
| **테스트** | Vitest | 4.0 |
| | React Testing Library | 16.3 |
| | Playwright | 1.58 |
| **Code Quality** | ESLint | 9.39 |
| | TypeScript Compiler | 5.9 |

---

## 빠른 시작

### 설치 및 개발

```bash
# 의존성 설치
npm install

# 개발 서버 시작 (localhost:5173)
npm run dev

# 프로덕션 빌드
npm run build

# 빌드 미리보기
npm run preview

# 코드 품질 검사
npm run lint
```

### 테스트

```bash
# 모든 테스트 실행
npm test

# 테스트 감시 모드
npm run test:watch

# 테스트 커버리지 (목표: 80%+)
npm run test:coverage

# 인터랙티브 UI
npm run test:ui

# E2E 테스트 (Playwright)
npm run test:e2e
```

### 백엔드 (Modal)

```bash
# Modal CLI 설치
pip install modal

# 로컬 개발 서버
modal serve backend/app.py

# 프로덕션 배포
modal deploy backend/app.py

# 시크릿 설정
modal secret create hchat-api-keys \
  OPENAI_API_KEY=sk-... \
  GEMINI_API_KEY=...
```

---

## 프로젝트 구조

**Feature-Sliced Design (FSD)** 아키텍처

```
hchat-pwa/
├── src/
│   ├── app/
│   │   └── layouts/           # MainLayout — 뷰 라우팅, 키보드 단축키
│   │
│   ├── pages/                 # 73개 페이지 컴포넌트 (66개 뷰)
│   │   ├── home/              # 홈 (비서 마켓플레이스)
│   │   ├── chat/              # 채팅
│   │   ├── all-chats/         # 모든 대화
│   │   ├── group-chat/        # 그룹 채팅
│   │   ├── quick-chat/        # 빠른 채팅
│   │   ├── projects/          # 프로젝트
│   │   ├── settings/          # 설정 (모델, 언어, 사용량 등)
│   │   ├── memory/            # 메모리 시스템
│   │   ├── swarm/             # 에이전트 Swarm
│   │   ├── schedule/          # 스케줄 매니저
│   │   ├── agent/             # AI 에이전트
│   │   ├── ai-tools/          # AI 도구 패널
│   │   ├── image-gen/         # 이미지 생성
│   │   ├── prompt-library/    # 프롬프트 라이브러리
│   │   ├── debate/            # 크로스 모델 토론
│   │   ├── translate/         # 문서 번역
│   │   ├── doc-writer/        # 문서 작성 마법사
│   │   ├── ocr/               # OCR 텍스트 추출
│   │   ├── prompt-chain/      # 프롬프트 체이닝
│   │   ├── knowledge/         # 지식베이스
│   │   ├── workflow/          # 워크플로우 빌더
│   │   ├── collab/            # 실시간 협업
│   │   ├── context-manager/  # 컨텍스트 매니저
│   │   ├── insights/          # AI 인사이트 + 크로스 세션 인사이트
│   │   ├── plugins/           # 플러그인 마켓플레이스
│   │   ├── theme/             # 테마 빌더
│   │   ├── batch/             # 배치 프로세싱 큐
│   │   ├── cache/             # 스마트 응답 캐싱
│   │   ├── audit/             # 감사 로그
│   │   ├── dashboard/          # AI 대시보드 홈
│   │   ├── workspace/          # 팀 워크스페이스
│   │   ├── snippet/            # 코드 스니펫 매니저 (Phase 14)
│   │   ├── api-tester/         # API 테스터 (Phase 14)
│   │   ├── regex-builder/      # 정규표현식 빌더 (Phase 14)
│   │   ├── data-converter/     # 데이터 변환기 (Phase 14)
│   │   ├── diagram-editor/     # 다이어그램 에디터 (Phase 14)
│   │   ├── mcp/                # MCP 서버 관리 (Phase 10)
│   │   ├── autonomous-agent/   # AI 자율 에이전트 (Phase 10)
│   │   ├── data-connector/     # 데이터 커넥터 (Phase 10)
│   │   ├── code-interpreter/   # 코드 인터프리터 (Phase 10)
│   │   ├── voice-chat/         # AI 음성 대화 (Phase 15)
│   │   ├── knowledge-graph/    # 스마트 지식 그래프 (Phase 15)
│   │   ├── canvas/             # 멀티모달 캔버스 (Phase 15)
│   │   └── auto-workflow/      # AI 자동 워크플로우 (Phase 15)
│   │
│   ├── widgets/               # 복합 UI 위젯
│   │   ├── message-list/      # 메시지 목록 (가상화, 마크다운)
│   │   ├── prompt-input/      # 프롬프트 입력 (음성, 도구)
│   │   ├── sidebar/           # 네비게이션 사이드바
│   │   ├── search-modal/      # 검색 모달
│   │   ├── header-tabs/       # 도구 탭 바 (4탭)
│   │   ├── artifact-panel/    # Canvas/Artifacts 사이드 패널
│   │   ├── multimodal/         # 멀티모달 입력 (이미지/오디오/카메라)
│   │   ├── advanced-prompt/    # 고급 프롬프트 에디터
│   │   ├── chat-header/       # 채팅 헤더 (내보내기 등)
│   │   ├── ai-tools/          # AI 도구 패널
│   │   ├── copilot/           # AI 코파일럿 위젯 (Phase 15)
│   │   └── ...
│   │
│   ├── entities/              # Zustand 스토어 70개
│   │   ├── session/               # 세션, 메시지, 스트리밍, 뷰 상태
│   │   ├── settings/              # 모델, 언어, 테마, 자격증명
│   │   ├── project/               # 프로젝트
│   │   ├── group-chat/            # 그룹 채팅
│   │   ├── channel/               # 채널 연동 (Slack/Telegram)
│   │   ├── memory/                # 메모리
│   │   ├── swarm/                 # Swarm
│   │   ├── schedule/              # 스케줄
│   │   ├── usage/                 # 사용량 추적, 비용 계산
│   │   ├── persona/               # 페르소나 (5 프리셋 + 커스텀)
│   │   ├── prompt-library/        # 프롬프트 템플릿
│   │   ├── debate/                # 크로스 모델 토론
│   │   ├── folder/                # 대화 폴더
│   │   ├── tag/                   # 대화 태그
│   │   ├── toast/                 # 토스트 알림
│   │   ├── translate/             # 문서 번역 워크플로우
│   │   ├── doc-writer/            # 문서 작성 마법사
│   │   ├── artifact/              # Canvas/Artifacts (버전 히스토리)
│   │   ├── knowledge/             # 지식베이스 (문서 청킹, 검색)
│   │   ├── workflow/              # 워크플로우 빌더 (블록 파이프라인)
│   │   ├── collab/                # 실시간 협업 (룸, 초대 코드)
│   │   ├── context-manager/       # 컨텍스트 매니저 (핀 메시지, 템플릿)
│   │   ├── insights/              # AI 인사이트 + 크로스 세션 인사이트
│   │   ├── plugins/               # 플러그인 관리 (설치/제거)
│   │   ├── theme/                 # 커스텀 테마 (CSS 변수)
│   │   ├── batch/                 # 배치 작업 큐
│   │   ├── cache/                 # 응답 캐시
│   │   ├── audit/                 # 감사 로그
│   │   ├── dashboard/               # 대시보드 레이아웃 (위젯 그리드)
│   │   ├── workspace/               # 팀 워크스페이스 (멤버, 공유)
│   │   ├── snippet/                 # 코드 스니펫 (Phase 14)
│   │   ├── api-tester/              # API 테스터 (Phase 14)
│   │   ├── regex-builder/           # 정규표현식 빌더 (Phase 14)
│   │   ├── data-converter/          # 데이터 변환기 (Phase 14)
│   │   ├── diagram-editor/          # 다이어그램 에디터 (Phase 14)
│   │   ├── mcp/                     # MCP 서버 (Phase 10)
│   │   ├── autonomous-agent/        # AI 자율 에이전트 (Phase 10)
│   │   ├── mobile-ux/               # 모바일 UX (Phase 10)
│   │   ├── data-connector/          # 데이터 커넥터 (Phase 10)
│   │   ├── code-interpreter/        # 코드 인터프리터 (Phase 10)
│   │   ├── voice-chat/              # AI 음성 대화 (Phase 15)
│   │   ├── knowledge-graph/         # 스마트 지식 그래프 (Phase 15)
│   │   ├── copilot/                 # AI 코파일럿 (Phase 15)
│   │   ├── canvas/                  # 멀티모달 캔버스 (Phase 15)
│   │   └── auto-workflow/           # AI 자동 워크플로우 (Phase 15)
│   │
│   └── shared/
│       ├── ui/                # 14개 재사용 UI 컴포넌트
│       │   ├── button.tsx
│       │   ├── avatar.tsx
│       │   ├── toggle.tsx
│       │   ├── AssistantCard.tsx   # 비서 카드 컴포넌트
│       │   ├── ErrorBoundary.tsx   # React 에러 경계
│       │   └── ...
│       │
│       ├── lib/
│       │   ├── providers/         # 멀티 프로바이더 시스템
│       │   │   ├── factory.ts     # 프로바이더 라우팅
│       │   │   ├── openai.ts
│       │   │   ├── gemini.ts
│       │   │   └── bedrock.ts
│       │   ├── agent/             # 에이전트 시스템 (XML 파서, 도구)
│       │   ├── db/                # Dexie 데이터베이스
│       │   ├── utils/             # 유틸리티 함수
│       │   ├── token-estimator.ts # 토큰 추정
│       │   ├── export-chat.ts     # 내보내기 로직
│       │   ├── translate.ts       # 번역 유틸리티 (청크 분할, 텍스트 추출)
│       │   ├── ocr.ts             # OCR 래퍼 (tesseract.js)
│       │   ├── artifact-detector.ts # 코드 블록 파싱, 아티팩트 타입 추론
│       │   ├── conversation-analysis.ts # 대화 분석 (자동 태깅, 감정, 제목 생성)
│       │   ├── crypto.ts             # 자격증명 암호화 (AES-GCM 256-bit)
│       │   ├── stream-throttle.ts    # SSE 스트리밍 rAF 쓰로틀
│       │   └── ...
│       │
│       ├── constants/           # 모델, 비서 프리셋
│       │   └── assistants.ts    # 8개 공식 비서 데이터
│       ├── i18n/                # 다국어 (한국어/영어)
│       ├── types/               # TypeScript 인터페이스
│       ├── constants.ts         # 모델 목록, 상수
│       └── styles/              # Tailwind CSS, 테마
│
├── backend/
│   ├── app.py                 # Modal FastAPI 앱
│   └── ...
│
├── public/                     # 정적 리소스
├── docs/                       # 설계 문서
│   ├── v2-implementation-plan.md
│   ├── hchat-implementation-plan.md
│   └── ...
│
└── vite.config.ts            # Vite 설정
```

### 핵심 아키텍처 결정

#### 1. 뷰 기반 라우팅 (React Router 없음)

Zustand의 `view` 상태로 페이지 전환. `MainLayout.renderContent()`가 `view` 값에 따라 올바른 페이지를 렌더링.

```typescript
// 네비게이션 예제
sessionStore.setView('chat')  // ChatPage 렌더링
sessionStore.setView('settings')  // SettingsPage 렌더링
```

#### 2. 멀티 프로바이더 팩토리 패턴

`ProviderFactory`가 선택된 모델에 따라 적절한 프로바이더 생성. 모든 프로바이더는 동일한 스트리밍 인터페이스 구현.

```typescript
const provider = ProviderFactory.create(modelId)
// provider.chat(messages) → AsyncIterable<StreamEvent>
```

#### 3. 메시지 세그먼트 구조

메시지는 텍스트와 도구 호출을 유연하게 혼합.

```typescript
interface Message {
  segments: MessageSegment[]  // { type: 'text' | 'tool', content?, toolCalls? }
  role: 'user' | 'assistant'
  attachments?: ImageAttachment[]
}
```

#### 4. IndexedDB 영속성

Dexie v7 스키마로 23개 테이블 자동 저장. 페이지 새로고침 후 자동 복구.

---

## 배포

### Frontend (Vercel)

```bash
# 프로덕션 배포
vercel --prod

# 또는 Vercel Dashboard에서 자동 배포 (main 푸시 시)
```

- **URL**: https://hchat-desktop.vercel.app
- **환경변수**: `.env.production`의 `VITE_API_BASE_URL` 설정

### Backend (Modal)

```bash
# 배포
modal deploy backend/app.py

# 시크릿 설정 (한 번만)
modal secret create hchat-api-keys \
  OPENAI_API_KEY=sk-proj-... \
  GEMINI_API_KEY=...
```

- **URL**: https://sgtlim0--hchat-api-api.modal.run
- **엔드포인트**:
  - `POST /api/chat` — SSE 스트리밍 채팅 (Bedrock)
  - `POST /api/chat/test` — 연결 테스트
  - `GET /api/health` — 헬스 체크
  - `POST /api/search` — 웹 검색 (DuckDuckGo 프록시)
  - `POST /api/extract-memory` — 메모리 추출
  - `POST /api/schedule/execute` — 스케줄 실행
  - `POST /api/swarm/execute` — Swarm 실행
  - `POST /api/channels/notify` — 채널 알림
  - `POST /api/openai/chat` — OpenAI SSE 프록시
  - `POST /api/gemini/chat` — Gemini SSE 프록시

### 환경 설정

| 환경 | 설정 | 용도 |
|------|------|------|
| **개발** | `.env.development` (빈값) | Vite 프록시 사용 (`bedrock-plugin.ts`) |
| **프로덕션** | `.env.production` | Modal URL 직접 호출 |

---

## 테스트

### 커버리지 현황

- **테스트 수**: 1,518 tests (전부 통과)
- **테스트 스위트**: 126 suites
- **커버리지**: 75% stmts, 62% branches, 86% funcs, 75% lines
- **테스트 타입**:
  - **단위**: 유틸리티, 스토어, 프로바이더, 에이전트 파서/도구 (Vitest)
  - **통합**: UI 컴포넌트, SSE 스트리밍, API 호출 (React Testing Library)
  - **E2E**: 핵심 사용자 흐름 (Playwright)

### 테스트 실행

```bash
# 모든 테스트
npm test

# 감시 모드 (개발 중)
npm run test:watch

# 커버리지 리포트
npm run test:coverage

# 인터랙티브 UI
npm run test:ui

# E2E 테스트
npm run test:e2e
```

---

## 화면 설계

Pencil MCP를 통한 28개 프레임 설계:

| 분류 | 프레임 | 상태 |
|------|---------|------|
| **v2 신규 기능** | 에이전트, AI 도구, TTS/STT, 폴더/태그 | ✅ 완료 |
| **H Chat** | Thinking Depth, 가드레일, 문서 검사, 데이터 분석 | ✅ 완료 |
| **Phase 1** | HomeScreen 비서 마켓플레이스 | ✅ 완료 |

파일: `pwa.pen` (Pencil 형식, 28+ frames)

---

## 완료 현황

| 우선순위 | 항목 수 | 완료 | 진행률 |
|----------|--------|------|--------|
| **P0** (필수) | 7 | 7 | 100% |
| **P1** (UX 개선) | 27 | 27 | 100% |
| **P2** (고급 기능) | 22 | 22 | 100% |
| **P3** (최적화) | 9 | 9 | 100% |
| **문서/설계** | 5 | 5 | 100% |
| **Phase 5** (Canvas) | 14 | 14 | 100% |
| **Phase 6** (자동화) | 12 | 12 | 100% |
| **Phase 7** (인텔리전스) | 4 | 4 | 100% |
| **Phase 8** (엔터프라이즈) | 4 | 4 | 100% |
| **Phase 9** (스마트 UX) | 5 | 5 | 100% |
| **Phase 14** (개발자 도구) | 5 | 5 | 100% |
| **Phase 10** (AI 네이티브) | 5 | 5 | 100% |
| **Phase 11** (AI 고도화) | 5 | 5 | 100% |
| **Phase 12** (고급 자동화) | 5 | 5 | 100% |
| **Phase 13** (크리에이티브) | 5 | 5 | 100% |
| **Phase 15** (AI 허브) | 5 | 5 | 100% |
| **P0 보안/성능** | 3 | 3 | 100% |
| **QW** (코드 품질) | 5 | 5 | 100% |
| **번들 최적화** | 2 | 2 | 100% |
| **Phase 16** (AI 에이전시) | 5 | 5 | 100% |
| **Phase 17** (하이퍼 인텔리전스) | 5 | 5 | 100% |
| **전체** | **159/159** | **159** | **100%** |

### Phase 1 확장 (비서 마켓플레이스)

| 항목 | 상태 |
|------|------|
| HomeScreen 비서 카드 그리드 | ✅ 완료 |
| 8개 공식 비서 프리셋 | ✅ 완료 |
| 8개 카테고리 필터 | ✅ 완료 |
| 공식/내 비서 탭 토글 | ✅ 완료 |
| AssistantCard 컴포넌트 | ✅ 완료 |
| i18n 키 28개 추가 (ko/en) | ✅ 완료 |
| 스트리밍 커서 버그 수정 | ✅ 완료 |

### Phase 2 확장 (헤더 탭 + 문서 번역)

| 항목 | 상태 |
|------|------|
| 헤더 도구 탭 (4탭 전환) | ✅ 완료 |
| TranslatePage 문서 번역 UI | ✅ 완료 |
| translate.store.ts 상태 관리 | ✅ 완료 |
| translate.ts 유틸리티 | ✅ 완료 |
| i18n 키 ~30개 추가 (ko/en) | ✅ 완료 |

### Phase 3 확장 (문서 작성 + OCR)

| 항목 | 상태 |
|------|------|
| DocWriterPage 5단계 마법사 | ✅ 완료 |
| doc-writer.store.ts 상태 관리 | ✅ 완료 |
| OcrPage OCR 텍스트 추출 UI | ✅ 완료 |
| ocr.ts tesseract.js 래퍼 | ✅ 완료 |
| i18n 키 ~40개 추가 (ko/en) | ✅ 완료 |

### Phase 4 확장 (사용량 카테고리)

| 항목 | 상태 |
|------|------|
| UsageCategory 6개 카테고리 | ✅ 완료 |
| 카테고리 필터 UI | ✅ 완료 |
| 도넛 차트 시각화 | ✅ 완료 |
| i18n 키 ~7개 추가 (ko/en) | ✅ 완료 |

### Phase 5 확장 (Canvas / Artifacts)

| 항목 | 상태 |
|------|------|
| Artifact/ArtifactVersion 타입 정의 | ✅ 완료 |
| Dexie v5 artifacts 테이블 + CRUD | ✅ 완료 |
| artifact-detector 유틸리티 (코드블록 파싱) | ✅ 완료 |
| artifact.store.ts Zustand 스토어 | ✅ 완료 |
| CodeBlock "캔버스에서 열기" 버튼 | ✅ 완료 |
| ArtifactPanel 위젯 (6개 파일) | ✅ 완료 |
| ChatPage split layout (flex-row) | ✅ 완료 |
| HTML/SVG sandboxed iframe 프리뷰 | ✅ 완료 |
| Mermaid lazy import 다이어그램 렌더링 | ✅ 완료 |
| 드래그 리사이즈 핸들 | ✅ 완료 |
| 스트리밍 완료 후 자동 감지 | ✅ 완료 |
| 버전 히스토리 네비게이션 | ✅ 완료 |
| 모바일 오버레이 (< 768px) | ✅ 완료 |
| i18n 키 15개 추가 (ko/en) | ✅ 완료 |
| 테스트 32개 추가 (854 total) | ✅ 완료 |

### Phase 6 확장 (생산성 자동화)

| 항목 | 상태 |
|------|------|
| 프롬프트 체이닝 (순차 실행, 조건 분기) | ✅ 완료 |
| prompt-chain.store.ts 스토어 | ✅ 완료 |
| PromptChainPage 타임라인 UI | ✅ 완료 |
| 지식베이스 (문서 업로드, 청킹, 검색) | ✅ 완료 |
| knowledge.store.ts 스토어 | ✅ 완료 |
| KnowledgeBasePage UI | ✅ 완료 |
| 워크플로우 빌더 (6개 블록, 3개 트리거) | ✅ 완료 |
| workflow.store.ts 스토어 | ✅ 완료 |
| WorkflowBuilderPage UI | ✅ 완료 |
| 실시간 협업 (룸, 초대 코드, 권한) | ✅ 완료 |
| collab.store.ts 스토어 | ✅ 완료 |
| CollabRoomPage UI | ✅ 완료 |
| i18n 키 154개 추가 (ko/en) | ✅ 완료 |
| 테스트 9개 추가 (863 total) | ✅ 완료 |

### Phase 7 확장 (인텔리전스)

| 항목 | 상태 |
|------|------|
| 컨텍스트 매니저 (토큰 시각화, 자동 압축, 핀 메시지) | ✅ 완료 |
| context-manager.store.ts 스토어 | ✅ 완료 |
| ContextManagerPage UI | ✅ 완료 |
| AI 인사이트 대시보드 (품질 점수, 모델 추천, 리포트) | ✅ 완료 |
| insights.store.ts 스토어 | ✅ 완료 |
| InsightsDashboardPage UI | ✅ 완료 |
| 플러그인 마켓플레이스 (설치/제거, 권한, 검색) | ✅ 완료 |
| plugin.store.ts 스토어 | ✅ 완료 |
| PluginMarketplacePage UI | ✅ 완료 |
| 테마 빌더 (색상 편집, 미리보기, 활성화) | ✅ 완료 |
| theme.store.ts 스토어 | ✅ 완료 |
| ThemeBuilderPage UI | ✅ 완료 |
| i18n 키 ~80개 추가 (ko/en) | ✅ 완료 |

### Phase 8 확장 (엔터프라이즈)

| 항목 | 상태 |
|------|------|
| 배치 프로세싱 큐 (우선순위, 진행률, 일시정지/재개) | ✅ 완료 |
| batch.store.ts 스토어 | ✅ 완료 |
| BatchQueuePage UI | ✅ 완료 |
| 크로스 세션 인사이트 (클러스터, 패턴 분석) | ✅ 완료 |
| SessionInsightsPage UI | ✅ 완료 |
| 스마트 응답 캐싱 (해시, TTL, 히트 카운트) | ✅ 완료 |
| cache.store.ts 스토어 | ✅ 완료 |
| CacheControlPage UI | ✅ 완료 |
| 감사 로그 (10 액션, 필터, CSV/JSON 내보내기) | ✅ 완료 |
| audit.store.ts 스토어 + 테스트 8개 | ✅ 완료 |
| AuditLogPage UI | ✅ 완료 |
| i18n 키 ~70개 추가 (ko/en) | ✅ 완료 |
| 테스트 8개 추가 (871 total, 53 suites) | ✅ 완료 |

### Phase 9 확장 (스마트 UX & 멀티모달)

| 항목 | 상태 |
|------|------|
| AI 대시보드 홈 (위젯 그리드, 6종 위젯, 레이아웃 CRUD) | ✅ 완료 |
| dashboard.store.ts 스토어 + 테스트 12개 | ✅ 완료 |
| DashboardPage UI | ✅ 완료 |
| 멀티모달 채팅 (Vision, 카메라, Whisper, 드래그앤드롭) | ✅ 완료 |
| MultimodalInput 위젯 | ✅ 완료 |
| 대화 분석 자동화 (자동 태깅, 감정 분석, 스마트 제목) | ✅ 완료 |
| conversation-analysis.ts 유틸리티 + 테스트 24개 | ✅ 완료 |
| 고급 프롬프트 에디터 (풀스크린, 변수 자동완성, / 커맨드) | ✅ 완료 |
| AdvancedPromptEditor 위젯 | ✅ 완료 |
| 팀 워크스페이스 (멤버 관리, 공유 라이브러리, 활동 피드) | ✅ 완료 |
| workspace.store.ts 스토어 + 테스트 12개 | ✅ 완료 |
| WorkspacePage UI | ✅ 완료 |
| i18n 키 ~60개 추가 (ko/en) | ✅ 완료 |
| 테스트 48개 추가 (919 total, 56 suites) | ✅ 완료 |

### Phase 14 확장 (개발자 도구 & 코드 지원)

| 항목 | 상태 |
|------|------|
| 코드 스니펫 매니저 (snippet.store + SnippetPage) | ✅ 완료 |
| API 테스터 (api-tester.store + ApiTesterPage) | ✅ 완료 |
| 정규표현식 빌더 (regex-builder.store + RegexBuilderPage) | ✅ 완료 |
| 데이터 변환기 (data-converter.store + DataConverterPage) | ✅ 완료 |
| 다이어그램 에디터 (diagram-editor.store + DiagramEditorPage) | ✅ 완료 |
| 테스트 105개 추가 (1,242 total, 92 suites) | ✅ 완료 |

### 번들 최적화

| 항목 | 상태 |
|------|------|
| .gitignore에 .env* 추가 (보안) | ✅ 완료 |
| vite.config.ts 함수 기반 manualChunks (5개 vendor 청크) | ✅ 완료 |
| ChatPage 651KB → 27KB (-96%) | ✅ 완료 |
| index 500KB → 222KB (-56%) | ✅ 완료 |

### Phase 11 확장 (AI 고도화 & 데이터 인텔리전스)

| 항목 | 상태 |
|------|------|
| AI 멘토링 (mentoring.store + MentoringPage) | ✅ 완료 |
| 데이터 파이프라인 (data-pipeline.store + DataPipelinePage) | ✅ 완료 |
| AI 코드 리뷰어 (code-review.store + CodeReviewPage) | ✅ 완료 |
| 알림 센터 (notification.store + NotificationCenterPage) | ✅ 완료 |
| 비주얼 프롬프트 (visual-prompt.store + VisualPromptBuilderPage) | ✅ 완료 |
| 테스트 37개 추가 | ✅ 완료 |

### Phase 12 확장 (고급 자동화 & 분석 인텔리전스)

| 항목 | 상태 |
|------|------|
| AI 회의록 (meeting-notes.store + MeetingNotesPage) | ✅ 완료 |
| 스마트 보고서 (report-generator.store + ReportGeneratorPage) | ✅ 완료 |
| AI 학습 경로 (learning-path.store + LearningPathPage) | ✅ 완료 |
| 북마크 & 하이라이트 (bookmark.store + BookmarkPage) | ✅ 완료 |
| 번역 메모리 (translation-memory.store + TranslationMemoryPage) | ✅ 완료 |
| 테스트 37개 추가 | ✅ 완료 |

### Phase 13 확장 (커뮤니케이션 & 크리에이티브 AI)

| 항목 | 상태 |
|------|------|
| AI 프레젠테이션 (presentation.store + PresentationPage) | ✅ 완료 |
| 스마트 요약 피드 (summary-feed.store + SummaryFeedPage) | ✅ 완료 |
| AI 이메일 어시스턴트 (email-assistant.store + EmailAssistantPage) | ✅ 완료 |
| 대화 타임라인 (conversation-timeline.store + ConversationTimelinePage) | ✅ 완료 |
| AI 마인드맵 (mindmap.store + MindMapPage) | ✅ 완료 |
| 테스트 32개 추가 | ✅ 완료 |

### Phase 17 확장 (AI 하이퍼 인텔리전스 & 이머시브)

| 항목 | 상태 |
|------|------|
| AI 실시간 번역 통화 (live-translate.store + LiveTranslatePage) | ✅ 완료 |
| 스마트 문서 OCR 분석 (doc-analyzer.store + DocAnalyzerPage) | ✅ 완료 |
| AI 게임화 학습 (gamified-learning.store + GamifiedLearningPage) | ✅ 완료 |
| 데이터 스토리텔링 (data-story.store + DataStoryPage) | ✅ 완료 |
| 감정 일기 & 웰빙 (wellbeing.store + WellbeingPage) | ✅ 완료 |
| 테스트 39개 추가 (1,518 total, 126 suites) | ✅ 완료 |

### Phase 16 확장 (AI 에이전시 & 인터랙티브 인텔리전스)

| 항목 | 상태 |
|------|------|
| AI 페어 프로그래밍 (pair-programming.store + PairProgrammingPage) | ✅ 완료 |
| 스마트 대시보드 빌더 (dashboard-builder.store + DashboardBuilderPage) | ✅ 완료 |
| AI 문서 비교 (doc-compare.store + DocComparePage) | ✅ 완료 |
| 멀티에이전트 디베이트 (multi-agent-debate.store + MultiAgentDebatePage) | ✅ 완료 |
| AI 포트폴리오 (portfolio.store + PortfolioPage) | ✅ 완료 |
| 테스트 39개 추가 (1,479 total, 121 suites) | ✅ 완료 |

### Phase 10 확장 (AI 네이티브 & 모바일 퍼스트)

| 항목 | 상태 |
|------|------|
| MCP 서버 통합 (mcp.store + McpServersPage) | ✅ 완료 |
| AI 에이전트 자율 실행 (autonomous-agent.store + AutonomousAgentPage) | ✅ 완료 |
| 모바일 네이티브 UX (mobile-ux.store) | ✅ 완료 |
| 데이터 커넥터 (data-connector.store + DataConnectorsPage) | ✅ 완료 |
| 코드 인터프리터 (code-interpreter.store + CodeInterpreterPage) | ✅ 완료 |
| 테스트 39개 추가 (1,334 total, 101 suites) | ✅ 완료 |

### Phase 15 확장 (AI 인텔리전스 허브 & 차세대 UX)

| 항목 | 상태 |
|------|------|
| AI 음성 대화 (voice-chat.store + VoiceChatPage) | ✅ 완료 |
| 스마트 지식 그래프 (knowledge-graph.store + KnowledgeGraphPage) | ✅ 완료 |
| AI 코파일럿 (copilot.store + CopilotPanel + Cmd+J) | ✅ 완료 |
| 멀티모달 캔버스 (canvas.store + CanvasPage) | ✅ 완료 |
| AI 자동 워크플로우 (auto-workflow.store + AutoWorkflowPage) | ✅ 완료 |
| 테스트 53개 추가 (1,295 total, 97 suites) | ✅ 완료 |

### P0 보안 & 성능 개선

| 항목 | 상태 |
|------|------|
| 자격증명 AES-GCM 256-bit 암호화 (`crypto.ts`) | ✅ 완료 |
| SSE 스트리밍 rAF 쓰로틀 (`stream-throttle.ts`) | ✅ 완료 |
| 0% 커버리지 파일 테스트 추가 (7파일, 54 tests) | ✅ 완료 |
| 테스트 54개 추가 (973 total, 63 suites) | ✅ 완료 |

### Quick Wins 코드 품질 개선

| 항목 | 상태 |
|------|------|
| 12개 스토어 단위 테스트 추가 | ✅ 완료 |
| 6개 페이지 컴포넌트 테스트 추가 | ✅ 완료 |
| Zustand useShallow 최적화 (20+ 파일) | ✅ 완료 |
| React Error Boundary 최상위 적용 | ✅ 완료 |
| 테스트 164개 추가 (973 → 1137 tests, 63 → 82 suites) | ✅ 완료 |

---

## 관련 문서

| 문서 | 내용 |
|------|------|
| `CLAUDE.md` | 아키텍처, 커맨드, 배포 가이드 |
| `docs/todolist.md` | 상세 TODO 목록 (Phase 1-17 완료 + Phase 18 기획) |
| `docs/roadmap.md` | 향후 로드맵 (Phase 18 기획) |
| `docs/v2-implementation-plan.md` | v2-extension 이식 계획 |
| `docs/hchat-implementation-plan.md` | H Chat 이식 계획 |
| `docs/hchat-screenshot-analysis.md` | H Chat UI 심층 분석 |
| `docs/v2-screen-design.md` | v2 화면 설계 |
| `docs/hchat-feature-design.md` | H Chat 기능 분석 |

---

## 향후 계획

### Phase 10: AI 네이티브 & 모바일 퍼스트 (📋 기획)

| 기능 | 설명 | 공수 | 임팩트 |
|------|------|------|--------|
| **MCP 서버 통합** | Model Context Protocol, 외부 도구 동적 로드 | 2일 | 높음 |
| **AI 에이전트 자율 실행** | ReAct 패턴, 도구 자동 선택, 실행 트리 시각화 | 3일 | 높음 |
| **모바일 네이티브 UX** | 바텀 네비, 스와이프 제스처, PWA 공유 타겟 | 2일 | 높음 |
| **실시간 데이터 커넥터** | Google Sheets, Notion, GitHub 연동 | 2일 | 중간 |
| **AI 코드 인터프리터** | Pyodide 브라우저 Python, Jupyter 스타일 노트북 | 3일 | 높음 |

### Phase 11: AI 고도화 & 데이터 인텔리전스 (📋 기획)

| 기능 | 설명 | 공수 | 임팩트 |
|------|------|------|--------|
| **AI 멘토링 시스템** | 학습 목표, 소크라테스식 튜터, 진도 추적 | 2일 | 높음 |
| **데이터 파이프라인 빌더** | 데이터 소스 → 변환 → 시각화 자동화 | 3일 | 높음 |
| **AI 코드 리뷰어** | 다중 관점 리뷰, 인라인 코멘트, 수정 제안 | 2일 | 중간 |
| **스마트 알림 센터** | 알림 카테고리, 규칙 설정, Push Notification | 1일 | 중간 |
| **비주얼 프롬프트 빌더** | 드래그앤드롭 프롬프트 블록, 품질 점수 | 2일 | 중간 |

### Phase 12: 고급 자동화 & 분석 인텔리전스 (📋 기획)

| 기능 | 설명 | 공수 | 임팩트 |
|------|------|------|--------|
| **AI 회의록 작성기** | 음성/텍스트 → 자동 회의록, 액션 아이템 추출 | 2일 | 높음 |
| **스마트 보고서 생성기** | 데이터/대화 기반 자동 보고서, 차트 삽입 | 2일 | 높음 |
| **AI 학습 경로 추천** | 사용 패턴 분석 → 개인화 로드맵, 진도 추적 | 2일 | 중간 |
| **대화 북마크 & 하이라이트** | 메시지 하이라이트, 북마크 컬렉션, 검색 연동 | 1일 | 중간 |
| **AI 번역 메모리 (TM)** | 번역 쌍 저장, 유사 문장 매칭, 용어집 | 2일 | 높음 |

### Phase 13: 커뮤니케이션 & 크리에이티브 AI (📋 기획)

| 기능 | 설명 | 공수 | 임팩트 |
|------|------|------|--------|
| **AI 프레젠테이션 생성기** | 대화 기반 슬라이드 생성, 차트 삽입, 발표 노트 | 2일 | 높음 |
| **스마트 요약 피드** | 일간/주간 세션 요약, 인사이트 추출, Slack 전송 | 1일 | 중간 |
| **AI 이메일 어시스턴트** | 이메일 초안, 톤/길이 조절, 회신 생성 | 2일 | 높음 |
| **대화 타임라인 뷰** | 시각적 히스토리, 주제별 구간, 점프 네비 | 1일 | 중간 |
| **AI 마인드맵 생성기** | 대화/문서 → 마인드맵, Mermaid 렌더링, 내보내기 | 2일 | 높음 |

### AI 인텔리전스 허브 & 차세대 UX (Phase 15)

- **AI 음성 대화 모드** — Whisper STT → LLM → TTS 실시간 파이프라인, 핸즈프리 UX, 자동 듣기, 미니 플레이어
- **스마트 지식 그래프** — Cytoscape.js 인터랙티브 노드 맵, 엔티티/관계 관리, 타입별 필터, 검색
- **AI 코파일럿 모드** — `Cmd/Ctrl+J` 글로벌 플로팅 채팅, 미니/풀 모드, 컨텍스트 자동 감지
- **멀티모달 캔버스** — 무한 캔버스 (팬/줌), 6종 노드(텍스트/코드/이미지/다이어그램/채팅/링크), 드래그 배치, 연결선
- **AI 자동 워크플로우** — 반복 패턴 자동 감지, 워크플로우 제안, 수락/무시, 절감 효과 대시보드

### AI 에이전시 & 인터랙티브 인텔리전스 (Phase 16)

- **AI 페어 프로그래밍** — 코드 에디터 + AI 인라인 제안, 수락/거부, 디버그 어시스턴트
- **스마트 대시보드 빌더** — 드래그앤드롭 위젯 (chart/table/kpi/text/image), 공개/비공개
- **AI 문서 비교 분석기** — 사이드바이사이드 diff, 변경점 하이라이트 (added/removed/changed)
- **멀티에이전트 디베이트** — N개 에이전트 역할별 토론, 라운드 투표, 합의 도출
- **AI 포트폴리오 생성기** — 프로젝트 관리, 5개 테마, HTML 자동 생성, iframe 미리보기

### AI 하이퍼 인텔리전스 & 이머시브 경험 (Phase 17)

- **AI 실시간 번역 통화** — 양방향 음성 번역, 다국어 세션, 실시간 자막, 신뢰도 표시
- **스마트 문서 OCR 분석기** — 영수증/계약서/명함 자동 인식, 구조화 데이터 추출, 필드 테이블
- **AI 게임화 학습 시스템** — 퀴즈 배틀, XP/레벨/배지/스트릭, 점수 추적
- **인터랙티브 데이터 스토리텔링** — 챕터 기반 내러티브, 차트 타입 선택, 인사이트 카드
- **AI 감정 일기 & 웰빙 트래커** — 무드 5단계, 감정 그래프, 웰빙 리포트, 마인드풀니스

### Phase 18: AI 크리에이티브 스튜디오 & 라이프 인텔리전스 (📋 기획)

| 기능 | 설명 | 공수 | 임팩트 |
|------|------|------|--------|
| **AI 화이트보드 협업** | 실시간 멀티 유저 화이트보드, AI 드로잉 보조, 스티커/도형/텍스트, SVG 내보내기 | 3일 | 높음 |
| **스마트 계약서 생성기** | AI 법률 문서 초안, 조항 템플릿 라이브러리, 위험 조항 자동 감지 | 2일 | 높음 |
| **AI 사운드스케이프** | 집중/휴식 배경음 생성, 포모도로 타이머 연동, 자연음/로파이/화이트노이즈 | 2일 | 중간 |
| **인터랙티브 튜토리얼 빌더** | 단계별 가이드 생성, 스크린샷 어노테이션, HTML 내보내기 | 2일 | 높음 |
| **AI 습관 트래커 & 코치** | 습관 CRUD, 스트릭, AI 동기부여 메시지, 주간 진행 리포트 | 2일 | 중간 |

---

## 기여 및 개발

### 코드 스타일

- **불변성**: 항상 새 객체 생성 (변경 금지)
- **파일 크기**: 200-400줄, 최대 800줄
- **함수**: 50줄 이하
- **구조**: 기능/도메인별 (타입별 아님)

### 커밋 메시지

```
<타입>: <설명>

<선택적 본문>
```

타입: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `ci`

### 개발 워크플로우

1. **계획**: 복잡한 기능은 설계 문서 작성
2. **테스트 우선** (TDD): 테스트 작성 → 구현 → 리팩토링
3. **코드 리뷰**: 프로덕션 배포 전 검증
4. **커밋**: 의미 있는 커밋 메시지

---

## 라이선스

MIT

---

## 문의 및 지원

- **프로젝트**: github.com:sgtlim0/hchat-desktop.git
- **배포**: Vercel (Frontend) / Modal (Backend)
- **상태**: Phase 1-17 전체 완료 (85개 기능), 70 스토어, 73 페이지, 65K 코드, 1,518 tests, Phase 18 기획
