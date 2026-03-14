# Full TODO List — Geo Intelligence + Prism Extension + Onboarding

**Date**: 2026-03-14
**Source**: 4-agent parallel analysis (Code Review, Security, Architecture, API Parsing) + 11-chapter Prism design review

---

## Summary

| Category | Total | Done | Remaining | Effort |
|----------|-------|------|-----------|--------|
| Geo Intelligence | 17 | 5 | 12 | ~40h |
| Prism Extension (Ch1-10) | 18 | 0 | 18 | ~160h |
| Onboarding (Ch11) | 5 | 0 | 5 | ~8h |
| **Total** | **40** | **5** | **35** | **~208h** |

---

## Geo Intelligence — TODO

### Done (Committed `aa3bd52`)

| ID | Title | Status |
|----|-------|--------|
| GEO-01 | `geo-intel-api.ts` — Extract `data.features` from response | **Done** |
| GEO-02 | `geo_intel.py` — FIRMS API key → env var | **Done** |
| GEO-03 | `geo_intel.py` — `follow_redirects=False` (SSRF) | **Done** |
| GEO-04 | `geo_intel.py` — Bounds validation + antimeridian | **Done** |
| GEO-05 | `GeoIntelligencePage.tsx` — useEffect deps fix | **Done** |

### Remaining

#### TODO-GEO-06: MapLibre Type Safety
- **Priority**: P1
- **Effort**: 1h
- **Files**: `src/widgets/geo-intelligence/GeoMap.tsx:40`
- **Issue**: `mapRef = useRef<any>(null)` loses all type information
- **Fix**: `import type { Map as MapLibreMap } from 'maplibre-gl'` → `useRef<MapLibreMap | null>(null)`

#### TODO-GEO-07: Map Event Listener Cleanup
- **Priority**: P1
- **Effort**: 2h
- **Files**: `src/widgets/geo-intelligence/GeoMap.tsx:105-118`
- **Issue**: Click/mouseenter/mouseleave listeners registered but never cleaned up on unmount
- **Fix**: Store handler refs in `useRef`, call `map.off()` in cleanup function

#### TODO-GEO-08: Map Error UI
- **Priority**: P1
- **Effort**: 2h
- **Files**: `src/widgets/geo-intelligence/GeoMap.tsx:132-134`
- **Issue**: MapLibre init failure → infinite loading spinner, no error feedback
- **Fix**: Add `mapError` state, render error card with retry button

#### TODO-GEO-09: LayerPanel i18n Type Safety
- **Priority**: P2
- **Effort**: 30min
- **Files**: `src/widgets/geo-intelligence/LayerPanel.tsx:68`
- **Issue**: `t(labelKey as any)` bypasses i18n key type checking
- **Fix**: Type `labelKey` as `'geoIntel.flights' | 'geoIntel.earthquakes' | 'geoIntel.fires'`

#### TODO-GEO-10: Store Error Toast Integration
- **Priority**: P1
- **Effort**: 1h
- **Files**: `src/entities/geo-intelligence/geo-intelligence.store.ts:57,142,154`
- **Issue**: IndexedDB errors logged to console only, user gets no feedback
- **Fix**: Import `useToastStore`, call `addToast({ type: 'error', message })` in catch blocks

#### TODO-GEO-11: Bookmark ID Collision
- **Priority**: P2
- **Effort**: 30min
- **Files**: `src/entities/geo-intelligence/geo-intelligence.store.ts:128`
- **Issue**: `Date.now() + Math.random()` can collide in same millisecond
- **Fix**: Use `crypto.randomUUID()` → `id: \`geo-bm-${crypto.randomUUID()}\``

#### TODO-GEO-12: Cache Race Condition
- **Priority**: P2
- **Effort**: 3h
- **Files**: `backend/routes/geo_intel.py:63-67`
- **Issue**: Concurrent requests with expired cache trigger duplicate upstream API calls
- **Fix**: Add `asyncio.Lock()` per cache key with double-check pattern

#### TODO-GEO-13: Backend Error Response Structure
- **Priority**: P1
- **Effort**: 2h
- **Files**: `backend/routes/geo_intel.py:136-262`
- **Issue**: Fetch failures return empty `[]`, client can't distinguish "no data" vs "API error"
- **Fix**: Return `tuple[list, str | None]` from fetch functions, include `error` field in response

#### TODO-GEO-14: Fire Timestamp Format
- **Priority**: P2
- **Effort**: 30min
- **Files**: `backend/routes/geo_intel.py:259`
- **Issue**: `"2024-03-14T1430"` is invalid ISO 8601 (missing colon/seconds)
- **Fix**: `f"{acq_date}T{acq_time[:2]}:{acq_time[2:]}:00Z"`

#### TODO-GEO-15: Auto-Refresh Interval Validation
- **Priority**: P2
- **Effort**: 1h
- **Files**: `geo-intelligence.store.ts`, `GeoIntelligencePage.tsx`
- **Issue**: DevTools can set `refreshInterval` to 0.1s → self-DoS
- **Fix**: Clamp to `MIN=30, MAX=3600` in `setRefreshInterval()`

#### TODO-GEO-16: Backend Test Coverage
- **Priority**: P1
- **Effort**: 8h
- **Files**: `backend/routes/geo_intel.py` (new test file)
- **Issue**: 0% test coverage on 3 proxy endpoints + cache + bounds validation
- **Fix**: pytest with httpx mocking — 15 test cases minimum

#### TODO-GEO-17: Frontend Store + API Tests
- **Priority**: P1
- **Effort**: 6h
- **Files**: `geo-intelligence.store.ts`, `geo-intel-api.ts` (new test files)
- **Issue**: 0% test coverage on store actions + API client
- **Fix**: Vitest — store actions (12 tests), API client (5 tests), E2E (3 tests)

---

## Prism Extension — TODO (Chapters 1-10)

### P0: Immediate (Week 1) — 26h

#### TODO-PRISM-01: Korean N-gram Search
- **Priority**: P0
- **Effort**: 12h
- **Chapter**: Ch6 (search.ts)
- **Issue**: Current search is exact-match only. Korean partial queries return 0 results
- **Fix**: 3-tier tokenizer (space split → 2-4 char n-gram → compound word dict), multi-entry Dexie index

#### TODO-PRISM-02: Centralized Error System
- **Priority**: P0
- **Effort**: 8h
- **Chapter**: Ch4 (errors.ts)
- **Issue**: Inconsistent error handling across API calls. Raw errors shown to users
- **Fix**: `HChatError` class + `ERROR_META` map + `handleApiResponse()` + `withRetry()`

#### TODO-PRISM-03: Fix IndexedDB Multi-Entry Index
- **Priority**: P0
- **Effort**: 2h
- **Chapter**: Ch1 (notebook.ts)
- **Issue**: `*searchText` expects `string[]` but `tokenize()` returns joined `string`
- **Fix**: Change `tokenize(text).join(' ')` → `tokenize(text)`, update `PageEntry.searchText` type

#### TODO-PRISM-04: SPA Race Condition Fix
- **Priority**: P0
- **Effort**: 4h
- **Chapter**: Ch3 (SPA)
- **Issue**: `waitForDOMStable()` has 3 competing `resolve()` paths
- **Fix**: Single `resolved` boolean gate, shared `lib/dom-stable.ts` module

### P1: High Priority (Week 2) — 32h

#### TODO-PRISM-05: LLM Request Queue
- **Priority**: P1
- **Effort**: 10h
- **Chapter**: Ch7 (background.ts)
- **Issue**: No concurrency limit on LLM calls. Group chat sends 3 parallel requests
- **Fix**: `LLMQueue` with max 2 concurrent, deduplication, `AbortController` cancellation

#### TODO-PRISM-06: Quota-Safe IndexedDB Write
- **Priority**: P1
- **Effort**: 4h
- **Chapter**: Ch4 (errors.ts)
- **Issue**: `QuotaExceededError` silently drops data
- **Fix**: Catch quota errors, prompt user before cleanup, never auto-delete

#### TODO-PRISM-07: Readability Text Extraction
- **Priority**: P1
- **Effort**: 12h
- **Chapter**: Ch8 (content_script.ts)
- **Issue**: Web search fetches HTML but doesn't extract clean text. RAG quality poor
- **Fix**: `scoreElement()` + `getLinkDensity()` + `removeNoise()` + page type detection

#### TODO-PRISM-08: Tab State Manager
- **Priority**: P1
- **Effort**: 6h
- **Chapter**: Ch7 (background.ts)
- **Issue**: Multi-tab PWA windows share state. History grows unbounded
- **Fix**: `TabStateManager` with 30min GC, max 100 history entries, LRU eviction

### P2: Medium Priority (Week 3-4) — 56h

#### TODO-PRISM-09: Korean Compound Word Dictionary
- **Priority**: P2
- **Effort**: 16h
- **Chapter**: Ch6 (search.ts)
- **Issue**: Hardcoded 15 patterns miss 99% of Korean compound nouns
- **Fix**: 10K+ entry dictionary, trie structure, lazy-load on init

#### TODO-PRISM-10: Site-Specific Extractor Adapters
- **Priority**: P2
- **Effort**: 20h
- **Chapter**: Ch5 (extractor.ts)
- **Issue**: Generic DOM extraction fails on structured e-commerce sites
- **Fix**: Registry pattern with adapters for Amazon, Naver Shopping, GitHub Issues

#### TODO-PRISM-11: Streaming Progress Events
- **Priority**: P2
- **Effort**: 8h
- **Chapter**: Ch7 (background.ts)
- **Issue**: Long operations (translate, doc-writer) show no progress
- **Fix**: `PROGRESS → STREAM_CHUNK → DONE → ERROR` event schema, progress bar UI

#### TODO-PRISM-12: Onboarding Flow
- **Priority**: P2
- **Effort**: 12h
- **Chapter**: Ch10 (onboarding.tsx)
- **Issue**: 30% of new users abandon due to API key confusion
- **Fix**: 5-step wizard (Welcome → Provider → ApiKey → FirstChat → Complete)

### P3: Backlog — 46h

#### TODO-PRISM-13: Fuzzy Search (Levenshtein)
- **Priority**: P3 | **Effort**: 8h

#### TODO-PRISM-14: Service Worker Response Caching
- **Priority**: P3 | **Effort**: 6h

#### TODO-PRISM-15: E2E Test Suite (Playwright)
- **Priority**: P3 | **Effort**: 20h

#### TODO-PRISM-16: Advanced Table Detection
- **Priority**: P3 | **Effort**: 12h

---

## Onboarding UX (Chapter 11) — TODO

#### TODO-ONB-01: Fix `<a` Tag JSX Error
- **Priority**: P0
- **Effort**: 5min
- **Issue**: `ApiKeyStep.tsx` — `<a` opening tag missing, same bug as Settings chapter
- **Fix**: Add `<a` before `href={consoleUrl}`, add `target="_blank" rel="noopener noreferrer"`

#### TODO-ONB-02: Error Type Validation in FirstDigest
- **Priority**: P1
- **Effort**: 1h
- **Issue**: `chrome.runtime.sendMessage` result `.error` field has no runtime type check
- **Fix**: `deserializePrismError()` with `VALID_CODES` set validation (from Ch4 errors.ts)

#### TODO-ONB-03: Storage/UI Sync in advance()
- **Priority**: P1
- **Effort**: 2h
- **Issue**: `advance()` calls `setOnboardingStep()` + `setStep()` — storage fail leaves UI ahead
- **Fix**: `await` storage write, only `setStep()` on success. Add try-catch with toast

#### TODO-ONB-04: Double-Click Guard on ProviderStep
- **Priority**: P2
- **Effort**: 30min
- **Issue**: `setTimeout(onNext, 300)` — rapid double-click calls `advance` twice
- **Fix**: `useRef(false)` advancing guard, disable buttons during transition

#### TODO-ONB-05: Unreachable `validating` Step
- **Priority**: P2
- **Effort**: 1h
- **Issue**: `validating` defined in `OnboardingStep` union but never set via `advance()`
- **Fix**: Either remove from union or integrate into `ApiKeyStep` as internal state

---

## Combined TODO — Master Table

| ID | Priority | Title | Category | Effort | Status |
|----|----------|-------|----------|--------|--------|
| GEO-01 | P0 | API response `data.features` extraction | Geo | 5min | **Done** |
| GEO-02 | P0 | FIRMS API key → env var | Geo | 30min | **Done** |
| GEO-03 | P0 | SSRF `follow_redirects=False` | Geo | 5min | **Done** |
| GEO-04 | P0 | Bounds validation + antimeridian | Geo | 30min | **Done** |
| GEO-05 | P0 | useEffect deps → `getState()` | Geo | 5min | **Done** |
| ONB-01 | P0 | Fix `<a` tag JSX error | Onboarding | 5min | New |
| PRISM-01 | P0 | Korean N-gram search | Prism | 12h | New |
| PRISM-02 | P0 | Centralized error system | Prism | 8h | New |
| PRISM-03 | P0 | IndexedDB multi-entry index fix | Prism | 2h | New |
| PRISM-04 | P0 | SPA `waitForDOMStable` race fix | Prism | 4h | New |
| GEO-06 | P1 | MapLibre type safety (`any` → typed) | Geo | 1h | New |
| GEO-07 | P1 | Map event listener cleanup | Geo | 2h | New |
| GEO-08 | P1 | Map error UI (no infinite spinner) | Geo | 2h | New |
| GEO-10 | P1 | Store error → toast integration | Geo | 1h | New |
| GEO-13 | P1 | Backend error response structure | Geo | 2h | New |
| GEO-16 | P1 | Backend test coverage (15 tests) | Geo | 8h | New |
| GEO-17 | P1 | Frontend store/API tests (20 tests) | Geo | 6h | New |
| ONB-02 | P1 | Error type validation in FirstDigest | Onboarding | 1h | New |
| ONB-03 | P1 | Storage/UI sync in `advance()` | Onboarding | 2h | New |
| PRISM-05 | P1 | LLM request queue with dedup | Prism | 10h | New |
| PRISM-06 | P1 | Quota-safe IndexedDB write | Prism | 4h | New |
| PRISM-07 | P1 | Readability text extraction | Prism | 12h | New |
| PRISM-08 | P1 | Tab state manager | Prism | 6h | New |
| GEO-09 | P2 | LayerPanel i18n type safety | Geo | 30min | New |
| GEO-11 | P2 | Bookmark ID → `crypto.randomUUID()` | Geo | 30min | New |
| GEO-12 | P2 | Cache race condition (async lock) | Geo | 3h | New |
| GEO-14 | P2 | Fire timestamp ISO 8601 fix | Geo | 30min | New |
| GEO-15 | P2 | Auto-refresh interval validation | Geo | 1h | New |
| ONB-04 | P2 | Double-click guard on ProviderStep | Onboarding | 30min | New |
| ONB-05 | P2 | Unreachable `validating` step cleanup | Onboarding | 1h | New |
| PRISM-09 | P2 | Korean compound word dictionary | Prism | 16h | New |
| PRISM-10 | P2 | Site-specific extractor adapters | Prism | 20h | New |
| PRISM-11 | P2 | Streaming progress events | Prism | 8h | New |
| PRISM-12 | P2 | Onboarding flow (5-step wizard) | Prism | 12h | New |
| PRISM-13 | P3 | Fuzzy search (Levenshtein) | Prism | 8h | New |
| PRISM-14 | P3 | Service worker response caching | Prism | 6h | New |
| PRISM-15 | P3 | E2E test suite (Playwright) | Prism | 20h | New |
| PRISM-16 | P3 | Advanced table detection | Prism | 12h | New |

### Priority Breakdown

| Priority | Items | Done | Remaining | Total Effort |
|----------|-------|------|-----------|-------------|
| **P0** | 10 | 5 | 5 | ~26h |
| **P1** | 13 | 0 | 13 | ~57h |
| **P2** | 11 | 0 | 11 | ~63h |
| **P3** | 4 | 0 | 4 | ~46h |
| **Total** | **38** | **5** | **33** | **~192h** |

---

## Implementation Timeline

### Week 1 — P0 Critical (26h)
- Day 1-2: PRISM-01 (Korean search) — 12h
- Day 3: PRISM-02 (Error system) — 8h
- Day 4: PRISM-03 (IndexedDB fix) + PRISM-04 (SPA race) + ONB-01 (JSX fix) — 6h

### Week 2 — P1 Geo + Prism (57h)
- Day 5: GEO-06/07/08/10 (MapLibre hardening) — 6h
- Day 6: GEO-13/16/17 (Backend + tests) — 16h
- Day 7-8: PRISM-05 (LLM queue) — 10h
- Day 9: PRISM-06 (Quota-safe) + ONB-02/03 — 7h
- Day 10: PRISM-07 (Readability) start — 12h
- Day 11: PRISM-08 (Tab state) — 6h

### Week 3-4 — P2 Medium (63h)
- GEO-09/11/12/14/15 — 5.5h
- ONB-04/05 — 1.5h
- PRISM-09 (Compound dict) — 16h
- PRISM-10 (Adapters) — 20h
- PRISM-11 (Streaming) — 8h
- PRISM-12 (Onboarding) — 12h

### Week 5+ — P3 Backlog (46h)
- PRISM-13/14/15/16

---

**Document Version**: 1.0
**Last Updated**: 2026-03-14
