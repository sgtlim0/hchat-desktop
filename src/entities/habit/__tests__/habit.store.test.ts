import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useHabitStore } from '../habit.store'
vi.mock('@/shared/lib/db', () => ({ getAllHabits: vi.fn().mockResolvedValue([]), putHabit: vi.fn().mockResolvedValue(undefined), deleteHabitFromDb: vi.fn().mockResolvedValue(undefined) }))
describe('HabitStore', () => {
  beforeEach(() => { useHabitStore.setState({ habits: [] }) })
  it('should create habit', async () => { await useHabitStore.getState().createHabit('Run', 'daily', '🏃', '#f00'); expect(useHabitStore.getState().habits).toHaveLength(1) })
  it('should toggle complete', async () => { await useHabitStore.getState().createHabit('Read', 'daily', '📖', '#00f'); const id = useHabitStore.getState().habits[0].id; const today = new Date().toISOString().split('T')[0]; await useHabitStore.getState().toggleComplete(id, today); expect(useHabitStore.getState().habits[0].completedDates).toContain(today) })
  it('should untoggle', async () => { await useHabitStore.getState().createHabit('X', 'daily', '✅', '#000'); const id = useHabitStore.getState().habits[0].id; const d = '2026-03-07'; await useHabitStore.getState().toggleComplete(id, d); await useHabitStore.getState().toggleComplete(id, d); expect(useHabitStore.getState().habits[0].completedDates).not.toContain(d) })
  it('should delete habit', async () => { await useHabitStore.getState().createHabit('T', 'weekly', '✅', '#000'); await useHabitStore.getState().deleteHabit(useHabitStore.getState().habits[0].id); expect(useHabitStore.getState().habits).toHaveLength(0) })
})
