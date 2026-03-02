import { CalendarClock, Plus, Play, Pause, Trash2, CheckCircle2, AlertCircle } from 'lucide-react'
import { useScheduleStore } from '@/entities/schedule/schedule.store'
import { Button } from '@/shared/ui/Button'
import { MODELS } from '@/shared/constants'
import { useTranslation } from '@/shared/i18n'
import type { ScheduleStatus } from '@/shared/types'

type FilterTab = 'all' | ScheduleStatus

function statusDot(status: ScheduleStatus): string {
  switch (status) {
    case 'active': return 'bg-green-500'
    case 'paused': return 'bg-yellow-500'
    case 'completed': return 'bg-blue-500'
    case 'failed': return 'bg-red-500'
  }
}

export function ScheduleManager() {
  const { t } = useTranslation()
  const { filterTab, setFilterTab, togglePause, deleteSchedule, filteredSchedules, stats } = useScheduleStore()

  const FILTER_TABS: { id: FilterTab; label: string }[] = [
    { id: 'all', label: t('schedule.all') },
    { id: 'active', label: t('schedule.active') },
    { id: 'paused', label: t('schedule.paused') },
    { id: 'completed', label: t('schedule.completed') },
    { id: 'failed', label: t('schedule.failed') },
  ]

  function statusText(status: ScheduleStatus): string {
    const map: Record<ScheduleStatus, string> = {
      active: t('schedule.active'),
      paused: t('schedule.paused'),
      completed: t('schedule.completed'),
      failed: t('schedule.failed'),
    }
    return map[status]
  }
  const schedules = filteredSchedules()
  const { active, paused, completed } = stats()

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <CalendarClock size={18} className="text-primary" />
            </div>
            <h1 className="text-xl font-bold text-text-primary">{t('schedule.title')}</h1>
          </div>
          <Button variant="primary" size="sm" className="gap-1.5">
            <Plus size={14} />
            {t('schedule.new')}
          </Button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="flex-shrink-0 px-6 py-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-tertiary font-medium">{t('schedule.active')}</span>
              <CheckCircle2 size={16} className="text-primary" />
            </div>
            <p className="text-2xl font-bold text-primary mt-1">{active}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-tertiary font-medium">{t('schedule.paused')}</span>
              <Pause size={16} className="text-yellow-500" />
            </div>
            <p className="text-2xl font-bold text-yellow-500 mt-1">{paused}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-tertiary font-medium">{t('schedule.completed')}</span>
              <AlertCircle size={16} className="text-green-500" />
            </div>
            <p className="text-2xl font-bold text-green-500 mt-1">{completed}</p>
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex-shrink-0 px-6 pb-3">
        <div className="flex gap-1 bg-page rounded-lg p-1">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterTab(tab.id)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                filterTab === tab.id
                  ? 'bg-card text-text-primary shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Schedule list */}
      <div className="flex-1 overflow-y-auto px-6 py-2">
        {schedules.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <CalendarClock size={32} className="text-primary/50" />
            </div>
            <p className="text-text-secondary text-sm font-medium">{t('schedule.empty')}</p>
            <p className="text-text-tertiary text-xs mt-1">
              {t('schedule.emptyHint')}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {schedules.map((schedule) => {
              const model = MODELS.find((m) => m.id === schedule.modelId)
              return (
                <div
                  key={schedule.id}
                  className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${statusDot(schedule.status)}`} />
                        <h3 className="text-sm font-semibold text-text-primary truncate">
                          {schedule.title}
                        </h3>
                        <span className="text-[10px] text-text-tertiary">{statusText(schedule.status)}</span>
                      </div>
                      <p className="text-xs text-text-secondary mb-2">{schedule.description}</p>
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[11px] font-medium">
                          {schedule.cronDescription}
                        </span>
                        {model && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-page text-text-secondary text-[11px] font-medium">
                            {model.label}
                          </span>
                        )}
                        <span className="text-[11px] text-text-tertiary">
                          {t('schedule.runCount', { count: schedule.runCount })}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {(schedule.status === 'active' || schedule.status === 'paused') && (
                        <button
                          onClick={() => togglePause(schedule.id)}
                          className="p-1.5 hover:bg-hover rounded-lg transition text-text-tertiary hover:text-text-primary"
                          title={schedule.status === 'active' ? t('schedule.pause') : t('schedule.resume')}
                        >
                          {schedule.status === 'active' ? <Pause size={14} /> : <Play size={14} />}
                        </button>
                      )}
                      <button
                        onClick={() => deleteSchedule(schedule.id)}
                        className="p-1.5 hover:bg-danger/10 rounded-lg transition text-text-tertiary hover:text-danger"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
