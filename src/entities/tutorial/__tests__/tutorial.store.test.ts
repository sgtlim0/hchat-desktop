import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useTutorialStore } from '../tutorial.store'
vi.mock('@/shared/lib/db', () => ({ getAllTutorials: vi.fn().mockResolvedValue([]), putTutorial: vi.fn().mockResolvedValue(undefined), deleteTutorialFromDb: vi.fn().mockResolvedValue(undefined) }))
describe('TutorialStore', () => {
  beforeEach(() => { useTutorialStore.setState({ tutorials: [], selectedTutorialId: null }) })
  it('should create tutorial', () => { useTutorialStore.getState().createTutorial('Guide'); expect(useTutorialStore.getState().tutorials).toHaveLength(1) })
  it('should add step', () => { useTutorialStore.getState().createTutorial('T'); const id = useTutorialStore.getState().tutorials[0].id; useTutorialStore.getState().addStep(id, 'S1', 'Desc'); expect(useTutorialStore.getState().tutorials[0].steps).toHaveLength(1) })
  it('should remove step', () => { useTutorialStore.getState().createTutorial('T'); const id = useTutorialStore.getState().tutorials[0].id; useTutorialStore.getState().addStep(id, 'S1', ''); const sid = useTutorialStore.getState().tutorials[0].steps[0].id; useTutorialStore.getState().removeStep(id, sid); expect(useTutorialStore.getState().tutorials[0].steps).toHaveLength(0) })
  it('should delete tutorial', () => { useTutorialStore.getState().createTutorial('T'); useTutorialStore.getState().deleteTutorial(useTutorialStore.getState().tutorials[0].id); expect(useTutorialStore.getState().tutorials).toHaveLength(0) })
})
