# src/shared/ — 공유 레이어

FSD 아키텍처의 공유 레이어. 재사용 가능한 UI 컴포넌트, 유틸리티, 타입 정의, AI 프로바이더, i18n을 포함합니다.

## 파일 구조

```
shared/
├── ui/                          # 재사용 UI 컴포넌트 (14개)
│   ├── Avatar.tsx               # 사용자/AI 아바타
│   ├── Button.tsx               # 범용 버튼
│   ├── ErrorBoundary.tsx        # React Error Boundary (i18n, 다크 모드)
│   ├── FormInput.tsx            # 폼 입력 필드
│   ├── FormLabel.tsx            # 폼 라벨
│   ├── IconButton.tsx           # 아이콘 버튼
│   ├── InputField.tsx           # 텍스트 입력 필드
│   ├── QuickActionChip.tsx      # 빠른 액션 칩
│   ├── SettingsTabItem.tsx      # 설정 탭 항목
│   ├── SidebarItem.tsx          # 사이드바 항목
│   ├── Toggle.tsx               # 토글 스위치
│   ├── ToolCallBlockItem.tsx    # 도구 호출 블록 항목
│   ├── AssistantCard.tsx        # 비서 카드 컴포넌트
│   └── ToastContainer.tsx       # 토스트 알림 컨테이너
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
│   ├── time.ts                  # 시간 포맷팅 유틸리티
│   ├── translate.ts             # 번역 유틸리티 (청크 분할, 텍스트 추출, LLM 번역)
│   ├── ocr.ts                   # OCR 래퍼 (tesseract.js, 4개 언어, 배치 처리)
│   ├── artifact-detector.ts     # 아티팩트 자동 감지 (코드블록 파싱, 타입 추론)
│   ├── conversation-analysis.ts # 대화 분석 (자동 태깅, 감정 분석, 스마트 제목)
│   ├── crypto.ts                # 자격증명 암호화 (AES-GCM 256-bit, Web Crypto API)
│   ├── stream-throttle.ts       # SSE 스트리밍 rAF 쓰로틀 (~60fps)
│   ├── search-intent.ts         # 검색 의도 감지 (키워드/정규식)
│   ├── web-search.ts            # 웹 검색 (DuckDuckGo 프록시)
│   ├── pdf-extractor.ts         # PDF 텍스트 추출
│   └── token-estimator.ts       # 토큰 추정
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
| `ErrorBoundary` | React 에러 바운더리, 렌더링 오류 복구 UI |
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

**`proxy-sse.ts`** — 백엔드 SSE 프록시 스트림 파서. `data: {...}\n\n` 형식을 AsyncGenerator로 변환

### 자격증명 암호화 (`lib/crypto.ts`)

Web Crypto API 기반 AES-GCM 256-bit 암호화. 암호화 키는 IndexedDB에 저장 (localStorage 분리).

- `encrypt(plaintext)` — 평문 → 암호화 (IV + ciphertext base64)
- `decrypt(ciphertext)` — 암호화 → 평문
- `decryptWithMigration(raw, onMigrate)` — 복호화 실패 시 평문으로 간주, 자동 암호화 마이그레이션
- Web Crypto 미지원 환경 fallback: base64 인코딩

### SSE 스트리밍 쓰로틀 (`lib/stream-throttle.ts`)

requestAnimationFrame 기반 렌더링 쓰로틀. SSE 이벤트가 100+/sec 수신되어도 ~60fps로 UI 업데이트.

- `createStreamThrottle()` → `{ update, flush, cancel }`
- `update(text, callback)` — rAF 프레임에 콜백 배치
- `flush(callback)` — 보류 중인 텍스트 즉시 플러시
- `cancel()` — 보류 취소 및 정리

### Bedrock 클라이언트 (`lib/bedrock-client.ts`)

AWS Bedrock API를 SSE 스트리밍으로 호출합니다. `VITE_API_BASE_URL` 환경변수로 엔드포인트를 전환합니다.

```
API_BASE = import.meta.env.VITE_API_BASE_URL || ''
- 빈값 (개발) → /api/chat (Vite 프록시)
- Modal URL (프로덕션) → https://sgtlim0--hchat-api-api.modal.run/api/chat
```

- `streamChat()` — SSE 스트리밍 AsyncGenerator (`data: {"type":"text","content":"..."}\n\n`)
- `testConnection()` — 자격증명 검증 (`{"success": true/false}`)

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
- `Artifact` / `ArtifactVersion` — Canvas 아티팩트 및 버전
- `ArtifactType` — `'code' | 'html' | 'svg' | 'mermaid'`
- `PinnedMessage` — 핀 메시지 (컨텍스트 매니저)
- `ContextTemplate` — 컨텍스트 템플릿 (코딩/글쓰기/분석/일반)
- `PromptQualityScore` — 프롬프트 품질 점수 (명확성, 구체성)
- `ModelRecommendation` — 최적 모델 추천
- `InsightReport` — AI 인사이트 리포트
- `SessionCluster` / `SessionPattern` — 세션 클러스터 및 반복 패턴
- `Plugin` / `PluginStatus` — 플러그인 및 상태
- `CustomTheme` — 커스텀 테마 (CSS 변수)
- `BatchJob` / `BatchJobItem` / `BatchPriority` / `BatchJobStatus` — 배치 작업
- `CacheEntry` — 응답 캐시 항목
- `AuditEntry` / `AuditAction` — 감사 로그 항목 및 액션 타입

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
