import { Trash2 } from 'lucide-react'
import { useTranslation, MODELS } from '@hchat/shared'
import { useExtSessionStore } from '@ext/stores/session.store'

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'now'
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  return `${days}d`
}

interface ExtSessionListProps {
  searchQuery?: string
}

export function ExtSessionList({ searchQuery }: ExtSessionListProps) {
  const { t } = useTranslation()
  const sessions = useExtSessionStore((s) => s.sessions)
  const selectSession = useExtSessionStore((s) => s.selectSession)
  const deleteSession = useExtSessionStore((s) => s.deleteSession)
  const currentSessionId = useExtSessionStore((s) => s.currentSessionId)

  const filtered = searchQuery
    ? sessions.filter(
        (s) =>
          s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (s.lastMessage ?? '').toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : sessions

  if (filtered.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-[var(--text-tertiary)]">
        {searchQuery ? t('common.noResults') : t('ext.noSessions')}
      </div>
    )
  }

  return (
    <div className="space-y-0.5">
      {filtered.map((session) => {
        const model = MODELS.find((m) => m.id === session.modelId)
        const isActive = session.id === currentSessionId
        return (
          <div
            key={session.id}
            className={`group flex items-start gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
              isActive
                ? 'bg-[var(--primary)]/10 border border-[var(--primary)]/20'
                : 'hover:bg-[var(--bg-hover)]'
            }`}
            onClick={() => selectSession(session.id)}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-medium truncate">
                  {session.title}
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] text-[var(--text-tertiary)]">
                  {model?.shortLabel ?? session.modelId}
                </span>
                <span className="text-[10px] text-[var(--text-tertiary)]">
                  {formatRelativeTime(session.updatedAt)}
                </span>
              </div>
              {session.lastMessage && (
                <p className="text-xs text-[var(--text-secondary)] truncate mt-0.5">
                  {session.lastMessage}
                </p>
              )}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation()
                deleteSession(session.id)
              }}
              className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-[var(--danger)]/10 text-[var(--text-tertiary)] hover:text-[var(--danger)] transition-all"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
