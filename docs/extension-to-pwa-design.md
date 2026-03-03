# H Chat Extension → PWA 전환 구현 설계안

> ✅ **전체 완료** (2026-03-03) — Phase 1-5 모든 기능 구현됨

**작성일**: 2026-03-02 | **최종 수정**: 2026-03-03
**대상**: hchat-pwa (React 19 + Vite 7 + Tailwind CSS 3 + Zustand)
**참조**: hchat-extension (v1), hchat-v2-extension (v3), design1.pen

---

## 1. 기능 인벤토리: v1 + v3 전체 기능 목록

### v1 기능 (hchat-extension)

| # | 기능 | 구현 수준 | PWA 현황 |
|---|------|-----------|----------|
| 1 | AI 채팅 (Claude 전용 스트리밍) | ✅ 완성 | ✅ Phase 1 구현 |
| 2 | 대화 메모리 (CLAUDE.md 방식) | ✅ 완성 | ✅ Phase 2 구현 |
| 3 | 태스크 스케줄러 (chrome.alarms) | ✅ 완성 | ✅ Phase 2 구현 |
| 4 | 에이전트 스웜 (병렬 실행) | ✅ 완성 | ✅ Phase 2 구현 |
| 5 | FAB + 컨텍스트 메뉴 | ✅ 완성 | ❌ 해당없음 (브라우저 확장 전용) |
| 6 | 팝업 (320px 대시보드) | ✅ 완성 | ❌ 해당없음 |
| 7 | 설정 (AWS, 모델, 다크모드) | ✅ 완성 | ✅ Phase 1 구현 |

### v3 기능 (hchat-v2-extension)

| # | 기능 | 구현 수준 | PWA 적용 가능성 | 우선순위 |
|---|------|-----------|----------------|----------|
| 8 | 멀티 AI 프로바이더 (OpenAI + Gemini) | ✅ 완성 | ✅ 높음 | 🔴 P0 |
| 9 | 자동 모델 라우팅 | ✅ 완성 | ✅ 높음 | 🔴 P0 |
| 10 | 크로스 모델 그룹 채팅 | ✅ 완성 | ✅ 높음 | 🔴 P0 |
| 11 | 크로스 모델 토론 (3라운드) | ✅ 완성 | ✅ 높음 | 🟡 P1 |
| 12 | 웹 검색 + RAG | ✅ 완성 | ⚠️ CORS 제한 | 🟡 P1 |
| 13 | 멀티턴 에이전트 (5 도구) | ✅ 완성 | ⚠️ 일부 도구 제한 | 🟡 P1 |
| 14 | 스마트 북마크/하이라이트 | ✅ 완성 | ❌ 브라우저 확장 전용 | - |
| 15 | 페이지 컨텍스트 추적 | ✅ 완성 | ❌ 브라우저 확장 전용 | - |
| 16 | 키보드 단축키 | ✅ 완성 | ✅ 높음 (일부 이미 구현) | 🟢 P2 |
| 17 | 내보내기/가져오기 | ✅ 완성 | ✅ 높음 | 🔴 P0 |
| 18 | 메시지 검색 | ✅ 완성 | ✅ 이미 UI 존재 | 🔴 P0 |
| 19 | 사용량 추적 (토큰/비용) | ✅ 완성 | ✅ 높음 | 🟡 P1 |
| 20 | 프롬프트 라이브러리 | ✅ 완성 | ✅ 높음 | 🟡 P1 |
| 21 | 페르소나 시스템 | ✅ 완성 | ✅ 높음 | 🟡 P1 |
| 22 | YouTube 자막 요약 | ✅ 완성 | ⚠️ CORS 제한 | 🟢 P2 |
| 23 | YouTube 댓글 분석 | ✅ 완성 | ❌ DOM 접근 필요 | - |
| 24 | PDF 채팅 | ✅ 완성 | ✅ 높음 | 🟡 P1 |
| 25 | 검색엔진 AI 카드 | ✅ 완성 | ❌ 콘텐츠 스크립트 전용 | - |
| 26 | 글쓰기 어시스턴트 | ✅ 완성 | ❌ 콘텐츠 스크립트 전용 | - |
| 27 | OCR (Vision) | ✅ 완성 | ✅ 높음 | 🟡 P1 |
| 28 | TTS/STT | ✅ 완성 | ✅ Web Speech API 사용 가능 | 🟢 P2 |
| 29 | 대화 포크 | ✅ 완성 | ✅ 높음 | 🟢 P2 |
| 30 | 대화 관리 (태그, 핀, 검색) | ✅ 완성 | ✅ 높음 | 🔴 P0 |

### PWA 전환 불가 기능 (브라우저 확장 전용)

다음 기능은 Chrome Extension API에 의존하여 PWA로 전환할 수 없음:

| 기능 | 의존 API | 대체 방안 |
|------|----------|-----------|
| FAB + 컨텍스트 메뉴 | chrome.scripting, content scripts | 없음 (PWA 범위 밖) |
| 페이지 컨텍스트 추적 | chrome.tabs, executeScript | URL 직접 입력으로 대체 |
| 스마트 하이라이트 | content scripts, XPath DOM | 없음 |
| 검색엔진 AI 카드 | content scripts, Shadow DOM | 없음 |
| 글쓰기 어시스턴트 | content scripts, textarea 감지 | 없음 |
| YouTube 댓글 분석 | chrome.scripting, DOM 파싱 | URL 기반 API로 대체 가능 |
| chrome.alarms 스케줄러 | chrome.alarms | Web Workers + setInterval |

---

## 2. PWA 전환 아키텍처 설계

### 2.1 Extension → PWA 매핑

```
Extension                    PWA
─────────────────────────    ─────────────────────────
Side Panel (400px)      →    Desktop Layout (전체 화면)
Popup (320px)           →    Home Screen (빠른 실행)
Background Worker       →    Web Worker / Service Worker
Content Scripts         →    ❌ 해당없음
chrome.storage.local    →    IndexedDB + Zustand persist
chrome.alarms           →    Service Worker + Notification API
chrome.runtime.connect  →    내부 함수 호출 (직접 import)
```

### 2.2 저장소 전환

```
Extension (chrome.storage.local)     PWA (IndexedDB)
────────────────────────────────     ──────────────────
hchat:config                    →    settingsStore (Zustand)
hchat:conv:{id}                 →    sessionStore.sessions
hchat:highlights                →    ❌ 제거
hchat:prompts                   →    promptStore (신규)
hchat:usage                     →    usageStore (신규)
hchat:page-context              →    ❌ 제거
hchat:search-cache              →    IndexedDB cache
```

### 2.3 AI 프로바이더 아키텍처

Extension에서는 각 프로바이더가 독립 클래스였지만, PWA에서는 Zustand + 유틸리티 함수로 구현:

```typescript
// 기존 Extension (class 기반)
class BedrockProvider implements AIProvider { ... }
class OpenAIProvider implements AIProvider { ... }
class GeminiProvider implements AIProvider { ... }

// PWA (함수 기반 + Zustand)
// src/shared/lib/providers/
├── types.ts           // AIProvider 인터페이스
├── bedrock.ts         // streamBedrock() 함수
├── openai.ts          // streamOpenAI() 함수
├── gemini.ts          // streamGemini() 함수
├── router.ts          // routeModel() 자동 라우팅
└── factory.ts         // createStream() 팩토리
```

### 2.4 CORS 문제 해결

Extension은 `host_permissions`로 CORS를 우회하지만, PWA는 직접 호출 불가:

| API | Extension | PWA 솔루션 |
|-----|-----------|-----------|
| AWS Bedrock | 직접 HTTPS | Vite proxy (`/api/bedrock`) → AWS |
| OpenAI API | 직접 HTTPS | Vite proxy (`/api/openai`) → OpenAI |
| Gemini API | 직접 HTTPS | Vite proxy (`/api/gemini`) → Google |
| DuckDuckGo | 직접 HTTPS | Vite proxy (`/api/search`) → DDG |

`vite.config.ts` 프록시 설정으로 개발/프로덕션 모두 지원.
프로덕션에서는 Vercel Serverless Functions 또는 Cloudflare Workers 사용.

---

## 3. Phase 3 구현 계획 (17개 화면)

### Phase 3-A: 멀티 프로바이더 시스템 (P0)

#### 3-A.1 OpenAI/Gemini 프로바이더 추가

**신규 파일:**

| 파일 | 설명 |
|------|------|
| `src/shared/lib/providers/types.ts` | ProviderType, AIProvider 인터페이스, ModelDef |
| `src/shared/lib/providers/openai.ts` | OpenAI SSE 스트리밍 (GPT-4o, GPT-4o mini) |
| `src/shared/lib/providers/gemini.ts` | Gemini 스트리밍 (Flash 2.0, Pro 1.5) |
| `src/shared/lib/providers/router.ts` | 자동 모델 라우팅 (프롬프트 패턴 분석) |
| `src/shared/lib/providers/factory.ts` | 프로바이더 팩토리 (통합 stream 함수) |

**수정 파일:**

| 파일 | 변경 |
|------|------|
| `src/shared/types/index.ts` | ProviderType, ModelDef 등 타입 추가 |
| `src/shared/constants.ts` | OPENAI_MODELS, GEMINI_MODELS 추가 |
| `src/entities/settings/settings.store.ts` | OpenAI/Gemini API 키 저장 |
| `src/pages/settings/SettingsScreen.tsx` | OpenAI/Gemini API 설정 섹션 |
| `src/shared/lib/bedrock-client.ts` | providers/bedrock.ts로 리팩토링 |

#### 3-A.2 그룹 채팅 (크로스 모델 비교)

**신규 파일:**

| 파일 | 설명 |
|------|------|
| `src/pages/group-chat/GroupChatPage.tsx` | 그룹 채팅 메인 화면 |
| `src/entities/group-chat/group-chat.store.ts` | 그룹 채팅 상태 관리 |

**화면 설계:**
```
┌──────────────────────────────────────────┐
│ 🔀 그룹 채팅          [모델 선택] [전송]  │
├──────────────────────────────────────────┤
│ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│ │ Sonnet   │ │ GPT-4o   │ │ Flash    │  │
│ │ 4.6      │ │          │ │ 2.0      │  │
│ │          │ │          │ │          │  │
│ │ [응답텍스│ │ [응답텍스│ │ [응답텍스│  │
│ │ 트...]   │ │ 트...]   │ │ 트...]   │  │
│ │          │ │          │ │          │  │
│ │ 1.2s     │ │ 0.8s     │ │ 0.3s     │  │
│ └──────────┘ └──────────┘ └──────────┘  │
├──────────────────────────────────────────┤
│ [입력창...]                     [전송]    │
└──────────────────────────────────────────┘
```

#### 3-A.3 대화 내보내기/가져오기

**신규 파일:**

| 파일 | 설명 |
|------|------|
| `src/shared/lib/export-chat.ts` | 5형식 내보내기 (MD, HTML, JSON, TXT, PDF) |
| `src/shared/lib/import-chat.ts` | JSON 가져오기 (ChatGPT/Claude/H Chat) |

**수정 파일:**

| 파일 | 변경 |
|------|------|
| `src/pages/chat/ChatPage.tsx` | 헤더에 내보내기 버튼 추가 |
| `src/pages/all-chats/AllChatsScreen.tsx` | 일괄 내보내기/가져오기 |

#### 3-A.4 대화 관리 강화

**수정 파일:**

| 파일 | 변경 |
|------|------|
| `src/entities/session/session.store.ts` | 태그, 핀, 검색 기능 추가 |
| `src/pages/all-chats/AllChatsScreen.tsx` | 태그 필터, 핀 표시, 검색 바 |
| `src/widgets/search/SearchModal.tsx` | 실제 메시지 검색 연결 |
| `src/shared/types/index.ts` | Session에 tags, pinned 필드 추가 |

### Phase 3-B: AI 고급 기능 (P1)

#### 3-B.1 크로스 모델 토론

**신규 파일:**

| 파일 | 설명 |
|------|------|
| `src/pages/debate/DebatePage.tsx` | 3라운드 토론 화면 |
| `src/shared/lib/debate.ts` | 토론 엔진 (초기답변→비평→종합) |
| `src/entities/debate/debate.store.ts` | 토론 상태 관리 |

**화면 설계:**
```
┌──────────────────────────────────────────┐
│ ⚔️ AI 토론           [모델 2-4개 선택]   │
├──────────────────────────────────────────┤
│ 📋 라운드 1: 초기 답변                    │
│ ┌─ Sonnet ─────────────────────────────┐ │
│ │ "A가 최선입니다. 이유는..."            │ │
│ └──────────────────────────────────────┘ │
│ ┌─ GPT-4o ─────────────────────────────┐ │
│ │ "B를 추천합니다. 근거는..."            │ │
│ └──────────────────────────────────────┘ │
│                                          │
│ 📋 라운드 2: 상호 비평                    │
│ ┌─ Sonnet ─────────────────────────────┐ │
│ │ "GPT의 답변에서 X는 맞지만..."         │ │
│ └──────────────────────────────────────┘ │
│                                          │
│ 📋 라운드 3: 종합                        │
│ ┌─ 종합 결론 ──────────────────────────┐ │
│ │ "두 관점을 종합하면..."               │ │
│ └──────────────────────────────────────┘ │
├──────────────────────────────────────────┤
│ [토론 주제 입력...]              [시작]   │
└──────────────────────────────────────────┘
```

#### 3-B.2 프롬프트 라이브러리

**신규 파일:**

| 파일 | 설명 |
|------|------|
| `src/pages/prompts/PromptsPage.tsx` | 프롬프트 관리 화면 |
| `src/entities/prompt/prompt.store.ts` | 프롬프트 CRUD + 검색 |
| `src/shared/lib/prompt-defaults.ts` | 8개 기본 프롬프트 |

**화면 설계:**
```
┌──────────────────────────────────────────┐
│ 📝 프롬프트 라이브러리    [+ 새 프롬프트]  │
├──────────────────────────────────────────┤
│ 🔍 프롬프트 검색...                       │
│                                          │
│ 카테고리: [전체] [업무] [개발] [번역] ... │
│                                          │
│ ┌────────────────────────────────────┐   │
│ │ 📄 페이지 요약        /sum          │   │
│ │ 주어진 내용을 3줄로 요약해주세요      │   │
│ │ ⭐ 기본 · 📋 복사 · ✏️ 편집         │   │
│ └────────────────────────────────────┘   │
│ ┌────────────────────────────────────┐   │
│ │ 🔄 번역                /translate   │   │
│ │ 다음 텍스트를 {{language}}로 번역...  │   │
│ └────────────────────────────────────┘   │
└──────────────────────────────────────────┘
```

#### 3-B.3 페르소나 시스템

**신규 파일:**

| 파일 | 설명 |
|------|------|
| `src/entities/persona/persona.store.ts` | 페르소나 CRUD |
| `src/shared/lib/persona-defaults.ts` | 6개 기본 페르소나 |

**수정 파일:**

| 파일 | 변경 |
|------|------|
| `src/widgets/prompt-input/PromptInput.tsx` | 페르소나 선택기 통합 |
| `src/pages/chat/ChatPage.tsx` | 활성 페르소나 표시 |

#### 3-B.4 사용량 추적

**신규 파일:**

| 파일 | 설명 |
|------|------|
| `src/pages/usage/UsagePage.tsx` | 사용량 대시보드 |
| `src/entities/usage/usage.store.ts` | 토큰/비용 추적 |

**화면 설계:**
```
┌──────────────────────────────────────────┐
│ 📊 사용량               [이번 달 ▼]      │
├──────────────────────────────────────────┤
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐    │
│ │총 비용│ │입력   │ │출력   │ │대화수 │    │
│ │$12.34│ │1.2M  │ │340K  │ │ 89   │    │
│ └──────┘ └──────┘ └──────┘ └──────┘    │
│                                          │
│ 프로바이더별 사용량                        │
│ ┌────────────────────────────────────┐   │
│ │ AWS Bedrock  ████████████  $8.50  │   │
│ │ OpenAI       █████         $2.84  │   │
│ │ Gemini       ███           $1.00  │   │
│ └────────────────────────────────────┘   │
│                                          │
│ 일별 추이 (차트)                          │
│ ┌────────────────────────────────────┐   │
│ │  ╭─╮     ╭─╮                      │   │
│ │ ╭╯ ╰─╮  │ ╰╮  ╭╮                 │   │
│ │╭╯    ╰──╯  ╰──╯╰╮                │   │
│ └────────────────────────────────────┘   │
└──────────────────────────────────────────┘
```

#### 3-B.5 PDF 채팅

**신규 파일:**

| 파일 | 설명 |
|------|------|
| `src/shared/lib/pdf-parser.ts` | PDF.js CDN + 텍스트 추출 |

**수정 파일:**

| 파일 | 변경 |
|------|------|
| `src/widgets/prompt-input/PromptInput.tsx` | PDF 업로드 버튼 |
| `src/pages/chat/ChatPage.tsx` | PDF 컨텍스트 표시 |

#### 3-B.6 OCR (이미지 → 텍스트)

**수정 파일:**

| 파일 | 변경 |
|------|------|
| `src/widgets/prompt-input/PromptInput.tsx` | 이미지 업로드 시 Vision 모델 자동 선택 |
| `src/shared/lib/providers/router.ts` | 이미지 첨부 시 Vision 모델 라우팅 |

#### 3-B.7 웹 검색 + RAG

**신규 파일:**

| 파일 | 설명 |
|------|------|
| `src/shared/lib/web-search.ts` | DuckDuckGo/Google 검색 (프록시 경유) |
| `src/shared/lib/search-intent.ts` | 검색 의도 자동 판단 |

**수정 파일:**

| 파일 | 변경 |
|------|------|
| `vite.config.ts` | `/api/search` 프록시 추가 |
| `src/entities/settings/settings.store.ts` | webSearchEnabled, searchApiKey 설정 |

#### 3-B.8 멀티턴 에이전트

기존 Phase 2의 에이전트 스웜을 확장:

**수정 파일:**

| 파일 | 변경 |
|------|------|
| `src/shared/lib/agent.ts` | 신규: 멀티턴 에이전트 루프 |
| `src/shared/lib/agent-tools.ts` | 신규: web_search, fetch_url, calculate |
| `src/pages/chat/ChatPage.tsx` | 에이전트 모드 토글 + 스텝 시각화 |

### Phase 3-C: UX 개선 (P2)

#### 3-C.1 TTS/STT

**신규 파일:**

| 파일 | 설명 |
|------|------|
| `src/shared/lib/tts.ts` | Text-to-Speech (Web Speech API) |
| `src/shared/lib/stt.ts` | Speech-to-Text (Web Speech API) |

#### 3-C.2 대화 포크

**수정 파일:**

| 파일 | 변경 |
|------|------|
| `src/entities/session/session.store.ts` | forkSession(messageId) 액션 |
| `src/widgets/message-list/MessageBubble.tsx` | 포크 버튼 추가 |

#### 3-C.3 키보드 단축키 확장

**수정 파일:**

| 파일 | 변경 |
|------|------|
| `src/app/layouts/MainLayout.tsx` | 추가 단축키 (N=새 채팅, /=입력 포커스 등) |

---

## 4. 신규 화면 설계안

### 4.1 전체 화면 목록 (Phase 3 추가분)

| # | 화면 | 접근 경로 | 뷰 상태 |
|---|------|-----------|---------|
| 1 | 그룹 채팅 | 사이드바 → 도구 → 그룹 채팅 | `groupChat` |
| 2 | AI 토론 | 사이드바 → 도구 → AI 토론 | `debate` |
| 3 | 프롬프트 라이브러리 | 사이드바 → 도구 → 프롬프트 | `prompts` |
| 4 | 사용량 대시보드 | 사이드바 → 도구 → 사용량 | `usage` |
| 5 | OpenAI 설정 (탭) | 설정 → API 설정 내 섹션 | 설정 내부 |
| 6 | Gemini 설정 (탭) | 설정 → API 설정 내 섹션 | 설정 내부 |

### 4.2 사이드바 네비게이션 확장

```
H Chat (로고)
──────────────────
🔍 검색 (⌘K)
[+ 새 채팅]
──────────────────
📁 프로젝트

🛠 도구
├── 🧠 메모리          → memory
├── 🔀 그룹 채팅       → groupChat      ← Phase 3 신규
├── ⚔️ AI 토론         → debate         ← Phase 3 신규
├── 🌐 에이전트 스웜   → agentSwarm
├── 📝 프롬프트        → prompts        ← Phase 3 신규
├── ⏰ 스케줄러        → schedule
└── 📊 사용량          → usage          ← Phase 3 신규

⭐ 즐겨찾기
  ├── 대화 1
  └── 대화 2

💬 최근 대화
  ├── 대화 3
  └── 대화 4
──────────────────
👤 현대오토에버 사용자
```

### 4.3 설정 화면 API 탭 확장

```
API 설정
──────────────────

AWS Bedrock (Claude)
┌──────────────────────────────────────┐
│ Access Key ID: [AKIA...]             │
│ Secret Access Key: [********]        │
│ 리전: [us-east-1 ▼]                 │
│ [연결 테스트]  [초기화]   ✓ 연결 성공 │
└──────────────────────────────────────┘

OpenAI (GPT)                            ← Phase 3 신규
┌──────────────────────────────────────┐
│ API Key: [sk-proj-...]               │
│ [연결 테스트]             ✓ 연결 성공 │
└──────────────────────────────────────┘

Google Gemini                           ← Phase 3 신규
┌──────────────────────────────────────┐
│ API Key: [AIza...]                   │
│ [연결 테스트]             ✓ 연결 성공 │
└──────────────────────────────────────┘

모델 설정
┌──────────────────────────────────────┐
│ 기본 모델: [Claude Sonnet 4.6 ▼]    │
│ 자동 모델 라우팅: [토글]              │
│ 웹 검색 활성화:  [토글]              │
└──────────────────────────────────────┘
```

---

## 5. 타입 확장 설계

```typescript
// src/shared/types/index.ts 추가 타입

// Provider 관련
export type ProviderType = 'bedrock' | 'openai' | 'gemini'
export type ModelCapability = 'chat' | 'code' | 'vision' | 'reasoning' | 'fast'

export interface ModelDef {
  id: string
  provider: ProviderType
  label: string
  shortLabel: string
  capabilities: ModelCapability[]
  cost: { input: number; output: number }  // USD per 1M tokens
}

export interface ProviderCredentials {
  bedrock: { accessKeyId: string; secretAccessKey: string; region: string }
  openai: { apiKey: string }
  gemini: { apiKey: string }
}

// ViewState 확장
export type ViewState =
  | 'home' | 'chat' | 'settings' | 'allChats'
  | 'projects' | 'projectDetail' | 'quickChat'
  | 'memory' | 'agentSwarm' | 'schedule'
  | 'groupChat' | 'debate' | 'prompts' | 'usage'  // Phase 3 추가

// 그룹 채팅
export interface GroupChatMessage {
  id: string
  prompt: string
  responses: {
    modelId: string
    provider: ProviderType
    content: string
    isStreaming: boolean
    responseTime?: number  // ms
    error?: string
  }[]
  timestamp: string
}

// 토론
export interface DebateRound {
  round: number
  modelId: string
  provider: ProviderType
  role: 'initial' | 'critique' | 'synthesis'
  content: string
  responseTime: number
}

export interface DebateSession {
  id: string
  topic: string
  modelIds: string[]
  rounds: DebateRound[]
  status: 'idle' | 'running' | 'completed'
  createdAt: string
}

// 프롬프트 라이브러리
export interface PromptTemplate {
  id: string
  title: string
  description: string
  content: string
  shortcut?: string  // e.g., '/sum'
  category: string
  isBuiltin: boolean
  variables?: string[]  // e.g., ['content', 'language']
  createdAt: string
  updatedAt: string
}

// 페르소나
export interface Persona {
  id: string
  name: string
  icon: string
  description: string
  systemPrompt: string
  isBuiltin: boolean
}

// 사용량
export interface UsageRecord {
  id: string
  timestamp: string
  provider: ProviderType
  modelId: string
  inputTokens: number
  outputTokens: number
  cost: number
  feature: 'chat' | 'group' | 'debate' | 'agent' | 'tool'
}

// 내보내기
export type ExportFormat = 'markdown' | 'html' | 'json' | 'txt' | 'pdf'
```

---

## 6. 구현 순서

### Step 1: 멀티 프로바이더 인프라 (P0)
1. `src/shared/lib/providers/` 디렉토리 생성
2. types.ts, bedrock.ts (기존 리팩토링), openai.ts, gemini.ts
3. factory.ts, router.ts
4. 설정 스토어 확장 (OpenAI/Gemini 키)
5. 설정 화면 API 탭 확장
6. 기존 채팅에 모델 선택 드롭다운 확장

### Step 2: 그룹 채팅 + 내보내기 (P0)
1. 그룹 채팅 스토어 + 페이지
2. 내보내기/가져오기 유틸리티
3. 대화 관리 강화 (태그, 핀, 검색)
4. 사이드바 네비게이션 업데이트

### Step 3: AI 고급 기능 (P1)
1. 토론 엔진 + 페이지
2. 프롬프트 라이브러리 스토어 + 페이지
3. 페르소나 시스템
4. 사용량 추적 스토어 + 페이지
5. PDF 채팅
6. 웹 검색 + RAG

### Step 4: UX 개선 (P2)
1. TTS/STT
2. 대화 포크
3. 키보드 단축키 확장

### Step 5: pwa.pen 화면 설계
1. 그룹 채팅 (Light + Dark)
2. AI 토론 (Light + Dark)
3. 프롬프트 라이브러리 (Light + Dark)
4. 사용량 대시보드 (Light + Dark)
5. 설정 API 탭 확장 (Light + Dark) — 기존 프레임 수정

---

## 7. 파일 변경 요약

### 신규 파일 (24개)

| 카테고리 | 파일 | 설명 |
|----------|------|------|
| **프로바이더** | `src/shared/lib/providers/types.ts` | 공통 인터페이스 |
| | `src/shared/lib/providers/openai.ts` | OpenAI 스트리밍 |
| | `src/shared/lib/providers/gemini.ts` | Gemini 스트리밍 |
| | `src/shared/lib/providers/router.ts` | 자동 모델 라우팅 |
| | `src/shared/lib/providers/factory.ts` | 프로바이더 팩토리 |
| **유틸리티** | `src/shared/lib/export-chat.ts` | 5형식 내보내기 |
| | `src/shared/lib/import-chat.ts` | JSON 가져오기 |
| | `src/shared/lib/debate.ts` | 3라운드 토론 엔진 |
| | `src/shared/lib/web-search.ts` | 웹 검색 (프록시 경유) |
| | `src/shared/lib/search-intent.ts` | 검색 의도 판단 |
| | `src/shared/lib/agent.ts` | 멀티턴 에이전트 루프 |
| | `src/shared/lib/agent-tools.ts` | 에이전트 내장 도구 |
| | `src/shared/lib/pdf-parser.ts` | PDF 텍스트 추출 |
| | `src/shared/lib/prompt-defaults.ts` | 기본 프롬프트 8개 |
| | `src/shared/lib/persona-defaults.ts` | 기본 페르소나 6개 |
| | `src/shared/lib/tts.ts` | Text-to-Speech |
| | `src/shared/lib/stt.ts` | Speech-to-Text |
| **스토어** | `src/entities/group-chat/group-chat.store.ts` | 그룹 채팅 상태 |
| | `src/entities/debate/debate.store.ts` | 토론 상태 |
| | `src/entities/prompt/prompt.store.ts` | 프롬프트 CRUD |
| | `src/entities/persona/persona.store.ts` | 페르소나 |
| | `src/entities/usage/usage.store.ts` | 사용량 추적 |
| **페이지** | `src/pages/group-chat/GroupChatPage.tsx` | 그룹 채팅 화면 |
| | `src/pages/debate/DebatePage.tsx` | AI 토론 화면 |
| | `src/pages/prompts/PromptsPage.tsx` | 프롬프트 화면 |
| | `src/pages/usage/UsagePage.tsx` | 사용량 화면 |

### 수정 파일 (12개)

| 파일 | 변경 내용 |
|------|-----------|
| `src/shared/types/index.ts` | ViewState 확장, 신규 타입 |
| `src/shared/constants.ts` | 모델 목록 확장, 프로바이더 색상 |
| `src/entities/settings/settings.store.ts` | OpenAI/Gemini 키, 라우팅 설정 |
| `src/entities/session/session.store.ts` | 태그, 핀, 포크, 검색 |
| `src/app/layouts/MainLayout.tsx` | 4개 뷰 디스패치 추가 |
| `src/widgets/sidebar/Sidebar.tsx` | 도구 섹션 4개 항목 추가 |
| `src/pages/settings/SettingsScreen.tsx` | API 탭 확장, 모델 설정 |
| `src/pages/chat/ChatPage.tsx` | 에이전트 모드, 내보내기, 페르소나 |
| `src/pages/all-chats/AllChatsScreen.tsx` | 태그, 핀, 가져오기 |
| `src/widgets/prompt-input/PromptInput.tsx` | 페르소나, PDF, STT |
| `src/widgets/search/SearchModal.tsx` | 실제 검색 연결 |
| `vite.config.ts` | API 프록시 추가 |

---

## 8. design1.pen 확장프로그램 프레임 참조

design1.pen에는 7개 확장프로그램 전용 프레임이 있음:

| 프레임 | 크기 | 내용 |
|--------|------|------|
| Ext/SidePanel-Chat | 400×700 | 탭 네비게이션 + 채팅 UI |
| Ext/SidePanel-Memory | 400×700 | 메모리 관리 |
| Ext/SidePanel-Scheduler | 400×700 | 스케줄러 |
| Ext/SidePanel-Swarm | 400×700 | 에이전트 스웜 |
| Ext/SidePanel-Settings | 400×700 | 설정 |
| Ext/Popup | 320×420 | 팝업 대시보드 |
| Ext/FAB-Context | 500×400 | FAB + 컨텍스트 메뉴 |

PWA 버전에서는 이 프레임들의 **UI 패턴과 색상 시스템**을 참조하되,
전체 데스크톱 레이아웃(사이드바 264px + 메인 콘텐츠)으로 재설계.

### 디자인 시스템 매핑

| Extension | PWA |
|-----------|-----|
| 400px 고정 너비 | flex-1 반응형 |
| 탭 바 네비게이션 | 사이드바 네비게이션 |
| CSS Variables (global.css) | Tailwind CSS + CSS Variables |
| Inter / JetBrains Mono | 동일 |
| Primary #3478FE / #5B93FF | 동일 |

---

## 9. Wiki 서비스 개요

H Chat 서비스 Wiki는 sgtlim0.gitlab.io (Jekyll 기반)에 이미 존재하며,
다음 내용을 추가/업데이트:

### 추가할 Wiki 페이지

| 페이지 | 내용 |
|--------|------|
| H Chat PWA 소개 | PWA 버전 개요, 설치 방법, 기능 목록 |
| 멀티 프로바이더 설정 | AWS/OpenAI/Gemini 키 발급 및 설정 가이드 |
| 그룹 채팅 가이드 | 크로스 모델 비교 사용법 |
| AI 토론 가이드 | 3라운드 토론 기능 사용법 |
| 프롬프트 라이브러리 | 기본 프롬프트 + 커스텀 생성법 |
| 에이전트 모드 가이드 | 멀티턴 에이전트 도구 설명 |
| Extension vs PWA 비교 | 기능 차이, 장단점 비교표 |
| API 참조 | 모델 ID, 가격, 기능 비교표 |

---

## 10. 검증 기준

- [ ] `npm run build` 성공
- [ ] 모든 신규 화면 사이드바에서 접근 가능
- [ ] 라이트/다크 모드 정상 동작
- [ ] OpenAI/Gemini 연결 테스트 동작
- [ ] 그룹 채팅에서 멀티 모델 병렬 스트리밍
- [ ] 내보내기 5형식 모두 다운로드 동작
- [ ] 검색 모달에서 실제 메시지 검색 동작
- [ ] pwa.pen에 신규 화면 프레임 추가 (Light + Dark)
