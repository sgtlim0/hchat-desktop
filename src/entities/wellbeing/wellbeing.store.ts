import { create } from 'zustand'
import type { MoodEntry, MoodLevel, WellbeingReport } from '@/shared/types'
import {
  getAllMoodEntries,
  putMoodEntry,
  deleteMoodEntryFromDb,
  getAllWellbeingReports,
  putWellbeingReport,
  deleteWellbeingReportFromDb,
} from '@/shared/lib/db'

const MOOD_SCORES: Record<MoodLevel, number> = {
  great: 5,
  good: 4,
  neutral: 3,
  low: 2,
  stressed: 1,
}

interface WellbeingState {
  entries: MoodEntry[]
  reports: WellbeingReport[]

  hydrate: () => void
  addMoodEntry: (mood: MoodLevel, note: string, sessionCount: number, topEmotions: string[]) => void
  deleteMoodEntry: (id: string) => void
  generateReport: (period: 'weekly' | 'monthly') => void
  deleteReport: (id: string) => void
  getAverageMood: () => number
}

export const useWellbeingStore = create<WellbeingState>((set, get) => ({
  entries: [],
  reports: [],

  hydrate: () => {
    Promise.all([getAllMoodEntries(), getAllWellbeingReports()])
      .then(([entries, reports]) => {
        set({ entries, reports })
      })
      .catch(console.error)
  },

  addMoodEntry: (mood, note, sessionCount, topEmotions) => {
    const entry: MoodEntry = {
      id: crypto.randomUUID(),
      date: new Date().toISOString().slice(0, 10),
      mood,
      note,
      sessionCount,
      topEmotions,
      createdAt: new Date().toISOString(),
    }

    set((state) => ({
      entries: [entry, ...state.entries],
    }))

    putMoodEntry(entry).catch(console.error)
  },

  deleteMoodEntry: (id) => {
    set((state) => ({
      entries: state.entries.filter((e) => e.id !== id),
    }))

    deleteMoodEntryFromDb(id).catch(console.error)
  },

  generateReport: (period) => {
    const { entries } = get()
    const now = Date.now()
    const cutoff = period === 'weekly' ? now - 7 * 86400000 : now - 30 * 86400000

    const periodEntries = entries.filter((e) => new Date(e.createdAt).getTime() >= cutoff)

    const moodTrend = periodEntries.map((e) => e.mood)
    const avgScore = periodEntries.length > 0
      ? periodEntries.reduce((sum, e) => sum + MOOD_SCORES[e.mood], 0) / periodEntries.length
      : 3

    const stressCount = periodEntries.filter((e) => e.mood === 'stressed' || e.mood === 'low').length
    const stressIndex = periodEntries.length > 0
      ? Math.round((stressCount / periodEntries.length) * 100)
      : 0

    const productivityScore = Math.round(avgScore * 20)

    const suggestions: string[] = []
    if (stressIndex > 50) suggestions.push('Consider taking more breaks between sessions')
    if (avgScore < 3) suggestions.push('Try shorter, focused work sessions')
    if (periodEntries.length < 3) suggestions.push('Log your mood more regularly for better insights')

    const report: WellbeingReport = {
      id: crypto.randomUUID(),
      period,
      stressIndex,
      productivityScore,
      moodTrend,
      suggestions,
      createdAt: new Date().toISOString(),
    }

    set((state) => ({
      reports: [report, ...state.reports],
    }))

    putWellbeingReport(report).catch(console.error)
  },

  deleteReport: (id) => {
    set((state) => ({
      reports: state.reports.filter((r) => r.id !== id),
    }))

    deleteWellbeingReportFromDb(id).catch(console.error)
  },

  getAverageMood: () => {
    const { entries } = get()
    if (entries.length === 0) return 0
    return entries.reduce((sum, e) => sum + MOOD_SCORES[e.mood], 0) / entries.length
  },
}))
