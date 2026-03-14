import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  HChatError,
  handleApiResponse,
  withRetry,
  ERROR_META,
  type HChatErrorCode,
} from '../hchat-error'

describe('HChatError', () => {
  it('should create error with code and default message', () => {
    const err = new HChatError('API_KEY_INVALID')
    expect(err.code).toBe('API_KEY_INVALID')
    expect(err.userMessage).toBe('Invalid API credentials')
    expect(err.action).toBe('CHECK_SETTINGS')
    expect(err).toBeInstanceOf(Error)
    expect(err.name).toBe('HChatError')
  })

  it('should allow custom userMessage', () => {
    const err = new HChatError('API_SERVER_ERROR', { userMessage: 'Custom message' })
    expect(err.userMessage).toBe('Custom message')
    expect(err.message).toBe('Custom message')
  })

  it('should store retryAfterMs', () => {
    const err = new HChatError('API_RATE_LIMIT', { retryAfterMs: 5000 })
    expect(err.retryAfterMs).toBe(5000)
  })

  it('should have undefined retryAfterMs by default', () => {
    const err = new HChatError('API_NETWORK_ERROR')
    expect(err.retryAfterMs).toBeUndefined()
  })
})

describe('ERROR_META', () => {
  it('should have meta for all error codes', () => {
    const codes: HChatErrorCode[] = [
      'API_KEY_MISSING', 'API_KEY_INVALID', 'API_RATE_LIMIT',
      'API_QUOTA_EXCEEDED', 'API_NETWORK_ERROR', 'API_TIMEOUT',
      'API_SERVER_ERROR', 'CONTENT_TOO_LONG', 'CONTENT_PARSE_ERROR',
      'STORAGE_QUOTA_EXCEEDED', 'STORAGE_PARSE_ERROR', 'UNKNOWN_ERROR',
    ]
    for (const code of codes) {
      expect(ERROR_META[code]).toBeDefined()
      expect(ERROR_META[code].message).toBeTruthy()
      expect(ERROR_META[code].severity).toMatch(/^(warn|error)$/)
      expect(ERROR_META[code].action).toBeTruthy()
    }
  })
})

describe('handleApiResponse', () => {
  function makeResponse(status: number, statusText = ''): Response {
    return { ok: status >= 200 && status < 300, status, statusText, headers: new Headers() } as Response
  }

  it('should not throw for 200 response', () => {
    expect(() => handleApiResponse(makeResponse(200))).not.toThrow()
  })

  it('should throw API_KEY_INVALID for 401', () => {
    expect(() => handleApiResponse(makeResponse(401))).toThrow(HChatError)
    try { handleApiResponse(makeResponse(401)) } catch (e) {
      expect((e as HChatError).code).toBe('API_KEY_INVALID')
    }
  })

  it('should throw API_KEY_INVALID for 403', () => {
    try { handleApiResponse(makeResponse(403)) } catch (e) {
      expect((e as HChatError).code).toBe('API_KEY_INVALID')
    }
  })

  it('should throw API_RATE_LIMIT for 429', () => {
    try { handleApiResponse(makeResponse(429)) } catch (e) {
      expect((e as HChatError).code).toBe('API_RATE_LIMIT')
    }
  })

  it('should parse retry-after header for 429', () => {
    const res = makeResponse(429)
    res.headers.set('retry-after', '30')
    try { handleApiResponse(res) } catch (e) {
      expect((e as HChatError).retryAfterMs).toBe(30_000)
    }
  })

  it('should throw CONTENT_PARSE_ERROR for 400', () => {
    try { handleApiResponse(makeResponse(400, 'Bad Request')) } catch (e) {
      expect((e as HChatError).code).toBe('CONTENT_PARSE_ERROR')
    }
  })

  it('should throw API_TIMEOUT for 408', () => {
    try { handleApiResponse(makeResponse(408)) } catch (e) {
      expect((e as HChatError).code).toBe('API_TIMEOUT')
    }
  })

  it('should throw API_TIMEOUT for 504', () => {
    try { handleApiResponse(makeResponse(504)) } catch (e) {
      expect((e as HChatError).code).toBe('API_TIMEOUT')
    }
  })

  it('should throw API_SERVER_ERROR for 500', () => {
    try { handleApiResponse(makeResponse(500)) } catch (e) {
      expect((e as HChatError).code).toBe('API_SERVER_ERROR')
    }
  })

  it('should throw UNKNOWN_ERROR for unrecognized status', () => {
    try { handleApiResponse(makeResponse(418, "I'm a teapot")) } catch (e) {
      expect((e as HChatError).code).toBe('UNKNOWN_ERROR')
    }
  })
})

describe('withRetry', () => {
  it('should return result on first success', async () => {
    const fn = vi.fn().mockResolvedValue('ok')
    const result = await withRetry(fn)
    expect(result).toBe('ok')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('should retry on rate limit error', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new HChatError('API_RATE_LIMIT', { retryAfterMs: 1 }))
      .mockResolvedValueOnce('ok')

    const result = await withRetry(fn, { maxAttempts: 3 })

    expect(result).toBe('ok')
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('should retry on server error', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new HChatError('API_SERVER_ERROR'))
      .mockResolvedValueOnce('recovered')

    const result = await withRetry(fn, { maxAttempts: 3 })

    expect(result).toBe('recovered')
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('should NOT retry on auth errors', async () => {
    const fn = vi.fn().mockRejectedValue(new HChatError('API_KEY_INVALID'))

    await expect(withRetry(fn, { maxAttempts: 3 })).rejects.toThrow(HChatError)
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('should NOT retry on non-HChatError', async () => {
    const fn = vi.fn().mockRejectedValue(new TypeError('oops'))

    await expect(withRetry(fn)).rejects.toThrow(TypeError)
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('should throw after max attempts', async () => {
    const fn = vi.fn().mockRejectedValue(new HChatError('API_RATE_LIMIT', { retryAfterMs: 1 }))

    await expect(withRetry(fn, { maxAttempts: 2 })).rejects.toThrow(HChatError)
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('should call onRetry callback', async () => {
    const onRetry = vi.fn()
    const fn = vi.fn()
      .mockRejectedValueOnce(new HChatError('API_RATE_LIMIT', { retryAfterMs: 1 }))
      .mockResolvedValueOnce('ok')

    await withRetry(fn, { maxAttempts: 3, onRetry })

    expect(onRetry).toHaveBeenCalledWith(1, 1)
  })

  it('should use retry-after from error when available', async () => {
    const onRetry = vi.fn()
    const fn = vi.fn()
      .mockRejectedValueOnce(new HChatError('API_RATE_LIMIT', { retryAfterMs: 42 }))
      .mockResolvedValueOnce('ok')

    await withRetry(fn, { maxAttempts: 3, onRetry })

    expect(onRetry).toHaveBeenCalledWith(1, 42)
  })
})
