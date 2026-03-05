import { useEffect } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { X, LayoutDashboard, Plus, GripVertical, MessageSquare, BarChart3, Zap, Database, CalendarClock, Star, Eye, EyeOff } from 'lucide-react'
import { useSessionStore } from '@/entities/session/session.store'
import { useDashboardStore } from '@/entities/dashboard/dashboard.store'
import { useTranslation } from '@/shared/i18n'
import { Button } from '@/shared/ui/Button'

export function DashboardPage() {
  const { t } = useTranslation()
  const setView = useSessionStore((s) => s.setView)
  const { layouts, activeLayoutId, hydrate, selectLayout, updateWidget } = useDashboardStore(
    useShallow((s) => ({
      layouts: s.layouts,
      activeLayoutId: s.activeLayoutId,
      hydrate: s.hydrate,
      selectLayout: s.selectLayout,
      updateWidget: s.updateWidget,
    }))
  )

  useEffect(() => {
    hydrate()
  }, [hydrate])

  const activeLayout = layouts.find((l) => l.id === activeLayoutId)
  const visibleWidgets = activeLayout?.widgets.filter((w) => w.visible) || []

  return (
    <div className="flex flex-col h-full overflow-hidden bg-page">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3 border-b dark:border-zinc-700">
        <button
          onClick={() => setView('home')}
          className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded"
          aria-label={t('common.close')}
        >
          <X className="w-5 h-5" />
        </button>
        <LayoutDashboard className="w-5 h-5 text-text-primary" />
        <div className="flex-1">
          <h1 className="text-lg font-semibold text-text-primary">{t('dashboard.title')}</h1>
          <p className="text-xs text-text-secondary">{t('dashboard.subtitle')}</p>
        </div>
        <Button onClick={() => setView('home')} className="text-sm">
          <Plus className="w-4 h-4 mr-1" />
          {t('dashboard.addWidget')}
        </Button>
      </header>

      {/* Layout Selector */}
      {layouts.length > 1 && (
        <div className="flex gap-2 px-4 py-2 border-b dark:border-zinc-700">
          {layouts.map((layout) => (
            <button
              key={layout.id}
              onClick={() => selectLayout(layout.id)}
              className={`px-3 py-1 text-sm rounded transition ${
                layout.id === activeLayoutId
                  ? 'bg-blue-500 text-white'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-text-primary hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
            >
              {layout.name}
            </button>
          ))}
        </div>
      )}

      {/* Widget Grid */}
      <div className="flex-1 overflow-auto p-4">
        {visibleWidgets.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center">
            <div>
              <LayoutDashboard className="w-12 h-12 mx-auto mb-3 text-zinc-400" />
              <p className="text-text-secondary">{t('dashboard.noWidgets')}</p>
              <Button onClick={() => setView('home')} className="mt-4">
                {t('dashboard.addWidget')}
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {visibleWidgets.map((widget) => (
              <WidgetCard
                key={widget.id}
                widget={widget}
                onToggleVisibility={() =>
                  activeLayoutId && updateWidget(activeLayoutId, widget.id, { visible: !widget.visible })
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

interface WidgetCardProps {
  widget: {
    id: string
    type: string
    title: string
    visible: boolean
  }
  onToggleVisibility: () => void
}

function WidgetCard({ widget, onToggleVisibility }: WidgetCardProps) {
  const { t } = useTranslation()
  const sessions = useSessionStore((s) => s.sessions)

  const getIcon = () => {
    switch (widget.type) {
      case 'recentChats':
        return <MessageSquare className="w-5 h-5" />
      case 'usageSummary':
        return <BarChart3 className="w-5 h-5" />
      case 'quickAssistants':
        return <Zap className="w-5 h-5" />
      case 'knowledgeSummary':
        return <Database className="w-5 h-5" />
      case 'schedule':
        return <CalendarClock className="w-5 h-5" />
      case 'favorites':
        return <Star className="w-5 h-5" />
      default:
        return <LayoutDashboard className="w-5 h-5" />
    }
  }

  const getContent = () => {
    switch (widget.type) {
      case 'recentChats': {
        const recent = sessions.slice(0, 3)
        return (
          <div className="space-y-2">
            {recent.length === 0 ? (
              <p className="text-xs text-text-secondary">{t('dashboard.noRecentChats')}</p>
            ) : (
              recent.map((s) => (
                <div key={s.id} className="text-xs p-2 bg-zinc-50 dark:bg-zinc-800 rounded truncate">
                  {s.title}
                </div>
              ))
            )}
          </div>
        )
      }
      case 'usageSummary':
        return (
          <div className="text-sm">
            <div className="flex justify-between mb-2">
              <span className="text-text-secondary">{t('dashboard.totalCost')}</span>
              <span className="font-semibold">$0.00</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">{t('dashboard.tokens')}</span>
              <span className="font-semibold">0</span>
            </div>
          </div>
        )
      case 'quickAssistants':
        return (
          <div className="grid grid-cols-2 gap-2">
            <button className="p-2 text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-100 dark:hover:bg-blue-900/50">
              {t('dashboard.assistant.analyst')}
            </button>
            <button className="p-2 text-xs bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded hover:bg-green-100 dark:hover:bg-green-900/50">
              {t('dashboard.assistant.translator')}
            </button>
            <button className="p-2 text-xs bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded hover:bg-purple-100 dark:hover:bg-purple-900/50">
              {t('dashboard.assistant.coder')}
            </button>
            <button className="p-2 text-xs bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded hover:bg-orange-100 dark:hover:bg-orange-900/50">
              {t('dashboard.assistant.writer')}
            </button>
          </div>
        )
      case 'knowledgeSummary':
        return (
          <div className="text-sm">
            <div className="flex justify-between mb-2">
              <span className="text-text-secondary">{t('dashboard.documents')}</span>
              <span className="font-semibold">0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">{t('dashboard.chunks')}</span>
              <span className="font-semibold">0</span>
            </div>
          </div>
        )
      case 'schedule':
        return (
          <div className="space-y-2">
            <p className="text-xs text-text-secondary">{t('dashboard.noScheduledTasks')}</p>
          </div>
        )
      case 'favorites': {
        const favorites = sessions.filter((s) => s.isFavorite).slice(0, 3)
        return (
          <div className="space-y-2">
            {favorites.length === 0 ? (
              <p className="text-xs text-text-secondary">{t('dashboard.noFavorites')}</p>
            ) : (
              favorites.map((s) => (
                <div key={s.id} className="text-xs p-2 bg-zinc-50 dark:bg-zinc-800 rounded truncate">
                  {s.title}
                </div>
              ))
            )}
          </div>
        )
      }
      default:
        return <p className="text-xs text-text-secondary">{t('dashboard.unknownWidget')}</p>
    }
  }

  return (
    <div className="border dark:border-zinc-700 rounded-lg p-4 bg-white dark:bg-zinc-900">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <GripVertical className="w-4 h-4 text-zinc-400 cursor-move" />
          {getIcon()}
          <h3 className="text-sm font-semibold text-text-primary">{widget.title}</h3>
        </div>
        <button
          onClick={onToggleVisibility}
          className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded"
          title={widget.visible ? t('dashboard.hide') : t('dashboard.show')}
        >
          {widget.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        </button>
      </div>
      {getContent()}
    </div>
  )
}
