import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useIntersectionObserver } from '../useIntersectionObserver'

let observeCallback: (entries: Partial<IntersectionObserverEntry>[]) => void

beforeEach(() => {
  const mockObserver = vi.fn((cb) => {
    observeCallback = cb
    return {
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    }
  })
  vi.stubGlobal('IntersectionObserver', mockObserver)
})

describe('useIntersectionObserver', () => {
  it('returns ref and isIntersecting false initially', () => {
    const { result } = renderHook(() => useIntersectionObserver())
    expect(result.current.ref).toHaveProperty('current')
    expect(result.current.isIntersecting).toBe(false)
  })

  it('returns null entry initially', () => {
    const { result } = renderHook(() => useIntersectionObserver())
    expect(result.current.entry).toBeNull()
  })

  it('accepts threshold option', () => {
    const { result } = renderHook(() => useIntersectionObserver({ threshold: 0.5 }))
    expect(result.current.isIntersecting).toBe(false)
  })

  it('accepts rootMargin option', () => {
    const { result } = renderHook(() => useIntersectionObserver({ rootMargin: '10px' }))
    expect(result.current.isIntersecting).toBe(false)
  })
})
