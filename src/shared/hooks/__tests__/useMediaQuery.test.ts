import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useMediaQuery } from '../useMediaQuery'

describe('useMediaQuery', () => {
  let listeners: Array<(e: MediaQueryListEvent) => void> = []
  let currentMatches = false

  beforeEach(() => {
    listeners = []
    currentMatches = false
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: vi.fn((query: string) => ({
        matches: currentMatches,
        media: query,
        addEventListener: vi.fn((_: string, handler: (e: MediaQueryListEvent) => void) => {
          listeners.push(handler)
        }),
        removeEventListener: vi.fn((_: string, handler: (e: MediaQueryListEvent) => void) => {
          listeners = listeners.filter((l) => l !== handler)
        }),
      })),
    })
  })

  afterEach(() => { listeners = [] })

  it('returns false when query does not match', () => {
    currentMatches = false
    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'))
    expect(result.current).toBe(false)
  })

  it('returns true when query matches', () => {
    currentMatches = true
    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'))
    expect(result.current).toBe(true)
  })

  it('updates when media query changes', () => {
    currentMatches = false
    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'))
    expect(result.current).toBe(false)
    act(() => {
      listeners.forEach((l) => l({ matches: true } as MediaQueryListEvent))
    })
    expect(result.current).toBe(true)
  })

  it('cleans up listener on unmount', () => {
    const { unmount } = renderHook(() => useMediaQuery('(min-width: 768px)'))
    expect(listeners).toHaveLength(1)
    unmount()
    expect(listeners).toHaveLength(0)
  })

  it('re-subscribes when query changes', () => {
    const { rerender } = renderHook(
      ({ q }) => useMediaQuery(q),
      { initialProps: { q: '(min-width: 768px)' } },
    )
    expect(listeners).toHaveLength(1)
    rerender({ q: '(min-width: 1024px)' })
    expect(listeners).toHaveLength(1)
  })
})
