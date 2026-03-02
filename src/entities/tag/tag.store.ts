import { create } from 'zustand'
import type { Tag } from '@/shared/types'
import { getAllTags, putTag, deleteTagFromDb } from '@/shared/lib/db'

interface TagState {
  tags: Tag[]

  // Actions
  hydrate: () => Promise<void>
  addTag: (name: string, color: string) => Promise<void>
  updateTag: (id: string, updates: Partial<Omit<Tag, 'id'>>) => Promise<void>
  deleteTag: (id: string) => Promise<void>
}

export const useTagStore = create<TagState>((set, get) => ({
  tags: [],

  hydrate: async () => {
    const tags = await getAllTags()
    set({ tags })
  },

  addTag: async (name, color) => {
    const newTag: Tag = {
      id: `tag-${Date.now()}`,
      name,
      color,
    }
    await putTag(newTag)
    set((state) => ({
      tags: [...state.tags, newTag],
    }))
  },

  updateTag: async (id, updates) => {
    const tag = get().tags.find((t) => t.id === id)
    if (!tag) return

    const updatedTag = { ...tag, ...updates }
    await putTag(updatedTag)
    set((state) => ({
      tags: state.tags.map((t) =>
        t.id === id ? updatedTag : t
      ),
    }))
  },

  deleteTag: async (id) => {
    await deleteTagFromDb(id)
    set((state) => ({
      tags: state.tags.filter((t) => t.id !== id),
    }))
  },
}))
