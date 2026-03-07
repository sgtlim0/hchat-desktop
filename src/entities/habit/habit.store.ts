import { create } from 'zustand'
import type { Habit, HabitFrequency } from '@/shared/types'
import { getAllHabits, putHabit, deleteHabitFromDb } from '@/shared/lib/db'

interface HabitState {
  habits: Habit[]

  hydrate: () => void
  createHabit: (name: string, frequency: HabitFrequency, icon: string, color: string) => void
  deleteHabit: (id: string) => void
  toggleComplete: (id: string, date: string) => void
}

function dateToStr(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function prevDay(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const prev = new Date(y, m - 1, d - 1)
  return dateToStr(prev)
}

function calcStreak(completedDates: string[]): number {
  if (completedDates.length === 0) return 0

  const sorted = [...completedDates].sort().reverse()
  const todayStr = dateToStr(new Date())
  const yesterdayStr = prevDay(todayStr)

  if (sorted[0] !== todayStr && sorted[0] !== yesterdayStr) return 0

  let streak = 1
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === prevDay(sorted[i - 1])) {
      streak++
    } else {
      break
    }
  }

  return streak
}

export const useHabitStore = create<HabitState>((set) => ({
  habits: [],

  hydrate: () => {
    getAllHabits()
      .then((habits) => set({ habits }))
      .catch(console.error)
  },

  createHabit: (name, frequency, icon, color) => {
    const habit: Habit = {
      id: crypto.randomUUID(),
      name,
      frequency,
      icon,
      color,
      streak: 0,
      bestStreak: 0,
      completedDates: [],
      createdAt: new Date().toISOString(),
    }

    set((state) => ({ habits: [habit, ...state.habits] }))
    putHabit(habit).catch(console.error)
  },

  deleteHabit: (id) => {
    set((state) => ({ habits: state.habits.filter((h) => h.id !== id) }))
    deleteHabitFromDb(id).catch(console.error)
  },

  toggleComplete: (id, date) => {
    set((state) => ({
      habits: state.habits.map((h) => {
        if (h.id !== id) return h

        const hasDate = h.completedDates.includes(date)
        const completedDates = hasDate
          ? h.completedDates.filter((d) => d !== date)
          : [...h.completedDates, date]

        const streak = calcStreak(completedDates)
        const bestStreak = Math.max(h.bestStreak, streak)

        const updated = { ...h, completedDates, streak, bestStreak }
        putHabit(updated).catch(console.error)
        return updated
      }),
    }))
  },
}))

export { calcStreak }
