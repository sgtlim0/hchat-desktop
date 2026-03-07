import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useProjectTimelineStore } from '../project-timeline.store'
vi.mock('@/shared/lib/db', () => ({ getAllProjectTimelines: vi.fn().mockResolvedValue([]), putProjectTimeline: vi.fn(), deleteProjectTimelineFromDb: vi.fn() }))
describe('ProjectTimelineStore', () => {
  beforeEach(() => { useProjectTimelineStore.setState({ timelines: [], selectedId: null }) })
  it('should create timeline', () => { useProjectTimelineStore.getState().createTimeline('Q1 Plan'); expect(useProjectTimelineStore.getState().timelines).toHaveLength(1) })
  it('should add task', () => { useProjectTimelineStore.getState().createTimeline('T'); const id = useProjectTimelineStore.getState().timelines[0].id; useProjectTimelineStore.getState().addTask(id, { id: 't1', title: 'Design', startDate: '2026-04-01', endDate: '2026-04-05', progress: 0, dependencies: [], assignee: 'Alice' }); expect(useProjectTimelineStore.getState().timelines[0].tasks).toHaveLength(1) })
  it('should add milestone', () => { useProjectTimelineStore.getState().createTimeline('T'); const id = useProjectTimelineStore.getState().timelines[0].id; useProjectTimelineStore.getState().addMilestone(id, { id: 'm1', title: 'MVP', date: '2026-04-15', completed: false }); expect(useProjectTimelineStore.getState().timelines[0].milestones).toHaveLength(1) })
  it('should delete', () => { useProjectTimelineStore.getState().createTimeline('T'); useProjectTimelineStore.getState().deleteTimeline(useProjectTimelineStore.getState().timelines[0].id); expect(useProjectTimelineStore.getState().timelines).toHaveLength(0) })
})
