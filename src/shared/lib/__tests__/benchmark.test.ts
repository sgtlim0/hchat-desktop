import { describe, it, expect, beforeEach } from 'vitest'
import {
  measure,
  measureAsync,
  benchmark,
  getResults,
  clearResults,
  compare,
  formatResult,
  exportResults,
  type BenchmarkResult
} from '../benchmark'

describe('benchmark', () => {
  beforeEach(() => {
    clearResults()
  })

  describe('measure', () => {
    it('returns execution time', () => {
      const { durationMs } = measure(() => {
        // Simulate some work
        let sum = 0
        for (let i = 0; i < 1000; i++) {
          sum += i
        }
      })

      expect(durationMs).toBeGreaterThanOrEqual(0)
      expect(durationMs).toBeLessThan(100) // Should be fast
    })

    it('returns function result', () => {
      const { result } = measure(() => {
        return 42
      })

      expect(result).toBe(42)
    })
  })

  describe('measureAsync', () => {
    it('works with promises', async () => {
      const { result, durationMs } = await measureAsync(async () => {
        await new Promise(resolve => setTimeout(resolve, 10))
        return 'async result'
      })

      expect(result).toBe('async result')
      expect(durationMs).toBeGreaterThanOrEqual(10)
      expect(durationMs).toBeLessThan(50)
    })
  })

  describe('benchmark', () => {
    it('runs N iterations', () => {
      const result = benchmark('test', () => {
        let sum = 0
        for (let i = 0; i < 100; i++) {
          sum += i
        }
      }, 50)

      expect(result.iterations).toBe(50)
      expect(result.name).toBe('test')
    })

    it('returns avg/min/max/median stats', () => {
      const result = benchmark('stats-test', () => {
        // Simple operation
        Math.sqrt(Math.random() * 1000)
      }, 10)

      expect(result.avgMs).toBeGreaterThanOrEqual(0)
      expect(result.minMs).toBeGreaterThanOrEqual(0)
      expect(result.maxMs).toBeGreaterThanOrEqual(result.minMs)
      expect(result.medianMs).toBeGreaterThanOrEqual(result.minMs)
      expect(result.medianMs).toBeLessThanOrEqual(result.maxMs)
      expect(result.totalMs).toBeGreaterThanOrEqual(0)
    })
  })

  describe('getResults', () => {
    it('returns all benchmarks', () => {
      benchmark('bench-1', () => {})
      benchmark('bench-2', () => {})
      benchmark('bench-3', () => {})

      const results = getResults()
      expect(results).toHaveLength(3)
      expect(results.map(r => r.name)).toEqual(['bench-1', 'bench-2', 'bench-3'])
    })
  })

  describe('clearResults', () => {
    it('empties all stored results', () => {
      benchmark('clear-1', () => {})
      benchmark('clear-2', () => {})

      expect(getResults()).toHaveLength(2)

      clearResults()

      expect(getResults()).toHaveLength(0)
    })
  })

  describe('compare', () => {
    it('returns comparison of two benchmarks', () => {
      const fast = benchmark('fast', () => {
        // Quick operation
      }, 100)

      const slow = benchmark('slow', () => {
        // Simulate slower operation
        let sum = 0
        for (let i = 0; i < 10000; i++) {
          sum += Math.sqrt(i)
        }
      }, 100)

      const comparison = compare('fast', 'slow')

      expect(comparison).toBeDefined()
      expect(comparison.faster).toBe('fast')
      expect(comparison.slower).toBe('slow')
      expect(comparison.speedup).toBeGreaterThan(1)
      expect(comparison.percentFaster).toBeGreaterThan(0)
    })
  })

  describe('formatResult', () => {
    it('returns human-readable string', () => {
      const result: BenchmarkResult = {
        name: 'test-format',
        iterations: 100,
        avgMs: 1.234,
        minMs: 0.5,
        maxMs: 2.5,
        medianMs: 1.1,
        totalMs: 123.4
      }

      const formatted = formatResult(result)

      expect(formatted).toContain('test-format')
      expect(formatted).toContain('100 iterations')
      expect(formatted).toContain('1.23ms')
      expect(formatted).toContain('0.50ms')
      expect(formatted).toContain('2.50ms')
      expect(formatted).toContain('1.10ms')
    })
  })

  describe('exportResults', () => {
    it('returns JSON string', () => {
      benchmark('export-1', () => {})
      benchmark('export-2', () => {})

      const json = exportResults()
      const parsed = JSON.parse(json)

      expect(parsed).toHaveProperty('benchmarks')
      expect(parsed.benchmarks).toHaveLength(2)
      expect(parsed).toHaveProperty('timestamp')
      expect(parsed).toHaveProperty('version')
    })
  })
})
