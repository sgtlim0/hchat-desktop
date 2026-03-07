import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useVoiceCloneStore } from '../voice-clone.store'
vi.mock('@/shared/lib/db', () => ({ getAllVoiceNarrations: vi.fn().mockResolvedValue([]), putVoiceNarration: vi.fn(), deleteVoiceNarrationFromDb: vi.fn() }))
describe('VoiceCloneStore', () => {
  beforeEach(() => { useVoiceCloneStore.setState({ narrations: [] }) })
  it('should create narration with preset config', () => { useVoiceCloneStore.getState().createNarration('Hello world', 'anchor'); const n = useVoiceCloneStore.getState().narrations[0]; expect(n.pitch).toBe(0.9); expect(n.rate).toBe(1.0) })
  it('should update text', () => { useVoiceCloneStore.getState().createNarration('Old', 'dj'); useVoiceCloneStore.getState().updateText(useVoiceCloneStore.getState().narrations[0].id, 'New'); expect(useVoiceCloneStore.getState().narrations[0].text).toBe('New') })
  it('should delete', () => { useVoiceCloneStore.getState().createNarration('X', 'narrator'); useVoiceCloneStore.getState().deleteNarration(useVoiceCloneStore.getState().narrations[0].id); expect(useVoiceCloneStore.getState().narrations).toHaveLength(0) })
})
