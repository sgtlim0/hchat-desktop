# H Chat Desktop

AI 모델(Claude, GPT, Gemini)과 대화하는 Progressive Web App. 멀티 프로바이더, 실시간 스트리밍, 고급 AI 도구, 로컬 저장, PWA 지원.

**상태**: 100% 완료 (70/70 TODO 항목) + Phase 1 비서 마켓플레이스 | **테스트**: 667 tests, 41 suites, 83% 커버리지 | **배포**: Vercel (Frontend) + Modal (Backend)

---

## 주요 기능

### 비서 마켓플레이스 (홈 화면)

- **8개 공식 비서** — 신중한 분석가, 빠른 대화, 문서 검토, 문서 번역, 보고서 작성, 코드 리뷰, 데이터 분석, 이메일 작성
- **카테고리 필터** — 전체/대화/업무/번역/분석/보고/그림/글쓰기 8개 카테고리
- **내 비서 탭** — 커스텀 페르소나를 비서로 활용 (페르소나 시스템 연동)
- **원클릭 세션** — 비서 카드 클릭 → 해당 모델 + 시스템 프롬프트로 즉시 대화 시작

### 핵심 채팅

- **멀티 프로바이더** — AWS Bedrock (Claude Opus/Sonnet/Haiku), OpenAI (GPT-4o/4 Turbo), Google Gemini Pro 지원
- **실시간 스트리밍** — SSE 기반 토큰 단위 응답 스트리밍 (네트워크 효율성 최적화)
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

- **로컬 저장** — IndexedDB (Dexie v4)로 모든 대화 영구 저장 (오프라인 접근)
- **전체 백업/복원** — 13개 테이블 JSON 내보내기/가져오기 (데이터 포팅 용이)
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

---

## 기술 스택

| 영역 | 기술 | 버전 |
|------|------|------|
| **Frontend** | React | 19 |
| | TypeScript | 5.9 |
| | Vite | 7 |
| | Tailwind CSS | 3 |
| **상태관리** | Zustand | 5 |
| **DB (Local)** | Dexie (IndexedDB) | 4.3 |
| **Markdown** | react-markdown | 10.1 |
| | react-syntax-highlighter | 16.1 |
| | remark-gfm | 4.0 |
| **문서 처리** | pdfjs-dist | 5.5 |
| | jspdf | 4.2 |
| | xlsx (SheetJS) | 0.18 |
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
│   ├── pages/                 # 15개 페이지 컴포넌트
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
│   │   └── debate/            # 크로스 모델 토론
│   │
│   ├── widgets/               # 복합 UI 위젯
│   │   ├── message-list/      # 메시지 목록 (가상화, 마크다운)
│   │   ├── prompt-input/      # 프롬프트 입력 (음성, 도구)
│   │   ├── sidebar/           # 네비게이션 사이드바
│   │   ├── search-modal/      # 검색 모달
│   │   ├── chat-header/       # 채팅 헤더 (내보내기 등)
│   │   ├── ai-tools/          # AI 도구 패널
│   │   └── ...
│   │
│   ├── entities/              # Zustand 스토어 (15개)
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
│   │   └── toast/                 # 토스트 알림
│   │
│   └── shared/
│       ├── ui/                # 12개 재사용 UI 컴포넌트
│       │   ├── button.tsx
│       │   ├── avatar.tsx
│       │   ├── toggle.tsx
│       │   ├── AssistantCard.tsx   # 비서 카드 컴포넌트
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

Dexie v4로 15개 스토어 모두 자동 저장. 페이지 새로고침 후 자동 복구.

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

- **전체**: 83% (목표: 80%+)
- **테스트 수**: 667 tests
- **테스트 스위트**: 41 suites
- **테스트 타입**:
  - **단위**: 유틸리티, 스토어, 프로바이더 (Vitest)
  - **통합**: UI 컴포넌트, API 호출 (React Testing Library)
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
| **전체** | **70** | **70** | **100%** |

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

---

## 관련 문서

| 문서 | 내용 |
|------|------|
| `CLAUDE.md` | 아키텍처, 커맨드, 배포 가이드 |
| `docs/todolist.md` | 상세 TODO 목록 (70/70 + Phase 1) |
| `docs/roadmap.md` | 향후 로드맵 (Phase 2~4) |
| `docs/v2-implementation-plan.md` | v2-extension 이식 계획 |
| `docs/hchat-implementation-plan.md` | H Chat 이식 계획 |
| `docs/hchat-screenshot-analysis.md` | H Chat UI 심층 분석 |
| `docs/v2-screen-design.md` | v2 화면 설계 |
| `docs/hchat-feature-design.md` | H Chat 기능 분석 |

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
- **상태**: 100% 기능 완성, 정기적 유지보수
