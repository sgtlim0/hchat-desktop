# H Chat PWA - Next Features Plan

> Based on: Phase 24 completion | 102 commits, 470 files, 67,911 LOC
> 919 tests (83% coverage), 35 pages, 31 Zustand stores
> Date: 2026-03-07

---

## Current State Summary

| Item | Value |
|------|-------|
| TS/TSX Files | 470 |
| Total LOC | 67,911 |
| Unit Tests | 161 (56 suites, 919 tests) |
| E2E Tests | 3 (24 tests) |
| Coverage | 83% stmts, 79% branches, 91% funcs, 82% lines |
| Pages/Views | 35 |
| Zustand Stores | 31 |
| Git Commits | 102 |
| Phases Complete | 24 |
| Backend | Modal.com FastAPI (Python) |
| Deploy | Vercel (FE) + Modal (BE) |

### Completed Features (100%)
- Multi-provider AI (Bedrock/OpenAI/Gemini)
- 35 screens (chat, translate, doc-writer, OCR, image-gen, etc.)
- Agent mode (XML tools: search, memory, schedule, file)
- Debate, Swarm, Workflow builder
- Realtime collaboration, Team workspace
- Plugin system, Theme builder
- Batch processing, Smart caching
- Audit logs, AI dashboard, ROI tracking
- PWA offline support, IndexedDB persistence

---

## Phase 25: Advanced RAG & Document Intelligence

**Goal**: Transform document handling from basic upload to intelligent knowledge retrieval

### Features
- [ ] **Vector Embedding Search** — Embed uploaded docs with local models, semantic search
- [ ] **Multi-format Parser** — PDF tables, Excel formulas, PPT slides extraction
- [ ] **Citation System** — AI responses reference specific doc sections with page numbers
- [ ] **Knowledge Graph Visualization** — D3 force graph of document relationships
- [ ] **Auto-Summary Pipeline** — Upload doc -> summary + key points + action items
- [ ] **Cross-Document Q&A** — Ask questions spanning multiple documents

### Technical
- Dexie vector store (float32 arrays)
- Chunking: sliding window with overlap
- Re-ranking: BM25 + semantic hybrid

---

## Phase 26: Voice-First Interface

**Goal**: Full voice interaction pipeline (STT -> AI -> TTS)

### Features
- [ ] **Continuous Listening Mode** — Wake word detection ("Hey H Chat")
- [ ] **Real-time Transcription** — Whisper streaming, live captions
- [ ] **Voice Commands** — "Summarize this", "Translate to English", "Start debate"
- [ ] **TTS Response** — Natural voice output with emotion detection
- [ ] **Meeting Mode** — Record meeting -> transcript -> summary + action items
- [ ] **Voice Notes** — Quick voice memo -> AI-processed notes

### Technical
- Web Audio API + Whisper local/API
- OpenAI TTS or ElevenLabs
- VAD (Voice Activity Detection) for auto-pause

---

## Phase 27: Advanced Analytics & Insights

**Goal**: Deep usage analytics beyond current ROI dashboard

### Features
- [ ] **Prompt Quality Scoring v2** — ML-based quality prediction, improvement suggestions
- [ ] **Model Performance Benchmarks** — Response time, accuracy, cost per query comparison
- [ ] **Usage Heatmaps** — Time-of-day, day-of-week usage patterns
- [ ] **Cost Forecasting** — ML-based monthly cost prediction with budget alerts
- [ ] **Team Analytics** — Per-member usage, top queries, shared knowledge utilization
- [ ] **Export Reports** — PDF/Excel weekly/monthly analytics reports

### Technical
- Client-side ML with TensorFlow.js lite
- D3.js advanced charts (heatmap, sankey, treemap)
- IndexedDB aggregation queries

---

## Phase 28: AI Workflow Automation

**Goal**: No-code AI automation beyond current workflow builder

### Features
- [ ] **Cron Scheduler** — Daily/weekly automated workflows (e.g., morning news digest)
- [ ] **Webhook Triggers** — External event triggers (Slack, GitHub, email)
- [ ] **Conditional Branching v2** — If/else with AI evaluation (sentiment, classification)
- [ ] **Loop Nodes** — Iterate over lists, paginated API calls
- [ ] **Human-in-the-Loop** — Pause workflow for human approval, then continue
- [ ] **Workflow Templates Marketplace** — Share/import community workflows

### Technical
- Service Worker for background execution
- Web Push for notification triggers
- YAML export/import for portability

---

## Phase 29: Collaborative AI Canvas

**Goal**: Real-time collaborative whiteboard with AI assistance

### Features
- [ ] **Infinite Canvas** — Drag-and-drop AI blocks, connections, annotations
- [ ] **AI Drawing Assistant** — Sketch -> diagram, hand-drawn -> clean SVG
- [ ] **Multi-cursor** — See collaborators' cursors and selections in real-time
- [ ] **AI Brainstorming** — Mind map generation from topic, auto-expand branches
- [ ] **Canvas-to-Document** — Convert canvas layout to structured document
- [ ] **Version Timeline** — Visual history of canvas changes

### Technical
- Y.js for CRDT-based collaboration
- Rough.js for hand-drawn style
- Canvas API + WebGL for performance

---

## Phase 30: Enterprise Security & Compliance

**Goal**: Enterprise-ready security features

### Features
- [ ] **SSO/SAML Integration** — Okta, Azure AD login
- [ ] **Data Retention Policies** — Auto-delete conversations after N days
- [ ] **PII Detection** — Auto-detect and redact personal information
- [ ] **Encryption at Rest** — AES-256 encryption for IndexedDB data
- [ ] **Compliance Reports** — GDPR, SOC2 compliance audit reports
- [ ] **Admin Dashboard** — User management, usage limits, policy enforcement

### Technical
- Web Crypto API for client-side encryption
- DLP (Data Loss Prevention) regex + ML patterns
- RBAC with team hierarchy

---

## Timeline & Dependencies

```
Phase 25 (RAG)         ──┐
Phase 26 (Voice)       ──┼── Parallel (independent)
Phase 27 (Analytics)   ──┘
                         │
Phase 28 (Automation)  ──── Depends on 25 (document triggers)
Phase 29 (Canvas)      ──── Depends on collab infra
Phase 30 (Enterprise)  ──── Independent (security layer)
```

## Success Metrics

| Metric | Phase 24 | Phase 30 Target |
|--------|---------|-----------------|
| Tests | 919 | 1,500+ |
| Coverage | 83% | 85%+ |
| Pages | 35 | 45+ |
| Stores | 31 | 40+ |
| LOC | 67,911 | 90,000+ |
| Offline Features | Basic | Full (RAG + Voice) |
| Enterprise Ready | No | Yes (SSO + Encryption) |

---

## Relationship with hchat-wiki

| | hchat-pwa | hchat-wiki |
|---|-----------|------------|
| Type | PWA (Single app) | Monorepo (8 apps) |
| Tech | Vite + Zustand | Next.js + Context |
| Backend | Modal (Python) | Mock/API Client |
| Purpose | Desktop AI app | Enterprise wiki + admin |
| Shared | None currently | @hchat/ui packages |
| Future | Consider shared UI lib | Consider shared types |
