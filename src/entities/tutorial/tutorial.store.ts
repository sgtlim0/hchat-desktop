import { create } from 'zustand'
import type { Tutorial, TutorialStep } from '@/shared/types'
import { getAllTutorials, putTutorial, deleteTutorialFromDb } from '@/shared/lib/db'

interface TutorialState {
  tutorials: Tutorial[]
  selectedTutorialId: string | null

  hydrate: () => void
  createTutorial: (title: string) => void
  deleteTutorial: (id: string) => void
  addStep: (tutorialId: string, title: string, description: string) => void
  updateStep: (tutorialId: string, stepId: string, updates: Partial<Omit<TutorialStep, 'id'>>) => void
  removeStep: (tutorialId: string, stepId: string) => void
  selectTutorial: (id: string | null) => void
}

export const useTutorialStore = create<TutorialState>((set) => ({
  tutorials: [],
  selectedTutorialId: null,

  hydrate: () => {
    getAllTutorials()
      .then((tutorials) => set({ tutorials }))
      .catch(console.error)
  },

  createTutorial: (title) => {
    const now = new Date().toISOString()
    const tutorial: Tutorial = {
      id: crypto.randomUUID(),
      title,
      steps: [],
      createdAt: now,
      updatedAt: now,
    }

    set((state) => ({ tutorials: [tutorial, ...state.tutorials] }))
    putTutorial(tutorial).catch(console.error)
  },

  deleteTutorial: (id) => {
    set((state) => ({
      tutorials: state.tutorials.filter((t) => t.id !== id),
      selectedTutorialId: state.selectedTutorialId === id ? null : state.selectedTutorialId,
    }))
    deleteTutorialFromDb(id).catch(console.error)
  },

  addStep: (tutorialId, title, description) => {
    set((state) => ({
      tutorials: state.tutorials.map((t) => {
        if (t.id !== tutorialId) return t
        const step: TutorialStep = {
          id: crypto.randomUUID(),
          title,
          description,
          annotations: [],
          order: t.steps.length,
        }
        const updated = { ...t, steps: [...t.steps, step], updatedAt: new Date().toISOString() }
        putTutorial(updated).catch(console.error)
        return updated
      }),
    }))
  },

  updateStep: (tutorialId, stepId, updates) => {
    set((state) => ({
      tutorials: state.tutorials.map((t) => {
        if (t.id !== tutorialId) return t
        const updated = {
          ...t,
          steps: t.steps.map((s) => (s.id === stepId ? { ...s, ...updates } : s)),
          updatedAt: new Date().toISOString(),
        }
        putTutorial(updated).catch(console.error)
        return updated
      }),
    }))
  },

  removeStep: (tutorialId, stepId) => {
    set((state) => ({
      tutorials: state.tutorials.map((t) => {
        if (t.id !== tutorialId) return t
        const updated = {
          ...t,
          steps: t.steps.filter((s) => s.id !== stepId),
          updatedAt: new Date().toISOString(),
        }
        putTutorial(updated).catch(console.error)
        return updated
      }),
    }))
  },

  selectTutorial: (id) => {
    set({ selectedTutorialId: id })
  },
}))
