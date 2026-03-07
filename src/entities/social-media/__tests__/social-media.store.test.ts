import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useSocialMediaStore } from '../social-media.store'
vi.mock('@/shared/lib/db', () => ({ getAllSocialPosts: vi.fn().mockResolvedValue([]), putSocialPost: vi.fn(), deleteSocialPostFromDb: vi.fn() }))
describe('SocialMediaStore', () => {
  beforeEach(() => { useSocialMediaStore.setState({ posts: [] }) })
  it('should create post', () => { useSocialMediaStore.getState().createPost('linkedin', 'Hello world', 'professional', ['#tech']); expect(useSocialMediaStore.getState().posts).toHaveLength(1) })
  it('should update content', () => { useSocialMediaStore.getState().createPost('twitter', 'Draft', 'casual', []); useSocialMediaStore.getState().updateContent(useSocialMediaStore.getState().posts[0].id, 'Final'); expect(useSocialMediaStore.getState().posts[0].content).toBe('Final') })
  it('should delete', () => { useSocialMediaStore.getState().createPost('instagram', 'X', 'humorous', []); useSocialMediaStore.getState().deletePost(useSocialMediaStore.getState().posts[0].id); expect(useSocialMediaStore.getState().posts).toHaveLength(0) })
})
