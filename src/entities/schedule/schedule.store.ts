import { create } from 'zustand'
import type { Schedule, ScheduleStatus } from '@/shared/types'
import { getAllSchedules, putSchedule, deleteScheduleFromDb } from '@/shared/lib/db'

type FilterTab = 'all' | ScheduleStatus

interface ScheduleState {
  schedules: Schedule[]
  filterTab: FilterTab

  hydrate: () => Promise<void>
  setFilterTab: (tab: FilterTab) => void
  addSchedule: (schedule: Omit<Schedule, 'id' | 'runCount' | 'createdAt' | 'updatedAt'>) => Promise<void>
  updateSchedule: (id: string, updates: Partial<Schedule>) => Promise<void>
  deleteSchedule: (id: string) => Promise<void>
  togglePause: (id: string) => Promise<void>
  filteredSchedules: () => Schedule[]
  stats: () => { active: number; paused: number; completed: number }
}

export const useScheduleStore = create<ScheduleState>((set, get) => ({
  schedules: [],
  filterTab: 'all',

  hydrate: async () => {
    const schedules = await getAllSchedules()
    set({ schedules })
  },

  setFilterTab: (tab) => set({ filterTab: tab }),

  addSchedule: async (schedule) => {
    const now = new Date().toISOString()
    const newSchedule: Schedule = {
      ...schedule,
      id: `sched-${Date.now()}`,
      runCount: 0,
      createdAt: now,
      updatedAt: now,
    }
    await putSchedule(newSchedule)
    set((state) => ({ schedules: [newSchedule, ...state.schedules] }))
  },

  updateSchedule: async (id, updates) => {
    const schedule = get().schedules.find((s) => s.id === id)
    if (!schedule) return

    const updatedSchedule = { ...schedule, ...updates, updatedAt: new Date().toISOString() }
    await putSchedule(updatedSchedule)
    set((state) => ({
      schedules: state.schedules.map((s) =>
        s.id === id ? updatedSchedule : s
      ),
    }))
  },

  deleteSchedule: async (id) => {
    await deleteScheduleFromDb(id)
    set((state) => ({
      schedules: state.schedules.filter((s) => s.id !== id),
    }))
  },

  togglePause: async (id) => {
    const schedule = get().schedules.find((s) => s.id === id)
    if (!schedule) return

    const newStatus: ScheduleStatus = schedule.status === 'active' ? 'paused' : 'active'
    const updatedSchedule = { ...schedule, status: newStatus, updatedAt: new Date().toISOString() }
    await putSchedule(updatedSchedule)
    set((state) => ({
      schedules: state.schedules.map((s) =>
        s.id === id ? updatedSchedule : s
      ),
    }))
  },

  filteredSchedules: () => {
    const { schedules, filterTab } = get()
    if (filterTab === 'all') return schedules
    return schedules.filter((s) => s.status === filterTab)
  },

  stats: () => {
    const { schedules } = get()
    return {
      active: schedules.filter((s) => s.status === 'active').length,
      paused: schedules.filter((s) => s.status === 'paused').length,
      completed: schedules.filter((s) => s.status === 'completed').length,
    }
  },
}))
