import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useWindowSize } from '../useWindowSize'

describe('useWindowSize', () => {
  let resizeListeners: Array<() => void> = []

  beforeEach(() => {
    resizeListeners = []
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1024 })
    Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 768 })
    vi.spyOn(window, 'addEventListener').mockImplementation((e, h) => {
      if (e === 'resize') resizeListeners.push(h as () => void)
    })
    vi.spyOn(window, 'removeEventListener').mockImplementation((e, h) => {
      if (e === 'resize') resizeListeners = resizeListeners.filter(l => l !== h)
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('returns initial window dimensions', () => {
    const { result } = renderHook(() => useWindowSize())
    expect(result.current.width).toBe(1024)
    expect(result.current.height).toBe(768)
  })

  it('updates on resize', () => {
    const { result } = renderHook(() => useWindowSize())

    // Initial dimensions
    expect(result.current.width).toBe(1024)
    expect(result.current.height).toBe(768)

    // Simulate resize
    act(() => {
      Object.defineProperty(window, 'innerWidth', { value: 1920 })
      Object.defineProperty(window, 'innerHeight', { value: 1080 })
      resizeListeners.forEach(l => l())
    })

    // Check updated dimensions
    expect(result.current.width).toBe(1920)
    expect(result.current.height).toBe(1080)
  })

  it('cleans up on unmount', () => {
    const { unmount } = renderHook(() => useWindowSize())
    expect(resizeListeners).toHaveLength(1)
    unmount()
    expect(resizeListeners).toHaveLength(0)
  })

  it('returns width and height', () => {
    // Set specific dimensions
    Object.defineProperty(window, 'innerWidth', { value: 1440 })
    Object.defineProperty(window, 'innerHeight', { value: 900 })

    const { result } = renderHook(() => useWindowSize())

    expect(result.current.width).toBe(1440)
    expect(result.current.height).toBe(900)
  })

  it('isPortrait returns true when height > width', () => {
    // Set portrait dimensions
    Object.defineProperty(window, 'innerWidth', { value: 768 })
    Object.defineProperty(window, 'innerHeight', { value: 1024 })

    const { result } = renderHook(() => useWindowSize())

    expect(result.current.isPortrait).toBe(true)
    expect(result.current.isLandscape).toBe(false)
  })

  it('isLandscape returns true when width > height', () => {
    // Set landscape dimensions
    Object.defineProperty(window, 'innerWidth', { value: 1920 })
    Object.defineProperty(window, 'innerHeight', { value: 1080 })

    const { result } = renderHook(() => useWindowSize())

    expect(result.current.isLandscape).toBe(true)
    expect(result.current.isPortrait).toBe(false)
  })
})
