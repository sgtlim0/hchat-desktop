import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useLatest } from '../useLatest'

describe('useLatest', () => {
  it('returns ref with current value', () => {
    const { result } = renderHook(() => useLatest(42))
    expect(result.current.current).toBe(42)
  })

  it('updates when value changes', () => {
    const { result, rerender } = renderHook(
      ({ val }) => useLatest(val),
      { initialProps: { val: 'a' } },
    )
    expect(result.current.current).toBe('a')
    rerender({ val: 'b' })
    expect(result.current.current).toBe('b')
  })

  it('ref identity is stable', () => {
    const { result, rerender } = renderHook(
      ({ val }) => useLatest(val),
      { initialProps: { val: 1 } },
    )
    const ref1 = result.current
    rerender({ val: 2 })
    expect(result.current).toBe(ref1)
  })

  it('works with objects', () => {
    const obj = { name: 'test' }
    const { result } = renderHook(() => useLatest(obj))
    expect(result.current.current).toBe(obj)
  })
})
