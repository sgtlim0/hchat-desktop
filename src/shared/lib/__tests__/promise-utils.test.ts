import { describe, it, expect, vi } from 'vitest'
import { withTimeout, delay, promisePool, allSettledTyped, retry, isPromise, deferred } from '../promise-utils'

describe('promise-utils', () => {
  it('withTimeout resolves before timeout', async () => {
    const result = await withTimeout(Promise.resolve('success'), 1000)
    expect(result).toBe('success')
  })

  it('withTimeout rejects on timeout', async () => {
    vi.useFakeTimers()
    const promise = new Promise(() => {}) // Never resolves
    const timeoutPromise = withTimeout(promise, 100)
    vi.advanceTimersByTime(100)
    await expect(timeoutPromise).rejects.toThrow('Promise timed out after 100ms')
    vi.useRealTimers()
  })

  it('delay resolves after ms', async () => {
    vi.useFakeTimers()
    const p = delay(100)
    vi.advanceTimersByTime(100)
    await expect(p).resolves.toBeUndefined()
    vi.useRealTimers()
  })

  it('promisePool limits concurrency', async () => {
    let concurrent = 0
    let maxConcurrent = 0

    const tasks = Array.from({ length: 5 }, (_, i) => async () => {
      concurrent++
      maxConcurrent = Math.max(maxConcurrent, concurrent)
      await new Promise(resolve => setTimeout(resolve, 10))
      concurrent--
      return i
    })

    const results = await promisePool(tasks, 2)
    expect(maxConcurrent).toBeLessThanOrEqual(2)
    expect(results).toEqual([0, 1, 2, 3, 4])
  })

  it('allSettledTyped returns results with status', async () => {
    const promises = [
      Promise.resolve('value1'),
      Promise.reject(new Error('error1')),
      Promise.resolve('value2')
    ]

    const results = await allSettledTyped(promises)

    expect(results[0]).toEqual({ status: 'fulfilled', value: 'value1' })
    expect(results[1].status).toBe('rejected')
    expect(results[2]).toEqual({ status: 'fulfilled', value: 'value2' })
  })

  it('retry retries on failure', async () => {
    let attempts = 0
    const fn = async () => {
      attempts++
      if (attempts < 3) {
        throw new Error('retry')
      }
      return 'success'
    }

    const result = await retry(fn, 3)
    expect(result).toBe('success')
    expect(attempts).toBe(3)
  })

  it('isPromise detects promise values', () => {
    expect(isPromise(Promise.resolve())).toBe(true)
    expect(isPromise(new Promise(() => {}))).toBe(true)
    expect(isPromise({ then: () => {} })).toBe(true)
    expect(isPromise(42)).toBe(false)
    expect(isPromise(null)).toBe(false)
    expect(isPromise(undefined)).toBe(false)
    expect(isPromise('string')).toBe(false)
    expect(isPromise({})).toBe(false)
  })

  it('deferred creates controllable promise', async () => {
    const def = deferred<string>()

    expect(typeof def.resolve).toBe('function')
    expect(typeof def.reject).toBe('function')

    def.resolve('controlled')
    const result = await def.promise
    expect(result).toBe('controlled')

    const def2 = deferred<number>()
    def2.reject(new Error('fail'))
    await expect(def2.promise).rejects.toThrow('fail')
  })
})
