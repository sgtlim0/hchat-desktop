import { useState, useEffect, useMemo } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { ArrowLeft, Heart, Plus, Trash2, BarChart2, Calendar, TrendingUp } from 'lucide-react'
import { useSessionStore } from '@/entities/session/session.store'
import { useWellbeingStore } from '@/entities/wellbeing/wellbeing.store'
import { useTranslation } from '@/shared/i18n'
import type { TranslationKey } from '@/shared/i18n'
import type { MoodLevel } from '@/shared/types'
import { Button } from '@/shared/ui/Button'

const MOODS = [
  { key: 'great' as const, emoji: '😄', color: 'text-green-500', bg: 'bg-green-500', value: 5 },
  { key: 'good' as const, emoji: '🙂', color: 'text-lime-500', bg: 'bg-lime-500', value: 4 },
  { key: 'neutral' as const, emoji: '😐', color: 'text-yellow-500', bg: 'bg-yellow-500', value: 3 },
  { key: 'low' as const, emoji: '😞', color: 'text-orange-500', bg: 'bg-orange-500', value: 2 },
  { key: 'stressed' as const, emoji: '😫', color: 'text-red-500', bg: 'bg-red-500', value: 1 },
]

const MOOD_SCORES: Record<MoodLevel, number> = { great: 5, good: 4, neutral: 3, low: 2, stressed: 1 }
const MOOD_COLORS: Record<string, string> = { great: '#22c55e', good: '#84cc16', neutral: '#eab308', low: '#f97316', stressed: '#ef4444' }

const MOOD_LABEL_KEYS: Record<MoodLevel, TranslationKey> = {
  great: 'wellbeing.great',
  good: 'wellbeing.good',
  neutral: 'wellbeing.neutral',
  low: 'wellbeing.low',
  stressed: 'wellbeing.stressed',
}

export function WellbeingPage() {
  const { t } = useTranslation()
  const setView = useSessionStore((s) => s.setView)

  const {
    entries,
    reports,
    hydrate,
    addMoodEntry,
    deleteMoodEntry,
    generateReport,
  } = useWellbeingStore(
    useShallow((s) => ({
      entries: s.entries,
      reports: s.reports,
      hydrate: s.hydrate,
      addMoodEntry: s.addMoodEntry,
      deleteMoodEntry: s.deleteMoodEntry,
      generateReport: s.generateReport,
    }))
  )

  const [tab, setTab] = useState<'log' | 'report'>('log')
  const [selectedMood, setSelectedMood] = useState<MoodLevel | null>(null)
  const [note, setNote] = useState('')

  useEffect(() => {
    hydrate()
  }, [hydrate])

  function handleAddEntry() {
    if (!selectedMood) return
    addMoodEntry(selectedMood, note.trim(), 0, [])
    setSelectedMood(null)
    setNote('')
  }

  function handleDelete(id: string) {
    if (confirm(t('wellbeing.deleteConfirm'))) {
      deleteMoodEntry(id)
    }
  }

  // Sorted entries (most recent first)
  const sortedEntries = useMemo(
    () => [...entries].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [entries],
  )

  // Last 14 entries for the bar graph
  const last14 = useMemo(() => sortedEntries.slice(0, 14).reverse(), [sortedEntries])

  // Computed report from entries
  const computedReport = useMemo(() => {
    if (entries.length === 0) return null
    const totalEntries = entries.length
    const avgMood = entries.reduce((sum, e) => sum + MOOD_SCORES[e.mood], 0) / totalEntries
    const distribution: Record<string, number> = {}
    let dominantMood: MoodLevel = 'neutral'
    let maxCount = 0
    for (const e of entries) {
      distribution[e.mood] = (distribution[e.mood] ?? 0) + 1
      if (distribution[e.mood] > maxCount) {
        maxCount = distribution[e.mood]
        dominantMood = e.mood
      }
    }
    return { totalEntries, averageMood: avgMood, dominantMood, distribution }
  }, [entries])

  const latestReport = reports[0] ?? null

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
            {t('wellbeing.title')}
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)]">
            {t('wellbeing.subtitle')}
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
            {t('wellbeing.logTab')}
          </button>
          <button
            onClick={() => {
              setTab('report')
              generateReport('weekly')
            }}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              tab === 'report'
                ? 'bg-[var(--color-accent)] text-white'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            {t('wellbeing.reportTab')}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {tab === 'log' ? (
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Mood Selector */}
            <div className="p-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
              <h2 className="text-sm font-medium text-[var(--color-text-secondary)] mb-3">
                {t('wellbeing.howAreYou')}
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
                      {t(MOOD_LABEL_KEYS[mood.key])}
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
                  placeholder={t('wellbeing.notePlaceholder')}
                  className="flex-1 px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] text-sm"
                />
                <Button onClick={handleAddEntry} disabled={!selectedMood}>
                  <Plus className="w-4 h-4 mr-1" />
                  {t('wellbeing.log')}
                </Button>
              </div>
            </div>

            {/* Mood Graph (SVG Bars) */}
            {last14.length > 0 && (
              <div className="p-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
                <div className="flex items-center gap-2 mb-3">
                  <BarChart2 className="w-4 h-4 text-[var(--color-accent)]" />
                  <h3 className="text-sm font-medium text-[var(--color-text-secondary)]">
                    {t('wellbeing.moodGraph')}
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
                    return (
                      <g key={entry.id}>
                        <rect
                          x={idx * 40 + 10}
                          y={100 - barHeight}
                          width={24}
                          height={barHeight}
                          rx={4}
                          fill={MOOD_COLORS[entry.mood] ?? '#a1a1aa'}
                          opacity={0.8}
                        />
                        <text
                          x={idx * 40 + 22}
                          y={115}
                          textAnchor="middle"
                          className="text-[8px] fill-[var(--color-text-secondary)]"
                        >
                          {new Date(entry.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
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
                {t('wellbeing.history')}
              </h3>
              {sortedEntries.length === 0 ? (
                <p className="text-sm text-[var(--color-text-secondary)] italic">
                  {t('wellbeing.noEntries')}
                </p>
              ) : (
                sortedEntries.map((entry) => {
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
                            {t(MOOD_LABEL_KEYS[entry.mood])}
                          </span>
                          <span className="text-xs text-[var(--color-text-secondary)]">
                            <Calendar className="w-3 h-3 inline mr-1" />
                            {new Date(entry.createdAt).toLocaleString()}
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
            {computedReport ? (
              <>
                {/* Summary Card */}
                <div className="p-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="w-5 h-5 text-[var(--color-accent)]" />
                    <h2 className="font-semibold text-[var(--color-text-primary)]">
                      {t('wellbeing.reportSummary')}
                    </h2>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-[var(--color-text-primary)]">
                        {computedReport.totalEntries}
                      </p>
                      <p className="text-xs text-[var(--color-text-secondary)]">
                        {t('wellbeing.totalEntries')}
                      </p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-[var(--color-text-primary)]">
                        {computedReport.averageMood.toFixed(1)}
                      </p>
                      <p className="text-xs text-[var(--color-text-secondary)]">
                        {t('wellbeing.averageMood')}
                      </p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-[var(--color-text-primary)]">
                        {MOODS.find((m) => m.key === computedReport.dominantMood)?.emoji ?? '😐'}
                      </p>
                      <p className="text-xs text-[var(--color-text-secondary)]">
                        {t('wellbeing.dominantMood')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Mood Distribution */}
                <div className="p-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
                  <h3 className="text-sm font-medium text-[var(--color-text-secondary)] mb-3">
                    {t('wellbeing.distribution')}
                  </h3>
                  <div className="space-y-2">
                    {MOODS.map((mood) => {
                      const count = computedReport.distribution[mood.key] ?? 0
                      const pct = computedReport.totalEntries > 0
                        ? Math.round((count / computedReport.totalEntries) * 100)
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

                {/* Latest Generated Report */}
                {latestReport && (
                  <>
                    <div className="p-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
                      <h3 className="text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                        {t('wellbeing.trend')}
                      </h3>
                      <p className="text-sm text-[var(--color-text-primary)]">
                        {t('wellbeing.stressIndex')}: {latestReport.stressIndex}% | {t('wellbeing.productivity')}: {latestReport.productivityScore}%
                      </p>
                    </div>
                    {latestReport.suggestions.length > 0 && (
                      <div className="p-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
                        <h3 className="text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                          {t('wellbeing.recommendations')}
                        </h3>
                        <ul className="space-y-1">
                          {latestReport.suggestions.map((suggestion: string, idx: number) => (
                            <li
                              key={idx}
                              className="flex items-start gap-2 text-sm text-[var(--color-text-primary)]"
                            >
                              <Heart className="w-4 h-4 mt-0.5 text-pink-500 flex-shrink-0" />
                              {suggestion}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center h-64 text-center">
                <div>
                  <BarChart2 className="w-12 h-12 mx-auto mb-3 text-zinc-300 dark:text-zinc-600" />
                  <p className="text-[var(--color-text-secondary)]">
                    {t('wellbeing.noReport')}
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
