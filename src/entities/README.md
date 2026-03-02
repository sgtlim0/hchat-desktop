# src/entities/ — 엔티티 레이어

FSD 아키텍처의 엔티티 레이어. Zustand 기반 상태 관리 스토어를 포함합니다. 모든 비즈니스 로직과 데이터 영속성이 이 레이어에서 처리됩니다.

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
│   └── channel.store.ts       # 채널 관리
├── memory/
│   └── memory.store.ts        # 메모리(컨텍스트) 관리
├── swarm/
│   └── swarm.store.ts         # 에이전트 스웜 오케스트레이션
└── schedule/
    └── schedule.store.ts      # 스케줄 작업 관리
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
