# src/entities/ — 엔티티 레이어

FSD 아키텍처의 엔티티 레이어. 22개 Zustand 기반 상태 관리 스토어를 포함합니다. 모든 비즈니스 로직과 데이터 영속성이 이 레이어에서 처리됩니다.

## 파일 구조

```
entities/
├── session/
│   └── session.store.ts       # 세션 및 메시지 관리
├── settings/
│   └── settings.store.ts      # 앱 설정 및 자격증명
├── project/
│   └── project.store.ts       # 프로젝트 관리
├── group-chat/
│   └── group-chat.store.ts    # 멀티 모델 그룹 채팅
├── channel/
│   └── channel.store.ts       # Slack/Telegram 채널 연동
├── memory/
│   └── memory.store.ts        # 메모리(컨텍스트) 관리
├── swarm/
│   └── swarm.store.ts         # 에이전트 스웜 오케스트레이션
├── schedule/
│   └── schedule.store.ts      # 스케줄 작업 관리
├── usage/
│   └── usage.store.ts         # 사용량 추적 + 카테고리별 분석
├── persona/
│   └── persona.store.ts       # 페르소나 (5 프리셋 + 커스텀)
├── prompt-library/
│   └── prompt-library.store.ts # 프롬프트 템플릿 CRUD
├── debate/
│   └── debate.store.ts        # 크로스 모델 토론
├── folder/
│   └── folder.store.ts        # 대화 폴더 (컬러 코딩)
├── tag/
│   └── tag.store.ts           # 대화 태그 (컬러 태그)
├── toast/
│   └── toast.store.ts         # 토스트 알림
├── translate/
│   └── translate.store.ts     # 문서 번역 워크플로우
├── doc-writer/
│   └── doc-writer.store.ts    # 문서 작성 마법사 (5단계)
├── artifact/
│   └── artifact.store.ts      # Canvas/Artifacts (버전 히스토리)
├── prompt-chain/
│   └── prompt-chain.store.ts  # 프롬프트 체이닝 (순차 실행, 조건 분기)
├── knowledge/
│   └── knowledge.store.ts     # 지식베이스 (문서 청킹, 검색)
├── workflow/
│   └── workflow.store.ts      # 워크플로우 빌더 (블록 파이프라인)
└── collab/
    └── collab.store.ts        # 실시간 협업 (룸, 초대 코드)
```

## 스토어별 상세

### SessionStore (`session.store.ts`)

앱의 핵심 스토어. 대화 세션과 메시지를 관리합니다.

| 상태 | 타입 | 설명 |
|------|------|------|
| `sessions` | `Session[]` | 모든 대화 세션 목록 |
| `messages` | `Record<string, Message[]>` | sessionId → 메시지 배열 매핑 |
| `currentSessionId` | `string \| null` | 현재 선택된 세션 |
| `view` | `ViewState` | 현재 표시 중인 페이지 |
| `isStreaming` | `boolean` | AI 응답 스트리밍 중 여부 |

주요 액션:
- `createSession()` — 새 세션 생성 및 이동
- `selectSession(id)` — 세션 선택 및 채팅 뷰 전환
- `sendMessage(content)` — 메시지 전송 및 AI 응답 스트리밍
- `goHome()` — 홈 뷰로 이동
- `setView(view)` — 뷰 상태 변경
- `hydrate()` — IndexedDB에서 데이터 복원

### SettingsStore (`settings.store.ts`)

앱 설정과 AI 프로바이더 자격증명을 관리합니다.

| 상태 | 설명 |
|------|------|
| `selectedModel` | 현재 선택된 AI 모델 |
| `darkMode` | 다크 모드 활성화 여부 |
| `sidebarOpen` | 사이드바 표시 여부 |
| `settingsOpen` | 설정 패널 표시 여부 |
| `credentials` | AWS/OpenAI/Gemini 자격증명 |
| `language` | UI 언어 (ko/en) |
| `systemPrompt` | 시스템 프롬프트 |

### ProjectStore (`project.store.ts`)

프로젝트 단위 대화 그룹화를 관리합니다.

| 상태 | 설명 |
|------|------|
| `projects` | 프로젝트 목록 |
| `selectedProjectId` | 현재 선택된 프로젝트 |

### GroupChatStore (`group-chat.store.ts`)

여러 AI 모델에 동시에 질문을 보내는 그룹 채팅 상태를 관리합니다. 각 모델별 응답을 병렬로 수신하고 비교합니다.

### ChannelStore (`channel.store.ts`)

대화 채널을 관리합니다. 채널별 설정과 멤버십을 처리합니다.

### MemoryStore (`memory.store.ts`)

AI 대화에서 추출한 컨텍스트 메모리를 관리합니다. 메모리 CRUD와 검색을 처리합니다.

### SwarmStore (`swarm.store.ts`)

다중 에이전트 오케스트레이션 상태를 관리합니다. 에이전트 구성, 실행, 결과를 추적합니다.

### ScheduleStore (`schedule.store.ts`)

반복 작업과 시간 기반 채팅 트리거를 관리합니다.

### UsageStore (`usage.store.ts`)

토큰 사용량 추적 및 비용 계산. 모델별/프로바이더별 통계, 카테고리별 분석(chat/translate/doc-write/ocr/image-gen/data-analysis).

### TranslateStore (`translate.store.ts`)

문서 번역 워크플로우 상태 관리. 엔진(LLM/브라우저), 소스/타겟 언어, 파일 목록, 진행률, 번역 결과.

### DocWriterStore (`doc-writer.store.ts`)

5단계 문서 작성 마법사. 프로젝트 설정, 컨텍스트, AI 목차 생성(JSON 파싱), 섹션별 AI 내용 스트리밍, MD/TXT 내보내기.

### ArtifactStore (`artifact.store.ts`)

Canvas/Artifacts 사이드 패널 상태 관리. 코드/HTML/SVG/Mermaid 아티팩트 CRUD, 버전 히스토리, 패널 열기/닫기, 리사이즈.

| 상태 | 타입 | 설명 |
|------|------|------|
| `artifacts` | `Record<string, Artifact[]>` | sessionId별 아티팩트 목록 |
| `activeArtifactId` | `string \| null` | 현재 활성 아티팩트 |
| `panelOpen` | `boolean` | 패널 열림 여부 |
| `panelWidth` | `number` | 패널 너비 (320-960px, localStorage 영속) |
| `viewMode` | `'preview' \| 'code'` | 미리보기/코드 전환 |

주요 액션:
- `createArtifact(params)` — 아티팩트 생성 (초기 버전 포함)
- `addVersion(artifactId, content)` — 새 버전 추가
- `openArtifact(id)` / `closePanel()` — 패널 제어
- `setCurrentVersion(id, index)` — 버전 전환
- `hydrate(sessionId)` — IndexedDB에서 복원

### PromptChainStore (`prompt-chain.store.ts`)

프롬프트 체이닝 실행 엔진. 순차 실행 체인 정의, 단계별 결과 자동 연결, 조건부 분기(IF-THEN-ELSE).

| 상태 | 설명 |
|------|------|
| `chains` | 체인 목록 |
| `currentChainId` | 현재 선택된 체인 |
| `isRunning` | 실행 중 여부 |

### KnowledgeStore (`knowledge.store.ts`)

지식베이스 문서 관리. 문서 업로드 → 자동 청킹(~500자) → 키워드 검색.

| 상태 | 설명 |
|------|------|
| `documents` | 문서 목록 |
| `selectedDocumentId` | 선택된 문서 |
| `searchQuery` / `searchResults` | 검색 상태 |

### WorkflowStore (`workflow.store.ts`)

워크플로우 빌더 상태 관리. 6개 블록 타입, 3개 트리거, 블록 연결, 실행/중단.

| 상태 | 설명 |
|------|------|
| `workflows` | 워크플로우 목록 |
| `currentWorkflowId` | 선택된 워크플로우 |
| `isRunning` | 실행 중 여부 |
| `blockResults` | 블록별 실행 결과 |

### CollabStore (`collab.store.ts`)

실시간 협업 룸 관리. 룸 생성/참여, 초대 코드, 채팅 메시지, 타이핑 표시, 권한.

| 상태 | 설명 |
|------|------|
| `rooms` | 룸 목록 |
| `currentRoomId` | 현재 룸 |
| `messages` | 채팅 메시지 |
| `isConnected` | 연결 상태 |

### PersonaStore, PromptTemplateStore, DebateStore, FolderStore, TagStore, ToastStore

각각 페르소나 관리, 프롬프트 템플릿 CRUD, 크로스 모델 토론, 대화 폴더(컬러 코딩), 대화 태그(컬러), 토스트 알림.

## 데이터 영속성

모든 스토어는 IndexedDB(Dexie)와 연동됩니다:

```
사용자 액션 → Zustand 상태 변경 → IndexedDB 저장 (비동기)
앱 마운트 → hydrate() → IndexedDB 로드 → Zustand 상태 복원
```

`src/shared/lib/db.ts`에서 Dexie 데이터베이스 스키마를 정의합니다.

## 사용 패턴

```typescript
// 컴포넌트에서 스토어 사용
const { sessions, selectSession } = useSessionStore()
const { darkMode, toggleDarkMode } = useSettingsStore()
```

스토어 훅을 직접 호출하여 상태에 접근합니다. Props drilling 없이 어디서든 접근 가능합니다.
