import { MessageSquare, Languages, FileText, ScanLine } from 'lucide-react'
import { useSessionStore } from '@/entities/session/session.store'
import { useTranslation } from '@/shared/i18n'
import type { ViewState } from '@/shared/types'
import type { LucideIcon } from 'lucide-react'

interface HeaderTab {
  id: string
  labelKey: string
  icon: LucideIcon
  view: ViewState
}

const HEADER_TABS: HeaderTab[] = [
  { id: 'chat', labelKey: 'headerTab.assistant', icon: MessageSquare, view: 'home' },
  { id: 'translate', labelKey: 'headerTab.translate', icon: Languages, view: 'translate' },
  { id: 'docWriter', labelKey: 'headerTab.docWriter', icon: FileText, view: 'docWriter' },
  { id: 'ocr', labelKey: 'headerTab.ocr', icon: ScanLine, view: 'ocr' },
]

const TOOL_VIEWS = new Set<ViewState>(['home', 'translate', 'docWriter', 'ocr'])

export function HeaderTabs() {
  const { t } = useTranslation()
  const view = useSessionStore((s) => s.view)
  const setView = useSessionStore((s) => s.setView)

  // Only show tabs on tool-related views
  if (!TOOL_VIEWS.has(view)) return null

  return (
    <div className="flex items-center gap-1 px-4 py-2 border-b border-border bg-surface overflow-x-auto flex-shrink-0">
      {HEADER_TABS.map((tab) => {
        const Icon = tab.icon
        const isActive = view === tab.view
        return (
          <button
            key={tab.id}
            onClick={() => setView(tab.view)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
              isActive
                ? 'bg-primary/10 text-primary'
                : 'text-text-secondary hover:bg-hover hover:text-text-primary'
            }`}
          >
            <Icon size={16} />
            {t(tab.labelKey as any)}
          </button>
        )
      })}
    </div>
  )
}
