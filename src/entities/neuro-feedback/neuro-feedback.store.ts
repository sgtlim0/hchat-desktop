import { create } from 'zustand'
import type { NeuroEntry, NeuroReport } from '@/shared/types'
import { getAllNeuroEntries, putNeuroEntry, getAllNeuroReports, putNeuroReport } from '@/shared/lib/db'
interface NeuroState { entries: NeuroEntry[]; reports: NeuroReport[]; hydrate: () => void; addEntry: (focus: number, stress: number, energy: number, note: string) => void; generateReport: (period: string) => void }
export const useNeuroFeedbackStore = create<NeuroState>((set, get) => ({
  entries: [], reports: [],
  hydrate: () => { Promise.all([getAllNeuroEntries(), getAllNeuroReports()]).then(([entries, reports]) => set({ entries, reports })) },
  addEntry: (focus, stress, energy, note) => { const e: NeuroEntry = { id: crypto.randomUUID(), timestamp: new Date().toISOString(), focus, stress, energy, note }; set((s) => ({ entries: [e, ...s.entries] })); putNeuroEntry(e) },
  generateReport: (period) => { const entries = get().entries; const avg = (arr: number[]) => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0; const r: NeuroReport = { id: crypto.randomUUID(), period, peakHours: ['10:00', '14:00'], avgFocus: avg(entries.map((e) => e.focus)), avgStress: avg(entries.map((e) => e.stress)), suggestions: ['Take breaks every 50min', 'Hydrate regularly'], createdAt: new Date().toISOString() }; set((s) => ({ reports: [r, ...s.reports] })); putNeuroReport(r) },
}))
