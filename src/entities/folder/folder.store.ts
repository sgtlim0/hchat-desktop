import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Folder } from '@/shared/types'

interface FolderState {
  folders: Folder[]
  selectedFolderId: string | null

  // Actions
  addFolder: (name: string, color: string) => void
  updateFolder: (id: string, updates: Partial<Omit<Folder, 'id' | 'createdAt'>>) => void
  deleteFolder: (id: string) => void
  selectFolder: (id: string | null) => void
}

export const useFolderStore = create<FolderState>()(
  persist(
    (set) => ({
      folders: [],
      selectedFolderId: null,

      addFolder: (name, color) => {
        const newFolder: Folder = {
          id: `folder-${Date.now()}`,
          name,
          color,
          createdAt: new Date().toISOString(),
        }
        set((state) => ({
          folders: [...state.folders, newFolder],
        }))
      },

      updateFolder: (id, updates) => {
        set((state) => ({
          folders: state.folders.map((f) =>
            f.id === id ? { ...f, ...updates } : f
          ),
        }))
      },

      deleteFolder: (id) => {
        set((state) => ({
          folders: state.folders.filter((f) => f.id !== id),
          selectedFolderId: state.selectedFolderId === id ? null : state.selectedFolderId,
        }))
      },

      selectFolder: (id) => {
        set({ selectedFolderId: id })
      },
    }),
    {
      name: 'hchat-folders',
    }
  )
)
