import { create } from 'zustand'
import type { SocialPost, SocialPlatform, PostTone } from '@/shared/types'
import { getAllSocialPosts, putSocialPost, deleteSocialPostFromDb } from '@/shared/lib/db'
interface SocialMediaState { posts: SocialPost[]; hydrate: () => void; createPost: (platform: SocialPlatform, content: string, tone: PostTone, hashtags: string[]) => void; deletePost: (id: string) => void; updateContent: (id: string, content: string) => void }
export const useSocialMediaStore = create<SocialMediaState>((set) => ({
  posts: [],
  hydrate: () => { getAllSocialPosts().then((posts) => set({ posts })) },
  createPost: (platform, content, tone, hashtags) => { const p: SocialPost = { id: crypto.randomUUID(), platform, content, tone, hashtags, createdAt: new Date().toISOString() }; set((s) => ({ posts: [p, ...s.posts] })); putSocialPost(p) },
  deletePost: (id) => { set((s) => ({ posts: s.posts.filter((p) => p.id !== id) })); deleteSocialPostFromDb(id) },
  updateContent: (id, content) => { set((s) => ({ posts: s.posts.map((p) => p.id === id ? { ...p, content } : p) })) },
}))
