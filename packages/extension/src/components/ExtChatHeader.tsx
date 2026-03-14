import { Plus } from 'lucide-react'
import { useTranslation } from '@hchat/shared'
import { useExtSessionStore } from '@ext/stores/session.store'
import { useExtSettingsStore } from '@ext/stores/settings.store'
import { ExtModelSelector } from './ExtModelSelector'

export function ExtChatHeader() {
  const { t } = useTranslation()
  const currentSessionId = useExtSessionStore((s) => s.currentSessionId)
  const sessions = useExtSessionStore((s) => s.sessions)
  const createSession = useExtSessionStore((s) => s.createSession)
  const selectedModel = useExtSettingsStore((s) => s.selectedModel)

  const currentSession = sessions.find((s) => s.id === currentSessionId)
  const title = currentSession?.title ?? t('session.newChat')

  return (
    <header className="flex items-center gap-2 px-3 py-2 border-b border-[var(--border)] bg-[var(--bg-page)]">
      <ExtModelSelector />
      <span className="flex-1 text-xs font-medium text-[var(--text-primary)] truncate">
        {title}
      </span>
      <button
        onClick={() => createSession(selectedModel)}
        className="p-1.5 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] transition-colors"
        title={t('sidebar.newChat')}
      >
        <Plus size={16} />
      </button>
    </header>
  )
}
