import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useSpaceExplorerStore } from '../space-explorer.store'
vi.mock('@/shared/lib/db', () => new Proxy({}, { get: () => vi.fn().mockResolvedValue([]) }))
describe('SpaceExplorerStore', () => {
  beforeEach(() => { useSpaceExplorerStore.setState({ explorations: [], selectedId: null }) })
  it('should create', () => { useSpaceExplorerStore.getState().createExploration('Solar System'); expect(useSpaceExplorerStore.getState().explorations).toHaveLength(1) })
  it('should add body', () => { useSpaceExplorerStore.getState().createExploration('T'); const id = useSpaceExplorerStore.getState().explorations[0].id; useSpaceExplorerStore.getState().addBody(id, { id: 'b1', name: 'Mars', type: 'planet', description: 'Red planet', distance: 225, magnitude: -2.9 }); expect(useSpaceExplorerStore.getState().explorations[0].bodies).toHaveLength(1) })
  it('should answer quiz and score', () => { useSpaceExplorerStore.getState().createExploration('T'); const id = useSpaceExplorerStore.getState().explorations[0].id; useSpaceExplorerStore.getState().addQuiz(id, { id: 'q1', question: 'Largest planet?', options: ['Earth', 'Jupiter'], correctIndex: 1 }); useSpaceExplorerStore.getState().answerQuiz(id, 'q1', 1); expect(useSpaceExplorerStore.getState().explorations[0].score).toBe(1) })
  it('should delete', () => { useSpaceExplorerStore.getState().createExploration('T'); useSpaceExplorerStore.getState().deleteExploration(useSpaceExplorerStore.getState().explorations[0].id); expect(useSpaceExplorerStore.getState().explorations).toHaveLength(0) })
})
