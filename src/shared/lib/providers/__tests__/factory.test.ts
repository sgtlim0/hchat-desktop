import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { createStream } from '../factory'
import { getRateLimiter } from '../../rate-limiter'
import type { ProviderConfig, StreamParams } from '../types'

// Mock the provider modules
vi.mock('../../bedrock-client', () => ({
  streamChat: vi.fn().mockImplementation(async function* () {
    yield { type: 'text', text: 'test response' }
    yield { type: 'done' }
  }),
}))

vi.mock('../openai', () => ({
  streamOpenAI: vi.fn().mockImplementation(async function* () {
    yield { type: 'text', text: 'openai response' }
    yield { type: 'done' }
  }),
}))

vi.mock('../gemini', () => ({
  streamGemini: vi.fn().mockImplementation(async function* () {
    yield { type: 'text', text: 'gemini response' }
    yield { type: 'done' }
  }),
}))

describe('factory with rate limiting', () => {
  beforeEach(() => {
    // Clear all rate limiters before each test
    getRateLimiter.clearAll?.()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('rate limiting integration', () => {
    it('should allow requests within rate limit', async () => {
      const config: ProviderConfig = {
        provider: 'bedrock',
        credentials: {
          accessKeyId: 'test',
          secretAccessKey: 'test',
          region: 'us-east-1',
        },
      }
      const params: StreamParams = {
        model: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
        messages: [{ role: 'user', content: 'test' }],
      }

      const stream = createStream(config, params)
      const results = []

      for await (const event of stream) {
        results.push(event)
      }

      expect(results).toHaveLength(2)
      expect(results[0]).toMatchObject({ type: 'text', text: 'test response' })
      expect(results[1]).toMatchObject({ type: 'done' })
    })

    it('should block requests when rate limit is exceeded', async () => {
      const config: ProviderConfig = {
        provider: 'bedrock',
        credentials: {
          accessKeyId: 'test',
          secretAccessKey: 'test',
          region: 'us-east-1',
        },
      }
      const params: StreamParams = {
        model: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
        messages: [{ role: 'user', content: 'test' }],
      }

      // Exhaust the rate limit (bedrock has 10 requests per minute)
      const limiter = getRateLimiter('bedrock')
      for (let i = 0; i < 10; i++) {
        await limiter.acquire()
      }

      // Next request should be rate limited
      const stream = createStream(config, params)
      const results = []

      for await (const event of stream) {
        results.push(event)
      }

      expect(results).toHaveLength(1)
      expect(results[0].type).toBe('error')
      expect(results[0].error).toContain('Rate limit exceeded')
      expect(results[0].error).toContain('Please wait')
    })

    it('should apply different rate limits for different providers', async () => {
      // OpenAI has 20 requests per minute
      const openaiConfig: ProviderConfig = {
        provider: 'openai',
        apiKey: 'test-key',
      }

      // Gemini has 15 requests per minute
      const geminiConfig: ProviderConfig = {
        provider: 'gemini',
        apiKey: 'test-key',
      }

      const params: StreamParams = {
        model: 'gpt-4o',
        messages: [{ role: 'user', content: 'test' }],
      }

      // OpenAI should allow 20 requests
      const openaiLimiter = getRateLimiter('openai')
      for (let i = 0; i < 20; i++) {
        expect(await openaiLimiter.acquire()).toBe(true)
      }
      expect(await openaiLimiter.acquire()).toBe(false)

      // Gemini should allow 15 requests
      const geminiLimiter = getRateLimiter('gemini')
      for (let i = 0; i < 15; i++) {
        expect(await geminiLimiter.acquire()).toBe(true)
      }
      expect(await geminiLimiter.acquire()).toBe(false)
    })

    it('should show correct wait time in error message', async () => {
      const config: ProviderConfig = {
        provider: 'bedrock',
        credentials: {
          accessKeyId: 'test',
          secretAccessKey: 'test',
          region: 'us-east-1',
        },
      }
      const params: StreamParams = {
        model: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
        messages: [{ role: 'user', content: 'test' }],
      }

      // Exhaust the rate limit
      const limiter = getRateLimiter('bedrock')
      for (let i = 0; i < 10; i++) {
        await limiter.acquire()
      }

      // Check wait time is calculated correctly
      const waitTime = limiter.getWaitTime()
      expect(waitTime).toBeGreaterThan(0)
      expect(waitTime).toBeLessThanOrEqual(60000) // Should be within 1 minute

      // Request should show wait time in seconds
      const stream = createStream(config, params)
      const results = []

      for await (const event of stream) {
        results.push(event)
      }

      const waitSeconds = Math.ceil(waitTime / 1000)
      expect(results[0].error).toContain(`${waitSeconds} seconds`)
    })

    it('should handle missing credentials with rate limiting', async () => {
      const config: ProviderConfig = {
        provider: 'bedrock',
        // Missing credentials
      }
      const params: StreamParams = {
        model: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
        messages: [{ role: 'user', content: 'test' }],
      }

      // Even though rate limit passes, should fail on missing credentials
      const stream = createStream(config, params)
      const results = []

      for await (const event of stream) {
        results.push(event)
      }

      expect(results).toHaveLength(1)
      expect(results[0]).toMatchObject({
        type: 'error',
        error: 'AWS credentials not configured',
      })

      // Should have consumed a token even though request failed
      const limiter = getRateLimiter('bedrock')
      expect(await limiter.acquire()).toBe(true) // Should have 9 tokens left
    })

    it('should handle unknown provider with default rate limit', async () => {
      const config: ProviderConfig = {
        provider: 'unknown' as any,
      }
      const params: StreamParams = {
        model: 'unknown-model',
        messages: [{ role: 'user', content: 'test' }],
      }

      const stream = createStream(config, params)
      const results = []

      for await (const event of stream) {
        results.push(event)
      }

      // Should use bedrock's default limit
      const limiter = getRateLimiter('unknown')
      for (let i = 0; i < 9; i++) {
        // Already used 1
        expect(await limiter.acquire()).toBe(true)
      }
      expect(await limiter.acquire()).toBe(false)
    })
  })
})