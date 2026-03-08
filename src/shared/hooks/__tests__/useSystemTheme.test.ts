import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSystemTheme } from '../useSystemTheme'

describe('useSystemTheme', () => {
  let listeners: Array<(e: MediaQueryListEvent) => void> = []
  let darkMode = false

  beforeEach(() => {
    listeners = []
    darkMode = false

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: vi.fn((query: string) => ({
        matches: query.includes('dark') ? darkMode : false,
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

  afterEach(() => {
    listeners = []
  })

  it('returns light when system is light mode', () => {
    darkMode = false
    const { result } = renderHook(() => useSystemTheme())
    expect(result.current).toBe('light')
  })

  it('returns dark when system is dark mode', () => {
    darkMode = true
    const { result } = renderHook(() => useSystemTheme())
    expect(result.current).toBe('dark')
  })

  it('updates when system changes to dark', () => {
    darkMode = false
    const { result } = renderHook(() => useSystemTheme())
    expect(result.current).toBe('light')

    act(() => {
      listeners.forEach((l) => l({ matches: true } as MediaQueryListEvent))
    })
    expect(result.current).toBe('dark')
  })

  it('updates when system changes to light', () => {
    darkMode = true
    const { result } = renderHook(() => useSystemTheme())
    expect(result.current).toBe('dark')

    act(() => {
      listeners.forEach((l) => l({ matches: false } as MediaQueryListEvent))
    })
    expect(result.current).toBe('light')
  })

  it('cleans up listener on unmount', () => {
    const { unmount } = renderHook(() => useSystemTheme())
    expect(listeners).toHaveLength(1)
    unmount()
    expect(listeners).toHaveLength(0)
  })

  it('registers one listener', () => {
    renderHook(() => useSystemTheme())
    expect(listeners).toHaveLength(1)
  })
})
