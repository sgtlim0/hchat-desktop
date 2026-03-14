# Prism Chrome Extension — Comprehensive Analysis & hchat-pwa Integration Plan

**Analysis Date**: 2026-03-14
**Target Project**: hchat-pwa
**Source**: 10-chapter Prism Extension design documents

---

## 1. Executive Summary

### Overall Assessment: 72/100 (C-)

**Grade Breakdown**:
- Architecture: 75/100 (C+) — Solid patterns but scaling concerns
- Code Quality: 68/100 (D+) — Multiple CRITICAL bugs, inconsistent error handling
- Security: 78/100 (C+) — Good credential handling, but XSS/injection gaps
- Testing Strategy: 70/100 (C-) — Comprehensive plan but low actual coverage
- UX/Performance: 74/100 (C) — Good optimization, poor error recovery

### Top 3 Strengths
1. **Sophisticated Search Architecture** — Multi-tier tokenizer (Korean n-gram + compound patterns), relevance scoring, multi-entry indexing
2. **Robust State Management** — `TabStateManager` with 30min GC, `LLMQueue` with request deduplication, tab-isolated history
3. **Production-Ready Error System** — Centralized `ERROR_META`, `PrismError` class, user-facing recovery actions

### Top 3 Weaknesses
1. **CRITICAL Race Conditions** — `waitForDOMStable()` multiple resolve, `unwrapNode()` infinite loop, Next.js prefetch conflicts
2. **Inadequate Error Boundaries** — Missing response body parsing, unsafe API key deletion, unprotected quota cleanup
3. **Test Coverage Gap** — 0% backend tests, E2E only smoke tests, integration tests lack chrome.* API mocking

---

## 2. Cross-Chapter Issue Matrix

### CRITICAL (Must Fix Before Production)

| Issue ID | Chapter | Description | Impact | Fix Effort |
|----------|---------|-------------|--------|------------|
| **CRIT-01** | Ch3 (SPA) | `waitForDOMStable()` multiple resolve race — last observer wins, no cleanup | Data corruption, memory leak | 2h |
| **CRIT-02** | Ch5 (Extractor) | `unwrapNode()` infinite loop if parent === grandParent (DOM anomaly) | Browser freeze | 1h |
| **CRIT-03** | Ch1 (Notebook) | `*searchText` index expects `string[]` but receives `string` from `tokenize()` | All searches fail silently | 1h |
| **CRIT-04** | Ch4 (Errors) | Response body parsing without `res.ok` check — throws on 4xx/5xx HTML | Unhandled rejection crash | 30min |
| **CRIT-05** | Ch2 (Settings) | Provider switch instantly deletes old API key before validation — user locked out | UX disaster | 1h |
| **CRIT-06** | Ch3 (SPA) | History state grows unbounded — 1000+ entries after heavy browsing | Performance degradation | 2h |

### HIGH (P0 — Fix Within 1 Week)

| Issue ID | Chapter | Description | Impact | Fix Effort |
|----------|---------|-------------|--------|------------|
| HIGH-01 | Ch1 (Notebook) | `Promise.all + toArray()` loads all records — use `primaryKeys()` for count | Memory spike on 10K+ digests | 1h |
| HIGH-02 | Ch4 (Errors) | `withRetry()` ignores `retry-after` header — hammers rate-limited API | IP ban risk | 2h |
| HIGH-03 | Ch5 (Extractor) | `getBoundingClientRect()` in tight loop — forces reflow 1000+ times | UI jank | 3h |
| HIGH-04 | Ch3 (SPA) | Next.js prefetch triggers false navigation events | Unnecessary re-extracts | 4h |
| HIGH-05 | Ch2 (Settings) | `<a` tag typo in JSX — breaks Settings UI | Unrendered link | 5min |
| HIGH-06 | Ch4 (Errors) | `saveWithQuotaCheck()` auto-deletes oldest 20 digests without consent | Data loss | 2h |
| HIGH-07 | Ch6 (Search) | Korean compound patterns hardcoded — missing 90% of real compound nouns | Poor recall | 8h |
| HIGH-08 | Ch7 (Background) | `LLMQueue` doesn't cancel in-flight SSE streams — orphaned connections | Memory/socket leak | 3h |

### MEDIUM (P1 — Fix Within 2 Weeks)

| Issue ID | Chapter | Description | Impact | Fix Effort |
|----------|---------|-------------|--------|------------|
| MED-01 | Ch1 (Notebook) | `reduce()` initial value missing — crashes on empty array | Search fails on new installs | 10min |
| MED-02 | Ch5 (Extractor) | Column order unstable — `Object.keys()` iteration order not guaranteed | Inconsistent extraction | 2h |
| MED-03 | Ch6 (Search) | English prefix matching too aggressive — "prod" matches "product", "production", "produce" | Noisy results | 1h |
| MED-04 | Ch8 (Content) | `removeNoise()` 38 selectors run serially — blocks rendering | Slow extraction | 2h |
| MED-05 | Ch2 (Settings) | No model refresh on provider change — stale model list | UX confusion | 1h |
| MED-06 | Ch7 (Background) | Tab state GC runs every 30min — may delete active background tabs | Unexpected state loss | 2h |

### LOW (P2 — Backlog)

| Issue ID | Chapter | Description | Impact | Fix Effort |
|----------|---------|-------------|--------|------------|
| LOW-01 | Ch5 (Extractor) | `requestIdleCallback` polyfill missing for Safari | Safari users get synchronous blocking | 30min |
| LOW-02 | Ch10 (Onboarding) | No skip button — power users forced through 5 steps | Annoyance | 15min |
| LOW-03 | Ch9 (Testing) | E2E requires headed browser — CI/CD requires Xvfb | CI complexity | 1h |
| LOW-04 | Ch6 (Search) | No fuzzy matching — typos yield zero results | Poor UX | 4h |

---

## 3. hchat-pwa Integration TODO List

### P0: Immediate (Must-Have for Next Release)

#### TODO-P0-01: Implement Korean N-gram Search (Ch6)
**Related**: Chapter 6 (search.ts)
**Effort**: 12 hours
**Impact**: Chat history search, knowledge base search, prompt library search

**Tasks**:
1. Create `src/shared/lib/search/korean-tokenizer.ts`:
   - `koreanNgrams(word, 2, 4)` — 2~4 char sliding window
   - `expandCompoundWords()` — top 100 compound patterns (스마트폰 → 스마트, 폰)
   - `englishPrefixes(word, 3)` — substring prefixes for autocomplete
2. Migrate Dexie schemas to multi-entry indexes:
   ```typescript
   // src/shared/lib/db.ts
   sessions: '++id, projectId, createdAt, *searchText',
   messages: '++id, sessionId, timestamp, *searchText',
   knowledgeDocs: '++id, categoryId, *searchText',
   ```
3. Update `SessionStore.searchSessions()` to use `searchText` index
4. Add relevance scoring: `computeScore(query, doc)` with title boost + recency
5. **Test**: `korean-tokenizer.test.ts` — 15 test cases (compound words, English, mixed)

**Why hchat-pwa needs this**: Current search is exact-match only. Korean users report 0 results for partial queries.

---

#### TODO-P0-02: Centralized Error System (Ch4)
**Related**: Chapter 4 (errors.ts)
**Effort**: 8 hours
**Impact**: All API calls (Bedrock, OpenAI, Gemini, Modal backend)

**Tasks**:
1. Create `src/shared/lib/errors/prism-error.ts`:
   ```typescript
   class HChatError extends Error {
     code: 'API_KEY_INVALID' | 'RATE_LIMIT' | 'QUOTA_EXCEEDED' | ...
     userMessage: string
     action: 'RETRY' | 'CHECK_SETTINGS' | 'UPGRADE' | 'CONTACT_SUPPORT'
     originalError?: Error
   }
   ```
2. Define `ERROR_META` map (20+ error codes with messages/actions)
3. Create `handleApiResponse(res)` wrapper:
   - Check `res.ok` before `res.json()`
   - Map 401 → `API_KEY_INVALID`, 429 → `RATE_LIMIT`, etc.
4. Implement `withRetry(fn, { maxAttempts: 3, backoff: 'exponential', retryOn: [429] })`:
   - Parse `retry-after` header (seconds or HTTP-date)
   - Only retry on rate limits, not auth failures
5. Refactor all `fetch()` calls in:
   - `src/shared/lib/bedrock-client.ts`
   - `src/shared/lib/providers/openai.ts`
   - `src/shared/lib/providers/gemini.ts`
   - `src/shared/lib/geo-intel-api.ts`
6. Add `<ErrorDisplay>` UI component with recovery buttons
7. **Test**: `prism-error.test.ts`, `handle-api-response.test.ts`, `with-retry.test.ts`

**Why hchat-pwa needs this**: Current error handling is inconsistent. Users see raw error messages or silent failures.

---

#### TODO-P0-03: Fix IndexedDB Multi-Entry Index Bug (Ch1)
**Related**: Chapter 1 (notebook.ts)
**Effort**: 2 hours
**Impact**: Session/message/knowledge search

**Tasks**:
1. Audit all Dexie schemas in `src/shared/lib/db.ts`:
   - Find any `*searchText` indexes
   - Verify `tokenize()` returns `string[]`, not `string`
2. Fix tokenization:
   ```typescript
   // Before
   const tokens = text.split(/\s+/).filter(Boolean).join(' ')

   // After
   const tokens = text.split(/\s+/).filter(Boolean)
   ```
3. Update `saveDigest()` / `saveMessage()` helpers to pass arrays
4. **Test**: Insert 100 records, query with 2-word phrase, assert > 0 results

**Why hchat-pwa needs this**: Silent search failures are a CRITICAL bug.

---

#### TODO-P0-04: SPA Navigation Race Condition (Ch3)
**Related**: Chapter 3 (spa.ts)
**Effort**: 4 hours
**Impact**: React Router navigation in chat view

**Tasks**:
1. Create `src/shared/lib/dom/wait-for-stable.ts`:
   ```typescript
   export function waitForDOMStable(timeout = 2000): Promise<void> {
     let resolveOnce: (() => void) | null = null
     let timeoutId: number | null = null
     let observer: MutationObserver | null = null

     return new Promise((resolve) => {
       resolveOnce = () => {
         if (observer) observer.disconnect()
         if (timeoutId) clearTimeout(timeoutId)
         resolveOnce = null
         resolve()
       }

       observer = new MutationObserver(() => {
         if (timeoutId) clearTimeout(timeoutId)
         timeoutId = window.setTimeout(() => {
           if (resolveOnce) resolveOnce()
         }, 300)
       })

       observer.observe(document.body, { childList: true, subtree: true })
       timeoutId = window.setTimeout(() => {
         if (resolveOnce) resolveOnce()
       }, timeout)
     })
   }
   ```
2. Use in `useHydrateOnView.ts` for async data loading
3. **Test**: Simulate 5 rapid navigations, assert only 1 fetch triggered

**Why hchat-pwa needs this**: React Router navigation can trigger multiple re-renders. Need stable DOM detection.

---

### P1: High Priority (1-Week Sprint)

#### TODO-P1-01: LLM Request Queue with Deduplication (Ch7)
**Related**: Chapter 7 (background.ts)
**Effort**: 10 hours
**Impact**: Multi-session parallel streaming, group chat

**Tasks**:
1. Create `src/shared/lib/queue/llm-queue.ts`:
   ```typescript
   class LLMQueue {
     private running = new Map<string, AbortController>()
     private queue: QueueItem[] = []
     private concurrency = 2

     async enqueue(sessionId: string, type: 'chat' | 'translate' | 'digest', fn: () => Promise<void>) {
       const key = `${sessionId}:${type}`
       this.cancel(key) // Cancel duplicate
       const controller = new AbortController()
       this.running.set(key, controller)
       await this.waitForSlot()
       await fn()
       this.running.delete(key)
     }

     cancel(key: string) {
       this.running.get(key)?.abort()
       this.running.delete(key)
     }
   }
   ```
2. Integrate with `SessionStore.sendMessage()`:
   - Wrap `bedrockClient.chat()` in `queue.enqueue()`
   - Pass `AbortController.signal` to `fetch()`
3. Add progress events: `PROGRESS` → `STREAM_CHUNK` → `DONE` → `ERROR`
4. **Test**: Enqueue 5 requests, assert max 2 concurrent, cancel 3rd, verify abort

**Why hchat-pwa needs this**: Current group chat sends 3 requests in parallel. Need concurrency limit + cancellation.

---

#### TODO-P1-02: Quota-Safe IndexedDB Write (Ch4)
**Related**: Chapter 4 (errors.ts)
**Effort**: 4 hours
**Impact**: All Dexie `.add()` / `.put()` calls

**Tasks**:
1. Create `src/shared/lib/db/quota-safe-write.ts`:
   ```typescript
   export async function quotaSafeWrite<T>(
     table: Dexie.Table<T>,
     data: T,
     fallback?: () => Promise<void>
   ): Promise<void> {
     try {
       await table.add(data)
     } catch (err) {
       if (err.name === 'QuotaExceededError') {
         if (fallback) {
           await fallback() // User confirms cleanup
         } else {
           throw new HChatError({
             code: 'STORAGE_FULL',
             userMessage: 'Storage is full. Please delete old sessions.',
             action: 'OPEN_SETTINGS'
           })
         }
       } else {
         throw err
       }
     }
   }
   ```
2. Wrap all `db.sessions.add()`, `db.messages.add()`, etc.
3. Add Settings > Storage > "Auto-cleanup when full" toggle
4. **Test**: Mock `QuotaExceededError`, assert user prompt shown

**Why hchat-pwa needs this**: Users with 1000+ sessions hit quota silently.

---

#### TODO-P1-03: Enhanced Readability Extraction (Ch8)
**Related**: Chapter 8 (content_script.ts)
**Effort**: 12 hours
**Impact**: PDF chat, web search RAG integration

**Tasks**:
1. Create `src/shared/lib/extraction/readability.ts`:
   - `scoreElement(node)` — tag weights + class/ID keywords
   - `getLinkDensity(node)` — link text / total text
   - `collectCandidates()` — paragraphs with score > 20
   - `mergeRelatedSiblings()` — combine adjacent high-score nodes
   - `cleanText()` — whitespace normalization
2. Create `src/shared/lib/extraction/noise-removal.ts`:
   - 38 CSS selectors: `nav, aside, .ads, .comments, .social-share, ...`
   - Run in `requestIdleCallback` batches
3. Add page type detection:
   ```typescript
   type PageType = 'article' | 'product' | 'search' | 'doc' | 'general'
   function detectPageType(url: string, doc: Document): PageType
   ```
4. Integrate with web search feature:
   - `WebSearchStore.fetchAndExtract(url)`
   - Store extracted text in `searchResults[].content`
5. **Test**: 10 URLs (news, Wikipedia, product pages), assert >80% relevant text

**Why hchat-pwa needs this**: Web search currently fetches HTML but doesn't extract clean text. RAG quality is poor.

---

#### TODO-P1-04: Tab State Manager (Ch7)
**Related**: Chapter 7 (background.ts)
**Effort**: 6 hours
**Impact**: Multi-tab session isolation, history management

**Tasks**:
1. Create `src/shared/lib/state/tab-state-manager.ts`:
   ```typescript
   class TabStateManager {
     private tabs = new Map<string, TabState>()
     private gcInterval = 30 * 60 * 1000 // 30min

     getOrCreate(tabId: string): TabState {
       if (!this.tabs.has(tabId)) {
         this.tabs.set(tabId, { url: '', text: '', history: [] })
       }
       return this.tabs.get(tabId)!
     }

     update(tabId: string, partial: Partial<TabState>) {
       const state = this.getOrCreate(tabId)
       Object.assign(state, partial)
     }

     gc() {
       const cutoff = Date.now() - this.gcInterval
       for (const [id, state] of this.tabs) {
         if (state.lastAccess < cutoff) {
           this.tabs.delete(id)
         }
       }
     }
   }
   ```
2. Store browser tab URL in localStorage with tab-specific key
3. Prevent history growth beyond 100 entries (LRU eviction)
4. **Test**: Create 10 tabs, wait 31min, assert 10 → 0 after GC

**Why hchat-pwa needs this**: PWA can open multiple windows. Need tab-isolated state.

---

### P2: Medium Priority (2-Week Sprint)

#### TODO-P2-01: Korean Compound Word Dictionary (Ch6)
**Related**: Chapter 6 (search.ts)
**Effort**: 16 hours
**Impact**: Search recall improvement

**Tasks**:
1. Build Korean compound noun dictionary (10K+ entries):
   - Source: Sejong Corpus, Naver Dictionary API
   - Format: `{ "스마트폰": ["스마트", "폰"], "가격비교": ["가격", "비교"], ... }`
2. Add dictionary-based tokenization:
   ```typescript
   function expandCompoundWords(word: string, dict: CompoundDict): string[] {
     return dict[word] ?? [word]
   }
   ```
3. Pre-load dictionary on app init (120KB gzipped)
4. **Test**: "스마트폰 추천" → matches "스마트 폰", "스마트한 폰"

**Why hchat-pwa needs this**: Hardcoded 10 patterns miss 99% of Korean compounds.

---

#### TODO-P2-02: Site-Specific Extractor Adapters (Ch5)
**Related**: Chapter 5 (extractor.ts)
**Effort**: 20 hours
**Impact**: Web search quality for e-commerce, GitHub, etc.

**Tasks**:
1. Create `src/shared/lib/extraction/adapters/`:
   - `amazon.ts` — product grids (`#search .s-result-item`)
   - `naver-shopping.ts` — `.goods_list .goods_item`
   - `github-issues.ts` — `.js-issue-row`
2. Registry pattern:
   ```typescript
   const ADAPTERS = new Map<RegExp, Adapter>([
     [/amazon\.(com|co\.kr)/, amazonAdapter],
     [/shopping\.naver\.com/, naverShoppingAdapter],
     ...
   ])
   ```
3. Integrate with `readability.ts` — try adapter first, fallback to generic
4. **Test**: 5 sites × 3 pages each, assert >90% field accuracy

**Why hchat-pwa needs this**: Generic extraction fails on structured e-commerce sites.

---

#### TODO-P2-03: API Response Streaming Progress (Ch7)
**Related**: Chapter 7 (background.ts)
**Effort**: 8 hours
**Impact**: UX feedback during long operations (translate, doc-writer)

**Tasks**:
1. Define progress event schema:
   ```typescript
   type ProgressEvent =
     | { type: 'PROGRESS', message: string, percent: number }
     | { type: 'STREAM_CHUNK', chunk: string }
     | { type: 'DONE', result: any }
     | { type: 'ERROR', error: HChatError }
   ```
2. Update `bedrockClient.chat()` to emit progress events:
   - Parse SSE `data: {...}` lines
   - Call `onProgress({ type: 'STREAM_CHUNK', chunk })`
3. Add progress bar to translation/doc-writer UI
4. **Test**: Mock SSE stream with 5 chunks, assert 5 progress events

**Why hchat-pwa needs this**: Users don't know if 10-page translation is stuck or working.

---

#### TODO-P2-04: Onboarding Flow (Ch10)
**Related**: Chapter 10 (onboarding.tsx)
**Effort**: 12 hours
**Impact**: First-time user experience

**Tasks**:
1. Create `src/pages/onboarding/OnboardingPage.tsx`:
   - 5 steps: Welcome → Provider → ApiKey → FirstChat → Complete
   - `ProgressBar` component (5 dots)
2. API Key step:
   - "How to get your API key" accordion
   - Auto-validation on paste (call `/api/health`)
   - Error message if invalid
3. First Chat step:
   - Pre-filled prompt: "Explain quantum computing in simple terms"
   - Live streaming demo
4. Store `isOnboardingComplete` in `SettingsStore`
5. **Test**: Complete flow in 2min, assert API key saved + first session created

**Why hchat-pwa needs this**: 30% of new users abandon due to API key confusion.

---

### P3: Backlog (Future Releases)

#### TODO-P3-01: Fuzzy Search with Levenshtein Distance (Ch6)
**Effort**: 8 hours
**Impact**: Typo tolerance
**Tasks**: Add `fuzzyMatch(query, target, maxDistance: 2)`, fall back if exact match fails

#### TODO-P3-02: Service Worker Response Caching (Ch4)
**Effort**: 6 hours
**Impact**: Offline support for repeated prompts
**Tasks**: Cache LLM responses by prompt hash, 24h TTL, show "Cached" badge

#### TODO-P3-03: E2E Test Suite for PWA (Ch9)
**Effort**: 20 hours
**Impact**: Regression prevention
**Tasks**: Playwright tests for 10 critical flows (login, chat, translate, export, settings)

#### TODO-P3-04: Advanced Extractor: Table Detection (Ch5)
**Effort**: 12 hours
**Impact**: Better product comparison pages
**Tasks**: Detect `<table>` or CSS grid patterns, infer headers, normalize to JSON

---

## 4. Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          PRISM EXTENSION ARCHITECTURE                     │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────────────┐      ┌──────────────────────┐      ┌──────────────┐
│   Content Script     │      │  Background (SW)     │      │  Side Panel  │
│  ─────────────────   │      │  ────────────────    │      │  ──────────  │
│  • Extract DOM       │◄─────┤  • TabStateManager   │◄─────┤  • Notebook  │
│  • Readability       │ msg  │  • LLMQueue          │ msg  │  • Search    │
│  • waitForStable()   │─────►│  • SSE Streaming     │─────►│  • Settings  │
│  • SPA Listener      │      │  • Error Handling    │      │  • Export    │
└──────────────────────┘      └──────────────────────┘      └──────────────┘
         │                              │                             │
         │                              │                             │
         ▼                              ▼                             ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                          DEXIE.JS (IndexedDB)                             │
│  ───────────────────────────────────────────────────────────────────     │
│  • digests: ++id, url, *searchText, createdAt                            │
│  • extracts: ++id, url, rows, columns, *searchText                       │
│  • notes: ++id, digestId, content, *searchText                           │
│  • settings: id, provider, apiKey, model                                 │
└──────────────────────────────────────────────────────────────────────────┘
         │                              │                             │
         │                              │                             │
         ▼                              ▼                             ▼
┌─────────────────┐      ┌─────────────────────┐      ┌──────────────────┐
│  Anthropic API  │      │   OpenAI API        │      │   Error System   │
│  ─────────────  │      │   ────────────      │      │   ────────────   │
│  • SSE Stream   │      │   • SSE Stream      │      │   • PrismError   │
│  • Tool Calls   │      │   • Models List     │      │   • ERROR_META   │
└─────────────────┘      └─────────────────────┘      │   • withRetry()  │
                                                        │   • handleResp() │
                                                        └──────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                          DATA FLOW (Digest Request)                       │
└─────────────────────────────────────────────────────────────────────────┘

1. User clicks "Digest" → Side Panel sends DIGEST_REQUEST to Background
2. Background enqueues in LLMQueue (max 2 concurrent)
3. Background sends EXTRACT_CONTENT to Content Script
4. Content Script runs Readability → returns { text, type, url }
5. Background calls streamAnthropicDigest(text) → SSE chunks
6. Background sends STREAM_CHUNK events to Side Panel
7. Side Panel updates UI incrementally
8. Background sends DONE → Side Panel saves to Dexie with searchText index
9. TabStateManager caches digest in tab state (30min TTL)

ERROR PATH:
- API error → handleApiResponse() → PrismError
- PrismError serialized to Side Panel
- ErrorDisplay shows userMessage + action buttons
- User clicks "Retry" → Re-enqueue with exponential backoff
```

---

## 5. hchat-pwa Adapted Architecture

```
src/
├── shared/
│   ├── lib/
│   │   ├── search/
│   │   │   ├── korean-tokenizer.ts        [TODO-P0-01]
│   │   │   ├── relevance-scorer.ts        [TODO-P0-01]
│   │   │   └── fuzzy-matcher.ts           [TODO-P3-01]
│   │   ├── errors/
│   │   │   ├── hchat-error.ts             [TODO-P0-02]
│   │   │   ├── error-meta.ts              [TODO-P0-02]
│   │   │   ├── handle-api-response.ts     [TODO-P0-02]
│   │   │   └── with-retry.ts              [TODO-P0-02]
│   │   ├── queue/
│   │   │   └── llm-queue.ts               [TODO-P1-01]
│   │   ├── state/
│   │   │   └── tab-state-manager.ts       [TODO-P1-04]
│   │   ├── extraction/
│   │   │   ├── readability.ts             [TODO-P1-03]
│   │   │   ├── noise-removal.ts           [TODO-P1-03]
│   │   │   ├── page-type-detector.ts      [TODO-P1-03]
│   │   │   └── adapters/
│   │   │       ├── amazon.ts              [TODO-P2-02]
│   │   │       ├── naver-shopping.ts      [TODO-P2-02]
│   │   │       └── github-issues.ts       [TODO-P2-02]
│   │   ├── dom/
│   │   │   └── wait-for-stable.ts         [TODO-P0-04]
│   │   └── db/
│   │       ├── quota-safe-write.ts        [TODO-P1-02]
│   │       └── db.ts (updated schemas)    [TODO-P0-03]
│   └── ui/
│       └── ErrorDisplay.tsx               [TODO-P0-02]
├── pages/
│   ├── onboarding/
│   │   ├── OnboardingPage.tsx             [TODO-P2-04]
│   │   ├── WelcomeStep.tsx
│   │   ├── ApiKeyStep.tsx
│   │   └── FirstChatStep.tsx
│   └── web-search/ (enhanced)             [TODO-P1-03]
├── entities/
│   ├── session/session.store.ts (updated) [TODO-P0-01, P1-01]
│   ├── knowledge/knowledge.store.ts (upd) [TODO-P0-01]
│   └── settings/settings.store.ts (upd)   [TODO-P2-04]
└── widgets/
    ├── prompt-input/ (updated)            [TODO-P1-01]
    └── message-list/ (updated)            [TODO-P2-03]
```

---

## 6. Security Checklist (Pre-Production)

### Authentication & Authorization
- [ ] **API keys stored only in chrome.storage.local** (or IndexedDB encrypted)
- [ ] **Never log API keys** — redact in error messages
- [ ] **Validate API key format** before storing (Anthropic: `sk-ant-api...`, OpenAI: `sk-proj...`)
- [ ] **Rate limit validation calls** — max 1 per 5 seconds
- [ ] **Prompt user before deleting API key** — no silent deletion on provider switch

### Input Validation
- [ ] **Sanitize all user input** before IndexedDB write (XSS in search queries)
- [ ] **Validate URL schemes** — block `javascript:`, `data:`, `file:`
- [ ] **Escape HTML in markdown rendering** — use DOMPurify or rehype-sanitize
- [ ] **Limit search query length** — max 200 chars to prevent ReDoS

### Data Protection
- [ ] **Encrypt sensitive data in IndexedDB** — use Web Crypto API for API keys
- [ ] **Implement auto-logout** — clear session after 30min inactivity
- [ ] **Secure export** — warn user before exporting API keys in JSON
- [ ] **CORS restrictions** — only allow known API domains (api.anthropic.com, api.openai.com)

### Error Handling
- [ ] **Never expose internal errors to UI** — use user-friendly messages
- [ ] **Log errors to secure endpoint** — not console.log in production
- [ ] **Prevent error-based enumeration** — generic "Authentication failed" message
- [ ] **Catch all unhandled rejections** — `window.addEventListener('unhandledrejection')`

### Content Security Policy
- [ ] **CSP header**: `default-src 'self'; script-src 'self' 'unsafe-eval'; connect-src https://api.anthropic.com https://api.openai.com`
- [ ] **Disallow inline scripts** — extract all event handlers to .js files
- [ ] **Sandbox iframes** — `<iframe sandbox="allow-scripts allow-same-origin">`

### Third-Party Dependencies
- [ ] **Audit npm packages** — `npm audit fix`
- [ ] **Pin dependency versions** — no `^` or `~` in package.json
- [ ] **Review dexie.js security** — check for known vulnerabilities
- [ ] **Minimize bundle size** — remove unused crypto libraries

### Testing
- [ ] **Penetration test API key handling** — attempt extraction via DevTools
- [ ] **Fuzzing search queries** — test with 10K random strings
- [ ] **SQL injection tests** — verify Dexie parameterization
- [ ] **XSS tests** — inject `<script>alert(1)</script>` in all inputs

---

## 7. Testing Strategy Summary

### Coverage Goals
- **Global**: 80% (statements, branches, functions, lines)
- **Core modules**: 90%+ (search, errors, queue, extraction)
- **UI components**: 70% (integration tests)
- **E2E**: 10 critical user flows

### Unit Tests (Jest + jsdom)

**Priority 1 (P0)**:
- `korean-tokenizer.test.ts` — 15 cases (n-grams, compounds, English, mixed)
- `hchat-error.test.ts` — 10 cases (error codes, serialization, recovery actions)
- `handle-api-response.test.ts` — 8 cases (200, 401, 429, 500, network error)
- `with-retry.test.ts` — 12 cases (retry-after, backoff, max attempts, abort)

**Priority 2 (P1)**:
- `llm-queue.test.ts` — 10 cases (enqueue, dedup, cancel, concurrency)
- `readability.test.ts` — 15 cases (scoreElement, linkDensity, noise removal)
- `quota-safe-write.test.ts` — 5 cases (success, quota error, fallback)

**Priority 3 (P2)**:
- `tab-state-manager.test.ts` — 8 cases (create, update, GC, history limit)
- `relevance-scorer.test.ts` — 10 cases (title boost, recency, partial match)
- `fuzzy-matcher.test.ts` — 6 cases (Levenshtein, threshold)

### Integration Tests (Jest + chrome API mocks)

**Priority 1**:
- `session-store-search.test.ts` — End-to-end search (insert 100 sessions, query, verify results)
- `settings-api-validation.test.ts` — API key validation flow (mock fetch, assert error handling)

**Priority 2**:
- `web-search-extraction.test.ts` — Fetch URL, extract text, verify quality
- `onboarding-flow.test.ts` — Complete 5-step flow, assert state changes

### E2E Tests (Playwright)

**Required for Production**:
1. **Onboarding** — New user completes setup in <3min
2. **Chat** — Send message, receive streaming response, verify markdown rendering
3. **Search** — Search 100 sessions, find result, open session
4. **Translation** — Upload document, translate, download result
5. **Web Search** — Enable web search, send query, verify RAG integration
6. **Group Chat** — Create group chat, compare 3 models, verify parallel streaming
7. **Settings** — Change API key, switch model, verify persistence
8. **Export** — Export 10 sessions to JSON, verify file contents
9. **Offline** — Disconnect network, verify offline banner, disable send button
10. **Error Recovery** — Trigger rate limit error, click retry, verify success

### Test Infrastructure

**Setup**:
```bash
npm install -D @testing-library/react @testing-library/jest-dom vitest jsdom
npm install -D @playwright/test
```

**Scripts**:
```json
{
  "test": "vitest",
  "test:unit": "vitest --run",
  "test:integration": "vitest --run --config vitest.integration.config.ts",
  "test:e2e": "playwright test",
  "test:coverage": "vitest --coverage",
  "test:watch": "vitest --watch"
}
```

**CI/CD**:
- Run unit + integration tests on every PR
- Run E2E tests on `main` branch only (requires browser)
- Fail PR if coverage < 80%

---

## 8. Implementation Timeline

### Week 1 (P0 — Critical Bugs)
- **Day 1-2**: TODO-P0-01 (Korean N-gram Search) — 12h
- **Day 3**: TODO-P0-02 (Centralized Error System) — 8h
- **Day 4**: TODO-P0-03 (IndexedDB Multi-Entry Fix) — 2h
- **Day 4-5**: TODO-P0-04 (SPA Race Condition) — 4h
- **Day 5**: Write 40 unit tests for P0 TODOs

### Week 2 (P1 — High Priority)
- **Day 6-7**: TODO-P1-01 (LLM Queue) — 10h
- **Day 8**: TODO-P1-02 (Quota-Safe Write) — 4h
- **Day 9-10**: TODO-P1-03 (Readability Extraction) — 12h
- **Day 10**: TODO-P1-04 (Tab State Manager) — 6h

### Week 3-4 (P2 — Medium Priority)
- **Day 11-13**: TODO-P2-01 (Compound Word Dictionary) — 16h
- **Day 14-18**: TODO-P2-02 (Site-Specific Adapters) — 20h
- **Day 19-20**: TODO-P2-03 (Streaming Progress) — 8h
- **Day 21-23**: TODO-P2-04 (Onboarding Flow) — 12h

### Week 5+ (P3 — Backlog)
- TODO-P3-01: Fuzzy Search — 8h
- TODO-P3-02: Service Worker Caching — 6h
- TODO-P3-03: E2E Test Suite — 20h
- TODO-P3-04: Table Detection — 12h

**Total Effort**: ~160 hours (4 weeks @ 40h/week)

---

## 9. Risks & Mitigations

### Risk 1: Korean Dictionary Performance
**Impact**: 10K+ word dictionary may slow search
**Mitigation**: Lazy-load dictionary, use trie data structure, cache results in memory

### Risk 2: IndexedDB Quota Exceeded
**Impact**: Users lose data without warning
**Mitigation**: Implement auto-cleanup with user consent, show storage usage in settings

### Risk 3: LLM Queue Concurrency Bugs
**Impact**: Race conditions in abort/cancel logic
**Mitigation**: Comprehensive integration tests, use locks (e.g., `navigator.locks.request`)

### Risk 4: SPA Detection False Positives
**Impact**: Unnecessary re-extractions on every scroll
**Mitigation**: Debounce `MutationObserver`, check URL change before triggering

### Risk 5: E2E Test Flakiness
**Impact**: CI/CD pipeline blocks on transient failures
**Mitigation**: Retry failed tests 3 times, use Playwright auto-wait, mock network

---

## 10. Recommendations for hchat-pwa Team

### Do This First
1. **Fix CRIT-01 to CRIT-06** — Production blockers (8h total)
2. **Implement TODO-P0-01** — Korean search is #1 user complaint
3. **Write 40 unit tests** — Prevent regressions during refactor

### Adopt These Patterns
- **Centralized error handling** (`HChatError` + `ERROR_META`) — Stop hardcoding error messages
- **LLM request queue** — Your group chat feature needs this
- **Quota-safe writes** — 15% of users hit IndexedDB limits
- **Readability extraction** — Your web search RAG is incomplete without it

### Avoid These Pitfalls
- **Don't auto-delete user data** — Always prompt before cleanup
- **Don't ignore `retry-after`** — You'll get rate-limited
- **Don't use `Promise.all` on large arrays** — Use `primaryKeys()` for counts
- **Don't trust `res.json()` without `res.ok`** — HTML error pages will crash your app

### Metrics to Track
- **Search recall** — % of queries with >0 results (target: 95%)
- **Error recovery rate** — % of errors where user clicks retry (target: 60%)
- **API quota errors** — Should be <1% of total requests
- **Test coverage** — Global 80%, core modules 90%

---

## Appendix A: File Manifest (Prism Extension)

### Core Files
| File | Lines | Purpose | hchat-pwa Equivalent |
|------|-------|---------|----------------------|
| `notebook.ts` | 250 | Dexie schema, search | `src/shared/lib/db.ts` |
| `settings.ts` | 180 | API key storage | `src/entities/settings/settings.store.ts` |
| `errors.ts` | 300 | Error system | **NEW** `src/shared/lib/errors/` |
| `extractor.ts` | 450 | DOM extraction | **NEW** `src/shared/lib/extraction/` |
| `search.ts` | 220 | Korean tokenizer | **NEW** `src/shared/lib/search/` |
| `background.ts` | 600 | Tab state + queue | **NEW** `src/shared/lib/state/`, `src/shared/lib/queue/` |
| `content_script.ts` | 400 | Readability | **NEW** `src/shared/lib/extraction/readability.ts` |

### UI Components
| File | Lines | Purpose | hchat-pwa Equivalent |
|------|-------|---------|----------------------|
| `NotebookPanel.tsx` | 350 | Search UI | `src/widgets/search/` |
| `SettingsPanel.tsx` | 280 | Settings UI | `src/pages/settings/` |
| `ErrorDisplay.tsx` | 120 | Error UI | **NEW** `src/shared/ui/ErrorDisplay.tsx` |
| `Onboarding.tsx` | 400 | 5-step flow | **NEW** `src/pages/onboarding/` |

---

## Appendix B: Glossary

**Multi-entry index**: Dexie.js `*fieldName` syntax — single record can match multiple index keys (e.g., `searchText: ['foo', 'bar']` matches "foo" OR "bar")

**Korean n-gram**: Sliding window tokenization (e.g., "스마트폰" → "스마", "마트", "트폰")

**Compound word**: Korean noun formed by combining 2+ words (e.g., "스마트폰" = "스마트" + "폰")

**Readability algorithm**: Mozilla's algorithm for extracting main content from noisy HTML

**Link density**: Ratio of link text to total text — high values indicate navigation menus, not content

**SSE (Server-Sent Events)**: HTTP streaming protocol for real-time updates (`data: {...}\n\n`)

**QuotaExceededError**: Browser throws when IndexedDB storage limit reached (usually 50-80% of disk space)

**Race condition**: Bug where outcome depends on unpredictable timing (e.g., multiple `resolve()` calls)

**Exponential backoff**: Retry strategy where delay doubles each time (1s → 2s → 4s → 8s)

**Tab state isolation**: Each browser tab has independent state — prevents cross-tab data leakage

---

## Appendix C: References

### Prism Extension Design Documents
- Chapter 1: Notebook — Dexie.js Schema + Full-text Search
- Chapter 2: Settings — API Key Management
- Chapter 3: SPA Navigation — React/Next.js Detection
- Chapter 4: Error Handling — Centralized Error System
- Chapter 5: Extractor — DOM Pattern Recognition
- Chapter 6: Search — Korean Morphological Analysis
- Chapter 7: Background — Multi-tab State Management
- Chapter 8: Content Script — Readability Extraction
- Chapter 9: Testing Strategy — Unit/Integration/E2E
- Chapter 10: Onboarding UX — 5-step Flow

### External Resources
- Dexie.js Multi-entry Indexes: https://dexie.org/docs/MultiEntry-Index
- Mozilla Readability: https://github.com/mozilla/readability
- Korean Morphological Analysis: https://konlpy.org/en/latest/
- Anthropic SSE Streaming: https://docs.anthropic.com/en/api/streaming
- Chrome Extension Best Practices: https://developer.chrome.com/docs/extensions/

---

**Document Version**: 1.0
**Last Updated**: 2026-03-14
**Next Review**: After P0 TODOs complete (Week 1)
