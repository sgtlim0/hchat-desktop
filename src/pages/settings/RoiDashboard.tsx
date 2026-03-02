import { useMemo } from 'react'
import { useUsageStore } from '@/entities/usage/usage.store'
import { useSessionStore } from '@/entities/session/session.store'
import { useTranslation } from '@/shared/i18n'
import type { TranslationKey } from '@/shared/i18n'

interface RoiMetric {
  labelKey: TranslationKey
  value: string | number
  suffix?: string
  color: string
}

export function RoiDashboard() {
  const { t } = useTranslation()
  const entries = useUsageStore((s) => s.entries)
  const sessions = useSessionStore((s) => s.sessions)

  const metrics = useMemo((): RoiMetric[] => {
    const totalCost = entries.reduce((sum, e) => sum + e.cost, 0)
    const totalMessages = entries.length
    const totalSessions = sessions.length
    const totalInputTokens = entries.reduce((sum, e) => sum + e.inputTokens, 0)
    const totalOutputTokens = entries.reduce((sum, e) => sum + e.outputTokens, 0)
    const avgCostPerSession = totalSessions > 0 ? totalCost / totalSessions : 0
    const avgCostPerMessage = totalMessages > 0 ? totalCost / totalMessages : 0
    const avgTokensPerMessage = totalMessages > 0
      ? Math.round((totalInputTokens + totalOutputTokens) / totalMessages)
      : 0

    // Productivity estimate: ~500 words/min saved per AI response
    // Average response ~200 words → ~0.4 min saved per message
    const estimatedMinutesSaved = Math.round(totalMessages * 0.4)
    const estimatedHoursSaved = (estimatedMinutesSaved / 60).toFixed(1)

    // Cost efficiency: cost per hour saved
    const costPerHourSaved = estimatedMinutesSaved > 0
      ? (totalCost / (estimatedMinutesSaved / 60)).toFixed(2)
      : '0.00'

    return [
      {
        labelKey: 'roi.totalCost',
        value: `$${totalCost.toFixed(2)}`,
        color: 'text-danger',
      },
      {
        labelKey: 'roi.totalMessages',
        value: totalMessages,
        color: 'text-primary',
      },
      {
        labelKey: 'roi.totalSessions',
        value: totalSessions,
        color: 'text-primary',
      },
      {
        labelKey: 'roi.avgCostPerSession',
        value: `$${avgCostPerSession.toFixed(4)}`,
        color: 'text-text-secondary',
      },
      {
        labelKey: 'roi.avgCostPerMessage',
        value: `$${avgCostPerMessage.toFixed(4)}`,
        color: 'text-text-secondary',
      },
      {
        labelKey: 'roi.avgTokensPerMessage',
        value: avgTokensPerMessage.toLocaleString(),
        suffix: ' tokens',
        color: 'text-text-secondary',
      },
      {
        labelKey: 'roi.estimatedTimeSaved',
        value: estimatedHoursSaved,
        suffix: ` ${t('roi.hours')}`,
        color: 'text-success',
      },
      {
        labelKey: 'roi.costPerHourSaved',
        value: `$${costPerHourSaved}`,
        suffix: `/${t('roi.hour')}`,
        color: 'text-warning',
      },
    ]
  }, [entries, sessions, t])

  // Provider breakdown
  const providerBreakdown = useMemo(() => {
    const grouped: Record<string, { count: number; cost: number; tokens: number }> = {}
    for (const entry of entries) {
      const key = entry.provider
      if (!grouped[key]) {
        grouped[key] = { count: 0, cost: 0, tokens: 0 }
      }
      grouped[key].count += 1
      grouped[key].cost += entry.cost
      grouped[key].tokens += entry.inputTokens + entry.outputTokens
    }
    return Object.entries(grouped).sort((a, b) => b[1].cost - a[1].cost)
  }, [entries])

  // Model breakdown
  const modelBreakdown = useMemo(() => {
    const grouped: Record<string, { count: number; cost: number }> = {}
    for (const entry of entries) {
      const key = entry.modelId
      if (!grouped[key]) {
        grouped[key] = { count: 0, cost: 0 }
      }
      grouped[key].count += 1
      grouped[key].cost += entry.cost
    }
    return Object.entries(grouped).sort((a, b) => b[1].cost - a[1].cost).slice(0, 5)
  }, [entries])

  if (entries.length === 0) {
    return (
      <div className="text-sm text-text-tertiary text-center py-8">
        {t('roi.noData')}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {metrics.map((m) => (
          <div key={m.labelKey} className="bg-card rounded-xl p-3 border border-border">
            <div className="text-xs text-text-secondary mb-1">{t(m.labelKey)}</div>
            <div className={`text-lg font-semibold ${m.color}`}>
              {m.value}{m.suffix ?? ''}
            </div>
          </div>
        ))}
      </div>

      {/* Provider Breakdown */}
      {providerBreakdown.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-text-primary mb-2">{t('roi.byProvider')}</h4>
          <div className="space-y-2">
            {providerBreakdown.map(([provider, data]) => {
              const totalCost = entries.reduce((sum, e) => sum + e.cost, 0)
              const pct = totalCost > 0 ? (data.cost / totalCost) * 100 : 0
              return (
                <div key={provider} className="flex items-center gap-3">
                  <span className="text-xs font-medium text-text-primary w-16 capitalize">{provider}</span>
                  <div className="flex-1 bg-hover rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs text-text-secondary w-20 text-right">
                    ${data.cost.toFixed(2)} ({data.count})
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Top Models */}
      {modelBreakdown.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-text-primary mb-2">{t('roi.topModels')}</h4>
          <div className="space-y-1.5">
            {modelBreakdown.map(([modelId, data]) => (
              <div key={modelId} className="flex items-center justify-between text-xs">
                <span className="text-text-primary font-mono truncate max-w-[200px]">{modelId}</span>
                <span className="text-text-secondary">
                  ${data.cost.toFixed(4)} ({data.count} msgs)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
