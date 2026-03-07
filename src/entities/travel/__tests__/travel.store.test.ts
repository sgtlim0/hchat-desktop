import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useTravelStore } from '../travel.store'
vi.mock('@/shared/lib/db', () => ({ getAllTravelPlans: vi.fn().mockResolvedValue([]), putTravelPlan: vi.fn().mockResolvedValue(undefined), deleteTravelPlanFromDb: vi.fn().mockResolvedValue(undefined) }))
describe('TravelStore', () => {
  beforeEach(() => { useTravelStore.setState({ plans: [], selectedPlanId: null }) })
  it('should create plan', () => { useTravelStore.getState().createPlan('Tokyo', 'Japan', '2026-04-01', '2026-04-07', 3000); expect(useTravelStore.getState().plans).toHaveLength(1) })
  it('should add day', () => { useTravelStore.getState().createPlan('T', 'J', '2026-04-01', '2026-04-02', 1000); const id = useTravelStore.getState().plans[0].id; useTravelStore.getState().addDay(id, { id: 'd1', date: '2026-04-01', places: ['Temple'], transport: 'Train', notes: '' }); expect(useTravelStore.getState().plans[0].days).toHaveLength(1) })
  it('should delete plan', () => { useTravelStore.getState().createPlan('T', 'J', '', '', 0); useTravelStore.getState().deletePlan(useTravelStore.getState().plans[0].id); expect(useTravelStore.getState().plans).toHaveLength(0) })
})
