# src/shared/ — 공유 레이어

FSD 아키텍처의 공유 레이어. 재사용 가능한 UI 컴포넌트, 유틸리티, 타입 정의, AI 프로바이더, i18n을 포함합니다.

## 파일 구조

```
shared/
├── ui/                          # 재사용 UI 컴포넌트 (11개)
│   ├── Avatar.tsx               # 사용자/AI 아바타
│   ├── Button.tsx               # 범용 버튼
│   ├── FormInput.tsx            # 폼 입력 필드
│   ├── FormLabel.tsx            # 폼 라벨
│   ├── IconButton.tsx           # 아이콘 버튼
│   ├── InputField.tsx           # 텍스트 입력 필드
│   ├── QuickActionChip.tsx      # 빠른 액션 칩
│   ├── SettingsTabItem.tsx      # 설정 탭 항목
│   ├── SidebarItem.tsx          # 사이드바 항목
│   ├── Toggle.tsx               # 토글 스위치
│   └── ToolCallBlockItem.tsx    # 도구 호출 블록 항목
├── lib/                         # 유틸리티 및 프로바이더
│   ├── bedrock-client.ts        # AWS Bedrock 클라이언트 (SSE 스트리밍)
│   ├── providers/               # 멀티 프로바이더 시스템
│   │   ├── types.ts             # 프로바이더 공통 인터페이스
│   │   ├── factory.ts           # 프로바이더 팩토리
│   │   ├── openai.ts            # OpenAI 프로바이더
│   │   ├── gemini.ts            # Google Gemini 프로바이더
│   │   └── router.ts            # 자동 라우팅 로직
│   ├── db.ts                    # IndexedDB/Dexie 데이터베이스
│   ├── mock-data.ts             # 개발용 목 데이터
│   ├── export-chat.ts           # 채팅 내보내기 (JSON/TXT)
│   ├── model-meta.ts            # 모델 메타데이터 (이름, 아이콘 등)
│   └── time.ts                  # 시간 포맷팅 유틸리티
├── i18n/                        # 다국어 시스템
│   ├── index.ts                 # i18n 훅 및 초기화
│   ├── ko.ts                    # 한국어 번역
│   └── en.ts                    # 영어 번역
├── types/
│   └── index.ts                 # TypeScript 타입 정의
├── constants.ts                 # 앱 상수 (모델 목록, 기본값)
└── styles/
    └── globals.css              # CSS 변수, 테마, 전역 스타일
```

## 주요 모듈 상세

### UI 컴포넌트 (`ui/`)

프레젠테이션 전용 컴포넌트. 비즈니스 로직 없이 props로만 동작합니다.

| 컴포넌트 | 용도 |
|----------|------|
| `Avatar` | 사용자/AI 프로필 아바타, 모델별 색상 |
| `Button` | 범용 버튼, variant/size props |
| `FormInput` | 라벨이 포함된 폼 입력 |
| `FormLabel` | 폼 필드 라벨 |
| `IconButton` | 아이콘만 있는 버튼 |
| `InputField` | 텍스트 입력 필드 |
| `QuickActionChip` | 홈 화면 빠른 액션 버튼 |
| `SettingsTabItem` | 설정 화면 탭 항목 |
| `SidebarItem` | 사이드바 네비게이션 항목 |
| `Toggle` | On/Off 토글 스위치 |
| `ToolCallBlockItem` | 도구 호출 결과 블록 |

### 멀티 프로바이더 시스템 (`lib/providers/`)

AI 모델 프로바이더를 추상화하는 팩토리 패턴입니다.

**`types.ts`** — 공통 인터페이스:
```typescript
interface ChatProvider {
  streamChat(params): AsyncGenerator<ChatStreamEvent>
  testConnection(credentials, modelId): Promise<TestResult>
}
```

**`factory.ts`** — 모델 ID에 따라 적절한 프로바이더를 생성:
- `claude-*`, `us.anthropic.*` → Bedrock 프로바이더
- `gpt-*` → OpenAI 프로바이더
- `gemini-*` → Gemini 프로바이더

**`openai.ts`** — OpenAI API 직접 호출 (SSE 스트리밍)

**`gemini.ts`** — Google Gemini API 직접 호출 (SSE 스트리밍)

**`router.ts`** — 프롬프트 내용에 따라 최적 모델을 자동 선택하는 라우팅 로직

### Bedrock 클라이언트 (`lib/bedrock-client.ts`)

AWS Bedrock API를 SSE 스트리밍으로 호출합니다. `VITE_API_BASE_URL` 환경변수로 로컬 프록시와 Modal 백엔드를 전환합니다.

- `streamChat()` — SSE 스트리밍 AsyncGenerator
- `testConnection()` — 자격증명 검증

### IndexedDB (`lib/db.ts`)

Dexie를 사용한 로컬 데이터베이스. 세션, 메시지, 설정을 IndexedDB에 영구 저장합니다. 페이지 새로고침 후에도 데이터가 유지됩니다.

### i18n (`i18n/`)

외부 라이브러리 없는 커스텀 다국어 시스템.

- `useTranslation()` 훅으로 번역 함수 `t()` 제공
- `ko.ts` / `en.ts`에 번역 키-값 정의
- SettingsStore의 `language` 상태와 연동

### 타입 정의 (`types/index.ts`)

모든 TypeScript 인터페이스를 중앙 관리합니다.

주요 타입:
- `Message` — 메시지 (segments, role, attachments)
- `MessageSegment` — 텍스트/도구 세그먼트
- `Session` — 대화 세션
- `ViewState` — 뷰 라우팅 상태
- `AwsCredentials` — AWS 자격증명
- `ChatStreamEvent` — SSE 스트림 이벤트 (`text | done | error`)
- `Project` — 프로젝트

### 상수 (`constants.ts`)

앱 전역 상수를 정의합니다.

- `MODELS` — 지원 모델 목록 (이름, ID, 프로바이더)
- `BEDROCK_MODEL_MAP` — 프론트엔드 모델 ID → Bedrock 모델 ID 매핑
- `DEFAULT_MODEL` — 기본 선택 모델
- 레이아웃 상수 (사이드바 너비 등)

### 테마 (`styles/globals.css`)

CSS 변수 기반 라이트/다크 테마 시스템.

```css
:root {
  --color-primary: ...;
  --color-page: ...;
  --color-sidebar: ...;
  --color-text-primary: ...;
}

.dark {
  --color-primary: ...;
  /* 다크 모드 값 오버라이드 */
}
```

Tailwind의 `extend.colors`에서 이 CSS 변수를 참조합니다.
