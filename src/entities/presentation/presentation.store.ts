import { create } from 'zustand'
import type { Presentation, Slide } from '@/shared/types'
import { getAllPresentations, putPresentation, deletePresentationFromDb } from '@/shared/lib/db'

interface PresentationState {
  presentations: Presentation[]
  selectedPresentationId: string | null

  hydrate: () => void
  createPresentation: (title: string, template: Presentation['template']) => void
  deletePresentation: (id: string) => void
  addSlide: (presId: string, title: string, content: string, notes: string) => void
  updateSlide: (presId: string, slideId: string, updates: Partial<Pick<Slide, 'title' | 'content' | 'notes'>>) => void
  removeSlide: (presId: string, slideId: string) => void
  reorderSlides: (presId: string, slideIds: string[]) => void
  selectPresentation: (id: string | null) => void
}

export const usePresentationStore = create<PresentationState>((set) => ({
  presentations: [],
  selectedPresentationId: null,

  hydrate: () => {
    getAllPresentations()
      .then((presentations) => {
        set({ presentations })
      })
      .catch(console.error)
  },

  createPresentation: (title, template) => {
    const now = new Date().toISOString()
    const rootSlide: Slide = {
      id: crypto.randomUUID(),
      title: 'Title Slide',
      content: '',
      notes: '',
      order: 0,
    }
    const presentation: Presentation = {
      id: crypto.randomUUID(),
      title,
      slides: [rootSlide],
      template,
      createdAt: now,
      updatedAt: now,
    }

    set((state) => ({
      presentations: [presentation, ...state.presentations],
      selectedPresentationId: presentation.id,
    }))

    putPresentation(presentation).catch(console.error)
  },

  deletePresentation: (id) => {
    set((state) => ({
      presentations: state.presentations.filter((p) => p.id !== id),
      selectedPresentationId: state.selectedPresentationId === id ? null : state.selectedPresentationId,
    }))

    deletePresentationFromDb(id).catch(console.error)
  },

  addSlide: (presId, title, content, notes) => {
    set((state) => ({
      presentations: state.presentations.map((p) => {
        if (p.id !== presId) return p
        const slide: Slide = {
          id: crypto.randomUUID(),
          title,
          content,
          notes,
          order: p.slides.length,
        }
        const updated: Presentation = {
          ...p,
          slides: [...p.slides, slide],
          updatedAt: new Date().toISOString(),
        }
        putPresentation(updated).catch(console.error)
        return updated
      }),
    }))
  },

  updateSlide: (presId, slideId, updates) => {
    set((state) => ({
      presentations: state.presentations.map((p) => {
        if (p.id !== presId) return p
        const updated: Presentation = {
          ...p,
          slides: p.slides.map((s) =>
            s.id === slideId ? { ...s, ...updates } : s,
          ),
          updatedAt: new Date().toISOString(),
        }
        putPresentation(updated).catch(console.error)
        return updated
      }),
    }))
  },

  removeSlide: (presId, slideId) => {
    set((state) => ({
      presentations: state.presentations.map((p) => {
        if (p.id !== presId) return p
        const filtered = p.slides
          .filter((s) => s.id !== slideId)
          .map((s, i) => ({ ...s, order: i }))
        const updated: Presentation = {
          ...p,
          slides: filtered,
          updatedAt: new Date().toISOString(),
        }
        putPresentation(updated).catch(console.error)
        return updated
      }),
    }))
  },

  reorderSlides: (presId, slideIds) => {
    set((state) => ({
      presentations: state.presentations.map((p) => {
        if (p.id !== presId) return p
        const slideMap = new Map(p.slides.map((s) => [s.id, s]))
        const reordered = slideIds
          .map((id, i) => {
            const slide = slideMap.get(id)
            return slide ? { ...slide, order: i } : null
          })
          .filter((s): s is Slide => s !== null)
        const updated: Presentation = {
          ...p,
          slides: reordered,
          updatedAt: new Date().toISOString(),
        }
        putPresentation(updated).catch(console.error)
        return updated
      }),
    }))
  },

  selectPresentation: (id) => {
    set({ selectedPresentationId: id })
  },
}))
