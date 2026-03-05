import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createStreamThrottle } from '../stream-throttle'

describe('createStreamThrottle', () => {
  let rafCallbacks: Array<() => void> = []
  let rafIdCounter = 1

  beforeEach(() => {
    rafCallbacks = []
    rafIdCounter = 1
    vi.stubGlobal('requestAnimationFrame', (cb: () => void) => {
      rafCallbacks.push(cb)
      return rafIdCounter++
    })
    vi.stubGlobal('cancelAnimationFrame', (id: number) => {
      // Remove callback by index (id - 1)
      rafCallbacks = rafCallbacks.filter((_, i) => i + 1 !== id)
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  function flushRAF() {
    const cbs = [...rafCallbacks]
    rafCallbacks = []
    cbs.forEach((cb) => cb())
  }

  it('should batch multiple updates into one rAF callback', () => {
    const throttle = createStreamThrottle()
    const callback = vi.fn()

    throttle.update('H', callback)
    throttle.update('He', callback)
    throttle.update('Hel', callback)
    throttle.update('Hell', callback)
    throttle.update('Hello', callback)

    expect(callback).not.toHaveBeenCalled()

    flushRAF()

    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback).toHaveBeenCalledWith('Hello')
  })

  it('should allow new updates after rAF fires', () => {
    const throttle = createStreamThrottle()
    const callback = vi.fn()

    throttle.update('first', callback)
    flushRAF()
    expect(callback).toHaveBeenCalledWith('first')

    throttle.update('second', callback)
    flushRAF()
    expect(callback).toHaveBeenCalledWith('second')
    expect(callback).toHaveBeenCalledTimes(2)
  })

  it('flush should immediately invoke callback with pending text', () => {
    const throttle = createStreamThrottle()
    const callback = vi.fn()

    throttle.update('pending', vi.fn())
    throttle.flush(callback)

    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback).toHaveBeenCalledWith('pending')
  })

  it('flush should cancel pending rAF', () => {
    const throttle = createStreamThrottle()
    const updateCb = vi.fn()
    const flushCb = vi.fn()

    throttle.update('text', updateCb)
    throttle.flush(flushCb)

    // Original rAF callback should not fire
    flushRAF()
    expect(updateCb).not.toHaveBeenCalled()
    expect(flushCb).toHaveBeenCalledWith('text')
  })

  it('flush should not invoke callback when no pending text', () => {
    const throttle = createStreamThrottle()
    const callback = vi.fn()

    throttle.flush(callback)

    expect(callback).not.toHaveBeenCalled()
  })

  it('cancel should clear pending text and rAF', () => {
    const throttle = createStreamThrottle()
    const callback = vi.fn()

    throttle.update('will be cancelled', callback)
    throttle.cancel()

    flushRAF()
    expect(callback).not.toHaveBeenCalled()

    // Flush after cancel should not invoke
    const flushCb = vi.fn()
    throttle.flush(flushCb)
    expect(flushCb).not.toHaveBeenCalled()
  })
})
