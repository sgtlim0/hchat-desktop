import { describe, it, expect, vi, beforeEach } from 'vitest'
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

  it('returns initial dimensions', () => {
    const { result } = renderHook(() => useWindowSize())
    expect(result.current.width).toBe(1024)
    expect(result.current.height).toBe(768)
  })

  it('isLandscape when width >= height', () => {
    const { result } = renderHook(() => useWindowSize())
    expect(result.current.isLandscape).toBe(true)
    expect(result.current.isPortrait).toBe(false)
  })

  it('updates on resize', () => {
    const { result } = renderHook(() => useWindowSize())
    act(() => {
      Object.defineProperty(window, 'innerWidth', { value: 400 })
      Object.defineProperty(window, 'innerHeight', { value: 800 })
      resizeListeners.forEach(l => l())
    })
    expect(result.current.width).toBe(400)
    expect(result.current.isPortrait).toBe(true)
  })

  it('cleans up on unmount', () => {
    const { unmount } = renderHook(() => useWindowSize())
    expect(resizeListeners).toHaveLength(1)
    unmount()
    expect(resizeListeners).toHaveLength(0)
  })
})
