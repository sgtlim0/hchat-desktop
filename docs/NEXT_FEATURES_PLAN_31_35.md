# H Chat PWA — Phase 31-35 Plan

> Based on: Phase 30 completion | ~108 commits, ~71K LOC, ~1,050 tests
> Date: 2026-03-08

---

## Phase 31: Offline-First Architecture

**Goal**: Full offline support with background sync

### Features
- [ ] **Service Worker Sync Queue** — Queue API calls when offline, replay on reconnect
- [ ] **Offline AI Inference** — Local ONNX models for basic tasks (summarize, classify)
- [ ] **Conflict Resolution** — Last-write-wins + manual merge for concurrent edits
- [ ] **Offline Indicator** — Real-time connectivity status badge + toast notifications
- [ ] **IndexedDB Optimization** — Batch writes, lazy loading, storage quota management
- [ ] **Cache-First Strategy** — All static assets + recent conversations pre-cached

### Technical
- Workbox for Service Worker management
- ONNX Runtime Web for local inference
- Background Sync API for deferred requests

---

## Phase 32: Multi-Language & Accessibility

**Goal**: Full i18n + WCAG 2.1 AA compliance

### Features
- [ ] **i18n Expansion** — Korean + English + Japanese + Chinese (4 languages)
- [ ] **RTL Support** — Arabic/Hebrew layout support
- [ ] **Screen Reader** — ARIA landmarks, live regions, role annotations
- [ ] **Keyboard Navigation** — Full app navigable via keyboard, focus management
- [ ] **Color Contrast** — WCAG AA contrast ratios, high contrast theme
- [ ] **Reduced Motion** — Respect prefers-reduced-motion, disable animations
- [ ] **Font Scaling** — Responsive typography, rem-based sizing

### Technical
- i18n key count: 49 → 500+ per language
- axe-core automated accessibility testing
- Playwright a11y test suite

---

## Phase 33: Performance & Bundle Optimization

**Goal**: Lighthouse 95+, bundle size 50% reduction

### Features
- [ ] **Code Splitting v2** — Route-level lazy loading for all 35+ pages
- [ ] **Mermaid Dynamic Import** — Load only when diagram viewed (~12MB → 0 initial)
- [ ] **Syntax Highlighter Trim** — Only load used languages
- [ ] **Image Optimization** — WebP/AVIF conversion, lazy loading, srcset
- [ ] **Virtual Scrolling v2** — Virtualize sidebar, search results, all lists
- [ ] **Web Worker Offloading** — Move embeddings, chunking, analytics to workers
- [ ] **Tree Shaking Audit** — Remove unused exports, dead code elimination

### Metrics Target
| Metric | Current | Target |
|--------|---------|--------|
| FCP | ~2s | <1s |
| LCP | ~3s | <1.5s |
| TBT | ~300ms | <100ms |
| Bundle (gzip) | ~800KB | <400KB |

---

## Phase 34: Advanced Agent System

**Goal**: Autonomous multi-step agent with tool use

### Features
- [ ] **ReAct v2 Agent** — Plan → Act → Observe → Reflect loop with memory
- [ ] **Tool Registry** — Dynamic tool registration, capability discovery
- [ ] **Agent Chains** — Sequential agent delegation (researcher → writer → reviewer)
- [ ] **Agent Memory** — Long-term memory across sessions, relevance decay
- [ ] **Safety Guards** — Budget limits, action approval, rollback capability
- [ ] **Agent Analytics** — Success rate, avg steps, cost per task

### Tools to Add
- File system operations (read/write/list local files)
- Calendar integration (read/create events)
- Database query (Dexie query builder)
- Code execution (sandboxed JS + Pyodide)

---

## Phase 35: Real-time Collaboration v2

**Goal**: Production-grade real-time features

### Features
- [ ] **CRDT Engine** — Yjs integration for conflict-free concurrent editing
- [ ] **Presence System** — Live user avatars, typing indicators, cursor sharing
- [ ] **Shared Canvas** — Real-time collaborative whiteboard (from Phase 29 canvas)
- [ ] **Shared Knowledge Base** — Team-wide document library with access control
- [ ] **Activity Feed** — Real-time notifications of team actions
- [ ] **Video/Audio Chat** — WebRTC peer-to-peer voice/video in workspace

### Technical
- Yjs + y-indexeddb for offline CRDT
- WebRTC for peer-to-peer media
- WebSocket signaling server (Modal)

---

## Timeline & Dependencies

```
Phase 31 (Offline)       ──┐
Phase 32 (i18n/A11y)     ──┼── Parallel (independent)
Phase 33 (Performance)   ──┘
                           │
Phase 34 (Agent v2)      ──── Depends on 31 (offline tools)
Phase 35 (Collab v2)     ──── Depends on 29 (canvas) + 33 (perf)
```

## Success Metrics

| Metric | Phase 30 | Phase 35 Target |
|--------|---------|-----------------|
| Tests | ~1,050 | 1,500+ |
| Coverage | 83% | 85%+ |
| Pages | 35 | 40+ |
| Stores | 33 | 38+ |
| LOC | ~71K | ~85K |
| Lighthouse | ~75 | 95+ |
| Languages | 2 (ko/en) | 4 |
| Offline | Basic | Full (sync + local AI) |
| Agent Tools | 4 | 10+ |
| Bundle | ~800KB | <400KB |
