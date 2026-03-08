import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useBreakpoint } from '../useBreakpoint'

describe('useBreakpoint', () => {
  let resizeListeners: Array<() => void> = []

  beforeEach(() => {
    resizeListeners = []
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1024 })
    vi.spyOn(window, 'addEventListener').mockImplementation((event, handler) => {
      if (event === 'resize') resizeListeners.push(handler as () => void)
    })
    vi.spyOn(window, 'removeEventListener').mockImplementation((event, handler) => {
      if (event === 'resize') resizeListeners = resizeListeners.filter((l) => l !== handler)
    })
  })

  it('returns lg for 1024px width', () => {
    const { result } = renderHook(() => useBreakpoint())
    expect(result.current.breakpoint).toBe('lg')
    expect(result.current.isDesktop).toBe(true)
  })

  it('returns xs for small width', () => {
    Object.defineProperty(window, 'innerWidth', { value: 320 })
    const { result } = renderHook(() => useBreakpoint())
    expect(result.current.breakpoint).toBe('xs')
    expect(result.current.isMobile).toBe(true)
  })

  it('returns sm for 640px', () => {
    Object.defineProperty(window, 'innerWidth', { value: 640 })
    const { result } = renderHook(() => useBreakpoint())
    expect(result.current.breakpoint).toBe('sm')
    expect(result.current.isMobile).toBe(true)
  })

  it('returns md for 768px', () => {
    Object.defineProperty(window, 'innerWidth', { value: 768 })
    const { result } = renderHook(() => useBreakpoint())
    expect(result.current.breakpoint).toBe('md')
    expect(result.current.isTablet).toBe(true)
  })

  it('returns xl for 1280px', () => {
    Object.defineProperty(window, 'innerWidth', { value: 1280 })
    const { result } = renderHook(() => useBreakpoint())
    expect(result.current.breakpoint).toBe('xl')
    expect(result.current.isDesktop).toBe(true)
  })

  it('returns 2xl for 1536px', () => {
    Object.defineProperty(window, 'innerWidth', { value: 1536 })
    const { result } = renderHook(() => useBreakpoint())
    expect(result.current.breakpoint).toBe('2xl')
  })

  it('updates on window resize', () => {
    const { result } = renderHook(() => useBreakpoint())
    expect(result.current.isDesktop).toBe(true)

    act(() => {
      Object.defineProperty(window, 'innerWidth', { value: 500 })
      resizeListeners.forEach((l) => l())
    })

    expect(result.current.isMobile).toBe(true)
  })

  it('cleans up resize listener', () => {
    const { unmount } = renderHook(() => useBreakpoint())
    expect(resizeListeners).toHaveLength(1)
    unmount()
    expect(resizeListeners).toHaveLength(0)
  })

  it('returns width value', () => {
    Object.defineProperty(window, 'innerWidth', { value: 900 })
    const { result } = renderHook(() => useBreakpoint())
    expect(result.current.width).toBe(900)
  })

  it('isMobile is false at 768px', () => {
    Object.defineProperty(window, 'innerWidth', { value: 768 })
    const { result } = renderHook(() => useBreakpoint())
    expect(result.current.isMobile).toBe(false)
    expect(result.current.isTablet).toBe(true)
  })
})
