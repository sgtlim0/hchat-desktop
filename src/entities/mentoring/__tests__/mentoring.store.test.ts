import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useMentoringStore } from '../mentoring.store'

vi.mock('@/shared/lib/db', () => ({
  getAllLearningGoals: vi.fn().mockResolvedValue([]),
  putLearningGoal: vi.fn().mockResolvedValue(undefined),
  deleteLearningGoalFromDb: vi.fn().mockResolvedValue(undefined),
}))

describe('MentoringStore', () => {
  beforeEach(() => { useMentoringStore.setState({ goals: [], selectedGoalId: null }) })

  it('should have empty initial state', () => {
    expect(useMentoringStore.getState().goals).toEqual([])
  })

  it('should add a goal', async () => {
    await useMentoringStore.getState().addGoal('TypeScript', 'intermediate', 10)
    const goals = useMentoringStore.getState().goals
    expect(goals).toHaveLength(1)
    expect(goals[0].topic).toBe('TypeScript')
    expect(goals[0].progress).toBe(0)
    expect(goals[0].status).toBe('active')
  })

  it('should update progress', async () => {
    await useMentoringStore.getState().addGoal('React', 'beginner', 5)
    const id = useMentoringStore.getState().goals[0].id
    await useMentoringStore.getState().updateProgress(id, 3)
    expect(useMentoringStore.getState().goals[0].progress).toBe(3)
  })

  it('should cap progress at totalSteps', async () => {
    await useMentoringStore.getState().addGoal('React', 'beginner', 5)
    const id = useMentoringStore.getState().goals[0].id
    await useMentoringStore.getState().updateProgress(id, 99)
    expect(useMentoringStore.getState().goals[0].progress).toBe(5)
  })

  it('should complete a goal', async () => {
    await useMentoringStore.getState().addGoal('CSS', 'advanced', 8)
    const id = useMentoringStore.getState().goals[0].id
    await useMentoringStore.getState().completeGoal(id)
    const goal = useMentoringStore.getState().goals[0]
    expect(goal.status).toBe('completed')
    expect(goal.progress).toBe(goal.totalSteps)
  })

  it('should pause and resume', async () => {
    await useMentoringStore.getState().addGoal('JS', 'beginner', 5)
    const id = useMentoringStore.getState().goals[0].id
    await useMentoringStore.getState().pauseGoal(id)
    expect(useMentoringStore.getState().goals[0].status).toBe('paused')
    await useMentoringStore.getState().resumeGoal(id)
    expect(useMentoringStore.getState().goals[0].status).toBe('active')
  })

  it('should remove a goal', async () => {
    await useMentoringStore.getState().addGoal('Go', 'beginner', 3)
    const id = useMentoringStore.getState().goals[0].id
    await useMentoringStore.getState().removeGoal(id)
    expect(useMentoringStore.getState().goals).toHaveLength(0)
  })
})
