import { create } from 'zustand'
import type { Folder } from '@/shared/types'
import { getAllFolders, putFolder, deleteFolderFromDb } from '@/shared/lib/db'

interface FolderState {
  folders: Folder[]
  selectedFolderId: string | null

  // Actions
  hydrate: () => Promise<void>
  addFolder: (name: string, color: string) => Promise<void>
  updateFolder: (id: string, updates: Partial<Omit<Folder, 'id' | 'createdAt'>>) => Promise<void>
  deleteFolder: (id: string) => Promise<void>
  selectFolder: (id: string | null) => void
}

export const useFolderStore = create<FolderState>((set, get) => ({
  folders: [],
  selectedFolderId: null,

  hydrate: async () => {
    const folders = await getAllFolders()
    set({ folders })
  },

  addFolder: async (name, color) => {
    const newFolder: Folder = {
      id: `folder-${Date.now()}`,
      name,
      color,
      createdAt: new Date().toISOString(),
    }
    await putFolder(newFolder)
    set((state) => ({
      folders: [...state.folders, newFolder],
    }))
  },

  updateFolder: async (id, updates) => {
    const folder = get().folders.find((f) => f.id === id)
    if (!folder) return

    const updatedFolder = { ...folder, ...updates }
    await putFolder(updatedFolder)
    set((state) => ({
      folders: state.folders.map((f) =>
        f.id === id ? updatedFolder : f
      ),
    }))
  },

  deleteFolder: async (id) => {
    await deleteFolderFromDb(id)
    set((state) => ({
      folders: state.folders.filter((f) => f.id !== id),
      selectedFolderId: state.selectedFolderId === id ? null : state.selectedFolderId,
    }))
  },

  selectFolder: (id) => {
    set({ selectedFolderId: id })
  },
}))
