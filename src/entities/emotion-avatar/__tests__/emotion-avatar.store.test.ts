import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useEmotionAvatarStore } from '../emotion-avatar.store'
vi.mock('@/shared/lib/db', () => ({ getAllAvatarConfigs: vi.fn().mockResolvedValue([]), putAvatarConfig: vi.fn(), deleteAvatarConfigFromDb: vi.fn() }))
describe('EmotionAvatarStore', () => {
  beforeEach(() => { useEmotionAvatarStore.setState({ avatars: [], selectedId: null }) })
  it('should create with neutral emotion', () => { useEmotionAvatarStore.getState().createAvatar('Alex'); expect(useEmotionAvatarStore.getState().avatars[0].emotion).toBe('neutral') })
  it('should set emotion', () => { useEmotionAvatarStore.getState().createAvatar('A'); useEmotionAvatarStore.getState().setEmotion(useEmotionAvatarStore.getState().avatars[0].id, 'joy'); expect(useEmotionAvatarStore.getState().avatars[0].emotion).toBe('joy') })
  it('should update style', () => { useEmotionAvatarStore.getState().createAvatar('A'); useEmotionAvatarStore.getState().updateStyle(useEmotionAvatarStore.getState().avatars[0].id, { hairColor: '#ff0000' }); expect(useEmotionAvatarStore.getState().avatars[0].hairColor).toBe('#ff0000') })
  it('should delete', () => { useEmotionAvatarStore.getState().createAvatar('A'); useEmotionAvatarStore.getState().deleteAvatar(useEmotionAvatarStore.getState().avatars[0].id); expect(useEmotionAvatarStore.getState().avatars).toHaveLength(0) })
})
