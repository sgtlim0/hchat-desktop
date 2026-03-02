# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

H Chat Desktop — a Progressive Web App chat interface for AI models (Claude Opus, Sonnet, Haiku). Built with React 19, TypeScript, Vite 7, Zustand, and Tailwind CSS 3. Currently Phase 1 (frontend only with mock data, no backend API integration).

## Commands

```bash
npm install          # Install dependencies
npm run dev          # Vite dev server (localhost:5173)
npm run build        # TypeScript check + Vite production build
npm run lint         # ESLint
npm run preview      # Preview production build locally
```

No test framework is configured yet.

## Architecture

Uses **Feature-Sliced Design (FSD)** with `@/` path alias mapping to `src/`:

```
src/
├── app/layouts/         # MainLayout — view routing dispatch, keyboard shortcuts
├── pages/               # 8 screens: home, chat, all-chats, projects, settings, quick-chat
├── widgets/             # Complex feature components (message-list, prompt-input, sidebar, search)
├── entities/            # Zustand stores: session, settings, project
├── shared/
│   ├── ui/              # 11 reusable components (Button, Avatar, Toggle, etc.)
│   ├── lib/             # Utilities: mock-data, model-meta, time formatting
│   ├── types/           # TypeScript interfaces (Message, Session, Project, etc.)
│   ├── constants.ts     # Models list, default model, layout constants
│   └── styles/          # globals.css with CSS variables for light/dark theme
```

### View Routing

No React Router. Navigation is state-driven via Zustand:
- `SessionStore.view` (`ViewState` type) determines which page renders
- `MainLayout.renderContent()` dispatches based on `view` value
- Navigation through store actions: `selectSession()`, `goHome()`, `setView()`

### State Management (Zustand)

Three stores in `src/entities/`:
- **SessionStore** — sessions, messages (keyed by sessionId), currentSessionId, view state
- **SettingsStore** — selectedModel, darkMode, sidebarOpen, settingsOpen
- **ProjectStore** — projects, selectedProjectId

### Message Model

Messages use a segment-based structure:
```typescript
interface Message {
  segments: MessageSegment[]  // Array of { type: 'text' | 'tool', content?, toolCalls? }
  role: 'user' | 'assistant'
  attachments?: ImageAttachment[]
}
```

### Theming

CSS variables in `globals.css` with `.dark` class toggle. Tailwind extends custom colors mapped to these variables (primary, page, sidebar, card, text-primary, text-secondary, border, etc.).

### Keyboard Shortcuts (MainLayout)

- `Cmd/Ctrl+K` — Search modal
- `Cmd/Ctrl+B` — Toggle sidebar
- `Cmd/Ctrl+,` — Toggle settings

## Deployment

GitHub Actions deploys to GitHub Pages on push to `main`. Base path switches via `GITHUB_PAGES` env var in `vite.config.ts` (`/hchat-desktop/` for Pages, `/` otherwise).

## Current Limitations (Phase 1)

- All data is mock (no API calls, no persistence)
- Search UI exists but not wired to real filtering
- Tool call display only (no execution)
- File upload UI exists but not functional
- Data lost on page refresh
