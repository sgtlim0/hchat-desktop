import { MessageSquare, Clock, Settings, Database, FlaskConical } from 'lucide-react'
import { useExtSessionStore } from '@ext/stores/session.store'
import type { ExtPage } from '@ext/shared/types'

const tabs: Array<{ page: ExtPage; icon: typeof MessageSquare; label: string }> = [
  { page: 'chat', icon: MessageSquare, label: '채팅' },
  { page: 'data', icon: Database, label: '데이터' },
  { page: 'research', icon: FlaskConical, label: '리서치' },
  { page: 'history', icon: Clock, label: '히스토리' },
  { page: 'settings', icon: Settings, label: '설정' },
]

export function ExtNavBar() {
  const currentPage = useExtSessionStore((s) => s.currentPage)
  const setPage = useExtSessionStore((s) => s.setPage)

  return (
    <nav className="flex items-center border-t-2 border-[var(--border)] bg-[var(--bg-page)]">
      {tabs.map(({ page, icon: Icon, label }) => {
        const isActive = currentPage === page
        return (
          <button
            key={page}
            onClick={() => setPage(page)}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors ${
              isActive
                ? 'text-[var(--primary)] bg-[var(--primary)]/5'
                : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
            }`}
          >
            <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
            <span>{label}</span>
          </button>
        )
      })}
    </nav>
  )
}
