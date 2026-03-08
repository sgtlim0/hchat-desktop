import { create } from 'zustand'
import { useSettingsStore } from '@/entities/settings/settings.store'
import { BEDROCK_MODEL_MAP } from '@/shared/constants'

const API_BASE = import.meta.env.VITE_API_BASE_URL || ''

export interface ResearchSource {
  url: string
  title: string
  score: number
}

export interface ResearchSession {
  id: string
  query: string
  status: 'idle' | 'running' | 'done' | 'error'
  queries: string[]
  sources: ResearchSource[]
  report: string
  error?: string
  createdAt: string
}

interface ResearchSSEEvent {
  type: string
  query?: string
  queries?: string[]
  step?: string
  message?: string
  totalResults?: number
  results?: Array<{ title: string; url: string; snippet: string }>
  count?: number
  sources?: ResearchSource[]
  content?: string
  error?: string
}

interface ResearchState {
  sessions: ResearchSession[]
  currentSessionId: string | null
  isResearching: boolean

  startResearch: (query: string, depth?: number, maxSources?: number) => Promise<void>
  cancelResearch: () => void
  clearSession: (id: string) => void
  clearAll: () => void
}

let abortController: AbortController | null = null

export const useResearchStore = create<ResearchState>((set, get) => ({
  sessions: [],
  currentSessionId: null,
  isResearching: false,

  startResearch: async (query, depth = 1, maxSources = 5) => {
    const { credentials, selectedModel } = useSettingsStore.getState()
    if (!credentials?.accessKeyId || !credentials?.secretAccessKey) return

    const modelId = BEDROCK_MODEL_MAP[selectedModel] ?? selectedModel
    const sessionId = `research-${Date.now()}`

    const session: ResearchSession = {
      id: sessionId,
      query,
      status: 'running',
      queries: [],
      sources: [],
      report: '',
      createdAt: new Date().toISOString(),
    }

    set((state) => ({
      sessions: [session, ...state.sessions],
      currentSessionId: sessionId,
      isResearching: true,
    }))

    abortController = new AbortController()

    try {
      const response = await fetch(`${API_BASE}/api/research/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, credentials, modelId, depth, maxSources }),
        signal: abortController.signal,
      })

      if (!response.ok || !response.body) {
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === sessionId ? { ...s, status: 'error' as const, error: `HTTP ${response.status}` } : s,
          ),
          isResearching: false,
        }))
        return
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed.startsWith('data: ')) continue

          try {
            const event: ResearchSSEEvent = JSON.parse(trimmed.slice(6))

            if (event.type === 'research_queries' && event.queries) {
              set((state) => ({
                sessions: state.sessions.map((s) =>
                  s.id === sessionId ? { ...s, queries: event.queries! } : s,
                ),
              }))
            }

            if (event.type === 'research_evidence' && event.sources) {
              set((state) => ({
                sessions: state.sessions.map((s) =>
                  s.id === sessionId ? { ...s, sources: event.sources! } : s,
                ),
              }))
            }

            if (event.type === 'research_report' && event.content) {
              set((state) => ({
                sessions: state.sessions.map((s) =>
                  s.id === sessionId ? { ...s, report: event.content! } : s,
                ),
              }))
            }

            if (event.type === 'research_status' && event.message) {
              // Status updates available for UI progress display
            }

            if (event.type === 'done') {
              set((state) => ({
                sessions: state.sessions.map((s) =>
                  s.id === sessionId ? { ...s, status: 'done' as const } : s,
                ),
                isResearching: false,
              }))
            }

            if (event.type === 'error') {
              set((state) => ({
                sessions: state.sessions.map((s) =>
                  s.id === sessionId ? { ...s, status: 'error' as const, error: event.error } : s,
                ),
                isResearching: false,
              }))
            }
          } catch {
            // Skip malformed JSON
          }
        }
      }

      reader.releaseLock()
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === sessionId
              ? { ...s, status: 'error' as const, error: (err as Error).message }
              : s,
          ),
          isResearching: false,
        }))
      }
    }
  },

  cancelResearch: () => {
    abortController?.abort()
    abortController = null
    const { currentSessionId } = get()
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === currentSessionId ? { ...s, status: 'idle' as const } : s,
      ),
      isResearching: false,
    }))
  },

  clearSession: (id) => {
    set((state) => ({
      sessions: state.sessions.filter((s) => s.id !== id),
      currentSessionId: state.currentSessionId === id ? null : state.currentSessionId,
    }))
  },

  clearAll: () => {
    set({ sessions: [], currentSessionId: null, isResearching: false })
  },
}))
