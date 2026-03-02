import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Tag } from '@/shared/types'

interface TagState {
  tags: Tag[]

  // Actions
  addTag: (name: string, color: string) => void
  updateTag: (id: string, updates: Partial<Omit<Tag, 'id'>>) => void
  deleteTag: (id: string) => void
}

export const useTagStore = create<TagState>()(
  persist(
    (set) => ({
      tags: [],

      addTag: (name, color) => {
        const newTag: Tag = {
          id: `tag-${Date.now()}`,
          name,
          color,
        }
        set((state) => ({
          tags: [...state.tags, newTag],
        }))
      },

      updateTag: (id, updates) => {
        set((state) => ({
          tags: state.tags.map((t) =>
            t.id === id ? { ...t, ...updates } : t
          ),
        }))
      },

      deleteTag: (id) => {
        set((state) => ({
          tags: state.tags.filter((t) => t.id !== id),
        }))
      },
    }),
    {
      name: 'hchat-tags',
    }
  )
)
