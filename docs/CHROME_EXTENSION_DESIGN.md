# H Chat Chrome Extension 전면 재설계안

> 작성일: 2026-03-14 | Phase 103
> 기반: hchat-wiki 모노레포 심층분석 + 기존 Extension 코드 분석

---

## 1. 현황 분석 (AS-IS)

### 1.1 기존 Extension 상태

| 항목 | 현재 상태 | 평가 |
|------|----------|------|
| manifest.json | MV3, 최소 구현 | OK |
| background.ts | 컨텍스트 메뉴 + storage | 기본 |
| content.ts | 텍스트 추출 + blocklist | 기본 |
| Popup.tsx | 4모드 분석 UI (257줄) | 단일 파일, @hchat/ui 미사용 |
| App.tsx | 플레이스홀더 | 미완성 |
| 디자인 토큰 | 미적용 | 불일치 |
| @hchat/ui 통합 | 없음 | 재사용 0% |
| 서비스 레이어 | fetch 직접 호출 | 패턴 불일치 |
| 테스트 | 0개 | 미작성 |
| i18n | 하드코딩 한국어 | 미지원 |

### 1.2 모노레포 활용 가능 자산

| 자산 | 위치 | 재사용 가치 |
|------|------|-----------|
| 디자인 토큰 (194 CSS vars) | `packages/tokens/` | HIGH |
| ThemeProvider + 다크모드 | `packages/ui/src/ThemeProvider.tsx` | HIGH |
| MessageBubble | `packages/ui/src/user/MessageBubble.tsx` | HIGH |
| StreamingIndicator | `packages/ui/src/user/StreamingIndicator.tsx` | HIGH |
| Badge, Toast, Skeleton | `packages/ui/src/` | MEDIUM |
| chatService 인터페이스 | `packages/ui/src/user/services/` | HIGH |
| sseService (Mock/Real) | `packages/ui/src/user/services/sseService.ts` | MEDIUM |
| Zod 스키마 | `packages/ui/src/schemas/` | MEDIUM |
| sanitize 유틸리티 | `packages/ui/src/utils/sanitize.ts` | HIGH |
| blocklist | `apps/extension/src/utils/blocklist.ts` | 유지 |
| i18n (ko/en) | `packages/ui/src/i18n/` | MEDIUM |
| MarkdownRenderer | `packages/ui/src/user/MarkdownRenderer.tsx` | HIGH |

### 1.3 Gap 분석

| 영역 | 현재 Extension | User App 수준 | Gap |
|------|--------------|-------------|-----|
| UI 컴포넌트 | inline style/CSS | @hchat/ui 50+ | 전면 교체 필요 |
| 서비스 패턴 | raw fetch | ServiceProvider + Mock/Real | 패턴 도입 필요 |
| 상태관리 | useState 직접 | 커스텀 훅 분리 | 훅 설계 필요 |
| 스트리밍 | 미구현 | SSE subscribe 패턴 | 구현 필요 |
| 오프라인 | 미고려 | useNetworkStatus | 적용 필요 |
| 접근성 | 미고려 | ARIA 속성 적용 | 적용 필요 |
| 보안 | blocklist만 | PII sanitize + CSP + Zod | 강화 필요 |

---

## 2. 설계 목표 (TO-BE)

### 2.1 핵심 원칙

1. **@hchat/ui 최대 재사용**: 모노레포 공유 컴포넌트 70%+ 활용
2. **서비스 레이어 통일**: ServiceProvider + Mock/Real 패턴
3. **디자인 토큰 일관성**: `--ext-*` 접두사 + 기존 토큰 상속
4. **보안 우선**: 최소 권한, PII 살균, API Gateway 경유
5. **SSE 스트리밍**: 실시간 분석 결과 스트리밍
6. **다크모드**: ThemeProvider 통합
7. **i18n 지원**: 한/영 전환
8. **80%+ 테스트 커버리지**

### 2.2 기능 스코프

| 기능 | 우선순위 | 설명 |
|------|---------|------|
| Popup 채팅 UI | P0 | MessageBubble 기반 미니 채팅 |
| 페이지 분석 (4모드) | P0 | 요약/설명/리서치/번역 |
| SSE 스트리밍 응답 | P0 | 실시간 토큰 스트리밍 |
| Side Panel | P1 | 전체 채팅 히스토리 (chrome.sidePanel API) |
| 컨텍스트 메뉴 통합 | P0 | 우클릭 -> 분석 모드 선택 |
| 다크모드 | P0 | 시스템/수동 전환 |
| i18n (ko/en) | P1 | 언어 전환 |
| PWA 연동 | P1 | Extension -> User App 컨텍스트 전달 |
| 오프라인 감지 | P1 | 네트워크 상태 표시 |
| 대화 히스토리 | P1 | IndexedDB 저장 |
| 키보드 단축키 | P2 | Cmd+Shift+H 팝업 토글 |
| 옵션 페이지 | P2 | API 설정, 테마, 언어 |

---

## 3. 아키텍처 설계

### 3.1 전체 아키텍처

```
Chrome Extension (MV3)
├── popup/                    # Popup UI (React 19 + Tailwind 4)
│   ├── App.tsx              # 루트 + Providers
│   ├── pages/
│   │   ├── ChatPage.tsx     # 미니 채팅 (MessageBubble 재사용)
│   │   ├── AnalyzePage.tsx  # 페이지 분석 결과
│   │   └── SettingsPage.tsx # 설정
│   ├── components/
│   │   ├── PopupHeader.tsx  # 헤더 (로고 + 테마 + 설정)
│   │   ├── ModeSelector.tsx # 분석 모드 선택 그리드
│   │   ├── ContextBanner.tsx # 추출된 텍스트 미리보기
│   │   └── QuickActions.tsx # 빠른 작업 버튼
│   └── hooks/
│       ├── useExtensionChat.ts    # Extension 전용 채팅 훅
│       ├── usePageContext.ts      # 페이지 컨텍스트 관리
│       └── useExtensionSettings.ts # 설정 관리
│
├── sidepanel/                # Side Panel UI (선택적)
│   ├── SidePanel.tsx        # 전체 채팅 뷰
│   └── sidepanel.html
│
├── background.ts             # Service Worker (MV3)
│   ├── 컨텍스트 메뉴 관리
│   ├── 메시지 라우팅
│   ├── API 프록시 (Rate Limit)
│   └── 알람 기반 세션 정리
│
├── content.ts                # Content Script
│   ├── 텍스트 추출 (선택/전체)
│   ├── PII 살균
│   └── 블록리스트 검사
│
├── options/                  # Options Page
│   ├── OptionsPage.tsx
│   └── options.html
│
├── services/
│   ├── ExtensionServiceProvider.tsx  # DI 컨테이너
│   ├── extensionChatService.ts      # 채팅 서비스
│   ├── extensionStorageService.ts   # chrome.storage 래퍼
│   ├── extensionAnalyzeService.ts   # 분석 서비스
│   └── mockExtensionService.ts      # 개발용 목 서비스
│
├── utils/
│   ├── blocklist.ts          # 민감 사이트 차단 (기존 유지)
│   ├── sanitize.ts           # PII 마스킹 (공유 유틸 래퍼)
│   ├── messaging.ts          # chrome.runtime.sendMessage 타입 안전 래퍼
│   └── storage.ts            # chrome.storage.local 타입 안전 래퍼
│
└── types/
    ├── messages.ts           # 메시지 타입 정의
    ├── context.ts            # 컨텍스트 타입
    └── settings.ts           # 설정 타입
```

### 3.2 데이터 흐름

```
[사용자 액션]
     │
     ├── 팝업 열기 ──────────────┐
     ├── 우클릭 "H Chat 분석" ───┤
     └── 텍스트 선택 + 단축키 ───┘
                                  │
                                  ▼
               ┌──────────────────────────┐
               │   content.ts              │
               │   1. shouldBlockExtraction│
               │   2. extractText()        │
               │   3. sanitizePII()        │
               └────────────┬─────────────┘
                            │ chrome.runtime.sendMessage
                            ▼
               ┌──────────────────────────┐
               │   background.ts           │
               │   1. 메시지 라우팅        │
               │   2. chrome.storage 저장  │
               │   3. API 프록시 (선택)    │
               └────────────┬─────────────┘
                            │ chrome.storage.onChanged
                            ▼
               ┌──────────────────────────┐
               │   popup/App.tsx           │
               │   usePageContext() 감지   │
               │   ContextBanner 표시      │
               │   ModeSelector 활성화     │
               └────────────┬─────────────┘
                            │ 분석 모드 선택
                            ▼
               ┌──────────────────────────┐
               │   extensionChatService    │
               │   1. Zod 입력 검증        │
               │   2. API Gateway 호출     │
               │   3. SSE 스트리밍 수신    │
               │   4. MessageBubble 렌더   │
               └──────────────────────────┘
```

### 3.3 Provider 계층구조

```typescript
// popup/App.tsx
<ThemeProvider>              // @hchat/ui — 다크모드
  <ExtensionServiceProvider> // Extension 전용 DI
    <I18nProvider>           // @hchat/ui/i18n — 한/영
      <ToastQueueProvider>   // @hchat/ui — 알림
        <RouterProvider>     // popup 내부 라우팅
          <PopupLayout />
        </RouterProvider>
      </ToastQueueProvider>
    </I18nProvider>
  </ExtensionServiceProvider>
</ThemeProvider>
```

### 3.4 @hchat/ui 재사용 매핑

| Extension 컴포넌트 | @hchat/ui 소스 | 커스터마이징 |
|-------------------|--------------|------------|
| 메시지 버블 | `MessageBubble` | width 축소 |
| 스트리밍 인디케이터 | `StreamingIndicator` | 그대로 |
| 마크다운 렌더러 | `MarkdownRenderer` | 그대로 |
| 테마 토글 | `ThemeToggle` | 아이콘만 |
| 배지 | `Badge` | 그대로 |
| 토스트 | `ToastContainer` | 위치 조정 |
| 스켈레톤 | `Skeleton` | 그대로 |
| 에러 바운더리 | `ErrorBoundary` | 그대로 |
| 빈 상태 | `EmptyState` | 아이콘 변경 |
| 언어 토글 | `LanguageToggle` | 그대로 |

---

## 4. Manifest V3 설계

### 4.1 manifest.json

```json
{
  "manifest_version": 3,
  "name": "H Chat - AI Assistant",
  "version": "1.0.0",
  "description": "현대차그룹 AI 비서 — 웹 페이지 분석, 요약, 번역, 리서치",
  "default_locale": "ko",

  "permissions": [
    "activeTab",
    "storage",
    "contextMenus",
    "sidePanel",
    "alarms"
  ],
  "optional_host_permissions": [
    "https://*/*"
  ],

  "action": {
    "default_popup": "popup.html",
    "default_icon": {
      "16": "icons/icon16.png",
      "32": "icons/icon32.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },

  "background": {
    "service_worker": "background.js",
    "type": "module"
  },

  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content.js"],
      "run_at": "document_idle"
    }
  ],

  "side_panel": {
    "default_path": "sidepanel.html"
  },

  "options_ui": {
    "page": "options.html",
    "open_in_tab": true
  },

  "icons": {
    "16": "icons/icon16.png",
    "32": "icons/icon32.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  },

  "commands": {
    "_execute_action": {
      "suggested_key": {
        "default": "Ctrl+Shift+H",
        "mac": "MacCtrl+Shift+H"
      },
      "description": "H Chat 팝업 열기"
    },
    "analyze_selection": {
      "suggested_key": {
        "default": "Ctrl+Shift+A",
        "mac": "MacCtrl+Shift+A"
      },
      "description": "선택 텍스트 분석"
    }
  },

  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self'; style-src 'self' 'unsafe-inline';"
  }
}
```

### 4.2 권한 분석

| 권한 | 용도 | 위험도 |
|------|------|--------|
| `activeTab` | 현재 탭 텍스트 추출 | LOW (사용자 액션 시만) |
| `storage` | 설정/컨텍스트 저장 | LOW |
| `contextMenus` | 우클릭 메뉴 | LOW |
| `sidePanel` | 사이드 패널 UI | LOW |
| `alarms` | 세션 정리 타이머 | LOW |
| `optional_host_permissions` | 사용자 허용 사이트만 | MEDIUM (선택적) |

---

## 5. 컴포넌트 상세 설계

### 5.1 Popup UI (400x600)

```
┌─────────────────────────────────┐
│  [H] H Chat    [🌙] [⚙️] [🔗]  │  PopupHeader
├─────────────────────────────────┤
│  📄 현대차그룹 AI 전략 보고서     │  ContextBanner
│  https://docs.hmg.com/ai-str.. │  (추출된 페이지 정보)
│  "H Chat은 현대차그룹 임직원..." │
├─────────────────────────────────┤
│  ┌──────┐ ┌──────┐             │
│  │ 📄   │ │ ❓   │             │  ModeSelector
│  │ 요약 │ │ 설명 │             │  (2x2 그리드)
│  └──────┘ └──────┘             │
│  ┌──────┐ ┌──────┐             │
│  │ 🔍   │ │ 🌐   │             │
│  │리서치│ │ 번역 │             │
│  └──────┘ └──────┘             │
├─────────────────────────────────┤
│  ┌─ AI ─────────────────────┐  │
│  │ H Chat은 현대차그룹      │  │  MessageBubble
│  │ 임직원을 위한 생성형 AI  │  │  (SSE 스트리밍)
│  │ 서비스입니다...          │  │
│  │ ● 스트리밍 중...        │  │  StreamingIndicator
│  └──────────────────────────┘  │
├─────────────────────────────────┤
│  [메시지 입력...]     [전송]    │  ChatInput
└─────────────────────────────────┘
```

### 5.2 Side Panel (전체 채팅)

```
┌─────────────────────────────────────┐
│  [H] H Chat          [새 대화] [⚙️]│
├──────────┬──────────────────────────┤
│ 대화목록  │  현재 대화               │
│ ───────  │                          │
│ 📄 AI전략│  [User] AI 전략 보고서   │
│ 📄 코드  │  분석해줘                 │
│ 📄 번역  │                          │
│          │  [AI] H Chat은...        │
│          │  SSE 스트리밍 ●          │
│          │                          │
│          ├──────────────────────────┤
│          │ [메시지 입력...]  [전송]  │
└──────────┴──────────────────────────┘
```

### 5.3 컨텍스트 메뉴 구조

```
우클릭 메뉴
├── H Chat으로 요약하기
├── H Chat으로 설명하기
├── H Chat으로 리서치
├── H Chat으로 번역하기
└── ──────────
    └── H Chat에서 열기 (Side Panel)
```

---

## 6. 서비스 레이어 설계

### 6.1 서비스 인터페이스

```typescript
// services/extensionChatService.ts
interface ExtensionChatService {
  analyze(request: AnalyzeRequest): AsyncGenerator<StreamChunk>
  chat(request: ChatRequest): AsyncGenerator<StreamChunk>
  getConversations(): Promise<Conversation[]>
  saveConversation(conv: Conversation): Promise<void>
  deleteConversation(id: string): Promise<void>
}

interface ExtensionStorageService {
  getContext(): Promise<PageContext | null>
  setContext(ctx: PageContext): Promise<void>
  clearContext(): Promise<void>
  getSettings(): Promise<ExtensionSettings>
  setSettings(settings: Partial<ExtensionSettings>): Promise<void>
}

interface ExtensionAnalyzeService {
  summarize(text: string, options?: AnalyzeOptions): AsyncGenerator<StreamChunk>
  explain(text: string, options?: AnalyzeOptions): AsyncGenerator<StreamChunk>
  research(text: string, options?: AnalyzeOptions): AsyncGenerator<StreamChunk>
  translate(text: string, targetLang: string): AsyncGenerator<StreamChunk>
}
```

### 6.2 Mock/Real 전환

```typescript
// services/ExtensionServiceProvider.tsx
const ExtensionServiceContext = createContext<ExtensionServices | null>(null)

export function ExtensionServiceProvider({ children }: Props) {
  const services = useMemo(() => {
    const mode = getApiMode() // 'mock' | 'real'
    return {
      chat: mode === 'mock' ? mockChatService : realChatService,
      storage: extensionStorageService,
      analyze: mode === 'mock' ? mockAnalyzeService : realAnalyzeService,
    }
  }, [])

  return (
    <ExtensionServiceContext.Provider value={services}>
      {children}
    </ExtensionServiceContext.Provider>
  )
}
```

### 6.3 API 엔드포인트 매핑

| Extension 기능 | API Gateway | AI Core |
|---------------|-------------|---------|
| 요약 | POST /api/v1/analyze | POST /analyze |
| 설명 | POST /api/v1/analyze | POST /analyze |
| 리서치 | POST /api/v1/research | POST /research |
| 번역 | POST /api/v1/analyze | POST /analyze |
| 채팅 | POST /api/v1/chat/stream | POST /chat/stream |

---

## 7. 보안 설계

### 7.1 보안 계층

| 계층 | 보안 조치 | 구현 위치 |
|------|----------|----------|
| Content Script | blocklist + PII sanitize | content.ts |
| Background | Rate limit (10/min) | background.ts |
| Storage | 5분 자동 만료 | storage.ts |
| API 호출 | Zod 검증 + API Key 서버사이드 | extensionChatService.ts |
| CSP | script-src 'self' | manifest.json |
| 권한 | optional_host_permissions | manifest.json |

### 7.2 PII 살균 규칙

```typescript
const PII_PATTERNS = [
  { pattern: /\b\d{6}[-]\d{7}\b/g, replacement: '[주민번호]' },
  { pattern: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, replacement: '[카드번호]' },
  { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, replacement: '[이메일]' },
  { pattern: /\b01[016789][-\s]?\d{3,4}[-\s]?\d{4}\b/g, replacement: '[전화번호]' },
  { pattern: /\b\d{3}-\d{2}-\d{5}\b/g, replacement: '[사업자번호]' },
]
```

### 7.3 Content Script 보안

```typescript
// content.ts 개선
function extractAndSanitize(): SanitizedContext {
  if (shouldBlockExtraction(location.href)) {
    return { text: '', url: location.href, title: '', blocked: true }
  }

  const rawText = extractText()
  const sanitizedText = sanitizePII(rawText)

  return {
    text: sanitizedText.slice(0, MAX_TEXT_LENGTH),
    url: location.href,
    title: document.title,
    blocked: false,
  }
}
```

---

## 8. 디자인 토큰 설계

### 8.1 Extension 전용 토큰 (`--ext-*`)

```css
/* packages/tokens/styles/tokens.css 에 추가 */
:root {
  /* Extension Popup */
  --ext-popup-width: 400px;
  --ext-popup-max-height: 600px;
  --ext-popup-bg: var(--user-bg);
  --ext-popup-surface: var(--user-surface);
  --ext-popup-border: var(--user-border);

  /* Extension Header */
  --ext-header-height: 48px;
  --ext-header-bg: var(--user-primary);

  /* Extension Mode Selector */
  --ext-mode-size: 80px;
  --ext-mode-bg: var(--user-surface);
  --ext-mode-active: var(--user-primary);

  /* Extension Context Banner */
  --ext-context-bg: var(--user-surface-secondary);
  --ext-context-border: var(--user-border);
}

.dark {
  --ext-popup-bg: var(--user-bg);
  --ext-popup-surface: var(--user-surface);
}
```

### 8.2 Tailwind CSS 4 통합

```css
/* apps/extension/src/globals.css */
@import "../../../../packages/tokens/styles/tokens.css";
@import "tailwindcss";

@source "../../../../packages/ui/src";
@source "../src";

@theme inline {
  --color-ext-bg: var(--ext-popup-bg);
  --color-ext-surface: var(--ext-popup-surface);
  --color-ext-primary: var(--user-primary);
  --color-ext-text: var(--user-text-primary);
  --color-ext-text-secondary: var(--user-text-secondary);
}
```

---

## 9. 빌드 시스템 설계

### 9.1 Vite 설정

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@hchat/ui': resolve(__dirname, '../../packages/ui/src'),
      '@hchat/tokens': resolve(__dirname, '../../packages/tokens'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'src/popup/popup.html'),
        sidepanel: resolve(__dirname, 'src/sidepanel/sidepanel.html'),
        options: resolve(__dirname, 'src/options/options.html'),
        content: resolve(__dirname, 'src/content.ts'),
        background: resolve(__dirname, 'src/background.ts'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
    // MV3 CSP: 인라인 스크립트 금지
    cssCodeSplit: false,
  },
})
```

### 9.2 Turbo 통합

```json
// turbo.json에 추가
{
  "build:extension": {
    "dependsOn": ["@hchat/tokens#build", "@hchat/ui#build"],
    "inputs": ["src/**", "public/**", "vite.config.ts"],
    "outputs": ["dist/**"]
  }
}
```

### 9.3 package.json

```json
{
  "name": "@hchat/extension",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite build --watch",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "lint": "eslint src/",
    "zip": "cd dist && zip -r ../hchat-extension.zip ."
  },
  "dependencies": {
    "@hchat/tokens": "workspace:*",
    "@hchat/ui": "workspace:*",
    "react": "^19.2.4",
    "react-dom": "^19.2.4"
  },
  "devDependencies": {
    "@types/chrome": "^0.1.37",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.5.2",
    "tailwindcss": "^4.0.0",
    "typescript": "^5.7.0",
    "vite": "^6.0.0",
    "vitest": "^3.0.0"
  }
}
```

---

## 10. 테스트 전략

### 10.1 테스트 계층

| 계층 | 도구 | 커버리지 목표 | 파일 수 |
|------|------|-------------|--------|
| 단위 테스트 | Vitest | 80%+ | ~25 |
| 컴포넌트 테스트 | Vitest + Testing Library | 80%+ | ~15 |
| E2E | Playwright + chrome.test | 핵심 흐름 | ~5 |
| Storybook | Storybook 9 | 시각적 검증 | ~15 |

### 10.2 테스트 대상

| 모듈 | 테스트 항목 |
|------|-----------|
| content.ts | 텍스트 추출, PII 살균, blocklist |
| background.ts | 메시지 라우팅, 컨텍스트 메뉴, storage |
| useExtensionChat | 분석 요청, 스트리밍, 에러 처리 |
| usePageContext | 컨텍스트 로드, 갱신, 정리 |
| extensionChatService | Mock/Real 전환, API 호출 |
| Popup.tsx | 렌더링, 모드 선택, 결과 표시 |
| ModeSelector | 버튼 클릭, 활성 상태 |
| ContextBanner | 컨텍스트 표시, 잘림 처리 |

---

## 11. 구현 로드맵

### Phase 1: 기반 구축 (Worker 1-3)

| # | 작업 | 담당 | 난이도 | 예상 파일 |
|---|------|------|--------|----------|
| 1 | 디자인 토큰 확장 (`--ext-*`) | W1 | LOW | 2 |
| 2 | Extension 프로젝트 구조 리셋 | W1 | MEDIUM | 10 |
| 3 | Vite 빌드 + @hchat/ui alias 설정 | W1 | MEDIUM | 3 |
| 4 | manifest.json 재설계 (Side Panel, commands) | W2 | LOW | 1 |
| 5 | 타입 시스템 재설계 (messages, context, settings) | W2 | MEDIUM | 5 |
| 6 | chrome.storage 타입 안전 래퍼 | W2 | LOW | 2 |
| 7 | messaging 타입 안전 래퍼 | W2 | LOW | 2 |
| 8 | PII sanitize 강화 | W3 | MEDIUM | 2 |
| 9 | blocklist 테스트 + 패턴 확장 | W3 | LOW | 2 |

### Phase 2: 서비스 레이어 (Worker 1-3)

| # | 작업 | 담당 | 난이도 | 예상 파일 |
|---|------|------|--------|----------|
| 10 | ExtensionServiceProvider | W1 | MEDIUM | 3 |
| 11 | extensionChatService (Mock) | W1 | MEDIUM | 2 |
| 12 | extensionChatService (Real + SSE) | W1 | HIGH | 2 |
| 13 | extensionStorageService | W2 | MEDIUM | 2 |
| 14 | extensionAnalyzeService (Mock/Real) | W2 | MEDIUM | 3 |
| 15 | Zod 입력 스키마 | W3 | LOW | 2 |
| 16 | 서비스 단위 테스트 (15개+) | W3 | MEDIUM | 5 |

### Phase 3: UI 구현 (Worker 1-3)

| # | 작업 | 담당 | 난이도 | 예상 파일 |
|---|------|------|--------|----------|
| 17 | Popup App.tsx + Provider 계층 | W1 | MEDIUM | 3 |
| 18 | PopupHeader + 테마/언어 토글 | W1 | LOW | 2 |
| 19 | ModeSelector (2x2 그리드) | W1 | LOW | 2 |
| 20 | ContextBanner | W2 | LOW | 2 |
| 21 | ChatPage (MessageBubble 재사용) | W2 | HIGH | 3 |
| 22 | AnalyzePage (스트리밍 결과) | W2 | MEDIUM | 2 |
| 23 | useExtensionChat 훅 | W3 | HIGH | 2 |
| 24 | usePageContext 훅 | W3 | MEDIUM | 2 |
| 25 | UI 컴포넌트 테스트 (20개+) | W3 | MEDIUM | 8 |

### Phase 4: Background + Content (Worker 1-2)

| # | 작업 | 담당 | 난이도 | 예상 파일 |
|---|------|------|--------|----------|
| 26 | background.ts 재작성 (메시지 라우팅 + 메뉴) | W1 | MEDIUM | 1 |
| 27 | content.ts 재작성 (PII + 향상된 추출) | W1 | MEDIUM | 1 |
| 28 | Side Panel 기본 구현 | W2 | MEDIUM | 3 |
| 29 | Options 페이지 | W2 | LOW | 3 |
| 30 | E2E 테스트 | W3 | HIGH | 5 |

### Phase 5: 통합 + 마무리 (전체)

| # | 작업 | 담당 | 난이도 |
|---|------|------|--------|
| 31 | PWA 연동 (useExtensionContext) | W1 | MEDIUM |
| 32 | Storybook 스토리 (15개) | W2 | LOW |
| 33 | 다크모드 전체 검증 | W2 | LOW |
| 34 | 커버리지 80%+ 달성 | W3 | MEDIUM |
| 35 | Chrome Web Store 준비 (스크린샷, 설명) | W1 | LOW |
| 36 | 최종 보안 리뷰 | PM | HIGH |

---

## 12. 예상 산출물

| 항목 | 수량 |
|------|------|
| 새 파일 | ~65 |
| 수정 파일 | ~8 |
| 총 LOC | ~5,000 |
| 테스트 파일 | ~25 |
| 테스트 케이스 | ~200+ |
| Storybook 스토리 | ~15 |
| 커버리지 | 80%+ |

---

## 13. 위험 요소 및 완화

| 위험 | 영향 | 완화 |
|------|------|------|
| @hchat/ui 빌드 호환성 (Vite alias) | HIGH | Phase 1에서 검증 |
| MV3 CSP + React 충돌 | HIGH | 인라인 스크립트 제거, cssCodeSplit: false |
| Side Panel API 브라우저 호환성 | MEDIUM | Chrome 114+ 타겟, 미지원 시 popup fallback |
| SSE 스트리밍 in Extension | MEDIUM | background.ts 프록시 vs popup 직접 |
| chrome.storage 용량 제한 (10MB) | LOW | 대화 히스토리 자동 정리 |
| Chrome Web Store 심사 | LOW | 최소 권한 + 상세 개인정보 처리방침 |

---

## 14. 성공 기준

- [ ] 모든 @hchat/ui 재사용 컴포넌트 정상 동작
- [ ] 4가지 분석 모드 SSE 스트리밍 동작
- [ ] 다크모드 + 라이트모드 정상
- [ ] i18n 한/영 전환 정상
- [ ] PII 살균 + blocklist 동작
- [ ] 테스트 커버리지 80%+
- [ ] 전체 모노레포 빌드 성공 (10/10 앱)
- [ ] Chrome Web Store 심사 제출 가능 상태
