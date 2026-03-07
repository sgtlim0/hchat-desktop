import { create } from 'zustand'
import type { LearningPath, LearningStep } from '@/shared/types'
import { getAllLearningPaths, putLearningPath, deleteLearningPathFromDb } from '@/shared/lib/db'

interface LearningPathState {
  paths: LearningPath[]

  hydrate: () => Promise<void>
  createPath: (title: string, topic: string) => Promise<void>
  deletePath: (id: string) => Promise<void>
  addStep: (pathId: string, title: string, description: string) => Promise<void>
  completeStep: (pathId: string, stepId: string, score?: number) => Promise<void>
}

function computeProgress(steps: LearningStep[]): number {
  if (steps.length === 0) return 0
  const completed = steps.filter((s) => s.completed).length
  return Math.round((completed / steps.length) * 100)
}

export const useLearningPathStore = create<LearningPathState>()((set, get) => ({
  paths: [],

  hydrate: async () => {
    const paths = await getAllLearningPaths()
    set({ paths })
  },

  createPath: async (title, topic) => {
    const now = new Date().toISOString()
    const path: LearningPath = {
      id: crypto.randomUUID(), title, topic,
      steps: [], progress: 0,
      createdAt: now, updatedAt: now,
    }
    await putLearningPath(path)
    set((s) => ({ paths: [path, ...s.paths] }))
  },

  deletePath: async (id) => {
    await deleteLearningPathFromDb(id)
    set((s) => ({ paths: s.paths.filter((p) => p.id !== id) }))
  },

  addStep: async (pathId, title, description) => {
    const path = get().paths.find((p) => p.id === pathId)
    if (!path) return
    const step: LearningStep = {
      id: crypto.randomUUID(), title, description,
      completed: false,
    }
    const newSteps = [...path.steps, step]
    const updated: LearningPath = {
      ...path,
      steps: newSteps,
      progress: computeProgress(newSteps),
      updatedAt: new Date().toISOString(),
    }
    await putLearningPath(updated)
    set((s) => ({ paths: s.paths.map((p) => (p.id === pathId ? updated : p)) }))
  },

  completeStep: async (pathId, stepId, score) => {
    const path = get().paths.find((p) => p.id === pathId)
    if (!path) return
    const newSteps = path.steps.map((s) =>
      s.id === stepId ? { ...s, completed: true, score } : s,
    )
    const updated: LearningPath = {
      ...path,
      steps: newSteps,
      progress: computeProgress(newSteps),
      updatedAt: new Date().toISOString(),
    }
    await putLearningPath(updated)
    set((s) => ({ paths: s.paths.map((p) => (p.id === pathId ? updated : p)) }))
  },
}))
