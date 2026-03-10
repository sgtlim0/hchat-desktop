import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useOnlineStatus } from '../useOnlineStatus'

describe('useOnlineStatus', () => {
  let onlineListeners: Array<() => void> = []
  let offlineListeners: Array<() => void> = []

  beforeEach(() => {
    onlineListeners = []
    offlineListeners = []

    Object.defineProperty(window, 'navigator', {
      value: {
        onLine: true
      },
      writable: true,
      configurable: true
    })

    window.addEventListener = vi.fn((event: string, handler: EventListenerOrEventListenerObject) => {
      if (event === 'online') {
        onlineListeners.push(handler as EventListener)
      } else if (event === 'offline') {
        offlineListeners.push(handler as EventListener)
      }
    })

    window.removeEventListener = vi.fn((event: string, handler: EventListenerOrEventListenerObject) => {
      if (event === 'online') {
        onlineListeners = onlineListeners.filter((h) => h !== handler)
      } else if (event === 'offline') {
        offlineListeners = offlineListeners.filter((h) => h !== handler)
      }
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns true when online', () => {
    Object.defineProperty(navigator, 'onLine', {
      value: true,
      writable: true,
      configurable: true
    })

    const { result } = renderHook(() => useOnlineStatus())

    expect(result.current).toBe(true)
  })

  it('returns false when offline', () => {
    Object.defineProperty(navigator, 'onLine', {
      value: false,
      writable: true,
      configurable: true
    })

    const { result } = renderHook(() => useOnlineStatus())

    expect(result.current).toBe(false)
  })

  it('subscribes to online and offline events', () => {
    renderHook(() => useOnlineStatus())

    expect(window.addEventListener).toHaveBeenCalledWith('online', expect.any(Function))
    expect(window.addEventListener).toHaveBeenCalledWith('offline', expect.any(Function))
  })

  it('updates when online event fires', () => {
    Object.defineProperty(navigator, 'onLine', {
      value: false,
      writable: true,
      configurable: true
    })

    const { result } = renderHook(() => useOnlineStatus())

    expect(result.current).toBe(false)

    act(() => {
      Object.defineProperty(navigator, 'onLine', {
        value: true,
        writable: true,
        configurable: true
      })
      onlineListeners.forEach((listener) => listener())
    })

    expect(result.current).toBe(true)
  })

  it('updates when offline event fires', () => {
    Object.defineProperty(navigator, 'onLine', {
      value: true,
      writable: true,
      configurable: true
    })

    const { result } = renderHook(() => useOnlineStatus())

    expect(result.current).toBe(true)

    act(() => {
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true,
        configurable: true
      })
      offlineListeners.forEach((listener) => listener())
    })

    expect(result.current).toBe(false)
  })

  it('unsubscribes from events on unmount', () => {
    const { unmount } = renderHook(() => useOnlineStatus())

    unmount()

    expect(window.removeEventListener).toHaveBeenCalledWith('online', expect.any(Function))
    expect(window.removeEventListener).toHaveBeenCalledWith('offline', expect.any(Function))
  })

  it('handles multiple online/offline transitions', () => {
    Object.defineProperty(navigator, 'onLine', {
      value: true,
      writable: true,
      configurable: true
    })

    const { result } = renderHook(() => useOnlineStatus())

    expect(result.current).toBe(true)

    act(() => {
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true,
        configurable: true
      })
      offlineListeners.forEach((listener) => listener())
    })

    expect(result.current).toBe(false)

    act(() => {
      Object.defineProperty(navigator, 'onLine', {
        value: true,
        writable: true,
        configurable: true
      })
      onlineListeners.forEach((listener) => listener())
    })

    expect(result.current).toBe(true)
  })

  it('returns true for server-side rendering (SSR)', () => {
    const { result } = renderHook(() => useOnlineStatus())

    expect(result.current).toBe(true)
  })
})
