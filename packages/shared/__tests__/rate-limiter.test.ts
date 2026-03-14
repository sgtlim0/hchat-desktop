import { describe, it, expect, beforeEach } from 'vitest'
import { RateLimiter, getRateLimiter } from '../src/lib/rate-limiter'

describe('RateLimiter', () => {
  it('allows requests within capacity', async () => {
    const limiter = new RateLimiter({ capacity: 3, refillRate: 1, refillInterval: 60000 })
    expect(await limiter.acquire()).toBe(true)
    expect(await limiter.acquire()).toBe(true)
    expect(await limiter.acquire()).toBe(true)
  })

  it('rejects requests when capacity exhausted', async () => {
    const limiter = new RateLimiter({ capacity: 1, refillRate: 1, refillInterval: 60000 })
    expect(await limiter.acquire()).toBe(true)
    expect(await limiter.acquire()).toBe(false)
  })

  it('getWaitTime returns 0 when tokens available', () => {
    const limiter = new RateLimiter({ capacity: 5, refillRate: 1, refillInterval: 1000 })
    expect(limiter.getWaitTime()).toBe(0)
  })

  it('reset restores full capacity', async () => {
    const limiter = new RateLimiter({ capacity: 1, refillRate: 1, refillInterval: 60000 })
    await limiter.acquire()
    expect(await limiter.acquire()).toBe(false)
    limiter.reset()
    expect(await limiter.acquire()).toBe(true)
  })
})

describe('getRateLimiter', () => {
  beforeEach(() => {
    getRateLimiter.clearAll()
  })

  it('returns a RateLimiter for known providers', () => {
    const limiter = getRateLimiter('bedrock')
    expect(limiter).toBeInstanceOf(RateLimiter)
  })

  it('returns same instance on repeated calls', () => {
    const a = getRateLimiter('openai')
    const b = getRateLimiter('openai')
    expect(a).toBe(b)
  })

  it('returns different instances for different providers', () => {
    const a = getRateLimiter('bedrock')
    const b = getRateLimiter('gemini')
    expect(a).not.toBe(b)
  })

  it('falls back to bedrock config for unknown providers', () => {
    const limiter = getRateLimiter('unknown')
    expect(limiter).toBeInstanceOf(RateLimiter)
  })
})
