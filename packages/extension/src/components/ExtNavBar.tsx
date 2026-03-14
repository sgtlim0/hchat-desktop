import { MessageSquare, Clock, BookOpen, Settings } from 'lucide-react'
import { useTranslation } from '@hchat/shared'
import { useExtSessionStore } from '@ext/stores/session.store'
import type { ExtPage } from '@ext/shared/types'

const tabs: Array<{ page: ExtPage; icon: typeof MessageSquare; labelKey: string }> = [
  { page: 'chat', icon: MessageSquare, labelKey: 'sidebar.newChat' },
  { page: 'history', icon: Clock, labelKey: 'allChats.title' },
  { page: 'promptLibrary', icon: BookOpen, labelKey: 'promptLib.title' },
  { page: 'settings', icon: Settings, labelKey: 'settings.title' },
]

export function ExtNavBar() {
  const { t } = useTranslation()
  const currentPage = useExtSessionStore((s) => s.currentPage)
  const setPage = useExtSessionStore((s) => s.setPage)

  return (
    <nav className="flex items-center border-t border-[var(--border)] bg-[var(--bg-page)]">
      {tabs.map(({ page, icon: Icon, labelKey }) => {
        const isActive = currentPage === page
        return (
          <button
            key={page}
            onClick={() => setPage(page)}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-[10px] transition-colors ${
              isActive
                ? 'text-[var(--primary)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
            <span>{t(labelKey as Parameters<typeof t>[0])}</span>
          </button>
        )
      })}
    </nav>
  )
}
