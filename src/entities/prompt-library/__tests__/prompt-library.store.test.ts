import { describe, it, expect, beforeEach, vi } from 'vitest'
import { usePromptLibraryStore } from '../prompt-library.store'
import type { SavedPrompt } from '@/shared/types'

vi.mock('@/shared/lib/db', () => ({
  getAllPrompts: vi.fn().mockResolvedValue([]),
  putPrompt: vi.fn().mockResolvedValue(undefined),
  deletePromptFromDb: vi.fn().mockResolvedValue(undefined),
}))

function makePrompt(overrides: Partial<SavedPrompt> = {}): SavedPrompt {
  return {
    id: `prompt-${Date.now()}`,
    title: 'Test Prompt',
    content: 'Hello {{name}}',
    category: 'general',
    tags: ['test'],
    isFavorite: false,
    usageCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  }
}

function resetStore() {
  usePromptLibraryStore.setState({ prompts: [], hydrated: false })
}

describe('usePromptLibraryStore', () => {
  beforeEach(() => {
    resetStore()
  })

  it('starts with empty prompts', () => {
    expect(usePromptLibraryStore.getState().prompts).toEqual([])
  })

  it('addPrompt prepends to list', () => {
    const p1 = makePrompt({ id: 'p1' })
    const p2 = makePrompt({ id: 'p2' })

    usePromptLibraryStore.getState().addPrompt(p1)
    usePromptLibraryStore.getState().addPrompt(p2)

    const { prompts } = usePromptLibraryStore.getState()
    expect(prompts).toHaveLength(2)
    expect(prompts[0].id).toBe('p2')
  })

  it('updatePrompt modifies prompt and sets updatedAt', () => {
    const prompt = makePrompt({ id: 'p1', title: 'Original', updatedAt: '2020-01-01T00:00:00.000Z' })
    usePromptLibraryStore.getState().addPrompt(prompt)

    usePromptLibraryStore.getState().updatePrompt('p1', { title: 'Updated' })

    const updated = usePromptLibraryStore.getState().prompts.find((p) => p.id === 'p1')
    expect(updated?.title).toBe('Updated')
    expect(updated?.updatedAt).not.toBe('2020-01-01T00:00:00.000Z')
  })

  it('deletePrompt removes from list', () => {
    usePromptLibraryStore.getState().addPrompt(makePrompt({ id: 'p1' }))
    usePromptLibraryStore.getState().addPrompt(makePrompt({ id: 'p2' }))

    usePromptLibraryStore.getState().deletePrompt('p1')
    expect(usePromptLibraryStore.getState().prompts).toHaveLength(1)
    expect(usePromptLibraryStore.getState().prompts[0].id).toBe('p2')
  })

  it('toggleFavorite flips isFavorite', () => {
    usePromptLibraryStore.getState().addPrompt(makePrompt({ id: 'p1', isFavorite: false }))

    usePromptLibraryStore.getState().toggleFavorite('p1')
    expect(usePromptLibraryStore.getState().prompts[0].isFavorite).toBe(true)

    usePromptLibraryStore.getState().toggleFavorite('p1')
    expect(usePromptLibraryStore.getState().prompts[0].isFavorite).toBe(false)
  })

  it('incrementUsage increases usageCount', () => {
    usePromptLibraryStore.getState().addPrompt(makePrompt({ id: 'p1', usageCount: 3 }))

    usePromptLibraryStore.getState().incrementUsage('p1')
    expect(usePromptLibraryStore.getState().prompts[0].usageCount).toBe(4)
  })

  it('getByCategory filters by category', () => {
    usePromptLibraryStore.getState().addPrompt(makePrompt({ id: 'p1', category: 'coding' }))
    usePromptLibraryStore.getState().addPrompt(makePrompt({ id: 'p2', category: 'writing' }))
    usePromptLibraryStore.getState().addPrompt(makePrompt({ id: 'p3', category: 'coding' }))

    const codingPrompts = usePromptLibraryStore.getState().getByCategory('coding')
    expect(codingPrompts).toHaveLength(2)
    expect(codingPrompts.every((p) => p.category === 'coding')).toBe(true)
  })
})
