import { useEffect, useState } from 'react'
import { Rss, Trash2, Calendar, Lightbulb, MessageSquare, Filter } from 'lucide-react'
import { useSummaryFeedStore } from '@/entities/summary-feed/summary-feed.store'
import { useTranslation } from '@/shared/i18n'
import type { FeedEntry } from '@/shared/types'

const PERIOD_COLORS: Record<string, string> = {
  daily: 'bg-blue-500/10 text-blue-500',
  weekly: 'bg-purple-500/10 text-purple-500',
}

const PERIOD_LABELS: Record<string, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
}

export function SummaryFeedPage() {
  const { t } = useTranslation()
  const entries = useSummaryFeedStore((s) => s.entries)
  const hydrate = useSummaryFeedStore((s) => s.hydrate)
  const removeEntry = useSummaryFeedStore((s) => s.removeEntry)
  const clearOldEntries = useSummaryFeedStore((s) => s.clearOldEntries)

  const [periodFilter, setPeriodFilter] = useState<string>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => { hydrate() }, [hydrate])

  const filtered = periodFilter === 'all'
    ? entries
    : entries.filter((e) => e.period === periodFilter)

  const groupedByDate = filtered.reduce<Record<string, FeedEntry[]>>((acc, entry) => {
    const date = new Date(entry.createdAt).toLocaleDateString()
    if (!acc[date]) acc[date] = []
    acc[date].push(entry)
    return acc
  }, {})

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <h1 className="text-lg font-bold text-text-primary flex items-center gap-2">
          <Rss className="w-5 h-5 text-primary" />{t('summaryFeed.title')}
        </h1>
        <button onClick={() => clearOldEntries(30)} className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-secondary text-text-secondary rounded-lg text-sm hover:bg-surface-tertiary">
          <Trash2 className="w-4 h-4" />{t('summaryFeed.clearOld')}
        </button>
      </div>

      {/* Filters */}
      <div className="px-6 py-3 border-b border-border flex items-center gap-2">
        <Filter className="w-4 h-4 text-text-tertiary" />
        {(['all', 'daily', 'weekly', 'monthly'] as const).map((period) => (
          <button key={period} onClick={() => setPeriodFilter(period)}
            className={`px-3 py-1 text-xs rounded-full ${periodFilter === period ? 'bg-primary text-white' : 'bg-surface-secondary text-text-secondary hover:bg-surface-tertiary'}`}>
            {period === 'all' ? t('summaryFeed.all') : (t as any)(PERIOD_LABELS[period])}
          </button>
        ))}
        <span className="ml-auto text-xs text-text-tertiary">{filtered.length} {t('summaryFeed.entries')}</span>
      </div>

      {/* Timeline */}
      <div className="flex-1 overflow-y-auto p-6">
        {filtered.length === 0 && <p className="text-center text-text-tertiary text-sm py-12">{t('summaryFeed.empty')}</p>}

        {Object.entries(groupedByDate).map(([date, dateEntries]) => (
          <div key={date} className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-text-tertiary" />
              <h2 className="text-sm font-semibold text-text-secondary">{date}</h2>
              <div className="flex-1 h-px bg-border" />
            </div>

            <div className="space-y-3 ml-6 border-l-2 border-border pl-4">
              {dateEntries.map((entry) => (
                <div key={entry.id} className="relative">
                  {/* Timeline dot */}
                  <div className="absolute -left-[22px] top-3 w-2.5 h-2.5 rounded-full bg-primary border-2 border-surface" />

                  <div className="p-4 rounded-xl border border-border bg-surface">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${PERIOD_COLORS[entry.period]}`}>
                          {(t as any)(PERIOD_LABELS[entry.period])}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-text-tertiary">
                          <MessageSquare className="w-3 h-3" />{entry.sessionCount} {t('summaryFeed.sessions')}
                        </span>
                      </div>
                      <button onClick={() => removeEntry(entry.id)} className="p-1 rounded hover:bg-red-500/10">
                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                      </button>
                    </div>

                    <p className="text-sm text-text-primary leading-relaxed">{entry.summary}</p>

                    {/* Insights */}
                    {entry.insights.length > 0 && (
                      <button
                        onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                        className="mt-2 flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        <Lightbulb className="w-3.5 h-3.5" />
                        {entry.insights.length} {t('summaryFeed.insights')}
                      </button>
                    )}

                    {expandedId === entry.id && (
                      <ul className="mt-2 space-y-1">
                        {entry.insights.map((insight, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-xs text-text-secondary">
                            <Lightbulb className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
                            {insight}
                          </li>
                        ))}
                      </ul>
                    )}

                    <p className="text-xs text-text-tertiary mt-2">
                      {new Date(entry.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
