// @ts-nocheck
import { useState, useEffect } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { ArrowLeft, Plus, Trash2, LayoutDashboard, BarChart3, Table, Hash, Type, Eye, EyeOff } from 'lucide-react'
import { useSessionStore } from '@/entities/session/session.store'
import { useDashboardBuilderStore } from '@/entities/dashboard-builder/dashboard-builder.store'
import { useTranslation } from '@/shared/i18n'
import { Button } from '@/shared/ui/Button'

const WIDGET_TYPES = ['chart', 'table', 'kpi', 'text'] as const
type WidgetType = (typeof WIDGET_TYPES)[number]

const WIDGET_ICONS: Record<WidgetType, typeof BarChart3> = {
  chart: BarChart3,
  table: Table,
  kpi: Hash,
  text: Type,
}

const WIDGET_COLORS: Record<WidgetType, string> = {
  chart: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  table: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  kpi: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
  text: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
}

export function DashboardBuilderPage() {
  const { t } = useTranslation()
  const setView = useSessionStore((s) => s.setView)
  const {
    dashboards,
    selectedDashboardId,
    hydrate,
    createDashboard,
    deleteDashboard,
    selectDashboard,
    togglePublic,
    addWidget,
    removeWidget,
    updateWidget,
  } = useDashboardBuilderStore(
    useShallow((s) => ({
      dashboards: s.dashboards,
      selectedDashboardId: s.selectedDashboardId,
      hydrate: s.hydrate,
      createDashboard: s.createDashboard,
      deleteDashboard: s.deleteDashboard,
      selectDashboard: s.selectDashboard,
      togglePublic: s.togglePublic,
      addWidget: s.addWidget,
      removeWidget: s.removeWidget,
      updateWidget: s.updateWidget,
    }))
  )

  const [showModal, setShowModal] = useState(false)
  const [newName, setNewName] = useState('')
  const [showWidgetModal, setShowWidgetModal] = useState(false)
  const [widgetTitle, setWidgetTitle] = useState('')
  const [widgetType, setWidgetType] = useState<WidgetType>('chart')

  useEffect(() => {
    hydrate()
  }, [hydrate])

  const selected = dashboards.find((d) => d.id === selectedDashboardId) ?? null

  function handleCreate() {
    if (!newName.trim()) return
    createDashboard(newName.trim())
    setShowModal(false)
    setNewName('')
  }

  function handleDelete(id: string) {
    if (confirm(t('dashboardBuilder.deleteConfirm'))) {
      deleteDashboard(id)
    }
  }

  function handleAddWidget() {
    if (!selected || !widgetTitle.trim()) return
    addWidget(selected.id, widgetType, widgetTitle.trim())
    setShowWidgetModal(false)
    setWidgetTitle('')
    setWidgetType('chart')
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3 border-b dark:border-zinc-700">
        <button
          onClick={() => setView('home')}
          className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded"
          aria-label={t('common.back')}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <LayoutDashboard className="w-5 h-5" />
        <div className="flex-1">
          <h1 className="text-lg font-semibold">{t('dashboardBuilder.title')}</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{t('dashboardBuilder.subtitle')}</p>
        </div>
        <Button onClick={() => setShowModal(true)} className="flex items-center gap-1">
          <Plus className="w-4 h-4" />
          {t('dashboardBuilder.newDashboard')}
        </Button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel: Dashboard List */}
        <div className="w-72 border-r dark:border-zinc-700 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-auto">
            {dashboards.length === 0 ? (
              <div className="flex items-center justify-center h-full text-center p-4">
                <div>
                  <LayoutDashboard className="w-10 h-10 mx-auto mb-2 text-zinc-400" />
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">{t('dashboardBuilder.empty')}</p>
                </div>
              </div>
            ) : (
              <div className="divide-y dark:divide-zinc-700">
                {dashboards.map((dashboard) => (
                  <button
                    key={dashboard.id}
                    onClick={() => selectDashboard(dashboard.id)}
                    className={`w-full text-left p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 group ${
                      selectedDashboardId === dashboard.id ? 'bg-zinc-100 dark:bg-zinc-800' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium truncate flex-1">{dashboard.name}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(dashboard.id) }}
                        className="p-0.5 opacity-0 group-hover:opacity-100 hover:text-red-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      {dashboard.isPublic ? (
                        <Eye className="w-3 h-3 text-green-500" />
                      ) : (
                        <EyeOff className="w-3 h-3 text-zinc-400" />
                      )}
                      <span className="text-xs text-zinc-400">
                        {t('dashboardBuilder.widgetCount').replace('{count}', String(dashboard.widgets.length))}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Widget Grid */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {selected ? (
            <>
              {/* Dashboard toolbar */}
              <div className="flex items-center gap-2 px-4 py-2 border-b dark:border-zinc-700">
                <h2 className="text-sm font-semibold flex-1">{selected.name}</h2>
                <button
                  onClick={() => togglePublic(selected.id)}
                  className={`flex items-center gap-1 px-2 py-1 text-xs rounded border ${
                    selected.isPublic
                      ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                      : 'border-zinc-300 dark:border-zinc-600 text-zinc-500'
                  }`}
                >
                  {selected.isPublic ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                  {selected.isPublic ? t('dashboardBuilder.public') : t('dashboardBuilder.private')}
                </button>
                <Button size="sm" onClick={() => setShowWidgetModal(true)}>
                  <Plus className="w-4 h-4 mr-1" />
                  {t('dashboardBuilder.addWidget')}
                </Button>
              </div>

              {/* Widget grid */}
              <div className="flex-1 overflow-auto p-4">
                {selected.widgets.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-center">
                    <div>
                      <LayoutDashboard className="w-12 h-12 mx-auto mb-3 text-zinc-300 dark:text-zinc-600" />
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">{t('dashboardBuilder.noWidgets')}</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    {selected.widgets.map((widget) => {
                      const Icon = WIDGET_ICONS[widget.type as WidgetType] ?? BarChart3
                      return (
                        <div
                          key={widget.id}
                          className="border dark:border-zinc-700 rounded-lg p-4 bg-white dark:bg-zinc-900"
                        >
                          <div className="flex items-center gap-2 mb-3">
                            <span className={`p-1.5 rounded ${WIDGET_COLORS[widget.type as WidgetType] ?? WIDGET_COLORS.chart}`}>
                              <Icon className="w-4 h-4" />
                            </span>
                            <input
                              type="text"
                              value={widget.title}
                              onChange={(e) => updateWidget(selected.id, widget.id, { title: e.target.value })}
                              className="flex-1 text-sm font-medium bg-transparent outline-none"
                            />
                            <button
                              onClick={() => removeWidget(selected.id, widget.id)}
                              className="p-1 text-zinc-400 hover:text-red-500"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div className="h-32 bg-zinc-50 dark:bg-zinc-800 rounded flex items-center justify-center text-xs text-zinc-400">
                            {(t as any)(`dashboardBuilder.widgetType.${widget.type}`)}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-center">
              <div>
                <LayoutDashboard className="w-12 h-12 mx-auto mb-3 text-zinc-300 dark:text-zinc-600" />
                <p className="text-zinc-500 dark:text-zinc-400">{t('dashboardBuilder.selectDashboard')}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Dashboard Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl w-full max-w-md p-6 m-4">
            <h2 className="text-lg font-semibold mb-4">{t('dashboardBuilder.newDashboard')}</h2>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={t('dashboardBuilder.namePlaceholder')}
              className="w-full px-3 py-2 border dark:border-zinc-700 rounded dark:bg-zinc-800"
            />
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="secondary" onClick={() => { setShowModal(false); setNewName('') }}>
                {t('common.cancel')}
              </Button>
              <Button onClick={handleCreate}>{t('common.save')}</Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Widget Modal */}
      {showWidgetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl w-full max-w-md p-6 m-4">
            <h2 className="text-lg font-semibold mb-4">{t('dashboardBuilder.addWidget')}</h2>
            <div className="space-y-3">
              <input
                type="text"
                value={widgetTitle}
                onChange={(e) => setWidgetTitle(e.target.value)}
                placeholder={t('dashboardBuilder.widgetTitlePlaceholder')}
                className="w-full px-3 py-2 border dark:border-zinc-700 rounded dark:bg-zinc-800"
              />
              <div className="grid grid-cols-2 gap-2">
                {WIDGET_TYPES.map((wt) => {
                  const Icon = WIDGET_ICONS[wt]
                  return (
                    <button
                      key={wt}
                      onClick={() => setWidgetType(wt)}
                      className={`flex items-center gap-2 px-3 py-2 rounded border text-sm ${
                        widgetType === wt
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                          : 'border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {(t as any)(`dashboardBuilder.widgetType.${wt}`)}
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="secondary" onClick={() => { setShowWidgetModal(false); setWidgetTitle('') }}>
                {t('common.cancel')}
              </Button>
              <Button onClick={handleAddWidget}>{t('common.save')}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
