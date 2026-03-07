import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useDigitalTwinStore } from '../digital-twin.store'
vi.mock('@/shared/lib/db', () => new Proxy({}, { get: () => vi.fn().mockResolvedValue([]) }))
describe('DigitalTwinStore', () => {
  beforeEach(() => { useDigitalTwinStore.setState({ twins: [], selectedId: null }) })
  it('should create', () => { useDigitalTwinStore.getState().createTwin('Alex'); expect(useDigitalTwinStore.getState().twins).toHaveLength(1) })
  it('should toggle active', () => { useDigitalTwinStore.getState().createTwin('A'); useDigitalTwinStore.getState().toggleActive(useDigitalTwinStore.getState().twins[0].id); expect(useDigitalTwinStore.getState().twins[0].isActive).toBe(true) })
  it('should add pattern', () => { useDigitalTwinStore.getState().createTwin('A'); useDigitalTwinStore.getState().addPattern(useDigitalTwinStore.getState().twins[0].id, 'greeting'); expect(useDigitalTwinStore.getState().twins[0].learnedPatterns).toHaveLength(1) })
  it('should delete', () => { useDigitalTwinStore.getState().createTwin('A'); useDigitalTwinStore.getState().deleteTwin(useDigitalTwinStore.getState().twins[0].id); expect(useDigitalTwinStore.getState().twins).toHaveLength(0) })
})
