import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useTranslationMemoryStore } from '../translation-memory.store'

vi.mock('@/shared/lib/db', () => ({
  getAllTranslationPairs: vi.fn().mockResolvedValue([]),
  putTranslationPair: vi.fn().mockResolvedValue(undefined),
  deleteTranslationPairFromDb: vi.fn().mockResolvedValue(undefined),
  getAllGlossaryTerms: vi.fn().mockResolvedValue([]),
  putGlossaryTerm: vi.fn().mockResolvedValue(undefined),
  deleteGlossaryTermFromDb: vi.fn().mockResolvedValue(undefined),
}))

describe('TranslationMemoryStore', () => {
  beforeEach(() => { useTranslationMemoryStore.setState({ pairs: [], glossary: [] }) })

  it('should have empty initial state', () => {
    const state = useTranslationMemoryStore.getState()
    expect(state.pairs).toEqual([])
    expect(state.glossary).toEqual([])
  })

  it('should add a translation pair', async () => {
    await useTranslationMemoryStore.getState().addPair('Hello', '안녕하세요', 'en', 'ko', 'general')
    const pairs = useTranslationMemoryStore.getState().pairs
    expect(pairs).toHaveLength(1)
    expect(pairs[0].source).toBe('Hello')
    expect(pairs[0].target).toBe('안녕하세요')
    expect(pairs[0].usageCount).toBe(0)
  })

  it('should remove a translation pair', async () => {
    await useTranslationMemoryStore.getState().addPair('A', 'B', 'en', 'ko', 'tech')
    const id = useTranslationMemoryStore.getState().pairs[0].id
    await useTranslationMemoryStore.getState().removePair(id)
    expect(useTranslationMemoryStore.getState().pairs).toHaveLength(0)
  })

  it('should add a glossary term', async () => {
    await useTranslationMemoryStore.getState().addGlossaryTerm('API', 'API', 'tech')
    const glossary = useTranslationMemoryStore.getState().glossary
    expect(glossary).toHaveLength(1)
    expect(glossary[0].term).toBe('API')
    expect(glossary[0].domain).toBe('tech')
  })

  it('should remove a glossary term', async () => {
    await useTranslationMemoryStore.getState().addGlossaryTerm('SDK', 'SDK', 'tech')
    const id = useTranslationMemoryStore.getState().glossary[0].id
    await useTranslationMemoryStore.getState().removeGlossaryTerm(id)
    expect(useTranslationMemoryStore.getState().glossary).toHaveLength(0)
  })

  it('should search pairs by source text', async () => {
    await useTranslationMemoryStore.getState().addPair('Hello World', '안녕 세계', 'en', 'ko', 'general')
    await useTranslationMemoryStore.getState().addPair('Goodbye', '안녕히 가세요', 'en', 'ko', 'general')
    const results = useTranslationMemoryStore.getState().searchPairs('hello')
    expect(results).toHaveLength(1)
    expect(results[0].source).toBe('Hello World')
  })

  it('should search pairs by target text', async () => {
    await useTranslationMemoryStore.getState().addPair('Hello', '안녕하세요', 'en', 'ko', 'general')
    await useTranslationMemoryStore.getState().addPair('Thanks', '감사합니다', 'en', 'ko', 'general')
    const results = useTranslationMemoryStore.getState().searchPairs('감사')
    expect(results).toHaveLength(1)
    expect(results[0].target).toBe('감사합니다')
  })

  it('should return empty array for no match', async () => {
    await useTranslationMemoryStore.getState().addPair('Hello', '안녕', 'en', 'ko', 'general')
    const results = useTranslationMemoryStore.getState().searchPairs('xyz')
    expect(results).toHaveLength(0)
  })
})
