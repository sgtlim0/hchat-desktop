import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useScheduleStore } from '../schedule.store'

vi.mock('@/shared/lib/db', () => ({
  getAllSchedules: vi.fn().mockResolvedValue([]),
  putSchedule: vi.fn().mockResolvedValue(undefined),
  deleteScheduleFromDb: vi.fn().mockResolvedValue(undefined),
}))

describe('useScheduleStore', () => {
  beforeEach(() => {
    // Reset to initial state with mock data
    useScheduleStore.setState({
      schedules: [
        {
          id: 'sched-1',
          title: 'Daily Task',
          description: 'Daily description',
          cron: '0 9 * * *',
          cronDescription: '매일 오전 9:00',
          modelId: 'claude-sonnet-4.6',
          prompt: 'Daily prompt',
          status: 'active',
          lastRunAt: '2026-03-02T00:00:00Z',
          nextRunAt: '2026-03-03T00:00:00Z',
          runCount: 15,
          createdAt: '2026-02-15T10:00:00Z',
          updatedAt: '2026-03-02T00:00:00Z',
        },
        {
          id: 'sched-2',
          title: 'Paused Task',
          description: 'Paused description',
          cron: '0 8 * * 1',
          cronDescription: '매주 월요일 오전 8:00',
          modelId: 'claude-opus-4.6',
          prompt: 'Paused prompt',
          status: 'paused',
          lastRunAt: '2026-02-21T09:00:00Z',
          runCount: 3,
          createdAt: '2026-02-10T14:00:00Z',
          updatedAt: '2026-02-21T09:00:00Z',
        },
        {
          id: 'sched-3',
          title: 'Completed Task',
          description: 'Completed description',
          cron: '0 0 * * *',
          cronDescription: '매일 자정',
          modelId: 'claude-sonnet-4.6',
          prompt: 'Completed prompt',
          status: 'completed',
          lastRunAt: '2026-03-01T15:00:00Z',
          runCount: 30,
          createdAt: '2026-01-31T00:00:00Z',
          updatedAt: '2026-03-01T15:00:00Z',
        },
      ],
      filterTab: 'all',
    })
  })

  describe('initial state', () => {
    it('has mock schedules', () => {
      expect(useScheduleStore.getState().schedules.length).toBeGreaterThan(0)
    })

    it('defaults to all filter', () => {
      expect(useScheduleStore.getState().filterTab).toBe('all')
    })
  })

  describe('setFilterTab', () => {
    it('sets filter to all', () => {
      useScheduleStore.getState().setFilterTab('all')
      expect(useScheduleStore.getState().filterTab).toBe('all')
    })

    it('sets filter to active', () => {
      useScheduleStore.getState().setFilterTab('active')
      expect(useScheduleStore.getState().filterTab).toBe('active')
    })

    it('sets filter to paused', () => {
      useScheduleStore.getState().setFilterTab('paused')
      expect(useScheduleStore.getState().filterTab).toBe('paused')
    })

    it('sets filter to completed', () => {
      useScheduleStore.getState().setFilterTab('completed')
      expect(useScheduleStore.getState().filterTab).toBe('completed')
    })
  })

  describe('addSchedule', () => {
    it('adds a new schedule', async () => {
      const initialLength = useScheduleStore.getState().schedules.length

      await useScheduleStore.getState().addSchedule({
        title: 'New Task',
        description: 'New description',
        cron: '0 10 * * *',
        cronDescription: '매일 오전 10:00',
        modelId: 'claude-haiku-4.5',
        prompt: 'New prompt',
        status: 'active',
      })

      expect(useScheduleStore.getState().schedules).toHaveLength(initialLength + 1)
    })

    it('generates unique ID with timestamp', async () => {
      await useScheduleStore.getState().addSchedule({
        title: 'Task 1',
        description: 'Description',
        cron: '0 10 * * *',
        cronDescription: '매일 오전 10:00',
        modelId: 'claude-sonnet-4.6',
        prompt: 'Prompt',
        status: 'active',
      })

      const schedule = useScheduleStore.getState().schedules[0]
      expect(schedule.id).toMatch(/^sched-\d+$/)
    })

    it('sets runCount to 0', async () => {
      await useScheduleStore.getState().addSchedule({
        title: 'New Task',
        description: 'Description',
        cron: '0 10 * * *',
        cronDescription: '매일 오전 10:00',
        modelId: 'claude-sonnet-4.6',
        prompt: 'Prompt',
        status: 'active',
      })

      const schedule = useScheduleStore.getState().schedules[0]
      expect(schedule.runCount).toBe(0)
    })

    it('sets createdAt and updatedAt', async () => {
      await useScheduleStore.getState().addSchedule({
        title: 'New Task',
        description: 'Description',
        cron: '0 10 * * *',
        cronDescription: '매일 오전 10:00',
        modelId: 'claude-sonnet-4.6',
        prompt: 'Prompt',
        status: 'active',
      })

      const schedule = useScheduleStore.getState().schedules[0]
      expect(schedule.createdAt).toBeDefined()
      expect(schedule.updatedAt).toBe(schedule.createdAt)
    })

    it('adds schedule to beginning of list', async () => {
      await useScheduleStore.getState().addSchedule({
        title: 'Newest Task',
        description: 'Description',
        cron: '0 10 * * *',
        cronDescription: '매일 오전 10:00',
        modelId: 'claude-sonnet-4.6',
        prompt: 'Prompt',
        status: 'active',
      })

      expect(useScheduleStore.getState().schedules[0].title).toBe('Newest Task')
    })

    it('preserves optional fields', async () => {
      await useScheduleStore.getState().addSchedule({
        title: 'Task',
        description: 'Description',
        cron: '0 10 * * *',
        cronDescription: '매일 오전 10:00',
        modelId: 'claude-sonnet-4.6',
        prompt: 'Prompt',
        status: 'active',
        lastRunAt: '2026-03-01T00:00:00Z',
        nextRunAt: '2026-03-02T00:00:00Z',
      })

      const schedule = useScheduleStore.getState().schedules[0]
      expect(schedule.lastRunAt).toBe('2026-03-01T00:00:00Z')
      expect(schedule.nextRunAt).toBe('2026-03-02T00:00:00Z')
    })
  })

  describe('updateSchedule', () => {
    it('updates schedule title', async () => {
      const scheduleId = useScheduleStore.getState().schedules[0].id

      await useScheduleStore.getState().updateSchedule(scheduleId, { title: 'Updated Title' })

      const updated = useScheduleStore.getState().schedules.find((s) => s.id === scheduleId)
      expect(updated?.title).toBe('Updated Title')
    })

    it('updates schedule cron', async () => {
      const scheduleId = useScheduleStore.getState().schedules[0].id

      await useScheduleStore.getState().updateSchedule(scheduleId, {
        cron: '0 12 * * *',
        cronDescription: '매일 정오',
      })

      const updated = useScheduleStore.getState().schedules.find((s) => s.id === scheduleId)
      expect(updated?.cron).toBe('0 12 * * *')
      expect(updated?.cronDescription).toBe('매일 정오')
    })

    it('updates schedule status', async () => {
      const scheduleId = useScheduleStore.getState().schedules[0].id

      await useScheduleStore.getState().updateSchedule(scheduleId, { status: 'paused' })

      const updated = useScheduleStore.getState().schedules.find((s) => s.id === scheduleId)
      expect(updated?.status).toBe('paused')
    })

    it('updates updatedAt timestamp', async () => {
      const scheduleId = useScheduleStore.getState().schedules[0].id
      const originalUpdatedAt = useScheduleStore.getState().schedules[0].updatedAt

      await useScheduleStore.getState().updateSchedule(scheduleId, { title: 'Updated' })

      const updated = useScheduleStore.getState().schedules.find((s) => s.id === scheduleId)
      expect(updated?.updatedAt).not.toBe(originalUpdatedAt)
    })

    it('does not update other schedules', async () => {
      const scheduleId = useScheduleStore.getState().schedules[0].id
      const otherSchedule = useScheduleStore.getState().schedules[1]

      await useScheduleStore.getState().updateSchedule(scheduleId, { title: 'Updated' })

      const unchanged = useScheduleStore.getState().schedules.find((s) => s.id === otherSchedule.id)
      expect(unchanged?.title).toBe(otherSchedule.title)
    })

    it('preserves unchanged fields', async () => {
      const scheduleId = useScheduleStore.getState().schedules[0].id
      const original = useScheduleStore.getState().schedules[0]

      await useScheduleStore.getState().updateSchedule(scheduleId, { title: 'Updated' })

      const updated = useScheduleStore.getState().schedules.find((s) => s.id === scheduleId)
      expect(updated?.description).toBe(original.description)
      expect(updated?.cron).toBe(original.cron)
      expect(updated?.modelId).toBe(original.modelId)
      expect(updated?.prompt).toBe(original.prompt)
      expect(updated?.runCount).toBe(original.runCount)
      expect(updated?.createdAt).toBe(original.createdAt)
    })
  })

  describe('deleteSchedule', () => {
    it('removes schedule from list', async () => {
      const initialLength = useScheduleStore.getState().schedules.length
      const scheduleId = useScheduleStore.getState().schedules[0].id

      await useScheduleStore.getState().deleteSchedule(scheduleId)

      expect(useScheduleStore.getState().schedules).toHaveLength(initialLength - 1)
      expect(useScheduleStore.getState().schedules.find((s) => s.id === scheduleId)).toBeUndefined()
    })

    it('does not affect other schedules', async () => {
      const scheduleToDelete = useScheduleStore.getState().schedules[0].id
      const scheduleToKeep = useScheduleStore.getState().schedules[1]

      await useScheduleStore.getState().deleteSchedule(scheduleToDelete)

      const remaining = useScheduleStore.getState().schedules.find((s) => s.id === scheduleToKeep.id)
      expect(remaining).toBeDefined()
      expect(remaining).toEqual(scheduleToKeep)
    })
  })

  describe('togglePause', () => {
    it('pauses an active schedule', async () => {
      const scheduleId = useScheduleStore.getState().schedules.find((s) => s.status === 'active')!.id

      await useScheduleStore.getState().togglePause(scheduleId)

      const updated = useScheduleStore.getState().schedules.find((s) => s.id === scheduleId)
      expect(updated?.status).toBe('paused')
    })

    it('activates a paused schedule', async () => {
      const scheduleId = useScheduleStore.getState().schedules.find((s) => s.status === 'paused')!.id

      await useScheduleStore.getState().togglePause(scheduleId)

      const updated = useScheduleStore.getState().schedules.find((s) => s.id === scheduleId)
      expect(updated?.status).toBe('active')
    })

    it('updates updatedAt timestamp', async () => {
      const schedule = useScheduleStore.getState().schedules.find((s) => s.status === 'active')!
      const originalUpdatedAt = schedule.updatedAt

      await useScheduleStore.getState().togglePause(schedule.id)

      const updated = useScheduleStore.getState().schedules.find((s) => s.id === schedule.id)
      expect(updated?.updatedAt).not.toBe(originalUpdatedAt)
    })

    it('does not affect other schedules', async () => {
      const scheduleToToggle = useScheduleStore.getState().schedules[0]
      const otherSchedule = useScheduleStore.getState().schedules[1]

      await useScheduleStore.getState().togglePause(scheduleToToggle.id)

      const unchanged = useScheduleStore.getState().schedules.find((s) => s.id === otherSchedule.id)
      expect(unchanged?.status).toBe(otherSchedule.status)
    })

    it('preserves other fields', async () => {
      const original = useScheduleStore.getState().schedules[0]

      await useScheduleStore.getState().togglePause(original.id)

      const updated = useScheduleStore.getState().schedules[0]
      expect(updated.title).toBe(original.title)
      expect(updated.description).toBe(original.description)
      expect(updated.cron).toBe(original.cron)
      expect(updated.modelId).toBe(original.modelId)
      expect(updated.prompt).toBe(original.prompt)
      expect(updated.runCount).toBe(original.runCount)
      expect(updated.createdAt).toBe(original.createdAt)
    })
  })

  describe('filteredSchedules', () => {
    it('returns all schedules when filter is all', () => {
      useScheduleStore.getState().setFilterTab('all')
      const filtered = useScheduleStore.getState().filteredSchedules()

      expect(filtered).toHaveLength(useScheduleStore.getState().schedules.length)
    })

    it('returns only active schedules', () => {
      useScheduleStore.getState().setFilterTab('active')
      const filtered = useScheduleStore.getState().filteredSchedules()

      expect(filtered.every((s) => s.status === 'active')).toBe(true)
      expect(filtered.length).toBeGreaterThan(0)
    })

    it('returns only paused schedules', () => {
      useScheduleStore.getState().setFilterTab('paused')
      const filtered = useScheduleStore.getState().filteredSchedules()

      expect(filtered.every((s) => s.status === 'paused')).toBe(true)
      expect(filtered.length).toBeGreaterThan(0)
    })

    it('returns only completed schedules', () => {
      useScheduleStore.getState().setFilterTab('completed')
      const filtered = useScheduleStore.getState().filteredSchedules()

      expect(filtered.every((s) => s.status === 'completed')).toBe(true)
      expect(filtered.length).toBeGreaterThan(0)
    })

    it('returns empty array when no matches', () => {
      // Remove all active schedules
      useScheduleStore.setState({
        schedules: [
          {
            id: 'sched-1',
            title: 'Task',
            description: 'Description',
            cron: '0 9 * * *',
            cronDescription: '매일 오전 9:00',
            modelId: 'claude-sonnet-4.6',
            prompt: 'Prompt',
            status: 'paused',
            runCount: 0,
            createdAt: '2026-03-01T00:00:00Z',
            updatedAt: '2026-03-01T00:00:00Z',
          },
        ],
        filterTab: 'all',
      })

      useScheduleStore.getState().setFilterTab('active')
      const filtered = useScheduleStore.getState().filteredSchedules()

      expect(filtered).toHaveLength(0)
    })
  })

  describe('stats', () => {
    it('counts active schedules', () => {
      const stats = useScheduleStore.getState().stats()
      const activeCount = useScheduleStore.getState().schedules.filter((s) => s.status === 'active').length

      expect(stats.active).toBe(activeCount)
    })

    it('counts paused schedules', () => {
      const stats = useScheduleStore.getState().stats()
      const pausedCount = useScheduleStore.getState().schedules.filter((s) => s.status === 'paused').length

      expect(stats.paused).toBe(pausedCount)
    })

    it('counts completed schedules', () => {
      const stats = useScheduleStore.getState().stats()
      const completedCount = useScheduleStore.getState().schedules.filter((s) => s.status === 'completed').length

      expect(stats.completed).toBe(completedCount)
    })

    it('returns zero for empty schedules', () => {
      useScheduleStore.setState({ schedules: [], filterTab: 'all' })

      const stats = useScheduleStore.getState().stats()

      expect(stats.active).toBe(0)
      expect(stats.paused).toBe(0)
      expect(stats.completed).toBe(0)
    })

    it('updates when schedules change', async () => {
      const initialStats = useScheduleStore.getState().stats()

      await useScheduleStore.getState().addSchedule({
        title: 'New Active Task',
        description: 'Description',
        cron: '0 10 * * *',
        cronDescription: '매일 오전 10:00',
        modelId: 'claude-sonnet-4.6',
        prompt: 'Prompt',
        status: 'active',
      })

      const updatedStats = useScheduleStore.getState().stats()

      expect(updatedStats.active).toBe(initialStats.active + 1)
    })
  })
})
