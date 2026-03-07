import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useLearningPathStore } from '../learning-path.store'

vi.mock('@/shared/lib/db', () => ({
  getAllLearningPaths: vi.fn().mockResolvedValue([]),
  putLearningPath: vi.fn().mockResolvedValue(undefined),
  deleteLearningPathFromDb: vi.fn().mockResolvedValue(undefined),
}))

describe('LearningPathStore', () => {
  beforeEach(() => { useLearningPathStore.setState({ paths: [] }) })

  it('should have empty initial state', () => {
    expect(useLearningPathStore.getState().paths).toEqual([])
  })

  it('should create a path', async () => {
    await useLearningPathStore.getState().createPath('React Mastery', 'React')
    const paths = useLearningPathStore.getState().paths
    expect(paths).toHaveLength(1)
    expect(paths[0].title).toBe('React Mastery')
    expect(paths[0].topic).toBe('React')
    expect(paths[0].progress).toBe(0)
    expect(paths[0].steps).toEqual([])
  })

  it('should delete a path', async () => {
    await useLearningPathStore.getState().createPath('A', 'TS')
    const id = useLearningPathStore.getState().paths[0].id
    await useLearningPathStore.getState().deletePath(id)
    expect(useLearningPathStore.getState().paths).toHaveLength(0)
  })

  it('should add a step', async () => {
    await useLearningPathStore.getState().createPath('B', 'CSS')
    const id = useLearningPathStore.getState().paths[0].id
    await useLearningPathStore.getState().addStep(id, 'Flexbox', 'Learn flexbox basics')
    const path = useLearningPathStore.getState().paths[0]
    expect(path.steps).toHaveLength(1)
    expect(path.steps[0].title).toBe('Flexbox')
    expect(path.steps[0].completed).toBe(false)
    expect(path.progress).toBe(0)
  })

  it('should complete a step and update progress', async () => {
    await useLearningPathStore.getState().createPath('C', 'JS')
    const id = useLearningPathStore.getState().paths[0].id
    await useLearningPathStore.getState().addStep(id, 'S1', 'Desc 1')
    await useLearningPathStore.getState().addStep(id, 'S2', 'Desc 2')
    const stepId = useLearningPathStore.getState().paths[0].steps[0].id
    await useLearningPathStore.getState().completeStep(id, stepId, 90)
    const path = useLearningPathStore.getState().paths[0]
    expect(path.steps[0].completed).toBe(true)
    expect(path.steps[0].score).toBe(90)
    expect(path.progress).toBe(50)
  })

  it('should compute 100% progress when all steps completed', async () => {
    await useLearningPathStore.getState().createPath('D', 'Go')
    const id = useLearningPathStore.getState().paths[0].id
    await useLearningPathStore.getState().addStep(id, 'S1', 'D1')
    const stepId = useLearningPathStore.getState().paths[0].steps[0].id
    await useLearningPathStore.getState().completeStep(id, stepId)
    expect(useLearningPathStore.getState().paths[0].progress).toBe(100)
  })

  it('should not modify path for unknown pathId', async () => {
    await useLearningPathStore.getState().addStep('unknown', 'X', 'Y')
    expect(useLearningPathStore.getState().paths).toHaveLength(0)
  })
})
