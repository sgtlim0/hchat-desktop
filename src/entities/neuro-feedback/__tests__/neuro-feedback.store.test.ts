import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useNeuroFeedbackStore } from '../neuro-feedback.store'
vi.mock('@/shared/lib/db', () => new Proxy({}, { get: () => vi.fn().mockResolvedValue([]) }))
describe('NeuroFeedbackStore', () => {
  beforeEach(() => { useNeuroFeedbackStore.setState({ entries: [], reports: [] }) })
  it('should add entry', () => { useNeuroFeedbackStore.getState().addEntry(80, 30, 70, 'Good focus'); expect(useNeuroFeedbackStore.getState().entries).toHaveLength(1) })
  it('should generate report', () => { useNeuroFeedbackStore.getState().addEntry(85, 20, 75, ''); useNeuroFeedbackStore.getState().generateReport('weekly'); expect(useNeuroFeedbackStore.getState().reports).toHaveLength(1); expect(useNeuroFeedbackStore.getState().reports[0].avgFocus).toBe(85) })
})
