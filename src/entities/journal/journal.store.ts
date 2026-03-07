import { create } from 'zustand'
import type { JournalEntry } from '@/shared/types'
import { getAllJournalEntries, putJournalEntry, deleteJournalEntryFromDb } from '@/shared/lib/db'
const AI_QUESTIONS = ['오늘 가장 감사한 일은?', '오늘 배운 것은?', '내일 가장 기대되는 일은?', '최근 극복한 어려움은?', '지금 가장 행복한 순간은?']
interface JournalState { entries: JournalEntry[]; hydrate: () => void; addEntry: (answer: string, gratitude: string[], mood: string) => void; deleteEntry: (id: string) => void; todayQuestion: () => string }
export const useJournalStore = create<JournalState>((set) => ({
  entries: [],
  hydrate: () => { getAllJournalEntries().then((entries) => set({ entries })) },
  addEntry: (answer, gratitude, mood) => { const e: JournalEntry = { id: crypto.randomUUID(), date: new Date().toISOString().split('T')[0], aiQuestion: AI_QUESTIONS[Math.floor(Math.random() * AI_QUESTIONS.length)], answer, gratitude, mood, createdAt: new Date().toISOString() }; set((s) => ({ entries: [e, ...s.entries] })); putJournalEntry(e) },
  deleteEntry: (id) => { set((s) => ({ entries: s.entries.filter((e) => e.id !== id) })); deleteJournalEntryFromDb(id) },
  todayQuestion: () => AI_QUESTIONS[new Date().getDay() % AI_QUESTIONS.length],
}))
