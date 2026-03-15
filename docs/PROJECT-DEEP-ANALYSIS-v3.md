# H Chat PWA - Project Deep Analysis Report v3

**Date**: 2026-03-15 | **Branch**: main | **Commit**: e6fb139
**Previous Analysis**: v2 (2026-03-10, commit f7951fb)
**Analyzed by**: PM + 5 Parallel Worker Agents (git worktree isolation)

---

## Executive Summary

| Metric | v2 (3/10) | v3 (3/15) | Delta |
|--------|-----------|-----------|-------|
| Files (TS/TSX) | 730 | 727 | -3 |
| Total LOC | ~95K | ~103K | +8K |
| Stores (entities/) | 113 | 104 dirs | normalized |
| Pages | 106 | 97 dirs | normalized |
| ViewState values | ~35 | ~96 | +61 |
| Test files | 277 | 301 | +24 |
| Test cases | 1,978+ | ~3,527 | +1,549 |
| Commits | 144 | 193 | +49 |
| Prod deps | 18 | 19 | +1 |
| Build size (dist/) | - | 8.1 MB | new metric |
| PWA precache | - | 7.82 MB (184 entries) | new metric |

### Overall Scores

| Area | v2 Score | v3 Score | Delta | Grade |
|------|----------|----------|-------|-------|
| Architecture | 62/100 | **54/100** | -8 | **F** |
| Security | 72/100 | **67/100** | -5 | **D+** |
| Test Quality | 75/100 | **41/100** | -34 | **F** |
| Bundle/Performance | 70/100 | **72/100** | +2 | **C-** |
| Tech Debt | 68/100 | **42/100** | -26 | **F** |
| **Overall** | **69/100** | **55/100** | **-14** | **F** |

> Overall -14 points. The codebase has scaled from ~31 to ~100+ stores without
> architectural evolution. Massive dead code (8,554+ lines), misleading test coverage
> (claimed 83%, true ~40-50%), and tripled ViewState complexity drive the decline.
> Only bundle optimization held steady (+2), thanks to thorough lazy loading.

### Risk Heat Map

```
            Low Impact      Medium Impact        High Impact
CRITICAL   |               |                    | SEC-01,05  ARC-1  TD-1,2
HIGH       |               | PERF-02  TD-5      | SEC-02,03,04,06  ARC-2,4  TST-1,2
MEDIUM     | SEC-13,14,15  | SEC-07,08,09,11,12 | SEC-10  ARC-3,5  PERF-01,05
LOW        | TD-7,9        | PERF-04  TD-6,8    | TST-3,4
```

---

## 1. Architecture & Code Structure (W1)

**Score: 54/100 (F)** | v2: 62/100 (D) | Delta: -8

### 1.1 FSD Layer Compliance: 42/100

Feature-Sliced Design mandates strict one-way imports: `app -> pages -> widgets -> entities -> shared`.

**CRITICAL violation**: `src/shared/hooks/useHydrateOnView.ts` imports **43 entity stores** into the shared layer — a catastrophic FSD inversion. This single file means `shared/` depends on the entire entity catalog.

No other cross-layer violations found (entities, widgets, pages all respect boundaries).

### 1.2 File Size Violations

| Severity | File | Lines | Issue |
|----------|------|-------|-------|
| CRITICAL | `shared/i18n/ko.ts` | ~1,920 | Monolithic translation |
| CRITICAL | `shared/i18n/en.ts` | ~1,920 | Monolithic translation |
| CRITICAL | `shared/types/index.ts` | 1,743 | God type file (276 exports) |
| CRITICAL | `shared/lib/db.ts` | 1,326 | 314 functions, 48 stubs |
| CRITICAL | `pages/settings/SettingsScreen.tsx` | 1,312 | 13 tabs in one component |
| WARNING | `widgets/sidebar/Sidebar.tsx` | ~496 | Growing navigation |
| WARNING | `widgets/prompt-input/PromptInput.tsx` | 494 | Complex input |
| WARNING | `shared/hooks/useHydrateOnView.ts` | 315 | 96-entry view map |

### 1.3 Circular Dependencies: 72/100

7 of 100+ stores have cross-store imports. No circular chains detected. `settings.store.ts` is a natural root store referenced by 4 others (acceptable).

### 1.4 Code Cohesion: 45/100

- **100+ store files** with identical CRUD boilerplate pattern
- **db.ts**: 314 functions for 80+ Dexie tables, including 48 empty stubs and 25 no-op queries (~250 lines dead code)
- **96 ViewState values** across 7 sub-types with zero URL routing
- Every new feature requires changes in **6 files minimum**: store, page, route-map, hydrate-map, sidebar, types

### 1.5 Type Safety

| Metric | v2 | v3 | Delta |
|--------|-----|-----|-------|
| `: any` (non-test) | 55 | 92 | +67% |
| `as any` (non-test) | 0 | 85 | NEW |
| `@ts-ignore` | - | 0 | Clean |

81 of 85 `as any` casts are `(t as any)('key')` — i18n keys never added to type definitions. Top offenders: DataStoryPage (19), DocAnalyzerPage (17), WhiteboardPage (13).

### 1.6 Architecture Strengths

- All 97 pages use `React.lazy()` via centralized `route-map.ts`
- Zustand selectors consistently use `(s) => s.field` pattern
- View-based hydration defers store loading until accessed
- `<Suspense>` + `<ErrorBoundary>` in MainLayout
- ChatPage: exemplary 60-line composition

### 1.7 Top Architecture Recommendations

| # | Action | Impact | Effort |
|---|--------|--------|--------|
| ARC-1 | Move `useHydrateOnView.ts` to `app/` layer | Eliminates FSD violation | Trivial |
| ARC-2 | Split `db.ts` into domain modules, delete 48 stubs | -250 dead lines, cohesion | Medium |
| ARC-3 | Split `types/index.ts` into domain type modules | Better IDE perf, discoverability | Medium |
| ARC-4 | Adopt URL-based routing (TanStack Router) | Back/forward, deep linking, SEO | High |
| ARC-5 | Fix 81 `(t as any)` casts with proper i18n keys | Restore type safety | Low-Med |

---

## 2. Security & Vulnerability (W2)

**Score: 67/100 (D+)** | v2: 72/100 (C-) | Delta: -5

### 2.1 Vulnerability Inventory

| ID | Severity | Location | Description |
|----|----------|----------|-------------|
| SEC-01 | **CRITICAL** | `bedrock-client.ts:20-29`, `backend/routes/chat.py:34-48` | AWS credentials transmitted as plaintext in HTTP request body |
| SEC-05 | **CRITICAL** | `code-interpreter.store.ts:5-51` | Worker sandbox bypass — `Function()` execution with network access |
| SEC-02 | HIGH | `backend/routes/channels.py:27-36` | SSRF via arbitrary Slack webhook URL |
| SEC-03 | HIGH | `backend/routes/tools.py:46,89` | CQL/JQL injection in legacy route (sanitize_query not applied) |
| SEC-04 | HIGH | `backend/routes/tools.py:53-54,96-100` | SSRF via unvalidated Atlassian base_url |
| SEC-06 | HIGH | `shared/hooks/useExtensionContext.ts:35-38` | Missing postMessage origin validation |
| SEC-07 | MEDIUM | `index.html:9` | CSP weakened by `unsafe-inline` and `unsafe-eval` |
| SEC-08 | MEDIUM | `pages/portfolio/PortfolioPage.tsx:307-310` | LLM HTML in iframe with `allow-scripts` |
| SEC-09 | MEDIUM | `backend/routes/research.py:262-268` | SSRF via DuckDuckGo result URL fetch |
| SEC-10 | MEDIUM | `backend/app.py:56-170` | No authentication on any backend endpoint |
| SEC-11 | MEDIUM | `backend/routes/chat.py:83` et al. | Error messages expose internal details |
| SEC-12 | MEDIUM | `shared/lib/dom-utils.ts:126-128` | `createElementFromHTML` uses innerHTML without sanitization |
| SEC-13 | LOW | `backend/app.py:19-41` | Rate limiter state lost on serverless cold start |
| SEC-14 | LOW | `package.json:42` | xlsx 0.18.5 (SheetJS) — known CVEs, unmaintained |
| SEC-15 | LOW | `shared/lib/crypto.ts:65-67` | Crypto fallback to Base64 (non-encryption) |

### 2.2 Fixed Since v2

- **SEC-18 (FIXED)**: Mermaid SVG XSS — DOMPurify now applied at `DiagramEditorPage.tsx:331`
- All `dangerouslySetInnerHTML` sites now sanitized with DOMPurify
- AES-256-GCM encryption for stored API credentials
- Mermaid `securityLevel: 'strict'` configured
- Pydantic validation on backend request models
- New `sanitize_query()` in `atlassian_schemas.py` (but not applied to legacy `tools.py`)

### 2.3 Security Strengths

- DOMPurify consistently applied (3/3 `dangerouslySetInnerHTML` sites)
- AES-256-GCM with proper IV for credential storage
- Sandboxed iframes (`sandbox=""`) for ArtifactHtmlPreview
- CORS restricted to specific origins (not wildcard)
- Rate limiting on all endpoints
- `sanitize-utils.ts` provides escapeHtml, sanitizeUrl, sanitizeFilename

### 2.4 Top Security Fixes

| # | Action | ID | Effort | Impact |
|---|--------|-----|--------|--------|
| 1 | Server-side credential vault (stop sending AWS keys in body) | SEC-01 | High | Eliminates credential exposure |
| 2 | URL allowlist for channels/tools SSRF | SEC-02,04 | Low | Blocks internal probing |
| 3 | Apply `sanitize_query()` to legacy `tools.py` | SEC-03 | Low | Prevents injection |
| 4 | Add `event.origin` validation on postMessage | SEC-06 | Low | Blocks cross-origin injection |
| 5 | Add API authentication (JWT/API key) | SEC-10 | Medium | Prevents unauthorized API usage |

---

## 3. Test Coverage & Quality (W3)

**Score: 41/100 (F)** | v2: 75/100 (C+) | Delta: -34

### 3.1 Test Metrics

| Metric | Claimed | Actual |
|--------|---------|--------|
| Test files | 277 (CLAUDE.md) | **301** |
| Test cases | 919 (CLAUDE.md) | **~3,527** |
| Assertions (`expect()`) | - | **6,512** |
| Statement coverage | 83% | **~40-50% true** |
| Snapshot tests | - | 0 |
| `.only()` left in code | - | 0 |
| `.skip()` tests | - | 1 file |

### 3.2 Coverage Configuration (CRITICAL FINDING)

`vitest.config.ts` **explicitly excludes** from coverage measurement:
- `src/app/**` (MainLayout, routing)
- `src/pages/**` (all 104+ page components)
- `src/widgets/**` (all 30+ widgets)
- `src/server/**`
- Multiple provider files (`factory.ts`, `openai.ts`, `gemini.ts`)
- `db.ts`, `stt.ts`, `tts.ts`

**The reported 83% coverage measures only the non-excluded subset.** True effective coverage of the full codebase is estimated at **40-50%**.

### 3.3 Layer Coverage

| Layer | Total | Tested | Coverage | Quality |
|-------|-------|--------|----------|---------|
| entities/ (stores) | 103 | 103 | **100%** | Many stubs (3-4 tests only) |
| pages/ | 104 | 15 | **14%** | 89 pages untested |
| widgets/ | 30 | 9 | **30%** | PromptInput untested |
| app/ (MainLayout) | 1 | 1 | **100%** | 23 tests, good quality |
| shared/lib | ~96 | ~60 | **~63%** | 71 files dead (tested-only) |
| shared/hooks | 31 | ~10 | **~32%** | 28 hooks dead |
| backend/ | 10+ routes | 1 file | **~5%** | 0 API endpoint tests |

### 3.4 Critical Untested Modules

| Module | Impact | Notes |
|--------|--------|-------|
| **PromptInput** widget | CRITICAL | Most interactive component, 0 tests |
| **ChatPage** | CRITICAL | Core user experience, 0 tests |
| **SettingsPage** | HIGH | 1,312 lines, 0 tests |
| **Bedrock Client** | HIGH | Excluded from coverage |
| **DB (Dexie)** layer | HIGH | Excluded from coverage |
| **OpenAI/Gemini providers** | HIGH | Excluded from coverage |
| **Backend API endpoints** | HIGH | 0 tests for all 10+ endpoints |

### 3.5 v2 Score Correction

The previous 75/100 was **significantly overestimated**:
- Coverage exclusions were not factored in (83% measures a subset)
- Phase 41-66 expansion mostly added stub tests (3-4 assertions each)
- Backend and E2E remain essentially untested
- Documentation counts (919 tests) are stale vs actual (3,527)

### 3.6 Top Testing Gaps

| # | Action | Impact |
|---|--------|--------|
| TST-1 | Remove coverage exclusions for `app/`, `pages/`, `widgets/` | Reveals true ~40-50% coverage |
| TST-2 | Add PromptInput component tests | Most critical UI gap |
| TST-3 | Add backend API endpoint tests (at minimum `/api/chat` SSE) | 0% backend coverage |
| TST-4 | Deepen stub entity tests (40+ stores with only 3-4 tests) | False sense of 100% entity coverage |
| TST-5 | Restore E2E test directory | `e2e/` directory missing |

---

## 4. Bundle & Performance (W4)

**Score: 72/100 (C-)** | v2: 70/100 (C-) | Delta: +2

### 4.1 Build Output

| Metric | Value |
|--------|-------|
| Total dist/ | **8.1 MB** (uncompressed) |
| JS chunks | ~173 files |
| CSS | 142 KB (app 78 + maplibre 64) |
| Build time | 6.51s |
| Chunks > 500 KB | 7 |

### 4.2 Heavy Chunks

| Chunk | Raw | Gzip | Lazy? | Issue |
|-------|-----|------|-------|-------|
| `vendor-maplibre` | 801 KB | 217 KB | YES | OK |
| **`vendor-syntax`** | **624 KB** | **223 KB** | **NO** | **CRITICAL: Prism loads ALL 290+ languages** |
| `vendor-icons` | 595 KB | 159 KB | Partial | 128 named lucide-react imports |
| `mermaid.core` | 468 KB | 129 KB | YES | OK |
| `treemap` (mermaid) | 451 KB | 107 KB | YES | OK |
| `cytoscape` | 441 KB | 141 KB | YES | OK |
| `xlsx` | 428 KB | 143 KB | YES | OK |
| `pdfjs-dist` | 405 KB | 120 KB | YES | OK |
| `jspdf` | 385 KB | 126 KB | YES | OK |
| **Main entry** | **368 KB** | **100 KB** | N/A | useHydrateOnView pulls 30+ stores |

### 4.3 Lazy Loading Scorecard

| Dependency | Bundle Impact | Dynamic Import? | Status |
|------------|---------------|-----------------|--------|
| tesseract.js | NOT IN BUILD | YES (runtime download) | EXCELLENT |
| pdfjs-dist | 405 KB | YES | GOOD |
| mermaid | ~1.3 MB total | YES | GOOD |
| xlsx | 428 KB | YES | GOOD |
| maplibre-gl | 802 KB | YES | GOOD |
| cytoscape | 441 KB | YES | GOOD |
| jspdf | 385 KB | YES | GOOD |
| **react-syntax-highlighter** | **624 KB** | **NO** | **CRITICAL** |
| lucide-react | 595 KB | Partial (tree-shaken) | MODERATE |

**Lazy loading: 7/9 heavy deps = 78%**

### 4.4 Performance Anti-Patterns

| ID | Severity | Location | Description |
|----|----------|----------|-------------|
| PERF-01 | HIGH | `useHydrateOnView.ts` | 30+ stores statically imported into main bundle |
| PERF-02 | **CRITICAL** | `CodeBlock.tsx:2`, `ArtifactCodeView.tsx:1` | `Prism` loads ALL 290 languages (624 KB) |
| PERF-03 | MEDIUM | 97 page components | Zero `React.memo` on page-level components |
| PERF-04 | LOW | `ArtifactMermaidPreview.tsx:3` | DOMPurify (158 KB) statically imported |
| PERF-05 | MEDIUM | `vite.config.ts` (workbox) | PWA precache 7.82 MB — too large for first visit |

### 4.5 Performance Strengths

- All 97 pages use `React.lazy()` with `<Suspense>`
- Zustand selectors: fine-grained `(s) => s.field` throughout
- `VirtualizedMessageList` activates at 50+ messages with variable row heights
- Core widgets (MessageBubble, MarkdownSegment) properly memoized
- `esbuild.drop` removes console/debugger in production

### 4.6 Top Optimization Recommendations

| # | Action | Savings | Effort |
|---|--------|---------|--------|
| PERF-1 | Switch to `PrismLight` with ~15 languages | ~400-500 KB | Low |
| PERF-2 | Dynamic-import stores in `useHydrateOnView` | ~100+ KB from main | Medium |
| PERF-3 | Reduce PWA precache (`globIgnores` for heavy chunks) | 7.82 MB -> ~3 MB | Low |
| PERF-4 | Add `build.target: 'es2022'` for modern syntax | ~5-10% code reduction | Trivial |
| PERF-5 | Named `manualChunks` for remaining heavy deps | Better long-term caching | Low |

---

## 5. Dependencies & Technical Debt (W5)

**Score: 42/100 (F)** | v2: 68/100 (D+) | Delta: -26

### 5.1 Dead Code (CRITICAL)

| Category | Count | Dead Lines |
|----------|-------|------------|
| Dead shared/lib files | **71 of 96** | **~7,454** |
| Dead shared hooks | **28 of 31** | **~1,100** |
| Demo files | 4 | ~200 |
| db.ts stub functions | 48 + 25 no-ops | ~250 |
| **Total dead code** | | **~9,004 lines (8.7% of codebase)** |

Only 3 hooks are actually used in production:
- `useOnlineStatus` (3 imports)
- `useHydrateOnView` (1 import)
- `useExtensionContext` (1 import)

71 shared/lib utility files have **zero production imports** — only imported by tests/demos or not at all. Examples: `workflow-automation.ts` (236 lines), `mock-data.ts` (233 lines), `offline-sync.ts` (209 lines), `canvas-engine.ts` (198 lines), `agent-v2.ts` (208 lines).

### 5.2 TypeScript Quality

| Metric | v2 | v3 | Delta |
|--------|-----|-----|-------|
| `any` (all non-test) | 55 | **92** | +67% |
| `as any` | 0 | **85** | NEW |
| Mutability violations | 310 | **264** | -15% improved |
| `@ts-ignore` | - | **0** | Clean |
| TODO/FIXME | - | **1** | Clean |
| console.log (prod) | - | **1** | Clean |

### 5.3 Dependency Health

| Issue | Package | Action |
|-------|---------|--------|
| Misplaced prod dep | `@aws-sdk/client-bedrock-runtime` (~8MB) | Move to devDependencies |
| Misplaced prod dep | `vite-plugin-pwa` | Move to devDependencies |
| Unmaintained | `xlsx` 0.18.5 (SheetJS community) | Evaluate `exceljs` migration |
| Dead consumer | `pdfjs-dist` | `pdf-extractor.ts` never imported in production |
| Dead consumer | `xlsx` | `spreadsheet-parser.ts` never imported in production |

### 5.4 Hardcoded Values (22 URLs)

Notable hardcoded URLs that should be constants or env vars:
- `pdf-extractor.ts:5` — CDN URL for pdf.js worker
- `SettingsScreen.tsx:191,225` — OpenAI/Gemini API URLs
- `ImageGenPage.tsx:50` — Direct OpenAI API call (should route through backend)
- `InternalSearchPage.tsx:53-72` — Mock placeholder URLs in production
- `GeoMap.tsx:81` — OpenStreetMap tile server

### 5.5 Monolith Files

| File | Lines | Exports | Issue |
|------|-------|---------|-------|
| `types/index.ts` | 1,743 | 276 | God type file — all interfaces in one module |
| `db.ts` | 1,326 | 314 functions | 80 Dexie tables + 48 stubs |
| `SettingsScreen.tsx` | 1,312 | 1 | 13 settings tabs in one component |
| `i18n/ko.ts` | ~1,920 | 1 | Linear growth per feature |
| `i18n/en.ts` | ~1,920 | 1 | Linear growth per feature |

### 5.6 Top Tech Debt Items

| # | Issue | Lines | Effort | Impact |
|---|-------|-------|--------|--------|
| TD-1 | Delete 71 dead shared/lib files | 7,454 | Low | HIGH — reduces confusion, build noise |
| TD-2 | Delete 28 dead shared hooks | 1,100 | Low | HIGH — false sense of utility library |
| TD-3 | Split `types/index.ts` into domain modules | 1,743 | Medium | HIGH — IDE perf, discoverability |
| TD-4 | Split `db.ts`, delete stubs | 1,326 | Medium | HIGH — cohesion, testability |
| TD-5 | Fix 81 `(t as any)` i18n casts | 81 locs | Medium | MEDIUM — type safety |
| TD-6 | Move 2 deps to devDependencies | 2 lines | Trivial | LOW — install size |
| TD-7 | Delete 4 demo files | ~200 | Trivial | LOW — code hygiene |
| TD-8 | Extract hardcoded URLs to constants | 6 locs | Low | MEDIUM — deploy flexibility |
| TD-9 | Remove `AuditLogPage.tsx` console.log | 1 line | Trivial | LOW |
| TD-10 | Split `SettingsScreen.tsx` into tab components | 1,312 | Medium | MEDIUM — maintainability |

---

## 6. Cross-Cutting Findings

### 6.1 Scaling Problem

The project has tripled in scope (31 -> 100+ stores, ~35 -> 96 views) without evolving the architecture. The copy-paste pattern (store + page + route-map + hydrate + sidebar + types) creates linear boilerplate growth. Every new feature touches 6 files minimum.

### 6.2 Metric Inflation

| Metric | Claimed | Actual |
|--------|---------|--------|
| Test count | 919 (CLAUDE.md) | ~3,527 |
| Coverage | 83% stmts | ~40-50% true |
| Feature complete | 100% | Many stub implementations in db.ts |
| Utility library | "30 hooks, 94 lib modules" | 3 hooks + 25 libs actually used |

### 6.3 Priority Matrix

```
                    Quick Fix               Significant Effort
                    (< 1 day)               (> 1 day)
HIGH IMPACT    | TD-1: Delete dead libs   | ARC-4: URL routing
               | TD-2: Delete dead hooks  | SEC-01: Credential vault
               | ARC-1: Move hydrate hook | ARC-2: Split db.ts
               | SEC-06: Origin validation| TST-1: Remove coverage exclusions
               | SEC-03: Sanitize tools.py| TST-2: PromptInput tests
               |                          |
LOW IMPACT     | TD-6: Move deps          | PERF-2: Dynamic store imports
               | TD-7: Delete demos       | ARC-3: Split types
               | TD-9: Remove console.log | TD-10: Split SettingsScreen
               | PERF-4: Build target     | TST-3: Backend API tests
```

---

## 7. Recommended Action Plan

### Phase A: Quick Wins (1-2 days)

1. **Delete 71 dead shared/lib files** (-7,454 lines)
2. **Delete 28 dead shared hooks** (-1,100 lines)
3. **Move `useHydrateOnView.ts` to `src/app/hooks/`** (FSD fix)
4. **Add `event.origin` validation** in `useExtensionContext.ts`
5. **Apply `sanitize_query()` to `backend/routes/tools.py`**
6. **Move `@aws-sdk` and `vite-plugin-pwa` to devDependencies**
7. **Switch to `PrismLight`** with 15 selective languages (-400 KB)

**Expected impact**: -8,554 dead lines, -400 KB bundle, 3 security fixes

### Phase B: Structural Improvements (3-5 days)

1. **Split `db.ts`** into domain modules, delete 48 stubs
2. **Split `types/index.ts`** into domain type files
3. **Add 81 missing i18n keys**, remove all `(t as any)` casts
4. **Remove vitest coverage exclusions**, establish true baseline
5. **Add PromptInput component tests**
6. **Reduce PWA precache** from 7.82 MB to ~3 MB
7. **Add backend API authentication** (JWT or API key)

**Expected impact**: True coverage baseline, type safety restored, 50% precache reduction

### Phase C: Architecture Evolution (1-2 weeks)

1. **Add URL-based routing** (TanStack Router) — enables deep linking, browser navigation
2. **Implement server-side credential vault** — eliminates SEC-01
3. **Add backend API endpoint tests** — from 0% to meaningful coverage
4. **Dynamic-import stores in `useHydrateOnView`** — reduces main bundle
5. **Split `SettingsScreen.tsx`** into tab sub-components

**Expected impact**: Production-grade architecture, security hardening, meaningful test coverage

---

## Appendix A: Scoring Methodology

| Area | Categories | Weights |
|------|-----------|---------|
| Architecture (54) | FSD compliance 25%, File size 15%, Circular deps 15%, Cohesion 20%, Complexity 15%, Layer stats 10% |
| Security (67) | XSS 20%, Secrets 20%, Input validation 15%, API security 15%, Data storage 10%, Injection 10%, Deps 10% |
| Testing (41) | Count/breadth 70, Coverage accuracy 30, Critical modules 65, Test depth 45, Backend 10, E2E 5, Infra 60 — averaged |
| Bundle (72) | Code splitting 25%, Lazy loading 20%, Build config 15%, Rendering 15%, PWA 10%, Memoization 10%, Size 5% |
| Tech Debt (42) | TS strictness 20%, Dead code 25%, Dep health 15%, Organization 15%, Mutability 10%, Hardcoded 10%, Console 5% |
| **Overall (55)** | Architecture 25%, Security 20%, Testing 20%, Bundle 15%, Tech Debt 20% |

## Appendix B: Worker Execution Stats

| Worker | Agent Type | Duration | Tool Uses | Tokens |
|--------|-----------|----------|-----------|--------|
| W1 Architecture | architect | 239s | 89 | 108,843 |
| W2 Security | security-reviewer | 236s | 65 | 111,933 |
| W3 Testing | general-purpose | 220s | 90 | 115,672 |
| W4 Bundle | general-purpose | 191s | 52 | 88,193 |
| W5 Tech Debt | refactor-cleaner | 459s | 161 | 90,685 |
| **Total** | **5 agents (worktree)** | **~460s max** | **457** | **515,326** |

All workers ran on isolated git worktrees. Worktrees auto-cleaned (no changes made).
