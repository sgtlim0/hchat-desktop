import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useVisualPromptStore } from '../visual-prompt.store'

vi.mock('@/shared/lib/db', () => ({
  getAllVisualPrompts: vi.fn().mockResolvedValue([]),
  putVisualPrompt: vi.fn().mockResolvedValue(undefined),
  deleteVisualPromptFromDb: vi.fn().mockResolvedValue(undefined),
}))

describe('VisualPromptStore', () => {
  beforeEach(() => { useVisualPromptStore.setState({ prompts: [], selectedPromptId: null }) })

  it('should have empty initial state', () => {
    expect(useVisualPromptStore.getState().prompts).toEqual([])
  })

  it('should create a prompt', async () => {
    const id = await useVisualPromptStore.getState().createPrompt('My Prompt')
    expect(id).toBeTruthy()
    expect(useVisualPromptStore.getState().prompts[0].title).toBe('My Prompt')
    expect(useVisualPromptStore.getState().prompts[0].qualityScore).toBe(0)
  })

  it('should add blocks and compute quality', async () => {
    const pid = await useVisualPromptStore.getState().createPrompt('Test')
    await useVisualPromptStore.getState().addBlock(pid, 'instruction', 'Do X')
    expect(useVisualPromptStore.getState().prompts[0].qualityScore).toBe(30)
    await useVisualPromptStore.getState().addBlock(pid, 'context', 'Background')
    expect(useVisualPromptStore.getState().prompts[0].qualityScore).toBe(50)
    await useVisualPromptStore.getState().addBlock(pid, 'output_format', 'JSON')
    expect(useVisualPromptStore.getState().prompts[0].qualityScore).toBe(70)
  })

  it('should generate prompt text from blocks', async () => {
    const pid = await useVisualPromptStore.getState().createPrompt('Test')
    await useVisualPromptStore.getState().addBlock(pid, 'instruction', 'Translate this')
    await useVisualPromptStore.getState().addBlock(pid, 'context', 'English to Korean')
    const prompt = useVisualPromptStore.getState().prompts[0]
    expect(prompt.generatedPrompt).toContain('지시사항')
    expect(prompt.generatedPrompt).toContain('Translate this')
    expect(prompt.generatedPrompt).toContain('컨텍스트')
  })

  it('should update a block', async () => {
    const pid = await useVisualPromptStore.getState().createPrompt('Test')
    await useVisualPromptStore.getState().addBlock(pid, 'instruction', 'Old')
    const blockId = useVisualPromptStore.getState().prompts[0].blocks[0].id
    await useVisualPromptStore.getState().updateBlock(pid, blockId, 'New')
    expect(useVisualPromptStore.getState().prompts[0].blocks[0].content).toBe('New')
  })

  it('should remove a block and recalculate', async () => {
    const pid = await useVisualPromptStore.getState().createPrompt('Test')
    await useVisualPromptStore.getState().addBlock(pid, 'instruction', 'X')
    await useVisualPromptStore.getState().addBlock(pid, 'context', 'Y')
    const blockId = useVisualPromptStore.getState().prompts[0].blocks[0].id
    await useVisualPromptStore.getState().removeBlock(pid, blockId)
    expect(useVisualPromptStore.getState().prompts[0].blocks).toHaveLength(1)
    expect(useVisualPromptStore.getState().prompts[0].qualityScore).toBe(20)
  })

  it('should reorder blocks', async () => {
    const pid = await useVisualPromptStore.getState().createPrompt('Test')
    await useVisualPromptStore.getState().addBlock(pid, 'instruction', 'A')
    await useVisualPromptStore.getState().addBlock(pid, 'context', 'B')
    const [b1, b2] = useVisualPromptStore.getState().prompts[0].blocks
    await useVisualPromptStore.getState().reorderBlocks(pid, [b2.id, b1.id])
    expect(useVisualPromptStore.getState().prompts[0].blocks[0].order).toBe(0)
    expect(useVisualPromptStore.getState().prompts[0].blocks[0].type).toBe('context')
  })

  it('should delete a prompt', async () => {
    const pid = await useVisualPromptStore.getState().createPrompt('Test')
    await useVisualPromptStore.getState().deletePrompt(pid)
    expect(useVisualPromptStore.getState().prompts).toHaveLength(0)
  })
})
