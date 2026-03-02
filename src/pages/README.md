# src/pages/ — 페이지 레이어

FSD 아키텍처의 페이지 레이어. 각 뷰 상태에 대응하는 화면 컴포넌트를 제공합니다. `MainLayout`의 `renderContent()`에서 `view` 값에 따라 렌더링됩니다.

## 파일 구조

```
pages/
├── home/
│   └── HomeScreen.tsx           # 홈 화면
├── chat/
│   ├── ChatPage.tsx             # 채팅 화면
│   └── ChatHeader.tsx           # 채팅 헤더
├── all-chats/
│   └── AllChatsScreen.tsx       # 전체 대화 목록
├── settings/
│   └── SettingsScreen.tsx       # 설정 화면
├── projects/
│   ├── ProjectsScreen.tsx       # 프로젝트 목록
│   └── ProjectDetailScreen.tsx  # 프로젝트 상세
├── quick-chat/
│   └── QuickChatPage.tsx        # 빠른 채팅
├── group-chat/
│   └── GroupChatPage.tsx        # 그룹 채팅 (멀티 모델)
├── memory/
│   └── MemoryPanel.tsx          # 메모리 관리
├── swarm/
│   └── AgentSwarmBuilder.tsx    # 에이전트 스웜
└── schedule/
    └── ScheduleManager.tsx      # 스케줄 관리
```

## 페이지별 상세

### HomeScreen

앱 진입 시 표시되는 홈 화면. 빠른 액션 버튼(새 대화, 프로젝트 등)과 최근 대화 목록을 표시합니다.

### ChatPage / ChatHeader

핵심 채팅 인터페이스. `MessageList` 위젯과 `PromptInput` 위젯을 조합합니다. `ChatHeader`는 현재 모델명, 세션 제목, 액션 버튼을 표시합니다.

### AllChatsScreen

모든 대화 세션을 시간순으로 나열합니다. 세션 검색, 삭제, 선택 기능을 제공합니다.

### SettingsScreen

앱 설정을 관리합니다:
- AI 프로바이더 자격증명 (AWS, OpenAI, Gemini)
- 모델 선택 및 연결 테스트
- 다크 모드 토글
- 언어 설정 (한국어/영어)
- 시스템 프롬프트 설정

### ProjectsScreen / ProjectDetailScreen

프로젝트 단위로 대화를 그룹화합니다. 프로젝트별 대화 목록, 컨텍스트 설정을 관리합니다.

### QuickChatPage

사이드바 없는 경량 채팅 모드. 빠른 질문-응답에 최적화되어 있습니다.

### GroupChatPage

여러 AI 모델에 동시에 동일한 질문을 보내고 응답을 나란히 비교합니다. `GroupChatStore`로 상태를 관리합니다.

### MemoryPanel

AI 대화에서 추출한 메모리(컨텍스트)를 관리합니다. 메모리 추가/삭제/검색 기능을 제공합니다.

### AgentSwarmBuilder

다중 에이전트 오케스트레이션 인터페이스. 에이전트를 구성하고 협업 워크플로우를 설계합니다.

### ScheduleManager

자동 실행될 채팅 작업을 스케줄링합니다. 반복 작업, 시간 기반 트리거를 설정합니다.

## 규칙

- 각 페이지는 Zustand 스토어에 직접 접근하여 데이터를 가져옵니다
- 페이지 간 직접 import는 없습니다 (FSD 원칙)
- 복합 UI는 `widgets/` 레이어의 컴포넌트를 사용합니다
- 페이지 전환은 `store.setView()` 또는 `store.selectSession()` 액션으로 수행합니다
