import { describe, it, expect, beforeEach, vi } from 'vitest'
import { usePhilosopherStore } from '../philosopher.store'
vi.mock('@/shared/lib/db', () => new Proxy({}, { get: () => vi.fn().mockResolvedValue([]) }))
describe('PhilosopherStore', () => {
  beforeEach(() => { usePhilosopherStore.setState({ dialogues: [], selectedId: null }) })
  it('should create with opening message', () => { usePhilosopherStore.getState().createDialogue('ethics'); expect(usePhilosopherStore.getState().dialogues[0].messages).toHaveLength(1); expect(usePhilosopherStore.getState().dialogues[0].messages[0].role).toBe('socrates') })
  it('should add message', () => { usePhilosopherStore.getState().createDialogue('logic'); const id = usePhilosopherStore.getState().dialogues[0].id; usePhilosopherStore.getState().addMessage(id, 'user', 'I think therefore I am'); expect(usePhilosopherStore.getState().dialogues[0].messages).toHaveLength(2) })
  it('should set experiment', () => { usePhilosopherStore.getState().createDialogue('metaphysics'); usePhilosopherStore.getState().setExperiment(usePhilosopherStore.getState().dialogues[0].id, 'Ship of Theseus'); expect(usePhilosopherStore.getState().dialogues[0].experiment).toBe('Ship of Theseus') })
  it('should delete', () => { usePhilosopherStore.getState().createDialogue('aesthetics'); usePhilosopherStore.getState().deleteDialogue(usePhilosopherStore.getState().dialogues[0].id); expect(usePhilosopherStore.getState().dialogues).toHaveLength(0) })
})
