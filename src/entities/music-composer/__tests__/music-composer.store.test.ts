import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useMusicComposerStore } from '../music-composer.store'
vi.mock('@/shared/lib/db', () => new Proxy({}, { get: () => vi.fn().mockResolvedValue([]) }))
describe('MusicComposerStore', () => {
  beforeEach(() => { useMusicComposerStore.setState({ compositions: [], selectedId: null }) })
  it('should create', () => { useMusicComposerStore.getState().createComposition('Song', 'pop', 120); expect(useMusicComposerStore.getState().compositions).toHaveLength(1) })
  it('should add chord', () => { useMusicComposerStore.getState().createComposition('S', 'rock', 140); const id = useMusicComposerStore.getState().compositions[0].id; useMusicComposerStore.getState().addChord(id, { id: 'c1', name: 'C', notes: ['C','E','G'], duration: 1 }); expect(useMusicComposerStore.getState().compositions[0].chords).toHaveLength(1) })
  it('should delete', () => { useMusicComposerStore.getState().createComposition('S', 'jazz', 100); useMusicComposerStore.getState().deleteComposition(useMusicComposerStore.getState().compositions[0].id); expect(useMusicComposerStore.getState().compositions).toHaveLength(0) })
})
