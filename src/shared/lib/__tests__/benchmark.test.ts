import { describe, it, expect, beforeEach } from 'vitest'
import { measure, measureAsync, benchmark, getResults, clearResults, formatResult, exportResults } from '../benchmark'

describe('benchmark', () => {
  beforeEach(() => clearResults())

  describe('measure', () => {
    it('returns result and duration', () => {
      const { result, durationMs } = measure(() => 42)
      expect(result).toBe(42)
      expect(durationMs).toBeGreaterThanOrEqual(0)
    })
  })

  describe('measureAsync', () => {
    it('works with promises', async () => {
      const { result, durationMs } = await measureAsync(() => Promise.resolve('ok'))
      expect(result).toBe('ok')
      expect(durationMs).toBeGreaterThanOrEqual(0)
    })
  })

  describe('benchmark', () => {
    it('runs N iterations', () => {
      let count = 0
      benchmark('counter', () => { count++ }, 50)
      expect(count).toBe(50)
    })

    it('returns stats', () => {
      const result = benchmark('noop', () => {}, 10)
      expect(result.name).toBe('noop')
      expect(result.iterations).toBe(10)
      expect(result.avgMs).toBeGreaterThanOrEqual(0)
      expect(result.minMs).toBeLessThanOrEqual(result.maxMs)
      expect(result.medianMs).toBeGreaterThanOrEqual(0)
    })

    it('stores results', () => {
      benchmark('a', () => {}, 5)
      benchmark('b', () => {}, 5)
      expect(getResults()).toHaveLength(2)
    })
  })

  it('clearResults empties', () => {
    benchmark('test', () => {}, 5)
    clearResults()
    expect(getResults()).toHaveLength(0)
  })

  it('formatResult returns string', () => {
    const result = benchmark('fmt', () => {}, 5)
    const str = formatResult(result)
    expect(str).toContain('fmt')
    expect(str).toContain('avg=')
  })

  it('exportResults returns JSON', () => {
    benchmark('test', () => {}, 5)
    const json = exportResults()
    expect(JSON.parse(json)).toHaveLength(1)
  })
})
