import { create } from 'zustand'
import type { LearningGoal, MentoringDifficulty } from '@/shared/types'
import { getAllLearningGoals, putLearningGoal, deleteLearningGoalFromDb } from '@/shared/lib/db'

interface MentoringState {
  goals: LearningGoal[]
  selectedGoalId: string | null

  hydrate: () => Promise<void>
  addGoal: (topic: string, difficulty: MentoringDifficulty, totalSteps: number) => Promise<void>
  updateProgress: (id: string, progress: number) => Promise<void>
  completeGoal: (id: string) => Promise<void>
  pauseGoal: (id: string) => Promise<void>
  resumeGoal: (id: string) => Promise<void>
  removeGoal: (id: string) => Promise<void>
  setSelectedGoalId: (id: string | null) => void
}

export const useMentoringStore = create<MentoringState>()((set, get) => ({
  goals: [],
  selectedGoalId: null,

  hydrate: async () => {
    const goals = await getAllLearningGoals()
    set({ goals })
  },

  addGoal: async (topic, difficulty, totalSteps) => {
    const now = new Date().toISOString()
    const goal: LearningGoal = {
      id: crypto.randomUUID(), topic, difficulty, progress: 0,
      totalSteps, status: 'active', createdAt: now, updatedAt: now,
    }
    await putLearningGoal(goal)
    set((s) => ({ goals: [goal, ...s.goals] }))
  },

  updateProgress: async (id, progress) => {
    const goal = get().goals.find((g) => g.id === id)
    if (!goal) return
    const updated = { ...goal, progress: Math.min(progress, goal.totalSteps), updatedAt: new Date().toISOString() }
    await putLearningGoal(updated)
    set((s) => ({ goals: s.goals.map((g) => (g.id === id ? updated : g)) }))
  },

  completeGoal: async (id) => {
    const goal = get().goals.find((g) => g.id === id)
    if (!goal) return
    const updated = { ...goal, status: 'completed' as const, progress: goal.totalSteps, updatedAt: new Date().toISOString() }
    await putLearningGoal(updated)
    set((s) => ({ goals: s.goals.map((g) => (g.id === id ? updated : g)) }))
  },

  pauseGoal: async (id) => {
    const goal = get().goals.find((g) => g.id === id)
    if (!goal || goal.status !== 'active') return
    const updated = { ...goal, status: 'paused' as const, updatedAt: new Date().toISOString() }
    await putLearningGoal(updated)
    set((s) => ({ goals: s.goals.map((g) => (g.id === id ? updated : g)) }))
  },

  resumeGoal: async (id) => {
    const goal = get().goals.find((g) => g.id === id)
    if (!goal || goal.status !== 'paused') return
    const updated = { ...goal, status: 'active' as const, updatedAt: new Date().toISOString() }
    await putLearningGoal(updated)
    set((s) => ({ goals: s.goals.map((g) => (g.id === id ? updated : g)) }))
  },

  removeGoal: async (id) => {
    await deleteLearningGoalFromDb(id)
    set((s) => ({
      goals: s.goals.filter((g) => g.id !== id),
      selectedGoalId: s.selectedGoalId === id ? null : s.selectedGoalId,
    }))
  },

  setSelectedGoalId: (selectedGoalId) => set({ selectedGoalId }),
}))
