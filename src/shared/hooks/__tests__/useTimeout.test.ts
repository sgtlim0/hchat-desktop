import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTimeout } from '../useTimeout'

describe('useTimeout', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('calls callback after delay', () => {
    const cb = vi.fn()
    renderHook(() => useTimeout(cb, 500))
    expect(cb).not.toHaveBeenCalled()
    vi.advanceTimersByTime(500)
    expect(cb).toHaveBeenCalledTimes(1)
  })

  it('does not call when delay is null', () => {
    const cb = vi.fn()
    renderHook(() => useTimeout(cb, null))
    vi.advanceTimersByTime(5000)
    expect(cb).not.toHaveBeenCalled()
  })

  it('cleans up on unmount', () => {
    const cb = vi.fn()
    const { unmount } = renderHook(() => useTimeout(cb, 500))
    unmount()
    vi.advanceTimersByTime(1000)
    expect(cb).not.toHaveBeenCalled()
  })

  it('clear prevents callback', () => {
    const cb = vi.fn()
    const { result } = renderHook(() => useTimeout(cb, 500))
    act(() => result.current.clear())
    vi.advanceTimersByTime(1000)
    expect(cb).not.toHaveBeenCalled()
  })

  it('reset restarts timer', () => {
    const cb = vi.fn()
    const { result } = renderHook(() => useTimeout(cb, 500))
    vi.advanceTimersByTime(400)
    act(() => result.current.reset())
    vi.advanceTimersByTime(400)
    expect(cb).not.toHaveBeenCalled()
    vi.advanceTimersByTime(100)
    expect(cb).toHaveBeenCalledTimes(1)
  })
})
