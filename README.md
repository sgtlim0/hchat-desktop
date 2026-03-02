# H Chat Desktop

AI 모델(Claude, GPT, Gemini)과 대화할 수 있는 Progressive Web App 채팅 인터페이스.

## 주요 기능

- **멀티 프로바이더** — AWS Bedrock (Claude Opus/Sonnet/Haiku), OpenAI (GPT-4o), Google Gemini 지원
- **실시간 스트리밍** — SSE 기반 토큰 단위 응답 스트리밍
- **그룹 채팅** — 여러 모델에 동시 질문, 응답 비교
- **PWA** — 오프라인 지원, 설치 가능, 앱과 동일한 UX
- **로컬 저장** — IndexedDB(Dexie)로 모든 대화 로컬 영구 저장
- **다국어** — 한국어/영어 전환 (커스텀 i18n)
- **다크 모드** — CSS 변수 기반 라이트/다크 테마

## 기술 스택

| 영역 | 기술 |
|------|------|
| Frontend | React 19, TypeScript 5.9, Vite 7 |
| 상태관리 | Zustand 5 |
| 스타일링 | Tailwind CSS 3, CSS Variables |
| 마크다운 | react-markdown, react-syntax-highlighter, remark-gfm |
| 아이콘 | Lucide React |
| 로컬 DB | Dexie (IndexedDB) |
| PWA | vite-plugin-pwa |
| Backend | Python, FastAPI, Modal (서버리스) |
| AI API | AWS Bedrock, OpenAI API, Google Gemini API |

## 시작하기

```bash
npm install          # 의존성 설치
npm run dev          # 개발 서버 (localhost:5173)
npm run build        # 프로덕션 빌드
npm run preview      # 빌드 미리보기
npm run lint         # ESLint 검사
```

## 프로젝트 구조

```
hchat-pwa/
├── src/
│   ├── app/              # 앱 레이아웃, 뷰 라우팅, 키보드 단축키
│   ├── pages/            # 12개 페이지 (홈, 채팅, 설정, 프로젝트 등)
│   ├── widgets/          # 복합 위젯 (메시지 목록, 입력창, 사이드바, 검색)
│   ├── entities/         # Zustand 스토어 (세션, 설정, 프로젝트 등 8개)
│   └── shared/           # 공유 UI 컴포넌트, 유틸리티, 타입, 프로바이더
├── backend/              # Modal 서버리스 백엔드 (FastAPI + Bedrock)
├── public/               # 정적 리소스 (아이콘, manifest)
└── docs/                 # 설계 문서
```

> **Feature-Sliced Design (FSD)** 아키텍처를 따릅니다. 각 디렉토리의 상세 설명은 해당 디렉토리의 `README.md`를 참조하세요.

## 아키텍처 핵심 결정

### 뷰 기반 라우팅 (React Router 없음)

Zustand의 `view` 상태로 페이지를 전환합니다. `MainLayout.renderContent()`가 `view` 값에 따라 적절한 페이지 컴포넌트를 렌더링합니다.

```
사용자 액션 → store.setView('chat') → MainLayout → ChatPage 렌더링
```

### 멀티 프로바이더 팩토리

`ProviderFactory`가 선택된 모델에 따라 적절한 프로바이더(Bedrock/OpenAI/Gemini)를 생성합니다. 모든 프로바이더는 동일한 스트리밍 인터페이스를 구현합니다.

### 메시지 세그먼트 구조

메시지는 `MessageSegment[]` 배열로 구성됩니다. 각 세그먼트는 `text` 또는 `tool` 타입으로, 텍스트와 도구 호출을 유연하게 혼합할 수 있습니다.

## 백엔드 (Modal)

```bash
pip install modal             # Modal CLI 설치
modal serve backend/app.py    # 로컬 개발 서버
modal deploy backend/app.py   # 프로덕션 배포
```

- **Production**: `https://sgtlim0--hchat-api-api.modal.run`
- **Endpoints**: `POST /api/chat` (SSE 스트리밍), `POST /api/chat/test` (연결 테스트), `GET /api/health`

## 배포

- **Frontend**: Vercel (`vercel --prod`)
- **Backend**: Modal (`modal deploy backend/app.py`)
- **환경변수**: `VITE_API_BASE_URL` — Modal API URL (프로덕션)

## 키보드 단축키

| 단축키 | 기능 |
|--------|------|
| `Cmd/Ctrl + K` | 검색 모달 |
| `Cmd/Ctrl + B` | 사이드바 토글 |
| `Cmd/Ctrl + ,` | 설정 토글 |
