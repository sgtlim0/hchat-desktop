import { describe, it, expect, vi } from 'vitest'
import {
  debounce,
  rafThrottle,
  lazyModule,
  estimateTokens,
  measureAsync,
  collectWebVitals,
} from '@/shared/lib/perf-optimizer'

describe('perf-optimizer', () => {
  describe('debounce', () => {
    it('should delay execution', async () => {
      vi.useFakeTimers()
      const fn = vi.fn()
      const debounced = debounce(fn, 100)

      debounced()
      debounced()
      debounced()
      expect(fn).not.toHaveBeenCalled()

      vi.advanceTimersByTime(100)
      expect(fn).toHaveBeenCalledTimes(1)
      vi.useRealTimers()
    })
  })

  describe('lazyModule', () => {
    it('should load module only once', async () => {
      const loader = vi.fn().mockResolvedValue({ value: 42 })
      const lazy = lazyModule(loader)

      const r1 = await lazy.get()
      const r2 = await lazy.get()

      expect(r1).toEqual({ value: 42 })
      expect(r2).toEqual({ value: 42 })
      expect(loader).toHaveBeenCalledTimes(1)
    })
  })

  describe('estimateTokens', () => {
    it('should estimate English tokens (~4 chars/token)', () => {
      const tokens = estimateTokens('Hello World Test')
      expect(tokens).toBeGreaterThan(0)
      expect(tokens).toBeLessThan(10)
    })

    it('should estimate Korean tokens (~2 chars/token)', () => {
      const tokens = estimateTokens('안녕하세요')
      expect(tokens).toBeGreaterThan(0)
    })

    it('should handle mixed text', () => {
      const tokens = estimateTokens('Hello 안녕 World 세계')
      expect(tokens).toBeGreaterThan(0)
    })

    it('should return 0 for empty string', () => {
      expect(estimateTokens('')).toBe(0)
    })
  })

  describe('measureAsync', () => {
    it('should return result and duration', async () => {
      const { result, durationMs } = await measureAsync('test', async () => {
        return 'hello'
      })
      expect(result).toBe('hello')
      expect(durationMs).toBeGreaterThanOrEqual(0)
    })
  })

  describe('collectWebVitals', () => {
    it('should return metrics object', () => {
      const metrics = collectWebVitals()
      expect(metrics.timestamp).toBeTruthy()
      expect(metrics).toHaveProperty('fcp')
      expect(metrics).toHaveProperty('lcp')
      expect(metrics).toHaveProperty('cls')
    })
  })
})
