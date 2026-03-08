import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useCountdown } from '../useCountdown'

describe('useCountdown', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('initializes with full duration', () => {
    const { result } = renderHook(() => useCountdown(5000))
    expect(result.current.remaining).toBe(5000)
    expect(result.current.isRunning).toBe(false)
    expect(result.current.isFinished).toBe(false)
  })

  it('counts down when started', () => {
    const { result } = renderHook(() => useCountdown(1000))
    act(() => result.current.start())
    act(() => { vi.advanceTimersByTime(500) })
    expect(result.current.remaining).toBeLessThan(1000)
    expect(result.current.isRunning).toBe(true)
  })

  it('finishes at zero', () => {
    const { result } = renderHook(() => useCountdown(500))
    act(() => result.current.start())
    act(() => { vi.advanceTimersByTime(600) })
    expect(result.current.remaining).toBe(0)
    expect(result.current.isFinished).toBe(true)
    expect(result.current.isRunning).toBe(false)
  })

  it('pause stops countdown', () => {
    const { result } = renderHook(() => useCountdown(5000))
    act(() => result.current.start())
    act(() => { vi.advanceTimersByTime(1000) })
    const pausedAt = result.current.remaining
    act(() => result.current.pause())
    act(() => { vi.advanceTimersByTime(2000) })
    expect(result.current.remaining).toBe(pausedAt)
  })

  it('reset restores duration', () => {
    const { result } = renderHook(() => useCountdown(5000))
    act(() => result.current.start())
    act(() => { vi.advanceTimersByTime(2000) })
    act(() => result.current.reset())
    expect(result.current.remaining).toBe(5000)
    expect(result.current.isRunning).toBe(false)
  })
})
