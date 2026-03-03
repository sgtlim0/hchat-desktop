# src/pages/ — 페이지 레이어

FSD 아키텍처의 페이지 레이어. 18개 뷰 상태에 대응하는 화면 컴포넌트를 제공합니다. `MainLayout`의 `renderContent()`에서 `view` 값에 따라 렌더링됩니다.

## 파일 구조

```
pages/
├── home/
│   └── HomeScreen.tsx           # 홈 화면 (비서 마켓플레이스)
├── chat/
│   ├── ChatPage.tsx             # 채팅 화면
│   └── ChatHeader.tsx           # 채팅 헤더
├── all-chats/
│   └── AllChatsScreen.tsx       # 전체 대화 목록
├── settings/
│   ├── SettingsScreen.tsx       # 설정 화면
│   └── RoiDashboard.tsx         # ROI 대시보드
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
├── schedule/
│   └── ScheduleManager.tsx      # 스케줄 관리
├── agent/
│   └── AgentPage.tsx            # AI 에이전트 모드
├── ai-tools/
│   └── AiToolsPage.tsx          # AI 도구 패널
├── image-gen/
│   └── ImageGenPage.tsx         # 이미지 생성
├── prompt-library/
│   └── PromptLibraryPage.tsx    # 프롬프트 라이브러리
├── debate/
│   └── DebatePage.tsx           # 크로스 모델 토론
├── translate/
│   └── TranslatePage.tsx        # 문서 번역
├── doc-writer/
│   └── DocWriterPage.tsx        # 문서 작성 마법사
└── ocr/
    └── OcrPage.tsx              # OCR 텍스트 추출
```

## 페이지별 상세

### HomeScreen

앱 진입 시 표시되는 홈 화면. 빠른 액션 버튼(새 대화, 프로젝트 등)과 최근 대화 목록을 표시합니다.

### ChatPage / ChatHeader

핵심 채팅 인터페이스. `flex-row` split layout으로 구성:
- **ChatColumn** (`flex-1`): ChatHeader + MessageList + PromptInput
- **ResizeHandle** + **ArtifactPanel** (panelOpen 시 조건부 렌더링)

`ArtifactPanel`은 코드/HTML/SVG/Mermaid 미리보기를 제공하며, 모바일에서는 `fixed overlay`로 표시됩니다. 세션 변경 시 `hydrate(sessionId)`로 아티팩트를 복원합니다.

`ChatHeader`는 현재 모델명, 세션 제목, 액션 버튼을 표시합니다.

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

### TranslatePage

파일 업로드 → 텍스트 추출 → LLM 청크 번역 → 결과 다운로드. `TranslateStore`로 상태를 관리합니다. PDF/TXT/MD 지원, 진행률 바, AbortController 중단.

### DocWriterPage

5단계 문서 작성 마법사. 프로젝트 설정 → 배경지식 입력 → AI 목차 생성 → 섹션별 AI 내용 작성 → MD/TXT 내보내기. `DocWriterStore`로 상태를 관리합니다.

### OcrPage

이미지에서 텍스트를 추출하는 OCR 도구. tesseract.js 기반 클라이언트 OCR, 배치 처리(최대 20개), 4개 언어(한+영/영/일+영/중+영). 결과 복사 및 TXT 다운로드.

### AgentPage

에이전트 모드 인터페이스. XML 도구 호출(웹 검색, 메모리, 스케줄, 파일), 다단계 실행 루프.

### AiToolsPage

11가지 AI 글쓰기 도구 + 문법 검사 + 요약 + 문서 건강 검사.

### ImageGenPage

DALL-E 3 기반 텍스트→이미지 생성. 프롬프트 입력, 이미지 미리보기, 다운로드.

### PromptLibraryPage

프롬프트 템플릿 CRUD, 카테고리 필터, `{{variable}}` 변수 렌더링.

### DebatePage

2-3개 AI 모델 크로스 토론. 3라운드 자동 토론, 합의 요약 생성.

## 규칙

- 각 페이지는 Zustand 스토어에 직접 접근하여 데이터를 가져옵니다
- 페이지 간 직접 import는 없습니다 (FSD 원칙)
- 복합 UI는 `widgets/` 레이어의 컴포넌트를 사용합니다
- 페이지 전환은 `store.setView()` 또는 `store.selectSession()` 액션으로 수행합니다
