# H Chat PWA - Project Deep Analysis Report v2

**Date**: 2026-03-10 | **Branch**: main | **Commit**: f7951fb
**Previous Analysis**: 2026-03-08 (commit 3e2ff96)
**Analyzed by**: PM + 5 Parallel Worker Agents (worktree isolation)

---

## Executive Summary

| Metric | Previous (3/8) | Current (3/10) | Delta |
|--------|----------------|----------------|-------|
| Files | 718 TS/TSX | 730 TS/TSX | +12 |
| Tests | 1,978+ (277 files) | 1,978+ (277 files) | - |
| Test Coverage | 83% stmts / 79% branches | 83% stmts / 79% branches | - |
| Stores | 113 entity files | 113 entity files | - |
| Pages | 106+ (99 ViewState) | 106+ (99 ViewState) | - |
| Commits | 142 | 144 | +2 |
| Dependencies | 18 prod / 26 dev | 18 prod / 26 dev | - |

### Overall Scores

| Area | Previous | Current | Delta | Grade |
|------|----------|---------|-------|-------|
| Architecture | 65/100 | 62/100 | -3 | D |
| Code Quality | 72/100 | 68/100 | -4 | D+ |
| Security | 45/100 | 72/100 | +27 | C- |
| Bundle/Optimization | 75/100 | 70/100 | -5 | C- |
| Test Infrastructure | 85/100 | 75/100 | -10 | C+ |
| **Overall** | **68/100** | **69/100** | **+1** | **D+** |

> Overall +1 mainly due to massive security improvement (+27). However, code quality
> and test infrastructure scores dropped significantly, masking systemic degradation.

### Risk Heat Map

```
            Low Impact    Medium Impact      High Impact
CRITICAL   |             |                  | SEC-6,18  ARC-1,7  CQ-7
HIGH       |             | CQ-4,8           | SEC-5,7,15  ARC-4,8  CQ-6,9
MEDIUM     | REF-1       | CQ-10,14  BUN-1  | SEC-10,11,14
LOW        | REF-2       | SEC-16  BUN-2    |
```

### Key Changes Since Previous Analysis

| Change | Impact |
|--------|--------|
| f7951fb: 50 TS build errors fixed | +55 `any` types introduced (was 0) |
| 51942b7: Confluence/Jira integration | Clean architecture, new stores |
| 5 security vulnerabilities FIXED | SEC-1,2,3,4,9 resolved |
| 1 NEW security vulnerability | SEC-18: DiagramEditorPage XSS |
| Immutability violations | 30 -> 310 (933% increase) |

---

## 1. Architecture Analysis (W1: Architect)

### Score: 62/100 (D) | Previous: 65/100 | Trend: -3

### 1.1 CRITICAL Issues

#### ARC-1: FSD Layer Violation - WORSENED (5 -> 8 files)

`shared/` layer imports from `entities/` (upper layer), violating FSD principles.

| File | Import | Status |
|------|--------|--------|
| `src/shared/i18n/index.ts` | `useSettingsStore` | OPEN |
| `src/shared/ui/ToastContainer.tsx` | `useToastStore` | OPEN |
| `src/shared/ui/ErrorBoundary.tsx` | `useSettingsStore` | OPEN |
| `src/shared/lib/export-chat.ts` | `useSettingsStore` | OPEN |
| `src/shared/lib/error-reporter.ts` | `useSessionStore` | OPEN |
| `src/shared/lib/__tests__/theme-sync.test.ts` | `useSettingsStore` | NEW |
| `src/shared/lib/__tests__/error-reporter.test.ts` | `useSessionStore` | NEW |
| `src/shared/i18n/__tests__/i18n.test.ts` | `useSettingsStore` | NEW |

**Fix**: Extract store interfaces to shared layer, use dependency injection.

#### ARC-7: No URL-based Routing (CRITICAL)

State-driven routing via `SessionStore.view` — no deep linking, no browser back/forward.

**Fix**: Migrate to React Router or TanStack Router.

### 1.2 HIGH Issues

| ID | Issue | Status |
|----|-------|--------|
| ARC-2 | ViewState 99 union members, no namespacing | UNCHANGED |
| ARC-3 | MainLayout God Object (25 stores) | UNCHANGED |
| ARC-4 | Initial load hydrates 25 stores | UNCHANGED |
| ARC-8 | Cannot share deep links | UNCHANGED |

### 1.3 POSITIVE

- route-map.ts extraction provides lazy-loaded component lookup (improvement)
- Confluence/Jira integration follows clean separation patterns
- New `tool-integration.store` properly isolated

---

## 2. Code Quality Analysis (W2: Code Reviewer)

### Score: 68/100 (D+) | Previous: 72/100 | Trend: -4

### 2.1 CRITICAL Issues

#### CQ-6: PromptInput.handleSend — 212 lines, 10+ responsibilities

`src/widgets/prompt-input/PromptInput.tsx:150-362` — guardrail, session creation, message building, context compression, token estimation, provider config, streaming, error handling, usage tracking, artifact detection.

**Fix**: Split into `useStreamingResponse`, `useUsageTracking`, `useGuardrail` hooks.

#### CQ-7: `any` Type Explosion — 0 -> 55 instances (REGRESSION)

Commit f7951fb introduced 55 `any` types across 26 files to fix build errors. Quick fixes instead of proper typing.

**Fix**: Replace each `any` with proper interfaces/generics.

#### CQ-9: Immutability Violations — 30 -> 310 (933% increase)

| Pattern | Count | Top Offender |
|---------|-------|--------------|
| `.push()` | 180+ | `db.ts` (58) |
| `.sort()` | 40+ | Multiple stores |
| `.splice()` | 30+ | Store operations |
| Direct assignment | 60+ | Various |

**Fix**: Use spread operators, `Array.from().sort()`, or immer for complex updates.

### 2.2 HIGH Issues

| ID | Issue | Current | Previous |
|----|-------|---------|----------|
| CQ-1 | Console.log residuals | 268 (53 files) | 271 (54 files) |
| CQ-4 | Oversized files (>800 lines) | 12 files | 12 files |
| CQ-8 | `as` type assertions | 217 (100 files) | N/A |
| CQ-13 | Tech debt from TS quick fixes | f7951fb | NEW |

### 2.3 POSITIVE

| Area | Detail |
|------|--------|
| Error handling | Improved: 153 -> 140 try/catch blocks (fewer empty catches) |
| Memoization | 254 useMemo/useCallback across 49 files |
| ErrorBoundary | Properly implemented |
| i18n | Growing (+54 lines en.ts) but well-structured |

---

## 3. Security Audit (W3: Security Reviewer)

### Score: 72/100 (C-) | Previous: 45/100 | Trend: +27

### 3.1 FIXED Vulnerabilities (5 of 17)

| ID | Severity | Issue | Fix Applied |
|----|----------|-------|-------------|
| SEC-1 | CRITICAL | API Keys in client | Backend proxy exclusively |
| SEC-2 | CRITICAL | XSS dangerouslySetInnerHTML | DOMPurify sanitization |
| SEC-3 | CRITICAL | IndexedDB plaintext | Web Crypto AES-GCM 256-bit |
| SEC-4 | HIGH | iframe sandbox scripts | Empty sandbox="" |
| SEC-9 | MEDIUM | CORS wildcard | Specific origins only |

### 3.2 NEW Vulnerability

#### SEC-18: XSS in DiagramEditorPage (CRITICAL, CVSS 8.2)

`src/pages/diagram-editor/DiagramEditorPage.tsx:330` — Mermaid SVG rendered without DOMPurify sanitization.

```typescript
// VULNERABLE:
dangerouslySetInnerHTML={{ __html: previewHtml }}

// FIX:
dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(previewHtml, { USE_PROFILES: { svg: true } }) }}
```

### 3.3 OPEN Vulnerabilities (10 remaining + 1 new)

| ID | Severity | Issue | CVSS |
|----|----------|-------|------|
| SEC-6 | CRITICAL | AWS credentials sent from client | 8.1 |
| SEC-18 | CRITICAL | DiagramEditorPage XSS (NEW) | 8.2 |
| SEC-5 | HIGH | No CSP headers | 6.5 |
| SEC-7 | HIGH | `new Function()` code injection | 7.3 |
| SEC-8 | HIGH | serialize-javascript RCE (transitive) | 7.5 |
| SEC-15 | HIGH | Code interpreter `new Function()` | 7.3 |
| SEC-10 | MEDIUM | No backend rate limiting | 5.3 |
| SEC-11 | MEDIUM | Prompt injection risk | 4.3 |
| SEC-14 | MEDIUM | DOM innerHTML XSS (partial fix) | 6.1 |
| SEC-16 | LOW | Gemini API key in URL query param | 3.5 |
| SEC-17 | MEDIUM | TS suppressions from f7951fb | 4.0 |

### 3.4 Confluence/Jira Integration Security

| Area | Status |
|------|--------|
| Input validation | Good (sanitization, CQL/JQL injection prevention) |
| Domain validation | HTTPS enforced, numeric page IDs |
| SSRF risk | Mitigated but recommend domain whitelist |

---

## 4. Dead Code & Bundle Optimization (W4: Refactor Cleaner)

### Score: 70/100 (C-) | Previous: 75/100 | Trend: -5

### 4.1 Immediately Deletable (unchanged)

| Category | Files | Lines |
|----------|-------|-------|
| Stub pages (U* prefix) | 4 | 64 |
| Demo/example files | 6 (+1) | 600 |
| Unused barrel exports | 1 | 101 |
| **Total** | **11 files** | **765 lines** |

### 4.2 Duplicate Functions (WORSENED)

| Function | Previous | Current |
|----------|----------|---------|
| `formatBytes()` | 3 locations | 6 locations |
| `formatDuration()` | 2 locations | 3 locations |

### 4.3 Bundle Critical — Static Imports That Must Be Dynamic

| Package | Size | Currently | Should Be |
|---------|------|-----------|-----------|
| `tesseract.js` | ~2MB | Static import | Dynamic `import()` |
| `pdfjs-dist` | ~500KB | Static import | Dynamic `import()` |
| `mermaid` | ~250KB | Already dynamic | OK |
| `xlsx` | ~200KB | Already dynamic | OK |
| `jspdf` | ~150KB | Already dynamic | OK |

**Fix**: Convert tesseract.js and pdfjs-dist to `const mod = await import('...')` pattern.

### 4.4 Low-Usage Experimental Stores (13 stores, ~1,500 lines)

```
dream-sim, space-explorer, philosopher, quantum-viz, movie-script,
soundscape, neuro-feedback, emotion-avatar, voice-clone, music-composer,
smart-contract, virtual-space, data-3d
```

Each only used in: route-map + page component + test. Business value unclear.

### 4.5 Estimated Total Savings

| Action | Lines | Bundle |
|--------|-------|--------|
| Delete stubs + demos | 765 | minimal |
| Consolidate duplicates | 80 | minimal |
| Experimental store cleanup | 1,500 | ~200KB |
| Dynamic import conversion | - | ~2.5MB |
| **Total** | **~2,850 lines** | **~2.7MB** |

---

## 5. Test Infrastructure & Dependencies (W5: Explorer)

### Score: 75/100 (C+) | Previous: 85/100 | Trend: -10

### 5.1 Coverage Reality Check

| Layer | Source Files | Tested | Gap |
|-------|-------------|--------|-----|
| entities/ | 145+ stores | ~65 tested, 80 empty dirs | 55% gap |
| pages/ | 150+ pages | ~15 tested | 90% gap |
| widgets/ | 13 widgets | ~3 tested | 77% gap |
| shared/lib/ | 60+ modules | ~25 tested | 58% gap |
| app/layouts/ | 1 (MainLayout) | 0 tested | 100% gap |
| backend/ | 15+ routes | 0 tested | 100% gap |

> **True coverage is estimated at 50-55%** when accounting for 80 empty `__tests__` directories.

### 5.2 Critical Untested Files

| File | Lines | Impact | Status |
|------|-------|--------|--------|
| `app/layouts/MainLayout.tsx` | 900+ | CRITICAL | NO TEST |
| `widgets/prompt-input/PromptInput.tsx` | 450+ | CRITICAL | NO TEST |
| `shared/lib/bedrock-client.ts` | ~200 | HIGH | Excluded from coverage |
| `shared/lib/providers/openai.ts` | 26 | MEDIUM | Only factory mock |
| `shared/lib/providers/gemini.ts` | 26 | MEDIUM | Only factory mock |
| `backend/app.py + routes/` | 15+ handlers | CRITICAL | 0 TEST FILES |

### 5.3 E2E Coverage

- **54 E2E tests** across 7 spec files (previously 24 tests)
- Covers: home, navigation, chat, settings, sidebar, search, tools
- **Missing**: error scenarios, advanced workflows, data persistence, multi-step wizards

### 5.4 Dependency Health

| Area | Score | Detail |
|------|-------|--------|
| Package freshness | 90/100 | All current versions |
| Vulnerability risk | 95/100 | No known CVEs |
| Bundle management | 85/100 | Good chunking strategy |
| Security scanning | 30/100 | No npm audit in CI |
| **Overall** | **82/100** | |

### 5.5 Build Health

| Setting | Status |
|---------|--------|
| TypeScript strict mode | Enabled (all flags) |
| Incremental builds (`tsc -b`) | Configured |
| Manual chunks (5 groups) | Configured |
| Coverage thresholds (80%) | Enforced |
| ESLint v9 flat config | Configured |

---

## 6. Cross-Worker Finding Correlations

### Pattern: Quality Regression Under Speed

All 5 workers identified a common thread: **commit f7951fb (50 TS error fixes) traded correctness for speed**, introducing technical debt that lowered 4 of 5 scores.

| Symptom | W1 | W2 | W3 | W4 | W5 |
|---------|:--:|:--:|:--:|:--:|:--:|
| 55 `any` types (was 0) | | X | X | | X |
| 310 mutability violations (was 30) | | X | | | |
| 8 FSD violations (was 5) | X | | | | |
| 80 empty test directories | | | | | X |
| formatBytes in 6 places (was 3) | | | | X | |
| tesseract/pdfjs static import | | | | X | X |
| Backend 0% test coverage | | | X | | X |
| MainLayout/PromptInput untested | X | X | | | X |
| DiagramEditorPage XSS (NEW) | | | X | | |
| No URL routing | X | | | | |

### Root Causes

1. **Velocity over quality**: 66 phases shipped without architectural governance
2. **Quick-fix culture**: f7951fb used `any` instead of proper types to pass builds
3. **Test theater**: 80 empty test directories inflate perceived coverage
4. **Backend neglect**: Zero Python tests despite 15+ production routes

---

## 7. Priority Action Plan

### Sprint S1: Critical Fixes (1-2 days)

| # | Action | Issue | Files | Impact |
|---|--------|-------|-------|--------|
| 1 | Fix DiagramEditorPage XSS | SEC-18 | 1 | Security |
| 2 | Add CSP meta tag | SEC-5 | 1 | Security |
| 3 | Replace `new Function()` | SEC-7,15 | 2 | Security |
| 4 | Convert tesseract.js to dynamic import | BUN-1 | 1 | -2MB bundle |
| 5 | Convert pdfjs-dist to dynamic import | BUN-1 | 1 | -500KB bundle |

### Sprint S2: Type Safety Recovery (3-5 days)

| # | Action | Issue | Impact |
|---|--------|-------|--------|
| 1 | Replace 55 `any` types with proper interfaces | CQ-7 | Type safety |
| 2 | Audit 217 `as` assertions for safety | CQ-8 | Correctness |
| 3 | Add ESLint `no-explicit-any` rule | Prevention | Pipeline |
| 4 | Add `vite-plugin-remove-console` | CQ-1 | 268 logs removed |

### Sprint S3: Architecture Cleanup (1-2 weeks)

| # | Action | Issue | Impact |
|---|--------|-------|--------|
| 1 | Fix 8 FSD layer violations | ARC-1 | FSD compliance |
| 2 | Namespace ViewState (99 -> 4 categories) | ARC-2 | IDE perf, DX |
| 3 | Extract PromptInput.handleSend into hooks | CQ-6 | Testability |
| 4 | Split SettingsScreen.tsx by tabs | CQ-4 | Maintainability |
| 5 | Split types/index.ts by domain | CQ-4 | IDE perf |
| 6 | Consolidate formatBytes/formatDuration | REF-1 | 6->1 source |

### Sprint S4: Test Infrastructure (2-3 weeks)

| # | Action | Issue | Impact |
|---|--------|-------|--------|
| 1 | Add MainLayout.tsx tests | TEST-1 | Critical path |
| 2 | Add PromptInput.tsx tests | TEST-2 | Critical path |
| 3 | Create backend Python test suite | TEST-3 | 15+ routes |
| 4 | Fill or remove 80 empty test dirs | TEST-4 | True coverage |
| 5 | Extend E2E error scenarios | TEST-5 | Reliability |

### Sprint S5: Long-term (1 month)

| # | Action | Impact |
|---|--------|--------|
| 1 | Implement URL-based routing (TanStack Router) | Deep linking, SEO |
| 2 | Lazy store hydration (on-demand) | Load performance |
| 3 | Backend rate limiting (slowapi) | DDoS protection |
| 4 | Evaluate/remove 13 experimental stores | 1,500 lines |
| 5 | npm audit in CI/CD pipeline | Dependency security |
| 6 | Store factory for CRUD boilerplate | 100+ patterns |

### Projected Score After Sprints

| Sprint | Architecture | Quality | Security | Bundle | Tests | Overall |
|--------|-------------|---------|----------|--------|-------|---------|
| Current | 62 | 68 | 72 | 70 | 75 | **69** |
| After S1 | 62 | 68 | 82 | 78 | 75 | **73** |
| After S2 | 62 | 78 | 82 | 80 | 75 | **75** |
| After S3 | 75 | 85 | 82 | 80 | 75 | **79** |
| After S4 | 75 | 85 | 82 | 80 | 88 | **82** |
| After S5 | 85 | 88 | 88 | 85 | 90 | **87** |

---

## Appendix A: Worker Execution Stats

| Worker | Agent Type | Duration | Tool Calls | Score | Trend |
|--------|-----------|----------|------------|-------|-------|
| W1 | Architect | 328s | 22 | 62/100 (D) | -3 |
| W2 | Code Reviewer | 341s | 19 | 68/100 (D+) | -4 |
| W3 | Security Reviewer | 435s | 32 | 72/100 (C-) | +27 |
| W4 | Refactor Cleaner | 713s | 41 | 70/100 (C-) | -5 |
| W5 | Explorer | 169s | 51 | 75/100 (C+) | -10 |
| **Total** | **5 agents** | **~33min** | **165 calls** | **69/100 (D+)** | **+1** |

## Appendix B: File Hotspots (Top 10 Riskiest Files)

| Rank | File | Lines | Issues | Risk |
|------|------|-------|--------|------|
| 1 | `widgets/prompt-input/PromptInput.tsx` | 450+ | CQ-6, untested | CRITICAL |
| 2 | `app/layouts/MainLayout.tsx` | 900+ | ARC-3,4,5, untested | CRITICAL |
| 3 | `shared/types/index.ts` | 1,659 | ARC-2, 99 ViewState | CRITICAL |
| 4 | `pages/diagram-editor/DiagramEditorPage.tsx` | ~400 | SEC-18 XSS | CRITICAL |
| 5 | `shared/lib/db.ts` | 1,210 | 58 console.log, mutations | HIGH |
| 6 | `shared/lib/agent/tools.ts` | ~200 | SEC-7 new Function() | HIGH |
| 7 | `shared/lib/bedrock-client.ts` | ~200 | SEC-6 AWS creds, untested | HIGH |
| 8 | `pages/settings/SettingsScreen.tsx` | 1,311 | CQ-4 oversized | HIGH |
| 9 | `entities/session/session.store.ts` | ~500 | 15 console.error | MEDIUM |
| 10 | `entities/code-interpreter/code-interpreter.store.ts` | ~200 | SEC-15 new Function() | HIGH |

---

*Generated by PM Agent orchestrating 5 parallel Worker Agents in isolated git worktrees.*
*Total analysis time: ~33 minutes | 165 tool calls | 5 independent reports synthesized.*
