import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useThrottle } from '../useThrottle'

describe('useThrottle', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns initial value immediately', () => {
    const { result } = renderHook(() => useThrottle('hello', 300))
    expect(result.current).toBe('hello')
  })

  it('delays rapid value changes', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useThrottle(value, 300),
      { initialProps: { value: 'a' } },
    )

    rerender({ value: 'b' })
    // Value doesn't update synchronously due to useEffect
    act(() => { vi.advanceTimersByTime(300) })
    expect(result.current).toBe('b')
  })

  it('produces final value after interval', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useThrottle(value, 200),
      { initialProps: { value: 1 } },
    )

    rerender({ value: 2 })
    rerender({ value: 3 })
    act(() => { vi.advanceTimersByTime(200) })
    expect(result.current).toBe(3)
  })

  it('works with objects', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useThrottle(value, 100),
      { initialProps: { value: { x: 1 } } },
    )
    rerender({ value: { x: 2 } })
    act(() => { vi.advanceTimersByTime(100) })
    expect(result.current).toEqual({ x: 2 })
  })
})
