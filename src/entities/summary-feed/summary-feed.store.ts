import { create } from 'zustand'
import type { FeedEntry } from '@/shared/types'
import { getAllFeedEntries, putFeedEntry, deleteFeedEntryFromDb } from '@/shared/lib/db'

interface SummaryFeedState {
  entries: FeedEntry[]

  hydrate: () => void
  addEntry: (period: FeedEntry['period'], summary: string, insights: string[], sessionCount: number) => void
  removeEntry: (id: string) => void
  clearOldEntries: (days: number) => void
}

export const useSummaryFeedStore = create<SummaryFeedState>((set) => ({
  entries: [],

  hydrate: () => {
    getAllFeedEntries()
      .then((entries) => {
        set({ entries })
      })
      .catch(console.error)
  },

  addEntry: (period, summary, insights, sessionCount) => {
    const entry: FeedEntry = {
      id: crypto.randomUUID(),
      period,
      summary,
      insights,
      sessionCount,
      createdAt: new Date().toISOString(),
    }

    set((state) => ({
      entries: [entry, ...state.entries],
    }))

    putFeedEntry(entry).catch(console.error)
  },

  removeEntry: (id) => {
    set((state) => ({
      entries: state.entries.filter((e) => e.id !== id),
    }))

    deleteFeedEntryFromDb(id).catch(console.error)
  },

  clearOldEntries: (days) => {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - days)
    const cutoffIso = cutoff.toISOString()

    set((state) => {
      const kept: FeedEntry[] = []
      const removed: FeedEntry[] = []

      for (const e of state.entries) {
        if (e.createdAt >= cutoffIso) {
          kept.push(e)
        } else {
          removed.push(e)
        }
      }

      for (const e of removed) {
        deleteFeedEntryFromDb(e.id).catch(console.error)
      }

      return { entries: kept }
    })
  },
}))
