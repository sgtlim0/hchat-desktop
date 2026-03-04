# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

H Chat Desktop — Advanced AI chat Progressive Web App supporting multi-provider models (Claude, GPT, Gemini). React 19, TypeScript 5.9, Vite 7, Zustand 5, Tailwind CSS 3. **100% complete** (70/70 TODO items + Phase 1-6 complete) with 863 tests (52 suites). Features: assistant marketplace (8 presets), document translation, document writer wizard, OCR text extraction, header tool tabs, usage category tracking, canvas/artifacts side panel, prompt chaining, knowledge base, workflow builder, realtime collaboration, agent mode, web search, debate, image gen, PDF/Excel analysis, TTS/STT, prompt library, persona system, usage tracking, ROI dashboard, folders/tags, memory, schedule, swarm, channels, guardrail, auto-routing, offline support.

## Commands

```bash
npm install               # Install dependencies
npm run dev               # Vite dev server (localhost:5173)
npm run build             # TypeScript check + Vite production build
npm run lint              # ESLint
npm run preview           # Preview production build locally
npm test                  # Vitest unit/integration tests (863 tests, 52 suites)
npm run test:ui           # Vitest interactive UI
npm run test:coverage     # Coverage report (83% stmts, 79% branches, 91% funcs, 82% lines)
npx playwright test       # E2E tests (24 tests)
```

## Architecture

Uses **Feature-Sliced Design (FSD)** with `@/` path alias mapping to `src/`:

```
src/
├── app/layouts/         # MainLayout — view routing dispatch, keyboard shortcuts, hydration
├── pages/               # 22 screens: home (marketplace), chat, all-chats, projects, settings,
│                        #   quick-chat, group-chat, memory, swarm, schedule, prompt-library,
│                        #   debate, ai-tools, image-gen, agent, translate, doc-writer, ocr,
│                        #   prompt-chain, knowledge, workflow, collab
├── widgets/             # Complex feature components (message-list, prompt-input, sidebar, search,
│                        #   header-tabs, artifact-panel)
├── entities/            # 22 Zustand stores: session, settings, project, group-chat, channel, memory,
│                        #   swarm, schedule, usage, persona, prompt-template (prompt-library), debate,
│                        #   folder, tag, toast, translate, doc-writer, artifact, prompt-chain,
│                        #   knowledge, workflow, collab
├── shared/
│   ├── ui/              # 12 reusable components (Button, Avatar, Toggle, AssistantCard, etc.)
│   ├── lib/             # Utilities, Bedrock client, provider factory, Dexie DB, token-estimator
│   ├── lib/providers/   # Multi-provider: OpenAI, Gemini, factory, router
│   ├── lib/agent/       # Agent system: XML tool parser, 4 tools (search, memory, schedule, file)
│   ├── constants/       # assistants.ts (8 assistant presets, categories)
│   ├── i18n/            # Custom i18n system (ko/en)
│   ├── types/           # TypeScript interfaces (Message, Session, Project, Memory, Agent, etc.)
│   ├── constants.ts     # Models list, BEDROCK_MODEL_MAP, PROVIDER_COLORS, default model
│   └── styles/          # globals.css with CSS variables for light/dark theme
```

### View Routing

No React Router. Navigation is state-driven via Zustand:
- `SessionStore.view` (`ViewState` type) determines which page renders
- `ViewState` = `'home' | 'chat' | 'settings' | 'allChats' | 'projects' | 'projectDetail' | 'quickChat' | 'memory' | 'agentSwarm' | 'schedule' | 'groupChat' | 'promptLibrary' | 'debate' | 'aiTools' | 'imageGen' | 'agent' | 'translate' | 'docWriter' | 'ocr' | 'promptChain' | 'knowledgeBase' | 'workflow' | 'collab'`
- `MainLayout.renderContent()` dispatches based on `view` value
- Navigation through store actions: `selectSession()`, `goHome()`, `setView()`

### State Management (Zustand)

22 stores in `src/entities/`, all persisted via IndexedDB (Dexie v5):
- **SessionStore** — sessions, messages (keyed by sessionId), currentSessionId, view state, streaming, folders/tags
- **SettingsStore** — selectedModel, darkMode, sidebarOpen, credentials, language, systemPrompt, monthlyBudget, thinkingDepth
- **ProjectStore** — projects, selectedProjectId
- **GroupChatStore** — multi-model parallel chat
- **ChannelStore** — Slack/Telegram channel config + webhook notifications
- **MemoryStore** — context memory management + auto-extraction
- **SwarmStore** — agent orchestration + SSE execution
- **ScheduleStore** — scheduled tasks + async execution
- **UsageStore** — token usage tracking, cost calculation, ROI metrics, category tracking (chat/translate/doc-write/ocr/image-gen/data-analysis)
- **PersonaStore** — persona presets (assistant, tutor, coder, analyst, creative) + custom CRUD
- **PromptTemplateStore** (prompt-library) — template CRUD, `{{variable}}` rendering, categories
- **DebateStore** — cross-model debate sessions, 3-round auto-debate, consensus summary
- **FolderStore** — folder CRUD, color coding, sidebar filtering
- **TagStore** — tag CRUD, color tags, multi-select
- **ToastStore** — toast notifications (success, error, warning, info)
- **TranslateStore** — document translation workflow (LLM/browser engine, file upload, batch processing, progress tracking)
- **DocWriterStore** — 5-step document wizard (project setup, context, AI outline, section content, export MD/TXT)
- **ArtifactStore** — canvas/artifacts side panel (code/HTML/SVG/Mermaid CRUD, versions, panel state, resize)
- **PromptChainStore** — prompt chaining (sequential execution, condition branching, step results)
- **KnowledgeStore** — knowledge base (document upload, auto-chunking, keyword search, categories)
- **WorkflowStore** — workflow builder (block pipeline, 6 block types, 3 triggers, templates)
- **CollabStore** — realtime collaboration (room management, invite codes, chat messages, typing indicators)

### Multi-Provider System

Factory pattern in `shared/lib/providers/`:
- `factory.ts` — model ID → provider routing
- **Bedrock**: via Modal backend API (`POST /api/chat` SSE)
- **OpenAI/Gemini**: via Modal backend proxy (`POST /api/openai/chat`, `POST /api/gemini/chat` SSE) when `VITE_API_BASE_URL` is set, OR direct browser API calls (fallback)
- Auto-routing: `model-router.ts` analyzes prompt intent and recommends optimal model

### Message Model

Messages use a segment-based structure:
```typescript
interface Message {
  segments: MessageSegment[]  // Array of { type: 'text' | 'tool', content?, toolCalls? }
  role: 'user' | 'assistant'
  attachments?: ImageAttachment[]
}
```

### Keyboard Shortcuts (MainLayout)

- `Cmd/Ctrl+K` — Search modal
- `Cmd/Ctrl+B` — Toggle sidebar
- `Cmd/Ctrl+,` — Toggle settings

## Backend (Modal)

Python + FastAPI serverless backend on Modal (modal.com):

```bash
modal serve backend/app.py     # Local dev server
modal deploy backend/app.py    # Production deploy
```

- **Production**: https://sgtlim0--hchat-api-api.modal.run
- **Endpoints**:
  - `POST /api/chat` — Bedrock SSE streaming (Claude models)
  - `POST /api/chat/test` — Bedrock API connection test
  - `GET /api/health` — Health check
  - `POST /api/search` — DuckDuckGo web search proxy
  - `POST /api/extract-memory` — LLM-based context extraction (Bedrock Haiku)
  - `POST /api/schedule/execute` — Async scheduled prompt execution
  - `POST /api/swarm/execute` — Multi-agent SSE pipeline
  - `POST /api/channels/notify` — Slack webhook + Telegram Bot API
  - `POST /api/openai/chat` — OpenAI SSE proxy (API key in Modal Secrets)
  - `POST /api/gemini/chat` — Gemini SSE proxy (API key in Modal Secrets)
- **Dependencies**: boto3, fastapi[standard], duckduckgo-search, httpx, openai, google-genai
- **SSE format**: `data: {"type":"text|done|error|usage", ...}\n\n`
- **Secrets** (optional): `modal secret create hchat-api-keys OPENAI_API_KEY=sk-... GEMINI_API_KEY=...`

## Deployment

- **Frontend**: Vercel (`vercel --prod`) — https://hchat-desktop.vercel.app
- **Backend**: Modal (`modal deploy backend/app.py`)
- **Env vars**: `VITE_API_BASE_URL` (empty=Vite proxy, Modal URL=production)
- **Secrets setup** (optional, for OpenAI/Gemini proxy):
  ```bash
  modal secret create hchat-api-keys \
    OPENAI_API_KEY=sk-proj-... \
    GEMINI_API_KEY=AIza...
  ```
  Then uncomment `secrets=[modal.Secret.from_name("hchat-api-keys")]` in `backend/app.py`

## Feature Status

**All features fully functional (100% complete + Phase 1-6 complete):**

### Assistant Marketplace (Phase 1)
- 8 official assistant presets (analyst, quickChat, docReview, translator, reportWriter, codeReviewer, dataAnalyst, emailWriter)
- 8 category filters (all, chat, work, translate, analyze, report, image, writing)
- Official / My Assistants tab toggle (persona system integration)
- One-click session creation with model + system prompt

### Document Tools (Phase 2-3)
- Document translation workflow (file upload, LLM/browser engine, batch processing, progress tracking, download)
- Document writer wizard (5-step: project setup, context, AI outline generation, section content, export MD/TXT)
- OCR text extraction (tesseract.js, image upload, batch processing, download results)
- Header tool tabs (quick navigation: chat/translate/doc-writer/ocr)

### Usage Tracking Extension (Phase 4)
- Category-based usage tracking (chat, translate, doc-write, ocr, image-gen, data-analysis)
- Category filter in Settings > Usage tab
- Per-category cost and token breakdown charts

### Canvas / Artifacts (Phase 5)
- Code/HTML/SVG/Mermaid side panel preview (Claude Artifacts style)
- Auto-detection after streaming (5+ line code blocks, HTML/SVG/Mermaid immediate)
- "Open in Canvas" button on code blocks
- Sandboxed iframe for HTML/SVG (XSS sanitized)
- Mermaid diagram lazy import (~1.5MB on demand)
- Version history navigation, drag resize (320-960px), mobile overlay
- Artifact selector dropdown, download/copy

### Productivity Automation (Phase 6)
- Prompt chaining (sequential chain execution, step result auto-linking, IF-THEN-ELSE condition branching)
- Knowledge base (document upload, auto-chunking ~500 chars, keyword search, tag/category management)
- Workflow builder (no-code block pipeline editor, 6 block types, 3 triggers, template gallery)
- Realtime collaboration (room create/join, invite code sharing, chat messages, host/participant roles)

### Core Chat
- Multi-provider chat (Bedrock, OpenAI, Gemini) with SSE streaming
- Group chat (multi-model parallel comparison)
- Quick chat (one-shot prompt without session)
- Agent mode (XML tool calls: search, memory, schedule, file)
- Auto-routing (prompt intent analysis → model recommendation)
- Message fork (branch conversation from any message)

### AI Features
- Web search (DuckDuckGo proxy, RAG integration)
- AI tools panel (11 writing tools + grammar check + summarize + doc health)
- Debate mode (2-3 models, 3-round auto-debate, consensus summary)
- Prompt library (CRUD, `{{variable}}` templates, categories)
- Persona system (5 presets + custom CRUD, system prompt injection)
- TTS (Web Speech API, read-aloud button)
- STT (Web Speech Recognition, microphone input)
- AI summarization (LLM-based chat summary)
- Thinking depth (fast/balanced/deep modes)
- AI guardrail (sensitive data detection, warning/masking)

### Data & Analysis
- PDF chat (pdfjs-dist text extraction, system prompt injection)
- Excel/CSV analysis (SheetJS parsing, AI analysis)
- Image generation (DALL-E 3 integration)
- Usage tracking (token estimation, cost calculation, real-time tracking)
- ROI dashboard (provider/model cost breakdown, productivity metrics)

### Organization & Data
- Export (Markdown, HTML, JSON, TXT, PDF)
- Import (JSON, ChatGPT/Claude format auto-detection)
- Folders (CRUD, color coding, sidebar filtering)
- Tags (CRUD, color tags, multi-select)
- Storage management (IndexedDB analysis, cleanup)
- Full-text search (sessions/messages)
- Memory (CRUD + LLM auto-extraction)
- Schedule (CRUD + async execution)
- Swarm (multi-agent orchestration + SSE execution)
- Channels (Slack/Telegram config + webhook notifications)

### UX & Quality
- IndexedDB persistence (all 22 stores, backup/restore)
- i18n (Korean/English)
- PWA (installable, service worker caching)
- Dark mode (CSS variables, comprehensive theming)
- Offline support (network status detection, banner, button disable)
- Message virtualization (react-window for 50+ messages)
- Budget warning (monthly budget, 70% threshold alert)
- Toast notifications (success, error, warning, info)
- Accessibility (focus-trap, skip-to-content, ARIA, WCAG AA contrast)
- Mobile responsive (sidebar overlay, auto-close)
- Keyboard shortcuts (Cmd/Ctrl+K, Cmd/Ctrl+B, Cmd/Ctrl+,)
