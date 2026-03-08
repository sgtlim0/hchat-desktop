import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useOnMount, useOnUnmount } from '../useOnMount'

describe('useOnMount', () => {
  it('calls callback on mount', () => {
    const cb = vi.fn()
    renderHook(() => useOnMount(cb))
    expect(cb).toHaveBeenCalledTimes(1)
  })

  it('does not call on rerender', () => {
    const cb = vi.fn()
    const { rerender } = renderHook(() => useOnMount(cb))
    rerender()
    rerender()
    expect(cb).toHaveBeenCalledTimes(1)
  })

  it('calls cleanup on unmount', () => {
    const cleanup = vi.fn()
    const { unmount } = renderHook(() => useOnMount(() => cleanup))
    unmount()
    expect(cleanup).toHaveBeenCalledTimes(1)
  })
})

describe('useOnUnmount', () => {
  it('calls callback on unmount', () => {
    const cb = vi.fn()
    const { unmount } = renderHook(() => useOnUnmount(cb))
    expect(cb).not.toHaveBeenCalled()
    unmount()
    expect(cb).toHaveBeenCalledTimes(1)
  })

  it('uses latest callback', () => {
    let count = 0
    const { unmount, rerender } = renderHook(
      ({ cb }) => useOnUnmount(cb),
      { initialProps: { cb: () => { count = 1 } } },
    )
    rerender({ cb: () => { count = 99 } })
    unmount()
    expect(count).toBe(99)
  })
})
