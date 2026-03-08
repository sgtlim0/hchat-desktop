import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useScrollPosition } from '../useScrollPosition'

describe('useScrollPosition', () => {
  it('returns initial position', () => {
    const { result } = renderHook(() => useScrollPosition())
    expect(result.current.x).toBe(0)
    expect(result.current.y).toBe(0)
    expect(result.current.direction).toBe('idle')
    expect(result.current.isAtTop).toBe(true)
  })

  it('accepts threshold parameter', () => {
    const { result } = renderHook(() => useScrollPosition(100))
    expect(result.current.isAtTop).toBe(true)
  })

  it('returns all expected fields', () => {
    const { result } = renderHook(() => useScrollPosition())
    expect(result.current).toHaveProperty('x')
    expect(result.current).toHaveProperty('y')
    expect(result.current).toHaveProperty('direction')
    expect(result.current).toHaveProperty('isAtTop')
    expect(result.current).toHaveProperty('isAtBottom')
  })
})
