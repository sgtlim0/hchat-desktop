import { useState, useMemo } from 'react'
import { Trash2, Search, MessageCircle } from 'lucide-react'
import { MODELS, PROVIDER_COLORS } from '@hchat/shared'

interface HistorySession {
  id: string
  title: string
  modelId: string
  lastMessage?: string
  createdAt: string
}

interface HistoryViewProps {
  onResume: (sessionId: string) => void
}

function loadSessions(): HistorySession[] {
  try {
    const raw = localStorage.getItem('hchat-sessions')
    return raw ? JSON.parse(raw) as HistorySession[] : []
  } catch {
    return []
  }
}

function saveSessions(sessions: HistorySession[]) {
  localStorage.setItem('hchat-sessions', JSON.stringify(sessions))
}

export function HistoryView({ onResume }: HistoryViewProps) {
  const [sessions, setSessions] = useState<HistorySession[]>(loadSessions)
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    if (!search.trim()) return sessions
    const q = search.toLowerCase()
    return sessions.filter(
      s => s.title.toLowerCase().includes(q) || s.lastMessage?.toLowerCase().includes(q),
    )
  }, [sessions, search])

  function handleDelete(id: string) {
    const updated = sessions.filter(s => s.id !== id)
    setSessions(updated)
    saveSessions(updated)
  }

  if (sessions.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-slate-400">
        <MessageCircle className="h-10 w-10" />
        <p className="text-sm">No chat history yet</p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 border-b border-slate-200 px-3 py-2 dark:border-slate-700">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search history..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-xs
              text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-400
              dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.map(session => {
          const model = MODELS.find(m => m.id === session.modelId)
          const color = model ? PROVIDER_COLORS[model.provider] : '#888'

          return (
            <button
              key={session.id}
              onClick={() => onResume(session.id)}
              className="flex w-full items-start gap-2 border-b border-slate-100 px-3 py-2.5 text-left
                transition-colors hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                  {session.title}
                </p>
                <div className="mt-0.5 flex items-center gap-2">
                  {model && (
                    <span
                      className="rounded-full px-1.5 py-0.5 text-[9px] font-medium text-white"
                      style={{ backgroundColor: color }}
                    >
                      {model.shortLabel}
                    </span>
                  )}
                  <span className="text-[10px] text-slate-400">
                    {new Date(session.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <button
                onClick={e => {
                  e.stopPropagation()
                  handleDelete(session.id)
                }}
                className="shrink-0 rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-500
                  dark:hover:bg-red-900/20"
                title="Delete"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </button>
          )
        })}
      </div>
    </div>
  )
}
