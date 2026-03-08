import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { RateLimiter, getRateLimiter } from '../rate-limiter'

describe('RateLimiter', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    // Clear singleton instances
    getRateLimiter.clearAll?.()
  })

  describe('Token Bucket Algorithm', () => {
    it('should initialize with full capacity', async () => {
      const limiter = new RateLimiter({ capacity: 5, refillRate: 1, refillInterval: 1000 })

      // Should be able to acquire all tokens immediately
      for (let i = 0; i < 5; i++) {
        const canAcquire = await limiter.acquire()
        expect(canAcquire).toBe(true)
      }

      // 6th request should fail
      const canAcquire = await limiter.acquire()
      expect(canAcquire).toBe(false)
    })

    it('should refill tokens over time', async () => {
      const limiter = new RateLimiter({ capacity: 3, refillRate: 1, refillInterval: 1000 })

      // Use all tokens
      for (let i = 0; i < 3; i++) {
        await limiter.acquire()
      }

      // Should not have tokens immediately
      expect(await limiter.acquire()).toBe(false)

      // After 1 second, should have 1 token
      vi.advanceTimersByTime(1000)
      expect(await limiter.acquire()).toBe(true)
      expect(await limiter.acquire()).toBe(false)

      // After another 2 seconds, should have 2 more tokens
      vi.advanceTimersByTime(2000)
      expect(await limiter.acquire()).toBe(true)
      expect(await limiter.acquire()).toBe(true)
      expect(await limiter.acquire()).toBe(false)
    })

    it('should not exceed max capacity when refilling', async () => {
      const limiter = new RateLimiter({ capacity: 2, refillRate: 3, refillInterval: 1000 })

      // Use 1 token
      await limiter.acquire()

      // After refill, should still have max 2 tokens
      vi.advanceTimersByTime(1000)

      expect(await limiter.acquire()).toBe(true)
      expect(await limiter.acquire()).toBe(true)
      expect(await limiter.acquire()).toBe(false)
    })

    it('should handle burst refill correctly', async () => {
      const limiter = new RateLimiter({ capacity: 10, refillRate: 5, refillInterval: 1000 })

      // Use all tokens
      for (let i = 0; i < 10; i++) {
        await limiter.acquire()
      }

      // After 1 second, should refill 5 tokens
      vi.advanceTimersByTime(1000)

      for (let i = 0; i < 5; i++) {
        expect(await limiter.acquire()).toBe(true)
      }
      expect(await limiter.acquire()).toBe(false)
    })
  })

  describe('getWaitTime', () => {
    it('should return 0 when tokens are available', () => {
      const limiter = new RateLimiter({ capacity: 5, refillRate: 1, refillInterval: 1000 })
      expect(limiter.getWaitTime()).toBe(0)
    })

    it('should calculate wait time when no tokens available', async () => {
      const limiter = new RateLimiter({ capacity: 2, refillRate: 1, refillInterval: 1000 })

      // Use all tokens
      await limiter.acquire()
      await limiter.acquire()

      // Should wait for next refill
      const waitTime = limiter.getWaitTime()
      expect(waitTime).toBeGreaterThan(0)
      expect(waitTime).toBeLessThanOrEqual(1000)
    })

    it('should calculate multi-interval wait time for multiple tokens', async () => {
      const limiter = new RateLimiter({ capacity: 3, refillRate: 1, refillInterval: 1000 })

      // Use all tokens
      for (let i = 0; i < 3; i++) {
        await limiter.acquire()
      }

      // Need to wait for 1 token
      const waitTime = limiter.getWaitTime(1)
      expect(waitTime).toBeGreaterThan(0)
      expect(waitTime).toBeLessThanOrEqual(1000)

      // Need to wait longer for 2 tokens
      const waitTime2 = limiter.getWaitTime(2)
      expect(waitTime2).toBeGreaterThan(1000)
      expect(waitTime2).toBeLessThanOrEqual(2000)
    })
  })

  describe('reset', () => {
    it('should reset tokens to full capacity', async () => {
      const limiter = new RateLimiter({ capacity: 3, refillRate: 1, refillInterval: 1000 })

      // Use all tokens
      for (let i = 0; i < 3; i++) {
        await limiter.acquire()
      }

      expect(await limiter.acquire()).toBe(false)

      // Reset
      limiter.reset()

      // Should have full capacity again
      for (let i = 0; i < 3; i++) {
        expect(await limiter.acquire()).toBe(true)
      }
    })
  })

  describe('Provider Configurations', () => {
    it('should have correct config for bedrock (10/min)', async () => {
      const limiter = getRateLimiter('bedrock')

      // Should allow 10 requests
      for (let i = 0; i < 10; i++) {
        expect(await limiter.acquire()).toBe(true)
      }

      // 11th should fail
      expect(await limiter.acquire()).toBe(false)

      // Should refill 10 tokens per minute
      vi.advanceTimersByTime(60000)
      for (let i = 0; i < 10; i++) {
        expect(await limiter.acquire()).toBe(true)
      }
    })

    it('should have correct config for openai (20/min)', async () => {
      const limiter = getRateLimiter('openai')

      // Should allow 20 requests
      for (let i = 0; i < 20; i++) {
        expect(await limiter.acquire()).toBe(true)
      }

      // 21st should fail
      expect(await limiter.acquire()).toBe(false)

      // Should refill 20 tokens per minute
      vi.advanceTimersByTime(60000)
      for (let i = 0; i < 20; i++) {
        expect(await limiter.acquire()).toBe(true)
      }
    })

    it('should have correct config for gemini (15/min)', async () => {
      const limiter = getRateLimiter('gemini')

      // Should allow 15 requests
      for (let i = 0; i < 15; i++) {
        expect(await limiter.acquire()).toBe(true)
      }

      // 16th should fail
      expect(await limiter.acquire()).toBe(false)

      // Should refill 15 tokens per minute
      vi.advanceTimersByTime(60000)
      for (let i = 0; i < 15; i++) {
        expect(await limiter.acquire()).toBe(true)
      }
    })

    it('should return singleton instances per provider', () => {
      const limiter1 = getRateLimiter('bedrock')
      const limiter2 = getRateLimiter('bedrock')
      expect(limiter1).toBe(limiter2)

      const openaiLimiter = getRateLimiter('openai')
      expect(openaiLimiter).not.toBe(limiter1)
    })

    it('should handle unknown provider with default config', () => {
      const limiter = getRateLimiter('unknown' as any)
      expect(limiter).toBeInstanceOf(RateLimiter)
    })
  })

  describe('Concurrent Access', () => {
    it('should handle concurrent acquire requests correctly', async () => {
      const limiter = new RateLimiter({ capacity: 5, refillRate: 1, refillInterval: 1000 })

      // Make concurrent requests
      const results = await Promise.all([
        limiter.acquire(),
        limiter.acquire(),
        limiter.acquire(),
        limiter.acquire(),
        limiter.acquire(),
        limiter.acquire(), // 6th should fail
      ])

      const successes = results.filter(r => r === true).length
      const failures = results.filter(r => r === false).length

      expect(successes).toBe(5)
      expect(failures).toBe(1)
    })
  })

  describe('Edge Cases', () => {
    it('should handle zero capacity', async () => {
      const limiter = new RateLimiter({ capacity: 0, refillRate: 1, refillInterval: 1000 })
      expect(await limiter.acquire()).toBe(false)

      // Even after refill
      vi.advanceTimersByTime(1000)
      expect(await limiter.acquire()).toBe(false)
    })

    it('should handle zero refill rate', async () => {
      const limiter = new RateLimiter({ capacity: 1, refillRate: 0, refillInterval: 1000 })

      // Can use initial capacity
      expect(await limiter.acquire()).toBe(true)
      expect(await limiter.acquire()).toBe(false)

      // No refill
      vi.advanceTimersByTime(10000)
      expect(await limiter.acquire()).toBe(false)
    })

    it('should handle fractional tokens with rounding', async () => {
      const limiter = new RateLimiter({ capacity: 10, refillRate: 3, refillInterval: 2000 })

      // Use all tokens
      for (let i = 0; i < 10; i++) {
        await limiter.acquire()
      }

      // After 2 seconds, should refill 3 tokens
      vi.advanceTimersByTime(2000)

      for (let i = 0; i < 3; i++) {
        expect(await limiter.acquire()).toBe(true)
      }
      expect(await limiter.acquire()).toBe(false)
    })
  })
})