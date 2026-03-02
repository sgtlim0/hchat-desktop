import { create } from 'zustand'
import type { Schedule, ScheduleStatus } from '@/shared/types'
import { getAllSchedules, putSchedule, deleteScheduleFromDb } from '@/shared/lib/db'
import { useSettingsStore } from '@/entities/settings/settings.store'
import { BEDROCK_MODEL_MAP } from '@/shared/constants'

const API_BASE = import.meta.env.VITE_API_BASE_URL || ''

type FilterTab = 'all' | ScheduleStatus

interface ScheduleExecuteResult {
  success: boolean
  result?: string
  error?: string
}

interface ScheduleState {
  schedules: Schedule[]
  filterTab: FilterTab

  hydrate: () => Promise<void>
  setFilterTab: (tab: FilterTab) => void
  addSchedule: (schedule: Omit<Schedule, 'id' | 'runCount' | 'createdAt' | 'updatedAt'>) => Promise<void>
  updateSchedule: (id: string, updates: Partial<Schedule>) => Promise<void>
  deleteSchedule: (id: string) => Promise<void>
  togglePause: (id: string) => Promise<void>
  executeSchedule: (scheduleId: string) => Promise<ScheduleExecuteResult>
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

  executeSchedule: async (scheduleId) => {
    const schedule = get().schedules.find((s) => s.id === scheduleId)
    if (!schedule) return { success: false, error: 'Schedule not found' }

    const { credentials } = useSettingsStore.getState()
    if (!credentials?.accessKeyId || !credentials?.secretAccessKey) {
      return { success: false, error: 'AWS credentials not configured' }
    }

    const bedrockModelId = BEDROCK_MODEL_MAP[schedule.modelId] ?? schedule.modelId

    try {
      const response = await fetch(`${API_BASE}/api/schedule/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: schedule.prompt,
          modelId: bedrockModelId,
          credentials,
          webhookUrl: null,
        }),
      })

      const data = await response.json()

      const now = new Date().toISOString()
      const updates: Partial<Schedule> = {
        lastRunAt: now,
        runCount: schedule.runCount + 1,
        updatedAt: now,
        status: data.success ? schedule.status : 'failed',
      }

      const updatedSchedule = { ...schedule, ...updates }
      await putSchedule(updatedSchedule)
      set((state) => ({
        schedules: state.schedules.map((s) =>
          s.id === scheduleId ? updatedSchedule : s
        ),
      }))

      return {
        success: data.success,
        result: data.result,
        error: data.error,
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Execution failed'

      const now = new Date().toISOString()
      const updatedSchedule = {
        ...schedule,
        lastRunAt: now,
        status: 'failed' as const,
        updatedAt: now,
      }
      await putSchedule(updatedSchedule)
      set((state) => ({
        schedules: state.schedules.map((s) =>
          s.id === scheduleId ? updatedSchedule : s
        ),
      }))

      return { success: false, error: message }
    }
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
