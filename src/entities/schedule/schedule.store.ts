import { create } from 'zustand'
import type { Schedule, ScheduleStatus } from '@/shared/types'

type FilterTab = 'all' | ScheduleStatus

interface ScheduleState {
  schedules: Schedule[]
  filterTab: FilterTab

  setFilterTab: (tab: FilterTab) => void
  addSchedule: (schedule: Omit<Schedule, 'id' | 'runCount' | 'createdAt' | 'updatedAt'>) => void
  updateSchedule: (id: string, updates: Partial<Schedule>) => void
  deleteSchedule: (id: string) => void
  togglePause: (id: string) => void
  filteredSchedules: () => Schedule[]
  stats: () => { active: number; paused: number; completed: number }
}

const MOCK_SCHEDULES: Schedule[] = [
  {
    id: 'sched-1',
    title: '일일 코드 리뷰 요약',
    description: '매일 오전 9시에 전일 커밋을 분석하고 리뷰 요약을 생성합니다.',
    cron: '0 9 * * *',
    cronDescription: '매일 오전 9:00',
    modelId: 'claude-sonnet-4.6',
    prompt: '어제 커밋된 코드를 분석하고 주요 변경사항을 요약해주세요.',
    status: 'active',
    lastRunAt: '2026-03-02T00:00:00Z',
    nextRunAt: '2026-03-03T00:00:00Z',
    runCount: 15,
    createdAt: '2026-02-15T10:00:00Z',
    updatedAt: '2026-03-02T00:00:00Z',
  },
  {
    id: 'sched-2',
    title: '주간 보안 스캔',
    description: '매주 월요일 오전 8시에 코드베이스 보안 취약점을 검사합니다.',
    cron: '0 8 * * 1',
    cronDescription: '매주 월요일 오전 8:00',
    modelId: 'claude-opus-4.6',
    prompt: '코드베이스의 보안 취약점을 분석하고 OWASP Top 10 기준으로 보고서를 작성해주세요.',
    status: 'active',
    lastRunAt: '2026-02-24T23:00:00Z',
    nextRunAt: '2026-03-03T23:00:00Z',
    runCount: 4,
    createdAt: '2026-02-01T08:00:00Z',
    updatedAt: '2026-02-24T23:00:00Z',
  },
  {
    id: 'sched-3',
    title: '문서 자동 업데이트',
    description: '코드 변경 시 API 문서를 자동으로 업데이트합니다.',
    cron: '0 18 * * 5',
    cronDescription: '매주 금요일 오후 6:00',
    modelId: 'claude-haiku-4.5',
    prompt: '이번 주 변경된 API 엔드포인트의 문서를 업데이트해주세요.',
    status: 'paused',
    lastRunAt: '2026-02-21T09:00:00Z',
    runCount: 3,
    createdAt: '2026-02-10T14:00:00Z',
    updatedAt: '2026-02-21T09:00:00Z',
  },
  {
    id: 'sched-4',
    title: '성능 벤치마크',
    description: '매일 자정에 애플리케이션 성능 벤치마크를 실행합니다.',
    cron: '0 0 * * *',
    cronDescription: '매일 자정',
    modelId: 'claude-sonnet-4.6',
    prompt: '애플리케이션 주요 기능의 성능을 측정하고 병목 지점을 분석해주세요.',
    status: 'completed',
    lastRunAt: '2026-03-01T15:00:00Z',
    runCount: 30,
    createdAt: '2026-01-31T00:00:00Z',
    updatedAt: '2026-03-01T15:00:00Z',
  },
]

export const useScheduleStore = create<ScheduleState>((set, get) => ({
  schedules: MOCK_SCHEDULES,
  filterTab: 'all',

  setFilterTab: (tab) => set({ filterTab: tab }),

  addSchedule: (schedule) => {
    const now = new Date().toISOString()
    const newSchedule: Schedule = {
      ...schedule,
      id: `sched-${Date.now()}`,
      runCount: 0,
      createdAt: now,
      updatedAt: now,
    }
    set((state) => ({ schedules: [newSchedule, ...state.schedules] }))
  },

  updateSchedule: (id, updates) => {
    set((state) => ({
      schedules: state.schedules.map((s) =>
        s.id === id ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s
      ),
    }))
  },

  deleteSchedule: (id) => {
    set((state) => ({
      schedules: state.schedules.filter((s) => s.id !== id),
    }))
  },

  togglePause: (id) => {
    set((state) => ({
      schedules: state.schedules.map((s) => {
        if (s.id !== id) return s
        const newStatus: ScheduleStatus = s.status === 'active' ? 'paused' : 'active'
        return { ...s, status: newStatus, updatedAt: new Date().toISOString() }
      }),
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
