# H Chat Chrome Extension 구현방안

> 작성일: 2026-03-14 | Phase 103 구현 가이드
> 참조: [설계안](./CHROME_EXTENSION_DESIGN.md)

---

## 1. 작업 배분 (PM + Worker 3명)

### PM 역할
- Worker 일감 배정 및 진척 관리
- 블로커 해결 및 의사결정
- 코드 리뷰 + 보안 리뷰
- 통합 테스트 검증
- 최종 빌드 확인

### Worker 배분

| Worker | 전문 영역 | 담당 |
|--------|----------|------|
| **W1** (infra-builder) | 빌드/인프라/서비스 | 프로젝트 구조, Vite 빌드, 서비스 레이어, background/content |
| **W2** (ui-developer) | UI 컴포넌트 | Popup UI, Side Panel, Options, Storybook, 다크모드 |
| **W3** (test-engineer) | 테스트/보안/품질 | 단위/E2E 테스트, PII 살균, Zod 스키마, 커버리지 |

---

## 2. Phase 1: 기반 구축

### Task 1.1: 프로젝트 구조 리셋 (W1)

```
apps/extension/
├── public/
│   ├── manifest.json          # 새 manifest
│   ├── icons/                 # 아이콘 세트
│   │   ├── icon16.png
│   │   ├── icon32.png
│   │   ├── icon48.png
│   │   └── icon128.png
│   └── _locales/
│       ├── ko/messages.json
│       └── en/messages.json
├── src/
│   ├── popup/
│   │   ├── popup.html
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── globals.css
│   │   ├── pages/
│   │   │   ├── ChatPage.tsx
│   │   │   ├── AnalyzePage.tsx
│   │   │   └── SettingsPage.tsx
│   │   ├── components/
│   │   │   ├── PopupHeader.tsx
│   │   │   ├── ModeSelector.tsx
│   │   │   ├── ContextBanner.tsx
│   │   │   ├── QuickActions.tsx
│   │   │   └── ChatInput.tsx
│   │   └── hooks/
│   │       ├── useExtensionChat.ts
│   │       ├── usePageContext.ts
│   │       ├── useExtensionSettings.ts
│   │       └── usePopupRouter.ts
│   ├── sidepanel/
│   │   ├── sidepanel.html
│   │   ├── main.tsx
│   │   └── SidePanel.tsx
│   ├── options/
│   │   ├── options.html
│   │   ├── main.tsx
│   │   └── OptionsPage.tsx
│   ├── background.ts
│   ├── content.ts
│   ├── services/
│   │   ├── ExtensionServiceProvider.tsx
│   │   ├── extensionChatService.ts
│   │   ├── extensionStorageService.ts
│   │   ├── extensionAnalyzeService.ts
│   │   ├── mockExtensionService.ts
│   │   └── types.ts
│   ├── utils/
│   │   ├── blocklist.ts
│   │   ├── sanitize.ts
│   │   ├── messaging.ts
│   │   └── storage.ts
│   ├── types/
│   │   ├── messages.ts
│   │   ├── context.ts
│   │   └── settings.ts
│   └── chrome.d.ts
├── __tests__/
│   ├── unit/
│   │   ├── blocklist.test.ts
│   │   ├── sanitize.test.ts
│   │   ├── messaging.test.ts
│   │   ├── storage.test.ts
│   │   ├── extensionChatService.test.ts
│   │   ├── extensionStorageService.test.ts
│   │   └── extensionAnalyzeService.test.ts
│   ├── components/
│   │   ├── PopupHeader.test.tsx
│   │   ├── ModeSelector.test.tsx
│   │   ├── ContextBanner.test.tsx
│   │   ├── ChatPage.test.tsx
│   │   └── AnalyzePage.test.tsx
│   └── e2e/
│       ├── popup.spec.ts
│       ├── contextMenu.spec.ts
│       └── sidePanel.spec.ts
├── vite.config.ts
├── tsconfig.json
├── vitest.config.ts
├── package.json
└── README.md
```

### Task 1.2: Vite 빌드 설정 (W1)

**핵심 과제**: @hchat/ui 패키지를 Extension 내에서 번들링

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
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: process.env.NODE_ENV === 'development',
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
    cssCodeSplit: false, // MV3 CSP 호환
    target: 'chrome114',
  },
  publicDir: 'public',
})
```

**검증 기준**: `npm run build` 성공 + dist/ 구조 확인

### Task 1.3: 타입 시스템 (W2)

```typescript
// src/types/messages.ts
export type MessageAction =
  | 'EXTRACT_TEXT'
  | 'ANALYZE'
  | 'SET_CONTEXT'
  | 'CLEAR_CONTEXT'
  | 'GET_SETTINGS'
  | 'SET_SETTINGS'
  | 'OPEN_SIDEPANEL'

export interface ExtensionMessage<T = unknown> {
  action: MessageAction
  payload?: T
  requestId?: string
}

export interface ExtensionResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

// src/types/context.ts
export type AnalysisMode = 'summarize' | 'explain' | 'research' | 'translate'

export interface PageContext {
  text: string
  url: string
  title: string
  favicon?: string
  timestamp: number
  sanitized: boolean
}

export interface AnalyzeRequest {
  text: string
  mode: AnalysisMode
  url?: string
  title?: string
  targetLang?: string
}

export interface StreamChunk {
  type: 'token' | 'done' | 'error'
  content: string
  metadata?: Record<string, unknown>
}

// src/types/settings.ts
export interface ExtensionSettings {
  theme: 'light' | 'dark' | 'system'
  language: 'ko' | 'en'
  apiMode: 'mock' | 'real'
  apiBaseUrl: string
  maxTextLength: number
  autoSanitize: boolean
  enableSidePanel: boolean
  enableShortcuts: boolean
}

export const DEFAULT_SETTINGS: ExtensionSettings = {
  theme: 'system',
  language: 'ko',
  apiMode: 'mock',
  apiBaseUrl: 'https://hchat-user.vercel.app',
  maxTextLength: 5000,
  autoSanitize: true,
  enableSidePanel: true,
  enableShortcuts: true,
}
```

### Task 1.4: 유틸리티 래퍼 (W2)

```typescript
// src/utils/storage.ts
import type { ExtensionSettings, PageContext } from '../types'
import { DEFAULT_SETTINGS } from '../types/settings'

const KEYS = {
  CONTEXT: 'hchat_context',
  SETTINGS: 'hchat_settings',
  CONVERSATIONS: 'hchat_conversations',
} as const

function isChromeExtension(): boolean {
  return typeof chrome !== 'undefined' && !!chrome?.storage?.local
}

export async function getStoredContext(): Promise<PageContext | null> {
  if (!isChromeExtension()) return null
  const result = await chrome.storage.local.get(KEYS.CONTEXT)
  return result[KEYS.CONTEXT] ?? null
}

export async function setStoredContext(ctx: PageContext): Promise<void> {
  if (!isChromeExtension()) return
  await chrome.storage.local.set({ [KEYS.CONTEXT]: ctx })
}

export async function clearStoredContext(): Promise<void> {
  if (!isChromeExtension()) return
  await chrome.storage.local.remove(KEYS.CONTEXT)
}

export async function getSettings(): Promise<ExtensionSettings> {
  if (!isChromeExtension()) return DEFAULT_SETTINGS
  const result = await chrome.storage.local.get(KEYS.SETTINGS)
  return { ...DEFAULT_SETTINGS, ...result[KEYS.SETTINGS] }
}

export async function setSettings(
  partial: Partial<ExtensionSettings>,
): Promise<ExtensionSettings> {
  const current = await getSettings()
  const updated = { ...current, ...partial }
  if (isChromeExtension()) {
    await chrome.storage.local.set({ [KEYS.SETTINGS]: updated })
  }
  return updated
}

// src/utils/messaging.ts
import type { ExtensionMessage, ExtensionResponse } from '../types/messages'

export function sendMessage<T>(
  message: ExtensionMessage,
): Promise<ExtensionResponse<T>> {
  return new Promise((resolve) => {
    if (typeof chrome === 'undefined' || !chrome.runtime) {
      resolve({ success: false, error: 'Not in extension context' })
      return
    }
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        resolve({ success: false, error: chrome.runtime.lastError.message })
        return
      }
      resolve(response as ExtensionResponse<T>)
    })
  })
}

export function sendTabMessage<T>(
  tabId: number,
  message: ExtensionMessage,
): Promise<ExtensionResponse<T>> {
  return new Promise((resolve) => {
    chrome.tabs.sendMessage(tabId, message, (response) => {
      if (chrome.runtime.lastError) {
        resolve({ success: false, error: chrome.runtime.lastError.message })
        return
      }
      resolve(response as ExtensionResponse<T>)
    })
  })
}
```

### Task 1.5: PII 살균 강화 (W3)

```typescript
// src/utils/sanitize.ts
interface PIIPattern {
  name: string
  pattern: RegExp
  replacement: string
}

const PII_PATTERNS: readonly PIIPattern[] = [
  { name: 'rrn', pattern: /\b\d{6}[-]\d{7}\b/g, replacement: '[주민번호]' },
  { name: 'card', pattern: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, replacement: '[카드번호]' },
  { name: 'email', pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, replacement: '[이메일]' },
  { name: 'phone', pattern: /\b01[016789][-\s]?\d{3,4}[-\s]?\d{4}\b/g, replacement: '[전화번호]' },
  { name: 'bizno', pattern: /\b\d{3}-\d{2}-\d{5}\b/g, replacement: '[사업자번호]' },
  { name: 'passport', pattern: /\b[A-Z]{1,2}\d{7,8}\b/g, replacement: '[여권번호]' },
  { name: 'account', pattern: /\b\d{3,4}-\d{2,6}-\d{4,6}\b/g, replacement: '[계좌번호]' },
]

export interface SanitizeResult {
  text: string
  detectedPatterns: string[]
  originalLength: number
  sanitizedLength: number
}

export function sanitizePII(text: string): SanitizeResult {
  const detectedPatterns: string[] = []
  let sanitized = text

  for (const { name, pattern, replacement } of PII_PATTERNS) {
    const regex = new RegExp(pattern.source, pattern.flags)
    if (regex.test(sanitized)) {
      detectedPatterns.push(name)
      sanitized = sanitized.replace(
        new RegExp(pattern.source, pattern.flags),
        replacement,
      )
    }
  }

  return {
    text: sanitized,
    detectedPatterns,
    originalLength: text.length,
    sanitizedLength: sanitized.length,
  }
}

export function hasSensitiveData(text: string): boolean {
  return PII_PATTERNS.some(({ pattern }) =>
    new RegExp(pattern.source, pattern.flags).test(text),
  )
}
```

---

## 3. Phase 2: 서비스 레이어

### Task 2.1: ExtensionServiceProvider (W1)

```typescript
// src/services/ExtensionServiceProvider.tsx
import React, { createContext, useContext, useMemo } from 'react'
import type { ExtensionChatService, ExtensionAnalyzeService } from './types'
import { createMockChatService } from './mockExtensionService'
import { createRealChatService } from './extensionChatService'
import { createMockAnalyzeService, createRealAnalyzeService } from './extensionAnalyzeService'
import { getSettings } from '../utils/storage'

interface ExtensionServices {
  chat: ExtensionChatService
  analyze: ExtensionAnalyzeService
}

const ServiceContext = createContext<ExtensionServices | null>(null)

export function ExtensionServiceProvider({
  children,
  apiMode,
}: {
  children: React.ReactNode
  apiMode?: 'mock' | 'real'
}) {
  const services = useMemo<ExtensionServices>(() => {
    const mode = apiMode ?? 'mock'
    return {
      chat: mode === 'mock' ? createMockChatService() : createRealChatService(),
      analyze: mode === 'mock' ? createMockAnalyzeService() : createRealAnalyzeService(),
    }
  }, [apiMode])

  return (
    <ServiceContext.Provider value={services}>
      {children}
    </ServiceContext.Provider>
  )
}

export function useExtensionServices(): ExtensionServices {
  const ctx = useContext(ServiceContext)
  if (!ctx) {
    throw new Error('useExtensionServices must be used within ExtensionServiceProvider')
  }
  return ctx
}
```

### Task 2.2: Chat Service (W1)

```typescript
// src/services/types.ts
import type { AnalyzeRequest, StreamChunk, AnalysisMode } from '../types'

export interface Conversation {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: number
  updatedAt: number
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  mode?: AnalysisMode
  timestamp: number
}

export interface ExtensionChatService {
  sendMessage(
    conversationId: string,
    content: string,
    onChunk: (chunk: StreamChunk) => void,
    signal?: AbortSignal,
  ): Promise<void>

  getConversations(): Promise<Conversation[]>
  getConversation(id: string): Promise<Conversation | null>
  createConversation(title: string): Promise<Conversation>
  deleteConversation(id: string): Promise<void>
}

export interface ExtensionAnalyzeService {
  analyze(
    request: AnalyzeRequest,
    onChunk: (chunk: StreamChunk) => void,
    signal?: AbortSignal,
  ): Promise<void>
}
```

```typescript
// src/services/extensionChatService.ts (Real)
import type { ExtensionChatService, Conversation } from './types'
import type { StreamChunk } from '../types'
import { getSettings } from '../utils/storage'

export function createRealChatService(): ExtensionChatService {
  async function sendMessage(
    conversationId: string,
    content: string,
    onChunk: (chunk: StreamChunk) => void,
    signal?: AbortSignal,
  ): Promise<void> {
    const settings = await getSettings()
    const url = `${settings.apiBaseUrl}/api/v1/chat/stream`

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId, message: content }),
      signal,
    })

    if (!response.ok) {
      throw new Error(`Chat request failed (${response.status})`)
    }

    const reader = response.body?.getReader()
    if (!reader) throw new Error('No response body')

    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const data = line.slice(6).trim()
        if (data === '[DONE]') {
          onChunk({ type: 'done', content: '' })
          return
        }
        try {
          const parsed = JSON.parse(data)
          onChunk({ type: 'token', content: parsed.token ?? parsed.content ?? '' })
        } catch {
          // skip malformed chunks
        }
      }
    }

    onChunk({ type: 'done', content: '' })
  }

  return {
    sendMessage,
    async getConversations() {
      const result = await chrome.storage.local.get('hchat_conversations')
      return result.hchat_conversations ?? []
    },
    async getConversation(id) {
      const convs = await this.getConversations()
      return convs.find((c: Conversation) => c.id === id) ?? null
    },
    async createConversation(title) {
      const conv: Conversation = {
        id: crypto.randomUUID(),
        title,
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
      const convs = await this.getConversations()
      await chrome.storage.local.set({
        hchat_conversations: [...convs, conv],
      })
      return conv
    },
    async deleteConversation(id) {
      const convs = await this.getConversations()
      await chrome.storage.local.set({
        hchat_conversations: convs.filter((c: Conversation) => c.id !== id),
      })
    },
  }
}
```

### Task 2.3: Mock Service (W1)

```typescript
// src/services/mockExtensionService.ts
import type { ExtensionChatService, ExtensionAnalyzeService, Conversation } from './types'
import type { StreamChunk, AnalyzeRequest } from '../types'

const MOCK_RESPONSES: Record<string, string> = {
  summarize: 'H Chat은 현대차그룹 임직원용 생성형 AI 서비스로, 다수의 LLM 모델을 통합하여 업무 효율성을 향상시키는 기업용 AI 플랫폼입니다.',
  explain: 'H Chat은 기업 내부에서 안전하게 사용할 수 있는 AI 챗봇 서비스입니다. OpenAI, Anthropic 등 다양한 제공자의 모델을 LLM 라우터를 통해 적절히 분배합니다.',
  research: '관련 분석: H Chat은 2024년 출시된 기업용 AI 서비스로, 글로벌 자동차 그룹 중 최초로 멀티 LLM 라우팅 기술을 도입했습니다.',
  translate: 'H Chat is a generative AI service for Hyundai Motor Group employees. It maximizes work efficiency by utilizing various LLM models.',
}

function simulateStream(
  text: string,
  onChunk: (chunk: StreamChunk) => void,
  signal?: AbortSignal,
): Promise<void> {
  return new Promise((resolve) => {
    const words = text.split(' ')
    let index = 0

    const interval = setInterval(() => {
      if (signal?.aborted) {
        clearInterval(interval)
        resolve()
        return
      }

      if (index >= words.length) {
        clearInterval(interval)
        onChunk({ type: 'done', content: '' })
        resolve()
        return
      }

      const separator = index === 0 ? '' : ' '
      onChunk({ type: 'token', content: separator + words[index] })
      index++
    }, 50)
  })
}

export function createMockChatService(): ExtensionChatService {
  let conversations: Conversation[] = []

  return {
    async sendMessage(conversationId, content, onChunk, signal) {
      await new Promise((r) => setTimeout(r, 300))
      const response = `AI 응답: "${content}"에 대한 분석 결과입니다. H Chat은 현대차그룹의 업무 효율을 극대화하는 AI 서비스입니다.`
      await simulateStream(response, onChunk, signal)
    },
    async getConversations() { return conversations },
    async getConversation(id) { return conversations.find((c) => c.id === id) ?? null },
    async createConversation(title) {
      const conv: Conversation = {
        id: crypto.randomUUID(),
        title,
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
      conversations = [...conversations, conv]
      return conv
    },
    async deleteConversation(id) {
      conversations = conversations.filter((c) => c.id !== id)
    },
  }
}

export function createMockAnalyzeService(): ExtensionAnalyzeService {
  return {
    async analyze(request: AnalyzeRequest, onChunk, signal) {
      await new Promise((r) => setTimeout(r, 300))
      const text = MOCK_RESPONSES[request.mode] ?? MOCK_RESPONSES.summarize
      await simulateStream(text, onChunk, signal)
    },
  }
}
```

### Task 2.4: Zod 스키마 (W3)

```typescript
// src/schemas/extension.ts
import { z } from 'zod'

export const analyzeRequestSchema = z.object({
  text: z.string().min(1).max(10000),
  mode: z.enum(['summarize', 'explain', 'research', 'translate']),
  url: z.string().url().optional(),
  title: z.string().max(500).optional(),
  targetLang: z.string().max(10).optional(),
})

export const settingsSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']),
  language: z.enum(['ko', 'en']),
  apiMode: z.enum(['mock', 'real']),
  apiBaseUrl: z.string().url(),
  maxTextLength: z.number().int().min(100).max(50000),
  autoSanitize: z.boolean(),
  enableSidePanel: z.boolean(),
  enableShortcuts: z.boolean(),
})

export const pageContextSchema = z.object({
  text: z.string().max(10000),
  url: z.string(),
  title: z.string().max(500),
  favicon: z.string().optional(),
  timestamp: z.number(),
  sanitized: z.boolean(),
})
```

---

## 4. Phase 3: UI 구현

### Task 3.1: Popup App 루트 (W1)

```typescript
// src/popup/App.tsx
import React, { useEffect, useState } from 'react'
import { ThemeProvider } from '@hchat/ui'
import { ExtensionServiceProvider } from '../services/ExtensionServiceProvider'
import { PopupHeader } from './components/PopupHeader'
import { ContextBanner } from './components/ContextBanner'
import { ModeSelector } from './components/ModeSelector'
import { AnalyzePage } from './pages/AnalyzePage'
import { usePageContext } from './hooks/usePageContext'
import { useExtensionSettings } from './hooks/useExtensionSettings'
import type { AnalysisMode } from '../types'

export function App() {
  const { settings, updateSettings } = useExtensionSettings()
  const { context, clearContext } = usePageContext()
  const [activeMode, setActiveMode] = useState<AnalysisMode | null>(null)

  return (
    <ThemeProvider>
      <ExtensionServiceProvider apiMode={settings.apiMode}>
        <div className="w-[400px] max-h-[600px] overflow-y-auto bg-ext-bg text-ext-text">
          <PopupHeader
            settings={settings}
            onSettingsChange={updateSettings}
          />

          {context && !activeMode && (
            <ContextBanner
              context={context}
              onClear={clearContext}
            />
          )}

          {!activeMode ? (
            <ModeSelector
              disabled={!context}
              onSelect={setActiveMode}
            />
          ) : (
            <AnalyzePage
              mode={activeMode}
              context={context}
              onBack={() => setActiveMode(null)}
            />
          )}
        </div>
      </ExtensionServiceProvider>
    </ThemeProvider>
  )
}
```

### Task 3.2: 핵심 Hooks (W3)

```typescript
// src/popup/hooks/usePageContext.ts
import { useState, useEffect, useCallback } from 'react'
import type { PageContext } from '../../types'
import { getStoredContext, clearStoredContext } from '../../utils/storage'

// 개발 환경 mock 데이터
const MOCK_CONTEXT: PageContext = {
  text: 'H Chat은 현대차그룹 임직원을 위한 생성형 AI 서비스입니다.',
  url: 'https://hchat.hmg.com/docs/overview',
  title: 'H Chat 서비스 개요',
  timestamp: Date.now(),
  sanitized: false,
}

function isChromeExtension(): boolean {
  return typeof chrome !== 'undefined' && !!chrome?.storage?.local
}

export function usePageContext() {
  const [context, setContext] = useState<PageContext | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (isChromeExtension()) {
        const stored = await getStoredContext()
        setContext(stored)
      } else {
        setContext(MOCK_CONTEXT)
      }
      setLoading(false)
    }
    load()

    // storage 변경 감지
    if (isChromeExtension()) {
      const listener = (changes: Record<string, chrome.storage.StorageChange>) => {
        if (changes.hchat_context) {
          setContext(changes.hchat_context.newValue ?? null)
        }
      }
      chrome.storage.local.onChanged.addListener(listener)
      return () => chrome.storage.local.onChanged.removeListener(listener)
    }
  }, [])

  const clearContext = useCallback(async () => {
    await clearStoredContext()
    setContext(null)
  }, [])

  return { context, loading, clearContext }
}
```

```typescript
// src/popup/hooks/useExtensionChat.ts
import { useState, useCallback, useRef } from 'react'
import { useExtensionServices } from '../../services/ExtensionServiceProvider'
import type { AnalysisMode, StreamChunk, PageContext } from '../../types'

interface UseExtensionChatReturn {
  result: string
  loading: boolean
  error: string | null
  analyze: (mode: AnalysisMode, context: PageContext) => Promise<void>
  abort: () => void
  reset: () => void
}

export function useExtensionChat(): UseExtensionChatReturn {
  const { analyze: analyzeService } = useExtensionServices()
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const analyze = useCallback(
    async (mode: AnalysisMode, context: PageContext) => {
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      setResult('')
      setError(null)
      setLoading(true)

      try {
        await analyzeService.analyze(
          {
            text: context.text,
            mode,
            url: context.url,
            title: context.title,
          },
          (chunk: StreamChunk) => {
            if (chunk.type === 'token') {
              setResult((prev) => prev + chunk.content)
            }
          },
          controller.signal,
        )
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          setError(err.message)
        }
      } finally {
        setLoading(false)
      }
    },
    [analyzeService],
  )

  const abort = useCallback(() => {
    abortRef.current?.abort()
    setLoading(false)
  }, [])

  const reset = useCallback(() => {
    abortRef.current?.abort()
    setResult('')
    setError(null)
    setLoading(false)
  }, [])

  return { result, loading, error, analyze, abort, reset }
}
```

### Task 3.3: PopupHeader (W2)

```typescript
// src/popup/components/PopupHeader.tsx
import React from 'react'
import { ThemeToggle } from '@hchat/ui'
import type { ExtensionSettings } from '../../types/settings'

interface PopupHeaderProps {
  settings: ExtensionSettings
  onSettingsChange: (partial: Partial<ExtensionSettings>) => void
}

export function PopupHeader({ settings, onSettingsChange }: PopupHeaderProps) {
  return (
    <header className="flex items-center justify-between px-4 py-3 border-b border-ext-surface">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-ext-primary flex items-center justify-center text-white font-bold text-sm">
          H
        </div>
        <h1 className="text-base font-semibold text-ext-text">H Chat</h1>
      </div>
      <div className="flex items-center gap-1">
        <ThemeToggle />
        <button
          type="button"
          className="p-1.5 rounded-md hover:bg-ext-surface transition-colors"
          aria-label="설정"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </button>
      </div>
    </header>
  )
}
```

### Task 3.4: ModeSelector (W2)

```typescript
// src/popup/components/ModeSelector.tsx
import React from 'react'
import type { AnalysisMode } from '../../types'

interface ModeSelectorProps {
  disabled: boolean
  onSelect: (mode: AnalysisMode) => void
}

interface ModeOption {
  mode: AnalysisMode
  icon: string
  label: string
  description: string
}

const MODE_OPTIONS: readonly ModeOption[] = [
  { mode: 'summarize', icon: '\uD83D\uDCC4', label: '요약', description: '핵심 내용을 요약합니다' },
  { mode: 'explain', icon: '\u2753', label: '설명', description: '쉽게 설명합니다' },
  { mode: 'research', icon: '\uD83D\uDD0D', label: '리서치', description: '관련 정보를 조사합니다' },
  { mode: 'translate', icon: '\uD83C\uDF10', label: '번역', description: '영어로 번역합니다' },
]

export function ModeSelector({ disabled, onSelect }: ModeSelectorProps) {
  return (
    <section className="px-4 py-3">
      <p className="text-xs font-medium text-ext-text-secondary mb-2">분석 모드</p>
      <div className="grid grid-cols-2 gap-2">
        {MODE_OPTIONS.map((option) => (
          <button
            key={option.mode}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(option.mode)}
            className="flex flex-col items-center gap-1 p-3 rounded-lg border border-ext-surface
                       hover:border-ext-primary hover:bg-ext-primary/5
                       disabled:opacity-40 disabled:cursor-not-allowed
                       transition-all duration-150"
            aria-label={`${option.label} 모드로 분석`}
          >
            <span className="text-xl" role="img" aria-hidden="true">
              {option.icon}
            </span>
            <span className="text-sm font-medium text-ext-text">{option.label}</span>
            <span className="text-[10px] text-ext-text-secondary">{option.description}</span>
          </button>
        ))}
      </div>
    </section>
  )
}
```

### Task 3.5: AnalyzePage (W2)

```typescript
// src/popup/pages/AnalyzePage.tsx
import React, { useEffect } from 'react'
import { Badge, Skeleton } from '@hchat/ui'
import { useExtensionChat } from '../hooks/useExtensionChat'
import type { AnalysisMode, PageContext } from '../../types'

// @hchat/ui의 MarkdownRenderer 재사용 (가능한 경우)
// import { MarkdownRenderer } from '@hchat/ui/user'

interface AnalyzePageProps {
  mode: AnalysisMode
  context: PageContext | null
  onBack: () => void
}

const MODE_LABELS: Record<AnalysisMode, string> = {
  summarize: '요약',
  explain: '설명',
  research: '리서치',
  translate: '번역',
}

export function AnalyzePage({ mode, context, onBack }: AnalyzePageProps) {
  const { result, loading, error, analyze, abort } = useExtensionChat()

  useEffect(() => {
    if (context) {
      analyze(mode, context)
    }
    return () => abort()
  }, [mode, context, analyze, abort])

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-ext-surface">
        <button
          type="button"
          onClick={onBack}
          className="p-1 rounded hover:bg-ext-surface transition-colors"
          aria-label="뒤로"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <Badge variant="outline">{MODE_LABELS[mode]}</Badge>
        {context && (
          <span className="text-xs text-ext-text-secondary truncate">
            {context.title}
          </span>
        )}
      </div>

      {/* Result */}
      <div className="flex-1 overflow-y-auto p-4">
        {error && (
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm">
            {error}
          </div>
        )}

        {loading && !result && (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        )}

        {result && (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{result}</p>
            {loading && (
              <span className="inline-block w-2 h-4 bg-ext-primary animate-pulse rounded-sm" />
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      {result && !loading && (
        <div className="flex gap-2 px-4 py-2 border-t border-ext-surface">
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText(result)}
            className="flex-1 py-1.5 text-xs font-medium rounded-md bg-ext-surface hover:bg-ext-surface/80 transition-colors"
          >
            복사
          </button>
          <button
            type="button"
            onClick={onBack}
            className="flex-1 py-1.5 text-xs font-medium rounded-md bg-ext-primary text-white hover:bg-ext-primary/90 transition-colors"
          >
            새 분석
          </button>
        </div>
      )}
    </div>
  )
}
```

---

## 5. Phase 4: Background + Content 재작성

### Task 4.1: background.ts (W1)

```typescript
// src/background.ts
import type { ExtensionMessage, PageContext, AnalysisMode } from './types'

const CONTEXT_MENU_MODES: Array<{ id: string; mode: AnalysisMode; title: string }> = [
  { id: 'hchat-summarize', mode: 'summarize', title: 'H Chat으로 요약하기' },
  { id: 'hchat-explain', mode: 'explain', title: 'H Chat으로 설명하기' },
  { id: 'hchat-research', mode: 'research', title: 'H Chat으로 리서치' },
  { id: 'hchat-translate', mode: 'translate', title: 'H Chat으로 번역하기' },
]

// 컨텍스트 메뉴 생성
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    const parentId = 'hchat-parent'
    chrome.contextMenus.create({
      id: parentId,
      title: 'H Chat',
      contexts: ['selection', 'page'],
    })

    for (const { id, title } of CONTEXT_MENU_MODES) {
      chrome.contextMenus.create({
        id,
        parentId,
        title,
        contexts: ['selection', 'page'],
      })
    }

    chrome.contextMenus.create({
      id: 'hchat-separator',
      parentId,
      type: 'separator',
      contexts: ['selection', 'page'],
    })

    chrome.contextMenus.create({
      id: 'hchat-sidepanel',
      parentId,
      title: 'H Chat에서 열기 (사이드 패널)',
      contexts: ['selection', 'page'],
    })
  })
})

// 컨텍스트 메뉴 클릭 처리
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab?.id) return

  if (info.menuItemId === 'hchat-sidepanel') {
    chrome.sidePanel.open({ tabId: tab.id })
    return
  }

  const modeEntry = CONTEXT_MENU_MODES.find((m) => m.id === info.menuItemId)
  if (!modeEntry) return

  try {
    const response = await chrome.tabs.sendMessage(tab.id, {
      action: 'EXTRACT_TEXT',
    } satisfies ExtensionMessage)

    if (response?.success) {
      const context: PageContext = {
        ...response.data,
        text: info.selectionText || response.data.text,
        timestamp: Date.now(),
        sanitized: true,
      }

      await chrome.storage.local.set({
        hchat_context: context,
        hchat_pending_mode: modeEntry.mode,
      })

      await chrome.action.openPopup()
    }
  } catch (error) {
    console.error('[H Chat] Context menu action failed:', error)
  }
})

// 메시지 라우팅
chrome.runtime.onMessage.addListener((message: ExtensionMessage, _sender, sendResponse) => {
  if (message.action === 'SET_CONTEXT' && message.payload) {
    chrome.storage.local
      .set({ hchat_context: message.payload })
      .then(() => sendResponse({ success: true }))
      .catch((err) => sendResponse({ success: false, error: String(err) }))
    return true
  }

  if (message.action === 'CLEAR_CONTEXT') {
    chrome.storage.local
      .remove(['hchat_context', 'hchat_pending_mode'])
      .then(() => sendResponse({ success: true }))
      .catch((err) => sendResponse({ success: false, error: String(err) }))
    return true
  }

  if (message.action === 'OPEN_SIDEPANEL') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.sidePanel.open({ tabId: tabs[0].id })
      }
    })
    sendResponse({ success: true })
    return false
  }

  return false
})

// 5분 자동 정리 알람
chrome.alarms.create('cleanup-context', { periodInMinutes: 5 })
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'cleanup-context') {
    chrome.storage.local.get('hchat_context', (result) => {
      const ctx = result.hchat_context as PageContext | undefined
      if (ctx && Date.now() - ctx.timestamp > 5 * 60 * 1000) {
        chrome.storage.local.remove(['hchat_context', 'hchat_pending_mode'])
      }
    })
  }
})
```

### Task 4.2: content.ts (W1)

```typescript
// src/content.ts
import type { ExtensionMessage, ExtensionResponse, PageContext } from './types'
import { shouldBlockExtraction } from './utils/blocklist'
import { sanitizePII } from './utils/sanitize'

const MAX_TEXT_LENGTH = 5000

function extractSelectedText(): string {
  const selection = window.getSelection()
  return selection ? selection.toString().trim() : ''
}

function extractPageText(): string {
  // 우선순위: article > main > body
  const article = document.querySelector('article')
  const main = document.querySelector('main')
  const target = article ?? main ?? document.body

  const text = target.innerText.trim()
  return text.length > MAX_TEXT_LENGTH
    ? text.slice(0, MAX_TEXT_LENGTH)
    : text
}

function buildContext(): Omit<PageContext, 'timestamp' | 'sanitized'> {
  const selectedText = extractSelectedText()
  const text = selectedText.length > 0 ? selectedText : extractPageText()

  return {
    text,
    url: location.href,
    title: document.title,
    favicon: getFavicon(),
  }
}

function getFavicon(): string {
  const link = document.querySelector<HTMLLinkElement>(
    'link[rel="icon"], link[rel="shortcut icon"]',
  )
  return link?.href ?? `${location.origin}/favicon.ico`
}

chrome.runtime.onMessage.addListener(
  (
    message: ExtensionMessage,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response: ExtensionResponse<Omit<PageContext, 'timestamp' | 'sanitized'>>) => void,
  ) => {
    if (message.action === 'EXTRACT_TEXT') {
      if (shouldBlockExtraction(location.href)) {
        sendResponse({
          success: false,
          error: '보안 사이트에서는 텍스트 추출이 차단됩니다.',
        })
        return false
      }

      const rawContext = buildContext()

      // PII 살균
      const sanitizeResult = sanitizePII(rawContext.text)
      const sanitizedContext = {
        ...rawContext,
        text: sanitizeResult.text,
      }

      sendResponse({ success: true, data: sanitizedContext })
    }

    return false
  },
)
```

---

## 6. Phase 5: 통합 테스트 + 마무리

### Task 5.1: 단위 테스트 예시 (W3)

```typescript
// __tests__/unit/sanitize.test.ts
import { describe, it, expect } from 'vitest'
import { sanitizePII, hasSensitiveData } from '../../src/utils/sanitize'

describe('sanitizePII', () => {
  it('주민번호를 마스킹한다', () => {
    const result = sanitizePII('주민번호: 900101-1234567')
    expect(result.text).toContain('[주민번호]')
    expect(result.detectedPatterns).toContain('rrn')
  })

  it('카드번호를 마스킹한다', () => {
    const result = sanitizePII('카드: 1234-5678-9012-3456')
    expect(result.text).toContain('[카드번호]')
    expect(result.detectedPatterns).toContain('card')
  })

  it('이메일을 마스킹한다', () => {
    const result = sanitizePII('이메일: user@example.com')
    expect(result.text).toContain('[이메일]')
  })

  it('전화번호를 마스킹한다', () => {
    const result = sanitizePII('전화: 010-1234-5678')
    expect(result.text).toContain('[전화번호]')
  })

  it('민감 데이터 없으면 원본 반환', () => {
    const result = sanitizePII('일반 텍스트입니다.')
    expect(result.text).toBe('일반 텍스트입니다.')
    expect(result.detectedPatterns).toHaveLength(0)
  })

  it('여러 PII 동시 마스킹', () => {
    const text = '이메일: a@b.com, 전화: 010-1234-5678'
    const result = sanitizePII(text)
    expect(result.detectedPatterns).toContain('email')
    expect(result.detectedPatterns).toContain('phone')
  })
})

describe('hasSensitiveData', () => {
  it('민감 데이터 포함 시 true', () => {
    expect(hasSensitiveData('카드: 1234-5678-9012-3456')).toBe(true)
  })

  it('민감 데이터 없으면 false', () => {
    expect(hasSensitiveData('일반 텍스트')).toBe(false)
  })
})
```

### Task 5.2: 빌드 검증 체크리스트

```bash
# 1. 전체 빌드
npm run build                    # 모노레포 전체 (10 앱)

# 2. Extension 단독 빌드
cd apps/extension && npm run build

# 3. dist/ 구조 확인
ls -la dist/
# popup.js, background.js, content.js, sidepanel.js, options.js
# manifest.json, icons/, assets/

# 4. 테스트
npm run test                     # 전체 테스트
cd apps/extension && npm run test # Extension 테스트

# 5. Chrome 로드
# chrome://extensions -> 개발자 모드 -> dist/ 로드

# 6. 커버리지
npm run test:coverage -- --filter=@hchat/extension
```

---

## 7. 일정 요약

| Phase | 기간 | W1 | W2 | W3 |
|-------|------|----|----|-----|
| Phase 1: 기반 | 1일 | 구조+빌드 | 타입+래퍼 | PII+blocklist |
| Phase 2: 서비스 | 1일 | ServiceProvider+Chat | Storage+Analyze | Zod+테스트 |
| Phase 3: UI | 1.5일 | App+Provider | Header+Mode+Analyze | Hooks+UI테스트 |
| Phase 4: BG+Content | 1일 | background+content | SidePanel+Options | E2E |
| Phase 5: 통합 | 0.5일 | PWA연동+Store | Storybook+다크 | 커버리지+보안 |

**총 예상: 5일, ~65파일, ~5,000 LOC, 200+ 테스트**
