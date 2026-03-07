import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useOkrStore } from '../okr.store'
vi.mock('@/shared/lib/db', () => ({ getAllOkrObjectives: vi.fn().mockResolvedValue([]), putOkrObjective: vi.fn(), deleteOkrObjectiveFromDb: vi.fn() }))
describe('OkrStore', () => {
  beforeEach(() => { useOkrStore.setState({ objectives: [], selectedId: null }) })
  it('should create objective', () => { useOkrStore.getState().createObjective('Grow Revenue', '2026-Q1'); expect(useOkrStore.getState().objectives).toHaveLength(1) })
  it('should add key result and compute progress', () => { useOkrStore.getState().createObjective('T', 'Q1'); const id = useOkrStore.getState().objectives[0].id; useOkrStore.getState().addKeyResult(id, { id: 'kr1', title: 'KR1', target: 100, current: 50, unit: '%' }); expect(useOkrStore.getState().objectives[0].progress).toBe(50) })
  it('should update key result', () => { useOkrStore.getState().createObjective('T', 'Q1'); const id = useOkrStore.getState().objectives[0].id; useOkrStore.getState().addKeyResult(id, { id: 'kr1', title: 'KR1', target: 100, current: 0, unit: '%' }); useOkrStore.getState().updateKeyResult(id, 'kr1', 75); expect(useOkrStore.getState().objectives[0].keyResults[0].current).toBe(75) })
  it('should delete', () => { useOkrStore.getState().createObjective('T', 'Q1'); useOkrStore.getState().deleteObjective(useOkrStore.getState().objectives[0].id); expect(useOkrStore.getState().objectives).toHaveLength(0) })
})
