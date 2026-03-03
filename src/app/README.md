# src/app/ — 앱 레이아웃 레이어

FSD 아키텍처의 최상위 레이어. 앱 전체 레이아웃, 뷰 라우팅, 전역 키보드 단축키를 담당합니다.

## 파일 구조

```
app/
└── layouts/
    └── MainLayout.tsx    # 메인 레이아웃 + 뷰 라우터
```

## MainLayout.tsx

앱의 진입점 컴포넌트. 세 가지 핵심 역할을 수행합니다.

### 1. 뷰 라우팅

React Router 없이 Zustand `view` 상태로 페이지를 전환합니다.

```
SessionStore.view (ViewState) → renderContent() → 페이지 컴포넌트
```

지원하는 뷰 상태:
- `home` → HomeScreen
- `chat` → ChatPage
- `allChats` → AllChatsScreen
- `projects` → ProjectsScreen
- `projectDetail` → ProjectDetailScreen
- `settings` → SettingsScreen
- `quickChat` → QuickChatPage
- `groupChat` → GroupChatPage
- `memory` → MemoryPanel
- `agentSwarm` → AgentSwarmBuilder
- `schedule` → ScheduleManager
- `promptLibrary` → PromptLibraryPage
- `debate` → DebatePage
- `aiTools` → AiToolsPage
- `imageGen` → ImageGenPage
- `agent` → AgentPage
- `translate` → TranslatePage
- `docWriter` → DocWriterPage
- `ocr` → OcrPage

### 2. 키보드 단축키

전역 `keydown` 이벤트 리스너로 단축키를 처리합니다.

| 단축키 | 동작 |
|--------|------|
| `Cmd/Ctrl + K` | 검색 모달 토글 |
| `Cmd/Ctrl + B` | 사이드바 토글 |
| `Cmd/Ctrl + ,` | 설정 토글 |

### 3. 데이터 하이드레이션

앱 마운트 시 IndexedDB에서 저장된 데이터를 복원합니다.

```
useEffect → SessionStore.hydrate() → IndexedDB 데이터 로드
```

## 의존성

- **SessionStore** — 현재 뷰, 세션 목록
- **SettingsStore** — 사이드바/설정 상태, 다크 모드
- **Sidebar** 위젯 — 좌측 네비게이션
- **SearchModal** 위젯 — 검색 오버레이
- **HeaderTabs** 위젯 — 도구 탭 바 (home/translate/docWriter/ocr)
- 모든 **Pages** 컴포넌트
