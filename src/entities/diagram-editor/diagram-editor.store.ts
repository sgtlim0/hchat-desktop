import { create } from 'zustand'
import type { Diagram, DiagramType } from '@/shared/types'
import { getAllDiagrams, putDiagram, deleteDiagramFromDb } from '@/shared/lib/db'

interface DiagramEditorState {
  diagrams: Diagram[]
  selectedDiagramId: string | null
  searchQuery: string

  hydrate: () => void
  addDiagram: (title: string, type: DiagramType, code: string) => void
  updateDiagram: (id: string, updates: Partial<Omit<Diagram, 'id' | 'createdAt'>>) => void
  deleteDiagram: (id: string) => void
  selectDiagram: (id: string | null) => void
  toggleFavorite: (id: string) => void
  setSearchQuery: (query: string) => void
  getFilteredDiagrams: () => Diagram[]
  getSelectedDiagram: () => Diagram | null
}

export const useDiagramEditorStore = create<DiagramEditorState>((set, get) => ({
  diagrams: [],
  selectedDiagramId: null,
  searchQuery: '',

  hydrate: () => {
    getAllDiagrams()
      .then((diagrams) => {
        set({ diagrams })
      })
      .catch(console.error)
  },

  addDiagram: (title, type, code) => {
    const now = new Date().toISOString()
    const diagram: Diagram = {
      id: `diagram-${Date.now()}`,
      title,
      type,
      code,
      isFavorite: false,
      createdAt: now,
      updatedAt: now,
    }

    set((state) => ({
      diagrams: [diagram, ...state.diagrams],
      selectedDiagramId: diagram.id,
    }))

    putDiagram(diagram).catch(console.error)
  },

  updateDiagram: (id, updates) => {
    set((state) => ({
      diagrams: state.diagrams.map((d) => {
        if (d.id !== id) return d

        const updated = {
          ...d,
          ...updates,
          updatedAt: new Date().toISOString(),
        }

        putDiagram(updated).catch(console.error)
        return updated
      }),
    }))
  },

  deleteDiagram: (id) => {
    set((state) => ({
      diagrams: state.diagrams.filter((d) => d.id !== id),
      selectedDiagramId: state.selectedDiagramId === id ? null : state.selectedDiagramId,
    }))

    deleteDiagramFromDb(id).catch(console.error)
  },

  selectDiagram: (id) => {
    set({ selectedDiagramId: id })
  },

  toggleFavorite: (id) => {
    set((state) => ({
      diagrams: state.diagrams.map((d) => {
        if (d.id !== id) return d

        const updated = {
          ...d,
          isFavorite: !d.isFavorite,
          updatedAt: new Date().toISOString(),
        }

        putDiagram(updated).catch(console.error)
        return updated
      }),
    }))
  },

  setSearchQuery: (query) => {
    set({ searchQuery: query })
  },

  getFilteredDiagrams: () => {
    const { diagrams, searchQuery } = get()
    if (!searchQuery.trim()) return diagrams
    const lower = searchQuery.toLowerCase()
    return diagrams.filter((d) => d.title.toLowerCase().includes(lower))
  },

  getSelectedDiagram: () => {
    const { diagrams, selectedDiagramId } = get()
    if (!selectedDiagramId) return null
    return diagrams.find((d) => d.id === selectedDiagramId) ?? null
  },
}))
