// @ts-nocheck
import { useState, useEffect } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { ArrowLeft, Heart, Plus, Trash2, BarChart2, Calendar, TrendingUp } from 'lucide-react'
import { useSessionStore } from '@/entities/session/session.store'
import { useWellbeingStore } from '@/entities/wellbeing/wellbeing.store'
import { useTranslation } from '@/shared/i18n'
import { Button } from '@/shared/ui/Button'

const MOODS = [
  { key: 'great', emoji: '😄', color: 'text-green-500', bg: 'bg-green-500', value: 5 },
  { key: 'good', emoji: '🙂', color: 'text-lime-500', bg: 'bg-lime-500', value: 4 },
  { key: 'neutral', emoji: '😐', color: 'text-yellow-500', bg: 'bg-yellow-500', value: 3 },
  { key: 'low', emoji: '😞', color: 'text-orange-500', bg: 'bg-orange-500', value: 2 },
  { key: 'stressed', emoji: '😫', color: 'text-red-500', bg: 'bg-red-500', value: 1 },
] as const

type MoodKey = (typeof MOODS)[number]['key']

export function WellbeingPage() {
  const { t } = useTranslation()
  const setView = useSessionStore((s) => s.setView)

  const {
    entries,
    report,
    hydrate,
    addEntry,
    deleteEntry,
    generateReport,
  } = useWellbeingStore(
    useShallow((s) => ({
      entries: s.entries,
      report: s.report,
      hydrate: s.hydrate,
      addEntry: s.addEntry,
      deleteEntry: s.deleteEntry,
      generateReport: s.generateReport,
    }))
  )

  const [tab, setTab] = useState<'log' | 'report'>('log')
  const [selectedMood, setSelectedMood] = useState<MoodKey | null>(null)
  const [note, setNote] = useState('')

  useEffect(() => {
    hydrate()
  }, [hydrate])

  function handleAddEntry() {
    if (!selectedMood) return
    addEntry(selectedMood, note.trim())
    setSelectedMood(null)
    setNote('')
  }

  function handleDelete(id: string) {
    if (confirm((t as any)('wellbeing.deleteConfirm'))) {
      deleteEntry(id)
    }
  }

  // Compute mood bar graph data (last 14 days)
  const last14 = entries
    .slice()
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 14)
    .reverse()

  const maxBarValue = 5

  return (
    <div className="flex flex-col h-full bg-[var(--color-bg-primary)]">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--color-border)]">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setView('home')}
          aria-label={t('common.back')}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <Heart className="w-5 h-5 text-pink-500" />
        <div className="flex-1">
          <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">
            {(t as any)('wellbeing.title')}
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)]">
            {(t as any)('wellbeing.subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-1 bg-[var(--color-bg-secondary)] rounded-lg p-1">
          <button
            onClick={() => setTab('log')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              tab === 'log'
                ? 'bg-[var(--color-accent)] text-white'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            {(t as any)('wellbeing.logTab')}
          </button>
          <button
            onClick={() => {
              setTab('report')
              generateReport()
            }}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              tab === 'report'
                ? 'bg-[var(--color-accent)] text-white'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            {(t as any)('wellbeing.reportTab')}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {tab === 'log' ? (
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Mood Selector */}
            <div className="p-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
              <h2 className="text-sm font-medium text-[var(--color-text-secondary)] mb-3">
                {(t as any)('wellbeing.howAreYou')}
              </h2>
              <div className="flex items-center justify-center gap-4 mb-4">
                {MOODS.map((mood) => (
                  <button
                    key={mood.key}
                    onClick={() => setSelectedMood(mood.key)}
                    className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all ${
                      selectedMood === mood.key
                        ? 'border-[var(--color-accent)] scale-110'
                        : 'border-transparent hover:bg-[var(--color-bg-primary)]'
                    }`}
                    aria-label={mood.key}
                  >
                    <span className="text-3xl">{mood.emoji}</span>
                    <span className="text-xs text-[var(--color-text-secondary)] capitalize">
                      {(t as any)(`wellbeing.mood.${mood.key}`)}
                    </span>
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddEntry()}
                  placeholder={(t as any)('wellbeing.notePlaceholder')}
                  className="flex-1 px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] text-sm"
                />
                <Button onClick={handleAddEntry} disabled={!selectedMood}>
                  <Plus className="w-4 h-4 mr-1" />
                  {(t as any)('wellbeing.log')}
                </Button>
              </div>
            </div>

            {/* Mood Graph (SVG Bars) */}
            {last14.length > 0 && (
              <div className="p-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
                <div className="flex items-center gap-2 mb-3">
                  <BarChart2 className="w-4 h-4 text-[var(--color-accent)]" />
                  <h3 className="text-sm font-medium text-[var(--color-text-secondary)]">
                    {(t as any)('wellbeing.moodGraph')}
                  </h3>
                </div>
                <svg
                  viewBox={`0 0 ${last14.length * 40 + 20} 120`}
                  className="w-full h-32"
                  aria-label="mood graph"
                >
                  {last14.map((entry, idx) => {
                    const moodDef = MOODS.find((m) => m.key === entry.mood)
                    const value = moodDef?.value ?? 3
                    const barHeight = (value / maxBarValue) * 90
                    const colors: Record<string, string> = {
                      great: '#22c55e',
                      good: '#84cc16',
                      neutral: '#eab308',
                      low: '#f97316',
                      stressed: '#ef4444',
                    }
                    return (
                      <g key={entry.id}>
                        <rect
                          x={idx * 40 + 10}
                          y={100 - barHeight}
                          width={24}
                          height={barHeight}
                          rx={4}
                          fill={colors[entry.mood] ?? '#a1a1aa'}
                          opacity={0.8}
                        />
                        <text
                          x={idx * 40 + 22}
                          y={115}
                          textAnchor="middle"
                          className="text-[8px] fill-[var(--color-text-secondary)]"
                        >
                          {new Date(entry.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </text>
                      </g>
                    )
                  })}
                </svg>
              </div>
            )}

            {/* Entry Timeline */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-[var(--color-text-secondary)]">
                {(t as any)('wellbeing.history')}
              </h3>
              {entries.length === 0 ? (
                <p className="text-sm text-[var(--color-text-secondary)] italic">
                  {(t as any)('wellbeing.noEntries')}
                </p>
              ) : (
                entries
                  .slice()
                  .sort((a, b) => b.timestamp - a.timestamp)
                  .map((entry) => {
                    const moodDef = MOODS.find((m) => m.key === entry.mood)
                    return (
                      <div
                        key={entry.id}
                        className="flex items-center gap-3 p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)]"
                      >
                        <span className="text-2xl">{moodDef?.emoji ?? '😐'}</span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-medium capitalize ${moodDef?.color ?? ''}`}>
                              {(t as any)(`wellbeing.mood.${entry.mood}`)}
                            </span>
                            <span className="text-xs text-[var(--color-text-secondary)]">
                              <Calendar className="w-3 h-3 inline mr-1" />
                              {new Date(entry.timestamp).toLocaleString()}
                            </span>
                          </div>
                          {entry.note && (
                            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                              {entry.note}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => handleDelete(entry.id)}
                          className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )
                  })
              )}
            </div>
          </div>
        ) : (
          /* Report Tab */
          <div className="max-w-2xl mx-auto space-y-4">
            {report ? (
              <>
                {/* Summary Card */}
                <div className="p-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="w-5 h-5 text-[var(--color-accent)]" />
                    <h2 className="font-semibold text-[var(--color-text-primary)]">
                      {(t as any)('wellbeing.reportSummary')}
                    </h2>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-[var(--color-text-primary)]">
                        {report.totalEntries}
                      </p>
                      <p className="text-xs text-[var(--color-text-secondary)]">
                        {(t as any)('wellbeing.totalEntries')}
                      </p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-[var(--color-text-primary)]">
                        {report.averageMood.toFixed(1)}
                      </p>
                      <p className="text-xs text-[var(--color-text-secondary)]">
                        {(t as any)('wellbeing.averageMood')}
                      </p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-[var(--color-text-primary)]">
                        {MOODS.find((m) => m.key === report.dominantMood)?.emoji ?? '😐'}
                      </p>
                      <p className="text-xs text-[var(--color-text-secondary)]">
                        {(t as any)('wellbeing.dominantMood')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Mood Distribution */}
                <div className="p-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
                  <h3 className="text-sm font-medium text-[var(--color-text-secondary)] mb-3">
                    {(t as any)('wellbeing.distribution')}
                  </h3>
                  <div className="space-y-2">
                    {MOODS.map((mood) => {
                      const count = report.distribution[mood.key] ?? 0
                      const pct = report.totalEntries > 0
                        ? Math.round((count / report.totalEntries) * 100)
                        : 0
                      return (
                        <div key={mood.key} className="flex items-center gap-3">
                          <span className="text-lg w-8">{mood.emoji}</span>
                          <div className="flex-1 h-4 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${mood.bg} transition-all`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-sm text-[var(--color-text-secondary)] w-12 text-right">
                            {pct}%
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Trend */}
                {report.trend && (
                  <div className="p-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
                    <h3 className="text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                      {(t as any)('wellbeing.trend')}
                    </h3>
                    <p className="text-sm text-[var(--color-text-primary)]">{report.trend}</p>
                  </div>
                )}

                {/* Recommendations */}
                {report.recommendations && report.recommendations.length > 0 && (
                  <div className="p-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
                    <h3 className="text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                      {(t as any)('wellbeing.recommendations')}
                    </h3>
                    <ul className="space-y-1">
                      {report.recommendations.map((rec, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2 text-sm text-[var(--color-text-primary)]"
                        >
                          <Heart className="w-4 h-4 mt-0.5 text-pink-500 flex-shrink-0" />
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center h-64 text-center">
                <div>
                  <BarChart2 className="w-12 h-12 mx-auto mb-3 text-zinc-300 dark:text-zinc-600" />
                  <p className="text-[var(--color-text-secondary)]">
                    {(t as any)('wellbeing.noReport')}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
