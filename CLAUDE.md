# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

H Chat Desktop — AI 모델(Claude, GPT, Gemini)과 대화하는 Progressive Web App. React 19, TypeScript 5.9, Vite 7, Zustand 5, Tailwind CSS 3 기반. Phase 3 완료 — 멀티 프로바이더, 그룹 채팅, 내보내기, IndexedDB 영속성, i18n 지원.

## Commands

```bash
npm install          # Install dependencies
npm run dev          # Vite dev server (localhost:5173)
npm run build        # TypeScript check + Vite production build
npm run lint         # ESLint
npm run preview      # Preview production build locally
npm test             # Vitest unit/integration tests
npm run test:ui      # Vitest interactive UI
npm run test:coverage # Coverage report (target: 80%+)
```

## Architecture

Uses **Feature-Sliced Design (FSD)** with `@/` path alias mapping to `src/`:

```
src/
├── app/layouts/         # MainLayout — view routing dispatch, keyboard shortcuts, hydration
├── pages/               # 12 screens: home, chat, all-chats, projects, settings, quick-chat,
│                        #   group-chat, memory, swarm, schedule, project-detail
├── widgets/             # Complex feature components (message-list, prompt-input, sidebar, search)
├── entities/            # 8 Zustand stores: session, settings, project, group-chat,
│                        #   channel, memory, swarm, schedule
├── shared/
│   ├── ui/              # 11 reusable components (Button, Avatar, Toggle, etc.)
│   ├── lib/             # Utilities, Bedrock client, provider factory, Dexie DB
│   ├── lib/providers/   # Multi-provider: OpenAI, Gemini, factory, router
│   ├── i18n/            # Custom i18n system (ko/en)
│   ├── types/           # TypeScript interfaces (Message, Session, Project, etc.)
│   ├── constants.ts     # Models list, BEDROCK_MODEL_MAP, default model
│   └── styles/          # globals.css with CSS variables for light/dark theme
```

### View Routing

No React Router. Navigation is state-driven via Zustand:
- `SessionStore.view` (`ViewState` type) determines which page renders
- `MainLayout.renderContent()` dispatches based on `view` value
- Navigation through store actions: `selectSession()`, `goHome()`, `setView()`

### State Management (Zustand)

8 stores in `src/entities/`, all persisted via IndexedDB (Dexie):
- **SessionStore** — sessions, messages (keyed by sessionId), currentSessionId, view state, streaming
- **SettingsStore** — selectedModel, darkMode, sidebarOpen, credentials, language, systemPrompt
- **ProjectStore** — projects, selectedProjectId
- **GroupChatStore** — multi-model parallel chat
- **ChannelStore** — Slack/Telegram channel config (mock)
- **MemoryStore** — context memory management (mock)
- **SwarmStore** — agent orchestration (mock)
- **ScheduleStore** — scheduled tasks (mock)

### Multi-Provider System

Factory pattern in `shared/lib/providers/`:
- `factory.ts` — model ID → provider routing
- Bedrock: via Modal backend API (`VITE_API_BASE_URL`)
- OpenAI/Gemini: direct browser API calls

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
- **Endpoints**: `POST /api/chat` (SSE), `POST /api/chat/test`, `GET /api/health`
- SSE format: `data: {"type":"text|done|error", ...}\n\n`

## Deployment

- **Frontend**: Vercel (`vercel --prod`) — https://hchat-desktop.vercel.app
- **Backend**: Modal (`modal deploy backend/app.py`)
- **Env vars**: `VITE_API_BASE_URL` (empty=Vite proxy, Modal URL=production)

## Feature Status

### ✅ Functional
- Multi-provider chat (Bedrock, OpenAI, Gemini) with SSE streaming
- Group chat (multi-model parallel comparison)
- Export (Markdown, HTML, JSON, TXT)
- Full-text search across sessions/messages
- IndexedDB persistence (sessions, messages, settings)
- i18n (Korean/English)
- PWA (installable, service worker caching)
- Dark mode

### ⚠️ UI Only (Mock Backend)
- Memory panel (CRUD works, no LLM auto-extraction)
- Schedule manager (CRUD works, no cron execution)
- Agent swarm builder (CRUD works, no agent execution)
- Channel connections (config UI, no real webhooks)
