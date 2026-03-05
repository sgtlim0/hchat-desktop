import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useRegexBuilderStore } from '../regex-builder.store'

// Mock the db module
vi.mock('@/shared/lib/db', () => ({
  getAllRegexPatterns: vi.fn(() => Promise.resolve([])),
  putRegexPattern: vi.fn(() => Promise.resolve()),
  deleteRegexPatternFromDb: vi.fn(() => Promise.resolve()),
}))

describe('RegexBuilderStore', () => {
  beforeEach(() => {
    useRegexBuilderStore.setState({
      patterns: [],
      currentPattern: '',
      currentFlags: 'g',
      testInput: '',
      selectedPatternId: null,
    })
  })

  it('should set pattern', () => {
    useRegexBuilderStore.getState().setPattern('\\d+')
    expect(useRegexBuilderStore.getState().currentPattern).toBe('\\d+')
  })

  it('should set flags', () => {
    useRegexBuilderStore.getState().setFlags('gi')
    expect(useRegexBuilderStore.getState().currentFlags).toBe('gi')
  })

  it('should set test input', () => {
    useRegexBuilderStore.getState().setTestInput('hello world 123')
    expect(useRegexBuilderStore.getState().testInput).toBe('hello world 123')
  })

  it('should return matches from getMatches', () => {
    const { setPattern, setFlags, setTestInput } = useRegexBuilderStore.getState()
    setPattern('\\d+')
    setFlags('g')
    setTestInput('abc 123 def 456')

    const matches = useRegexBuilderStore.getState().getMatches()
    expect(matches).toHaveLength(2)
    expect(matches[0].text).toBe('123')
    expect(matches[0].index).toBe(4)
    expect(matches[1].text).toBe('456')
    expect(matches[1].index).toBe(12)
  })

  it('should return empty array for invalid regex', () => {
    const { setPattern, setTestInput } = useRegexBuilderStore.getState()
    setPattern('[invalid')
    setTestInput('test')

    const matches = useRegexBuilderStore.getState().getMatches()
    expect(matches).toEqual([])
  })

  it('should return empty array when pattern or input is empty', () => {
    useRegexBuilderStore.getState().setPattern('')
    useRegexBuilderStore.getState().setTestInput('test')
    expect(useRegexBuilderStore.getState().getMatches()).toEqual([])

    useRegexBuilderStore.getState().setPattern('\\d+')
    useRegexBuilderStore.getState().setTestInput('')
    expect(useRegexBuilderStore.getState().getMatches()).toEqual([])
  })

  it('should save a pattern', () => {
    const { setPattern, setFlags, setTestInput, savePattern } = useRegexBuilderStore.getState()
    setPattern('\\w+')
    setFlags('gi')
    setTestInput('hello world')

    savePattern('Word matcher')

    const patterns = useRegexBuilderStore.getState().patterns
    expect(patterns).toHaveLength(1)
    expect(patterns[0].name).toBe('Word matcher')
    expect(patterns[0].pattern).toBe('\\w+')
    expect(patterns[0].flags).toBe('gi')
    expect(patterns[0].testInput).toBe('hello world')
    expect(patterns[0].isFavorite).toBe(false)
    expect(patterns[0].id).toMatch(/^regex-\d+$/)
  })

  it('should update a pattern', () => {
    const { setPattern, savePattern, updatePattern } = useRegexBuilderStore.getState()
    setPattern('\\d+')
    savePattern('Numbers')

    const id = useRegexBuilderStore.getState().patterns[0].id

    updatePattern(id, { name: 'Digits', pattern: '[0-9]+' })

    const updated = useRegexBuilderStore.getState().patterns[0]
    expect(updated.name).toBe('Digits')
    expect(updated.pattern).toBe('[0-9]+')
  })

  it('should delete a pattern', () => {
    const { setPattern, savePattern, deletePattern } = useRegexBuilderStore.getState()
    setPattern('test1')
    savePattern('Pattern 1')

    // Use a slight delay to avoid ID collision
    vi.spyOn(Date, 'now').mockReturnValueOnce(Date.now() + 1)
    setPattern('test2')
    savePattern('Pattern 2')
    vi.restoreAllMocks()

    const patterns = useRegexBuilderStore.getState().patterns
    expect(patterns).toHaveLength(2)

    deletePattern(patterns[0].id)

    expect(useRegexBuilderStore.getState().patterns).toHaveLength(1)
  })

  it('should clear selectedPatternId when deleting selected pattern', () => {
    const { setPattern, savePattern, selectPattern, deletePattern } = useRegexBuilderStore.getState()
    setPattern('\\d+')
    savePattern('Numbers')

    const id = useRegexBuilderStore.getState().patterns[0].id
    selectPattern(id)
    expect(useRegexBuilderStore.getState().selectedPatternId).toBe(id)

    deletePattern(id)
    expect(useRegexBuilderStore.getState().selectedPatternId).toBeNull()
  })

  it('should toggle favorite', () => {
    const { setPattern, savePattern, toggleFavorite } = useRegexBuilderStore.getState()
    setPattern('\\d+')
    savePattern('Numbers')

    const id = useRegexBuilderStore.getState().patterns[0].id
    expect(useRegexBuilderStore.getState().patterns[0].isFavorite).toBe(false)

    toggleFavorite(id)
    expect(useRegexBuilderStore.getState().patterns[0].isFavorite).toBe(true)

    toggleFavorite(id)
    expect(useRegexBuilderStore.getState().patterns[0].isFavorite).toBe(false)
  })

  it('should select a pattern and load its values', () => {
    const { setPattern, setFlags, setTestInput, savePattern, selectPattern } = useRegexBuilderStore.getState()
    setPattern('\\d+')
    setFlags('gi')
    setTestInput('test 123')
    savePattern('Numbers')

    // Change current values
    setPattern('changed')
    setFlags('m')
    setTestInput('different')

    const id = useRegexBuilderStore.getState().patterns[0].id
    selectPattern(id)

    const state = useRegexBuilderStore.getState()
    expect(state.selectedPatternId).toBe(id)
    expect(state.currentPattern).toBe('\\d+')
    expect(state.currentFlags).toBe('gi')
    expect(state.testInput).toBe('test 123')
  })

  it('should deselect pattern with null', () => {
    useRegexBuilderStore.setState({ selectedPatternId: 'some-id' })

    useRegexBuilderStore.getState().selectPattern(null)
    expect(useRegexBuilderStore.getState().selectedPatternId).toBeNull()
  })

  it('should hydrate patterns from database', async () => {
    const mockPatterns = [
      {
        id: 'regex-1',
        name: 'Email',
        pattern: '[\\w.]+@[\\w.]+',
        flags: 'g',
        description: '',
        testInput: 'test@example.com',
        isFavorite: true,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
    ]

    const { getAllRegexPatterns } = await import('@/shared/lib/db')
    vi.mocked(getAllRegexPatterns).mockResolvedValueOnce(mockPatterns)

    useRegexBuilderStore.getState().hydrate()

    await new Promise((resolve) => setTimeout(resolve, 10))

    expect(useRegexBuilderStore.getState().patterns).toEqual(mockPatterns)
  })

  it('should handle non-global flag matching', () => {
    const { setPattern, setFlags, setTestInput } = useRegexBuilderStore.getState()
    setPattern('\\d+')
    setFlags('')
    setTestInput('abc 123 def 456')

    const matches = useRegexBuilderStore.getState().getMatches()
    expect(matches).toHaveLength(1)
    expect(matches[0].text).toBe('123')
  })
})
