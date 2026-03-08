import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useInterval } from '../useInterval'

describe('useInterval', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('calls callback at interval', () => {
    const cb = vi.fn()
    renderHook(() => useInterval(cb, 100))
    vi.advanceTimersByTime(300)
    expect(cb).toHaveBeenCalledTimes(3)
  })

  it('does not call when delay is null', () => {
    const cb = vi.fn()
    renderHook(() => useInterval(cb, null))
    vi.advanceTimersByTime(1000)
    expect(cb).not.toHaveBeenCalled()
  })

  it('cleans up on unmount', () => {
    const cb = vi.fn()
    const { unmount } = renderHook(() => useInterval(cb, 100))
    vi.advanceTimersByTime(100)
    expect(cb).toHaveBeenCalledTimes(1)
    unmount()
    vi.advanceTimersByTime(500)
    expect(cb).toHaveBeenCalledTimes(1)
  })

  it('uses latest callback', () => {
    let count = 0
    const { rerender } = renderHook(
      ({ cb }) => useInterval(cb, 100),
      { initialProps: { cb: () => { count += 1 } } },
    )
    rerender({ cb: () => { count += 10 } })
    vi.advanceTimersByTime(100)
    expect(count).toBe(10)
  })

  it('restarts when delay changes', () => {
    const cb = vi.fn()
    const { rerender } = renderHook(
      ({ delay }) => useInterval(cb, delay),
      { initialProps: { delay: 100 as number | null } },
    )
    vi.advanceTimersByTime(250)
    expect(cb).toHaveBeenCalledTimes(2)
    rerender({ delay: 200 })
    cb.mockClear()
    vi.advanceTimersByTime(400)
    expect(cb).toHaveBeenCalledTimes(2)
  })
})
