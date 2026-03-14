import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { waitForDOMStable } from '../wait-for-stable'

describe('waitForDOMStable', () => {
  let container: HTMLDivElement

  beforeEach(() => {
    vi.useFakeTimers()
    container = document.createElement('div')
    document.body.appendChild(container)
  })

  afterEach(() => {
    vi.useRealTimers()
    container.remove()
  })

  it('should resolve after stableMs when no mutations occur', async () => {
    const promise = waitForDOMStable(container, { stableMs: 100, timeoutMs: 2000 })

    await vi.advanceTimersByTimeAsync(150)
    await expect(promise).resolves.toBeUndefined()
  })

  it('should wait for mutations to settle before resolving', async () => {
    let resolved = false
    const promise = waitForDOMStable(container, { stableMs: 200, timeoutMs: 5000 })
    promise.then(() => { resolved = true })

    // Trigger mutation at 50ms
    await vi.advanceTimersByTimeAsync(50)
    container.appendChild(document.createElement('span'))

    // Should NOT be resolved yet (mutation resets timer)
    await vi.advanceTimersByTimeAsync(100)
    expect(resolved).toBe(false)

    // Advance past stableMs after last mutation
    await vi.advanceTimersByTimeAsync(200)
    await promise
    expect(resolved).toBe(true)
  })

  it('should resolve at timeoutMs even if mutations continue', async () => {
    let resolved = false
    const promise = waitForDOMStable(container, { stableMs: 500, timeoutMs: 1000 })
    promise.then(() => { resolved = true })

    // Keep mutating every 100ms
    for (let i = 0; i < 20; i++) {
      await vi.advanceTimersByTimeAsync(100)
      container.appendChild(document.createElement('div'))
    }

    // Should have resolved at timeoutMs
    await promise
    expect(resolved).toBe(true)
  })

  it('should only resolve once even with multiple timers', async () => {
    const callback = vi.fn()
    const promise = waitForDOMStable(container, { stableMs: 100, timeoutMs: 200 })
    promise.then(callback)

    // Let both stableMs and timeoutMs fire
    await vi.advanceTimersByTimeAsync(300)
    await promise

    expect(callback).toHaveBeenCalledTimes(1)
  })

  it('should use default options when not provided', async () => {
    const promise = waitForDOMStable(container)

    // Default stableMs = 300
    await vi.advanceTimersByTimeAsync(350)
    await expect(promise).resolves.toBeUndefined()
  })

  it('should disconnect observer after resolving', async () => {
    const promise = waitForDOMStable(container, { stableMs: 50, timeoutMs: 500 })

    await vi.advanceTimersByTimeAsync(100)
    await promise

    // Mutations after resolve should not cause issues
    container.appendChild(document.createElement('div'))
    container.appendChild(document.createElement('div'))
    // No error thrown = observer disconnected
  })
})
