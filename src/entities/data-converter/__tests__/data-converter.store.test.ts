import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useDataConverterStore } from '../data-converter.store'

vi.mock('@/shared/lib/db', () => ({
  getAllConversionHistory: vi.fn(() => Promise.resolve([])),
  putConversionHistory: vi.fn(() => Promise.resolve()),
  clearConversionHistory: vi.fn(() => Promise.resolve()),
}))

describe('DataConverterStore', () => {
  beforeEach(() => {
    useDataConverterStore.setState({
      sourceContent: '',
      targetContent: '',
      sourceFormat: 'json',
      targetFormat: 'yaml',
      history: [],
      error: null,
    })
  })

  it('should convert JSON to YAML', () => {
    const { setSourceContent, convert } = useDataConverterStore.getState()

    setSourceContent('{"name": "test", "age": 30, "active": true}')
    convert()

    const state = useDataConverterStore.getState()
    expect(state.error).toBeNull()
    expect(state.targetContent).toContain('name: test')
    expect(state.targetContent).toContain('age: 30')
    expect(state.targetContent).toContain('active: true')
  })

  it('should convert YAML to JSON', () => {
    useDataConverterStore.setState({
      sourceFormat: 'yaml',
      targetFormat: 'json',
    })

    const { setSourceContent, convert } = useDataConverterStore.getState()

    setSourceContent('name: test\nage: 30\nactive: true')
    convert()

    const state = useDataConverterStore.getState()
    expect(state.error).toBeNull()
    const parsed = JSON.parse(state.targetContent)
    expect(parsed.name).toBe('test')
    expect(parsed.age).toBe(30)
    expect(parsed.active).toBe(true)
  })

  it('should swap formats', () => {
    useDataConverterStore.setState({
      sourceFormat: 'json',
      targetFormat: 'yaml',
      sourceContent: 'source-data',
      targetContent: 'target-data',
    })

    const { swapFormats } = useDataConverterStore.getState()
    swapFormats()

    const state = useDataConverterStore.getState()
    expect(state.sourceFormat).toBe('yaml')
    expect(state.targetFormat).toBe('json')
    expect(state.sourceContent).toBe('target-data')
    expect(state.targetContent).toBe('source-data')
  })

  it('should format source JSON', () => {
    const { setSourceContent, formatSource } = useDataConverterStore.getState()

    setSourceContent('{"name":"test","age":30}')
    formatSource()

    const state = useDataConverterStore.getState()
    expect(state.sourceContent).toBe('{\n  "name": "test",\n  "age": 30\n}')
    expect(state.error).toBeNull()
  })

  it('should minify source JSON', () => {
    const { setSourceContent, minifySource } = useDataConverterStore.getState()

    setSourceContent('{\n  "name": "test",\n  "age": 30\n}')
    minifySource()

    const state = useDataConverterStore.getState()
    expect(state.sourceContent).toBe('{"name":"test","age":30}')
    expect(state.error).toBeNull()
  })

  it('should set error on invalid JSON input', () => {
    const { setSourceContent, convert } = useDataConverterStore.getState()

    setSourceContent('{invalid json}')
    convert()

    const state = useDataConverterStore.getState()
    expect(state.error).not.toBeNull()
    expect(state.targetContent).toBe('')
  })

  it('should save conversion to history', () => {
    const { setSourceContent, convert } = useDataConverterStore.getState()

    setSourceContent('{"key": "value"}')
    convert()

    const state = useDataConverterStore.getState()
    expect(state.history).toHaveLength(1)
    expect(state.history[0].sourceFormat).toBe('json')
    expect(state.history[0].targetFormat).toBe('yaml')
    expect(state.history[0].id).toMatch(/^conv-/)
  })

  it('should hydrate history from DB', async () => {
    const { getAllConversionHistory } = await import('@/shared/lib/db')
    const mockHistory = [
      {
        id: 'conv-1',
        sourceFormat: 'json' as const,
        targetFormat: 'yaml' as const,
        sourceContent: '{}',
        targetContent: '',
        createdAt: '2026-01-01T00:00:00Z',
      },
    ]
    vi.mocked(getAllConversionHistory).mockResolvedValueOnce(mockHistory)

    const { hydrate } = useDataConverterStore.getState()
    await hydrate()

    const state = useDataConverterStore.getState()
    expect(state.history).toHaveLength(1)
    expect(state.history[0].id).toBe('conv-1')
  })

  it('should convert nested JSON to YAML', () => {
    const { setSourceContent, convert } = useDataConverterStore.getState()

    setSourceContent('{"user": {"name": "test", "address": {"city": "Seoul"}}}')
    convert()

    const state = useDataConverterStore.getState()
    expect(state.error).toBeNull()
    expect(state.targetContent).toContain('user:')
    expect(state.targetContent).toContain('name: test')
    expect(state.targetContent).toContain('address:')
    expect(state.targetContent).toContain('city: Seoul')
  })

  it('should convert JSON array to YAML', () => {
    const { setSourceContent, convert } = useDataConverterStore.getState()

    setSourceContent('{"items": [1, 2, 3]}')
    convert()

    const state = useDataConverterStore.getState()
    expect(state.error).toBeNull()
    expect(state.targetContent).toContain('items:')
    expect(state.targetContent).toContain('- 1')
    expect(state.targetContent).toContain('- 2')
    expect(state.targetContent).toContain('- 3')
  })

  it('should clear all content', () => {
    useDataConverterStore.setState({
      sourceContent: 'some data',
      targetContent: 'some result',
      error: 'some error',
    })

    const { clearAll } = useDataConverterStore.getState()
    clearAll()

    const state = useDataConverterStore.getState()
    expect(state.sourceContent).toBe('')
    expect(state.targetContent).toBe('')
    expect(state.error).toBeNull()
  })

  it('should set error for empty input', () => {
    const { convert } = useDataConverterStore.getState()
    convert()

    const state = useDataConverterStore.getState()
    expect(state.error).toBe('Input is empty')
  })

  it('should limit history to 10 entries', () => {
    const { setSourceContent, convert } = useDataConverterStore.getState()

    for (let i = 0; i < 12; i++) {
      setSourceContent(`{"item": ${i}}`)
      convert()
    }

    const state = useDataConverterStore.getState()
    expect(state.history.length).toBeLessThanOrEqual(10)
  })
})
