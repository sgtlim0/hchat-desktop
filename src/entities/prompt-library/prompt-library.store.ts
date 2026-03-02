import { create } from 'zustand'
import type { SavedPrompt, PromptCategory } from '@/shared/types'
import { getAllPrompts, putPrompt, deletePromptFromDb } from '@/shared/lib/db'

interface PromptLibraryState {
  prompts: SavedPrompt[]
  hydrated: boolean

  hydrate: () => Promise<void>
  addPrompt: (prompt: SavedPrompt) => void
  updatePrompt: (id: string, updates: Partial<SavedPrompt>) => void
  deletePrompt: (id: string) => void
  toggleFavorite: (id: string) => void
  incrementUsage: (id: string) => void
  getByCategory: (category: PromptCategory) => SavedPrompt[]
}

export const usePromptLibraryStore = create<PromptLibraryState>((set, get) => ({
  prompts: [],
  hydrated: false,

  hydrate: async () => {
    try {
      const prompts = await getAllPrompts()
      set({ prompts, hydrated: true })
    } catch (error) {
      console.error('Failed to hydrate prompt library store:', error)
      set({ hydrated: true })
    }
  },

  addPrompt: (prompt) => {
    set((state) => ({ prompts: [prompt, ...state.prompts] }))
    putPrompt(prompt).catch(console.error)
  },

  updatePrompt: (id, updates) => {
    set((state) => ({
      prompts: state.prompts.map((p) =>
        p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p,
      ),
    }))
    const updated = get().prompts.find((p) => p.id === id)
    if (updated) putPrompt(updated).catch(console.error)
  },

  deletePrompt: (id) => {
    set((state) => ({ prompts: state.prompts.filter((p) => p.id !== id) }))
    deletePromptFromDb(id).catch(console.error)
  },

  toggleFavorite: (id) => {
    const prompt = get().prompts.find((p) => p.id === id)
    if (prompt) {
      get().updatePrompt(id, { isFavorite: !prompt.isFavorite })
    }
  },

  incrementUsage: (id) => {
    const prompt = get().prompts.find((p) => p.id === id)
    if (prompt) {
      get().updatePrompt(id, { usageCount: prompt.usageCount + 1 })
    }
  },

  getByCategory: (category) => {
    return get().prompts.filter((p) => p.category === category)
  },
}))
