import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { retry } from '../retry'

describe('retry', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('succeeds on first try without retrying', async () => {
    const fn = vi.fn().mockResolvedValue('success')

    const promise = retry(fn)
    const result = await promise

    expect(result).toBe('success')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('retries on failure then succeeds', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('fail 1'))
      .mockRejectedValueOnce(new Error('fail 2'))
      .mockResolvedValue('success')

    const promise = retry(fn)

    // First attempt fails immediately
    await vi.advanceTimersByTimeAsync(0)
    expect(fn).toHaveBeenCalledTimes(1)

    // Wait for first retry (1000ms base delay)
    await vi.advanceTimersByTimeAsync(1500)
    expect(fn).toHaveBeenCalledTimes(2)

    // Wait for second retry (2000ms with backoff)
    await vi.advanceTimersByTimeAsync(2500)
    expect(fn).toHaveBeenCalledTimes(3)

    const result = await promise
    expect(result).toBe('success')
  })

  it('exhausts all retries and throws last error', async () => {
    const error = new Error('persistent failure')
    const fn = vi.fn().mockRejectedValue(error)

    const promise = retry(fn, { maxRetries: 2 })

    // First attempt
    await vi.advanceTimersByTimeAsync(0)
    expect(fn).toHaveBeenCalledTimes(1)

    // First retry
    await vi.advanceTimersByTimeAsync(1500)
    expect(fn).toHaveBeenCalledTimes(2)

    // Second retry
    await vi.advanceTimersByTimeAsync(2500)
    expect(fn).toHaveBeenCalledTimes(3)

    await expect(promise).rejects.toThrow('persistent failure')
    expect(fn).toHaveBeenCalledTimes(3) // initial + 2 retries
  })

  it('respects maxRetries option', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('fail'))

    const promise = retry(fn, { maxRetries: 1 })

    await vi.advanceTimersByTimeAsync(0)
    await vi.advanceTimersByTimeAsync(1500)

    await expect(promise).rejects.toThrow('fail')
    expect(fn).toHaveBeenCalledTimes(2) // initial + 1 retry
  })

  it('applies exponential backoff with increasing delays', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('fail'))
    const onRetry = vi.fn()

    const promise = retry(fn, {
      maxRetries: 3,
      baseDelayMs: 100,
      backoffFactor: 2,
      onRetry
    })

    // First attempt fails immediately
    await vi.advanceTimersByTimeAsync(0)
    expect(fn).toHaveBeenCalledTimes(1)

    // First retry after ~100ms (with jitter)
    await vi.advanceTimersByTimeAsync(150)
    expect(fn).toHaveBeenCalledTimes(2)
    expect(onRetry).toHaveBeenCalledWith(expect.any(Error), 1)

    // Second retry after ~200ms (100 * 2^1)
    await vi.advanceTimersByTimeAsync(250)
    expect(fn).toHaveBeenCalledTimes(3)
    expect(onRetry).toHaveBeenCalledWith(expect.any(Error), 2)

    // Third retry after ~400ms (100 * 2^2)
    await vi.advanceTimersByTimeAsync(450)
    expect(fn).toHaveBeenCalledTimes(4)
    expect(onRetry).toHaveBeenCalledWith(expect.any(Error), 3)

    await expect(promise).rejects.toThrow()
  })

  it('uses custom shouldRetry function to determine retry', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('retryable'))
      .mockRejectedValueOnce(new Error('not retryable'))

    const shouldRetry = (error: Error) => error.message === 'retryable'

    const promise = retry(fn, { shouldRetry, maxRetries: 5 })

    // First attempt fails with retryable error
    await vi.advanceTimersByTimeAsync(0)
    expect(fn).toHaveBeenCalledTimes(1)

    // Should retry on retryable error
    await vi.advanceTimersByTimeAsync(1500)
    expect(fn).toHaveBeenCalledTimes(2)

    // Should not retry on non-retryable error
    await expect(promise).rejects.toThrow('not retryable')
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('cancels retry when AbortSignal is triggered', async () => {
    const controller = new AbortController()
    const fn = vi.fn().mockRejectedValue(new Error('fail'))

    const promise = retry(fn, {
      signal: controller.signal,
      maxRetries: 5
    })

    // First attempt
    await vi.advanceTimersByTimeAsync(0)
    expect(fn).toHaveBeenCalledTimes(1)

    // Abort during retry delay
    controller.abort()
    await vi.advanceTimersByTimeAsync(1500)

    await expect(promise).rejects.toThrow('Retry aborted')
    expect(fn).toHaveBeenCalledTimes(1) // No more attempts after abort
  })

  it('returns successful result value', async () => {
    const result = { data: 'test', status: 200 }
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValue(result)

    const promise = retry(fn)

    await vi.advanceTimersByTimeAsync(0)
    await vi.advanceTimersByTimeAsync(1500)

    const actual = await promise
    expect(actual).toEqual(result)
  })

  it('calls onRetry callback with error and attempt number', async () => {
    const error1 = new Error('fail 1')
    const error2 = new Error('fail 2')
    const fn = vi.fn()
      .mockRejectedValueOnce(error1)
      .mockRejectedValueOnce(error2)
      .mockResolvedValue('success')

    const onRetry = vi.fn()

    const promise = retry(fn, { onRetry })

    await vi.advanceTimersByTimeAsync(0)
    await vi.advanceTimersByTimeAsync(1500)
    expect(onRetry).toHaveBeenCalledWith(error1, 1)

    await vi.advanceTimersByTimeAsync(2500)
    expect(onRetry).toHaveBeenCalledWith(error2, 2)

    await promise
    expect(onRetry).toHaveBeenCalledTimes(2)
  })

  it('works with default configuration', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValue('success')

    const promise = retry(fn)

    await vi.advanceTimersByTimeAsync(0)
    await vi.advanceTimersByTimeAsync(1500)

    const result = await promise
    expect(result).toBe('success')
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('respects maxDelayMs cap on exponential backoff', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('fail'))
    const onRetry = vi.fn()

    const promise = retry(fn, {
      maxRetries: 5,
      baseDelayMs: 1000,
      maxDelayMs: 3000,
      backoffFactor: 2,
      onRetry
    })

    // First attempt
    await vi.advanceTimersByTimeAsync(0)
    expect(fn).toHaveBeenCalledTimes(1)

    // First retry - 1000ms base + jitter
    await vi.advanceTimersByTimeAsync(1200)
    expect(fn).toHaveBeenCalledTimes(2)

    // Second retry - 2000ms + jitter
    await vi.advanceTimersByTimeAsync(2400)
    expect(fn).toHaveBeenCalledTimes(3)

    // Third retry - 4000ms capped to 3000ms + jitter (max 3600ms)
    await vi.advanceTimersByTimeAsync(3600)
    expect(fn).toHaveBeenCalledTimes(4)

    // Fourth retry - should still be capped at 3000ms + jitter
    await vi.advanceTimersByTimeAsync(3600)
    expect(fn).toHaveBeenCalledTimes(5)

    // Fifth retry - should still be capped at 3000ms + jitter
    await vi.advanceTimersByTimeAsync(3600)
    expect(fn).toHaveBeenCalledTimes(6)

    await expect(promise).rejects.toThrow('fail')
    expect(onRetry).toHaveBeenCalledTimes(5)
  })

  it('adds jitter to prevent thundering herd', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('fail'))

    // Mock Math.random to control jitter
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.5)

    const promise = retry(fn, {
      maxRetries: 1,
      baseDelayMs: 1000,
      backoffFactor: 1 // No backoff to isolate jitter test
    })

    await vi.advanceTimersByTimeAsync(0)

    // With 0.5 random, jitter should add 0-20% (0-200ms) to base 1000ms
    // So delay should be around 1100ms
    await vi.advanceTimersByTimeAsync(1100)
    expect(fn).toHaveBeenCalledTimes(2)

    await expect(promise).rejects.toThrow()
    randomSpy.mockRestore()
  })
})