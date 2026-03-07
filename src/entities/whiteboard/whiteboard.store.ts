import { create } from 'zustand'
import type { Whiteboard, WhiteboardElement } from '@/shared/types'
import { getAllWhiteboards, putWhiteboard, deleteWhiteboardFromDb } from '@/shared/lib/db'

interface WhiteboardState {
  boards: Whiteboard[]
  selectedBoardId: string | null

  hydrate: () => void
  createBoard: (title: string, template: Whiteboard['template']) => void
  deleteBoard: (id: string) => void
  addElement: (boardId: string, element: WhiteboardElement) => void
  updateElement: (boardId: string, elementId: string, updates: Partial<Omit<WhiteboardElement, 'id'>>) => void
  removeElement: (boardId: string, elementId: string) => void
  selectBoard: (id: string | null) => void
}

export const useWhiteboardStore = create<WhiteboardState>((set) => ({
  boards: [],
  selectedBoardId: null,

  hydrate: () => {
    getAllWhiteboards()
      .then((boards) => set({ boards }))
      .catch(console.error)
  },

  createBoard: (title, template) => {
    const now = new Date().toISOString()
    const board: Whiteboard = {
      id: crypto.randomUUID(),
      title,
      elements: [],
      template,
      createdAt: now,
      updatedAt: now,
    }

    set((state) => ({ boards: [board, ...state.boards] }))
    putWhiteboard(board).catch(console.error)
  },

  deleteBoard: (id) => {
    set((state) => ({
      boards: state.boards.filter((b) => b.id !== id),
      selectedBoardId: state.selectedBoardId === id ? null : state.selectedBoardId,
    }))
    deleteWhiteboardFromDb(id).catch(console.error)
  },

  addElement: (boardId, element) => {
    set((state) => ({
      boards: state.boards.map((b) => {
        if (b.id !== boardId) return b
        const updated = { ...b, elements: [...b.elements, element], updatedAt: new Date().toISOString() }
        putWhiteboard(updated).catch(console.error)
        return updated
      }),
    }))
  },

  updateElement: (boardId, elementId, updates) => {
    set((state) => ({
      boards: state.boards.map((b) => {
        if (b.id !== boardId) return b
        const updated = {
          ...b,
          elements: b.elements.map((el) => (el.id === elementId ? { ...el, ...updates } : el)),
          updatedAt: new Date().toISOString(),
        }
        putWhiteboard(updated).catch(console.error)
        return updated
      }),
    }))
  },

  removeElement: (boardId, elementId) => {
    set((state) => ({
      boards: state.boards.map((b) => {
        if (b.id !== boardId) return b
        const updated = {
          ...b,
          elements: b.elements.filter((el) => el.id !== elementId),
          updatedAt: new Date().toISOString(),
        }
        putWhiteboard(updated).catch(console.error)
        return updated
      }),
    }))
  },

  selectBoard: (id) => {
    set({ selectedBoardId: id })
  },
}))
