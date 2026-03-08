import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePageVisibility } from '../usePageVisibility'

describe('usePageVisibility', () => {
  it('returns isVisible true by default', () => {
    const { result } = renderHook(() => usePageVisibility())
    expect(result.current.isVisible).toBe(true)
    expect(result.current.isHidden).toBe(false)
  })

  it('detects hidden state', () => {
    const { result } = renderHook(() => usePageVisibility())
    act(() => {
      Object.defineProperty(document, 'hidden', { value: true, writable: true, configurable: true })
      document.dispatchEvent(new Event('visibilitychange'))
    })
    expect(result.current.isHidden).toBe(true)
    // Restore
    Object.defineProperty(document, 'hidden', { value: false, writable: true, configurable: true })
  })

  it('cleans up listener', () => {
    const removeSpy = vi.spyOn(document, 'removeEventListener')
    const { unmount } = renderHook(() => usePageVisibility())
    unmount()
    expect(removeSpy.mock.calls.some(([e]) => e === 'visibilitychange')).toBe(true)
    removeSpy.mockRestore()
  })

  it('returns both isVisible and isHidden', () => {
    const { result } = renderHook(() => usePageVisibility())
    expect(typeof result.current.isVisible).toBe('boolean')
    expect(typeof result.current.isHidden).toBe('boolean')
    expect(result.current.isVisible).not.toBe(result.current.isHidden)
  })
})
