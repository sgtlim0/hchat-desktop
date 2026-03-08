import { describe, it, expect, beforeEach, vi } from 'vitest'
import { RateLimiter, getRateLimiter, resetAllLimiters } from '../rate-limiter'

describe('RateLimiter', () => {
  let limiter: RateLimiter

  beforeEach(() => {
    limiter = new RateLimiter({ maxTokens: 3, refillRate: 1, refillIntervalMs: 1000 })
  })

  it('allows requests within capacity', () => {
    expect(limiter.acquire()).toBe(true)
    expect(limiter.acquire()).toBe(true)
    expect(limiter.acquire()).toBe(true)
  })

  it('blocks requests when exhausted', () => {
    limiter.acquire()
    limiter.acquire()
    limiter.acquire()
    expect(limiter.acquire()).toBe(false)
  })

  it('returns available tokens correctly', () => {
    expect(limiter.getAvailableTokens()).toBe(3)
    limiter.acquire()
    expect(limiter.getAvailableTokens()).toBe(2)
  })

  it('refills tokens after interval', () => {
    limiter.acquire()
    limiter.acquire()
    limiter.acquire()
    expect(limiter.acquire()).toBe(false)

    vi.useFakeTimers()
    vi.advanceTimersByTime(1000)
    expect(limiter.acquire()).toBe(true)
    vi.useRealTimers()
  })

  it('does not exceed max tokens on refill', () => {
    vi.useFakeTimers()
    vi.advanceTimersByTime(10000)
    expect(limiter.getAvailableTokens()).toBe(3)
    vi.useRealTimers()
  })

  it('returns zero wait time when tokens available', () => {
    expect(limiter.getWaitTimeMs()).toBe(0)
  })

  it('returns positive wait time when exhausted', () => {
    limiter.acquire()
    limiter.acquire()
    limiter.acquire()
    expect(limiter.getWaitTimeMs()).toBeGreaterThan(0)
  })

  it('resets to full capacity', () => {
    limiter.acquire()
    limiter.acquire()
    limiter.acquire()
    limiter.reset()
    expect(limiter.getAvailableTokens()).toBe(3)
    expect(limiter.acquire()).toBe(true)
  })
})

describe('getRateLimiter', () => {
  beforeEach(() => {
    resetAllLimiters()
  })

  it('returns singleton per provider', () => {
    const a = getRateLimiter('bedrock')
    const b = getRateLimiter('bedrock')
    expect(a).toBe(b)
  })

  it('returns different instances for different providers', () => {
    const bedrock = getRateLimiter('bedrock')
    const openai = getRateLimiter('openai')
    expect(bedrock).not.toBe(openai)
  })

  it('uses default config for unknown providers', () => {
    const unknown = getRateLimiter('unknown-provider')
    expect(unknown.getAvailableTokens()).toBe(10) // bedrock default
  })

  it('bedrock has 10 max tokens', () => {
    const limiter = getRateLimiter('bedrock')
    expect(limiter.getAvailableTokens()).toBe(10)
  })

  it('openai has 20 max tokens', () => {
    const limiter = getRateLimiter('openai')
    expect(limiter.getAvailableTokens()).toBe(20)
  })

  it('gemini has 15 max tokens', () => {
    const limiter = getRateLimiter('gemini')
    expect(limiter.getAvailableTokens()).toBe(15)
  })

  it('resetAllLimiters resets all instances', () => {
    const bedrock = getRateLimiter('bedrock')
    bedrock.acquire()
    bedrock.acquire()
    resetAllLimiters()
    expect(bedrock.getAvailableTokens()).toBe(10)
  })
})
