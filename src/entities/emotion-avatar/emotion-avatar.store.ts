import { create } from 'zustand'
import type { AvatarConfig, AvatarEmotion } from '@/shared/types'
import { getAllAvatarConfigs, putAvatarConfig, deleteAvatarConfigFromDb } from '@/shared/lib/db'
interface EmotionAvatarState { avatars: AvatarConfig[]; selectedId: string | null; hydrate: () => void; createAvatar: (name: string) => void; deleteAvatar: (id: string) => void; setEmotion: (id: string, emotion: AvatarEmotion) => void; updateStyle: (id: string, updates: Partial<AvatarConfig>) => void; selectAvatar: (id: string | null) => void }
export const useEmotionAvatarStore = create<EmotionAvatarState>((set) => ({
  avatars: [], selectedId: null,
  hydrate: () => { getAllAvatarConfigs().then((avatars) => set({ avatars })) },
  createAvatar: (name) => { const a: AvatarConfig = { id: crypto.randomUUID(), name, emotion: 'neutral', hairStyle: 'short', hairColor: '#333', skinColor: '#f5d0a9', outfit: 'casual', createdAt: new Date().toISOString() }; set((s) => ({ avatars: [a, ...s.avatars], selectedId: a.id })); putAvatarConfig(a) },
  deleteAvatar: (id) => { set((s) => ({ avatars: s.avatars.filter((a) => a.id !== id), selectedId: s.selectedId === id ? null : s.selectedId })); deleteAvatarConfigFromDb(id) },
  setEmotion: (id, emotion) => { set((s) => ({ avatars: s.avatars.map((a) => a.id === id ? { ...a, emotion } : a) })) },
  updateStyle: (id, updates) => { set((s) => ({ avatars: s.avatars.map((a) => a.id === id ? { ...a, ...updates } : a) })) },
  selectAvatar: (id) => set({ selectedId: id }),
}))
