import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useHover } from '../useHover'

describe('useHover', () => {
  it('returns ref and isHovered false', () => {
    const { result } = renderHook(() => useHover<HTMLDivElement>())
    expect(result.current[0]).toHaveProperty('current')
    expect(result.current[1]).toBe(false)
  })

  it('initially not hovered', () => {
    const { result } = renderHook(() => useHover())
    expect(result.current[1]).toBe(false)
  })

  it('returns tuple of [ref, boolean]', () => {
    const { result } = renderHook(() => useHover())
    expect(Array.isArray(result.current)).toBe(true)
    expect(result.current).toHaveLength(2)
  })
})
