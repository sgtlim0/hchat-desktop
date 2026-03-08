# Phase 41: Production Hardening & DX

> Date: 2026-03-08 | Base: Phase 40 complete (f56cc11)
> 519 TS/TSX files, 112 entities, 106 pages, 964+ tests

---

## Current Gaps (Codebase Analysis)

| Area | Current State | Gap |
|------|--------------|-----|
| CI/CD | deploy.yml (build + deploy only) | No test/lint in pipeline |
| Rate Limiting | stream-throttle.ts only | No API call rate limiter |
| E2E Tests | 3 specs, 286 lines, 24 tests | Insufficient coverage |
| Error Reporting | ErrorBoundary exists, console.error only | No error tracking/reporting |
| Bundle Analysis | Manual chunks in vite.config | No build size tracking |
| Sync Status | Offline banner only | No pending sync count UI |

---

## Features (6 items, 4 parallelizable)

### F1: CI/CD Pipeline Enhancement
**Goal**: Add test + lint steps before deploy

**Files**:
- NEW: `.github/workflows/ci.yml`
- MODIFY: `.github/workflows/deploy.yml` (add test dependency)

**Implementation**:
```yaml
# ci.yml: lint -> test -> build on every push/PR
jobs:
  lint: eslint .
  test: vitest run
  build: tsc -b && vite build
```

**Independence**: FULL (no src/ changes)

---

### F2: API Rate Limiter
**Goal**: Client-side rate limiter for all provider API calls

**Files**:
- NEW: `src/shared/lib/rate-limiter.ts`
- NEW: `src/shared/lib/__tests__/rate-limiter.test.ts`

**Implementation**:
- Token bucket algorithm (configurable per provider)
- Default: 10 req/min for Bedrock, 20 for OpenAI, 15 for Gemini
- Integration point: `providers/factory.ts` createStream()
- Queue overflow: toast warning

**Independence**: FULL (new files only, factory.ts minimal change)

---

### F3: E2E Test Expansion
**Goal**: Expand from 24 to 40+ Playwright tests

**Files**:
- NEW: `e2e/settings.spec.ts`
- NEW: `e2e/sidebar.spec.ts`
- NEW: `e2e/tools.spec.ts`
- NEW: `e2e/search.spec.ts`

**Test Scenarios**:
- Settings: dark mode toggle, language switch, model selection
- Sidebar: folder creation, session list, search
- Tools: translate page load, OCR page load, doc-writer
- Search: Cmd+K modal, search filtering

**Independence**: FULL (e2e/ directory only)

---

### F4: Error Boundary Enhancement
**Goal**: Add error reporting, granular boundaries, recovery strategies

**Files**:
- MODIFY: `src/shared/ui/ErrorBoundary.tsx` (add reporting hook)
- NEW: `src/shared/lib/error-reporter.ts`
- NEW: `src/shared/lib/__tests__/error-reporter.test.ts`

**Implementation**:
- Error reporter: collect errors with context (view, sessionId, timestamp)
- Store in IndexedDB for later analysis (max 100 entries, FIFO)
- Granular boundaries per page section (not just main content)
- Auto-retry with exponential backoff for transient errors

**Independence**: FULL (shared/ only, no MainLayout change)

---

### F5: Sync Status Badge
**Goal**: Show pending sync items + last sync time in layout

**Files**:
- NEW: `src/shared/ui/SyncStatusBadge.tsx`
- NEW: `src/shared/ui/__tests__/SyncStatusBadge.test.tsx`
- MODIFY: `src/app/layouts/MainLayout.tsx` (add badge)
- MODIFY: `src/shared/i18n/ko.ts`, `en.ts` (add keys)

**Implementation**:
- Badge shows: pending count from offline-sync store
- Tooltip: last successful sync timestamp
- States: synced (green), pending (amber), error (red)

**Independence**: LOW (touches MainLayout, i18n - CONFLICT ZONE)

---

### F6: Build Size Tracking
**Goal**: Track and report bundle sizes on build

**Files**:
- NEW: `scripts/bundle-report.ts`
- MODIFY: `package.json` (add script)
- MODIFY: `vite.config.ts` (add rollup-plugin-visualizer optional)

**Implementation**:
- Post-build script: parse dist/ sizes, compare with baseline
- Generate markdown report (dist-report.md)
- Warning if total > 2MB or any chunk > 500KB

**Independence**: FULL (scripts/ + config only)

---

## Worktree Agent Assignment

### Parallel Workers (independent)

| Worktree Branch | Agent Type | Feature | Files |
|----------------|------------|---------|-------|
| `feat/p41-cicd` | general-purpose | F1: CI/CD | .github/ |
| `feat/p41-rate-limiter` | tdd-guide | F2: Rate Limiter | src/shared/lib/ |
| `feat/p41-e2e` | e2e-runner | F3: E2E Tests | e2e/ |
| `feat/p41-error-reporter` | tdd-guide | F4: Error Reporter | src/shared/lib/, src/shared/ui/ |

### Integration Step (PM does this on main)

| Feature | Conflict Zone | Strategy |
|---------|--------------|----------|
| F5: Sync Badge | MainLayout, i18n | PM applies after merge |
| F6: Build Report | vite.config, package.json | PM applies after merge |

---

## Timeline

```
Phase 41 Execution:
  [Parallel] F1 + F2 + F3 + F4  (4 worktree agents)
  [Sequential] F5 + F6           (PM integration)
  [Final] Merge all -> test -> commit
```

## Success Metrics

| Metric | Before | After |
|--------|--------|-------|
| CI test gate | None | lint + test + build |
| E2E tests | 24 | 40+ |
| Rate limiting | None | Per-provider |
| Error tracking | console only | IndexedDB + context |
| Sync visibility | Banner only | Badge + tooltip |
| Build tracking | None | Size report |

---

## Risk Analysis

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Merge conflicts | Low | Medium | 4 parallel workers touch no common files |
| E2E flakiness | Medium | Low | Use Playwright auto-wait, retry 2x |
| Rate limiter blocks UX | Low | High | Generous defaults, user-configurable |
| CI timeout | Low | Medium | 10min timeout, cache node_modules |
