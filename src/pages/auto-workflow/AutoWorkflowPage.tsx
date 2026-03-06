import { useEffect } from 'react'
import { Zap, Check, X, Trash2, Clock, Coins, BarChart3, RefreshCw } from 'lucide-react'
import { useAutoWorkflowStore } from '@/entities/auto-workflow/auto-workflow.store'
import { useSessionStore } from '@/entities/session/session.store'
import { useTranslation } from '@/shared/i18n'
import type { TFunction } from '@/shared/i18n/types'
import type { WorkflowSuggestion } from '@/shared/types'

const STATUS_STYLES: Record<WorkflowSuggestion['status'], { bg: string; text: string }> = {
  pending: { bg: 'bg-amber-500/10', text: 'text-amber-600' },
  accepted: { bg: 'bg-green-500/10', text: 'text-green-600' },
  dismissed: { bg: 'bg-surface-tertiary', text: 'text-text-tertiary' },
}

function getStatusLabel(status: WorkflowSuggestion['status'], t: TFunction) {
  if (status === 'pending') return t('autoWorkflow.pending')
  if (status === 'accepted') return t('autoWorkflow.accepted')
  return t('autoWorkflow.dismissed')
}

export function AutoWorkflowPage() {
  const { t } = useTranslation()
  const suggestions = useAutoWorkflowStore((s) => s.suggestions)
  const filterStatus = useAutoWorkflowStore((s) => s.filterStatus)
  const totalSavings = useAutoWorkflowStore((s) => s.totalSavings)
  const hydrate = useAutoWorkflowStore((s) => s.hydrate)
  const acceptSuggestion = useAutoWorkflowStore((s) => s.acceptSuggestion)
  const dismissSuggestion = useAutoWorkflowStore((s) => s.dismissSuggestion)
  const removeSuggestion = useAutoWorkflowStore((s) => s.removeSuggestion)
  const setFilterStatus = useAutoWorkflowStore((s) => s.setFilterStatus)
  const detectPatterns = useAutoWorkflowStore((s) => s.detectPatterns)
  const messages = useSessionStore((s) => s.messages)

  useEffect(() => { hydrate() }, [hydrate])

  const handleDetect = () => {
    const allMessages = Object.values(messages).flat()
    const userPrompts = allMessages.filter((m) => m.role === 'user').map((m) => m.segments.map((s) => s.content ?? '').join(''))
    detectPatterns(userPrompts)
  }

  const filtered = filterStatus === 'all' ? suggestions : suggestions.filter((s) => s.status === filterStatus)
  const filters: Array<WorkflowSuggestion['status'] | 'all'> = ['all', 'pending', 'accepted', 'dismissed']

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div className="px-6 py-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-text-primary flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />{t('autoWorkflow.title')}
            </h1>
            <p className="text-sm text-text-secondary mt-0.5">{t('autoWorkflow.description')}</p>
          </div>
          <button onClick={handleDetect} className="flex items-center gap-2 px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 text-sm">
            <RefreshCw className="w-4 h-4" />{t('autoWorkflow.detect')}
          </button>
        </div>

        {/* Savings dashboard */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="p-3 rounded-lg bg-green-500/10">
            <div className="flex items-center gap-2 text-green-600">
              <Coins className="w-4 h-4" />
              <span className="text-xs font-medium">{t('autoWorkflow.costSaved')}</span>
            </div>
            <p className="text-lg font-bold text-text-primary mt-1">${totalSavings.cost.toFixed(2)}</p>
          </div>
          <div className="p-3 rounded-lg bg-blue-500/10">
            <div className="flex items-center gap-2 text-blue-600">
              <BarChart3 className="w-4 h-4" />
              <span className="text-xs font-medium">{t('autoWorkflow.tokensSaved')}</span>
            </div>
            <p className="text-lg font-bold text-text-primary mt-1">{totalSavings.tokens.toLocaleString()}</p>
          </div>
          <div className="p-3 rounded-lg bg-purple-500/10">
            <div className="flex items-center gap-2 text-purple-600">
              <Clock className="w-4 h-4" />
              <span className="text-xs font-medium">{t('autoWorkflow.timeSaved')}</span>
            </div>
            <p className="text-lg font-bold text-text-primary mt-1">{totalSavings.timeMinutes}{t('autoWorkflow.minutes')}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="px-6 py-2 border-b border-border flex gap-2">
        {filters.map((f) => (
          <button key={f} onClick={() => setFilterStatus(f)} className={`px-3 py-1 text-xs rounded-full ${filterStatus === f ? 'bg-primary text-white' : 'bg-surface-secondary text-text-secondary hover:bg-surface-tertiary'}`}>
            {f === 'all' ? t('autoWorkflow.all') : getStatusLabel(f, t)} ({f === 'all' ? suggestions.length : suggestions.filter((s) => s.status === f).length})
          </button>
        ))}
      </div>

      {/* Suggestion list */}
      <div className="flex-1 overflow-y-auto px-6 py-3 space-y-3">
        {filtered.length === 0 && (
          <div className="flex-1 flex items-center justify-center h-40">
            <p className="text-text-tertiary text-sm">{t('autoWorkflow.empty')}</p>
          </div>
        )}
        {filtered.map((sg) => {
          const style = STATUS_STYLES[sg.status]
          return (
            <div key={sg.id} className={`p-4 rounded-lg border border-border ${style.bg}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-text-primary">{sg.description}</p>
                  <p className="text-xs text-text-tertiary mt-1 font-mono bg-surface-secondary/50 px-2 py-0.5 rounded inline-block">{sg.pattern.slice(0, 80)}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-text-secondary">
                    <span>{t('autoWorkflow.frequency')}: {sg.frequency}x</span>
                    <span>{t('autoWorkflow.estSavings')}: {sg.estimatedSavings.tokens} tokens</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 ml-3">
                  {sg.status === 'pending' && (
                    <>
                      <button onClick={() => acceptSuggestion(sg.id, `wf-${sg.id}`)} className="p-1.5 rounded-lg bg-green-500/20 hover:bg-green-500/30" aria-label={t('autoWorkflow.accept')}>
                        <Check className="w-4 h-4 text-green-600" />
                      </button>
                      <button onClick={() => dismissSuggestion(sg.id)} className="p-1.5 rounded-lg bg-surface-tertiary hover:bg-surface-secondary" aria-label={t('autoWorkflow.dismiss')}>
                        <X className="w-4 h-4 text-text-tertiary" />
                      </button>
                    </>
                  )}
                  <button onClick={() => removeSuggestion(sg.id)} className="p-1.5 rounded-lg hover:bg-red-500/10" aria-label={t('common.delete')}>
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  </button>
                </div>
              </div>
              <span className={`inline-block text-[10px] font-medium mt-2 px-2 py-0.5 rounded-full ${style.bg} ${style.text}`}>{getStatusLabel(sg.status, t)}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
