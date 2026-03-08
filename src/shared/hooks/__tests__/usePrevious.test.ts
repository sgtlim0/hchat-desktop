import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { usePrevious } from '../usePrevious'

describe('usePrevious', () => {
  it('returns undefined on first render', () => {
    const { result } = renderHook(() => usePrevious('initial'))

    expect(result.current).toBeUndefined()
  })

  it('returns previous value after update', () => {
    const { result, rerender } = renderHook(
      ({ value }) => usePrevious(value),
      { initialProps: { value: 'first' } }
    )

    // First render - no previous value
    expect(result.current).toBeUndefined()

    // Update to second value
    rerender({ value: 'second' })
    expect(result.current).toBe('first')

    // Update to third value
    rerender({ value: 'third' })
    expect(result.current).toBe('second')
  })

  it('tracks multiple updates correctly', () => {
    const { result, rerender } = renderHook(
      ({ value }) => usePrevious(value),
      { initialProps: { value: 1 } }
    )

    expect(result.current).toBeUndefined()

    rerender({ value: 2 })
    expect(result.current).toBe(1)

    rerender({ value: 3 })
    expect(result.current).toBe(2)

    rerender({ value: 4 })
    expect(result.current).toBe(3)

    rerender({ value: 5 })
    expect(result.current).toBe(4)
  })

  it('works with different types', () => {
    // Test with objects
    const { result: objectResult, rerender: objectRerender } = renderHook(
      ({ value }) => usePrevious(value),
      { initialProps: { value: { name: 'initial' } } }
    )

    expect(objectResult.current).toBeUndefined()

    const secondObject = { name: 'second' }
    objectRerender({ value: secondObject })
    expect(objectResult.current).toEqual({ name: 'initial' })

    // Test with arrays
    const { result: arrayResult, rerender: arrayRerender } = renderHook(
      ({ value }) => usePrevious(value),
      { initialProps: { value: [1, 2, 3] } }
    )

    expect(arrayResult.current).toBeUndefined()

    arrayRerender({ value: [4, 5, 6] })
    expect(arrayResult.current).toEqual([1, 2, 3])

    // Test with boolean
    const { result: boolResult, rerender: boolRerender } = renderHook(
      ({ value }) => usePrevious(value),
      { initialProps: { value: true } }
    )

    expect(boolResult.current).toBeUndefined()

    boolRerender({ value: false })
    expect(boolResult.current).toBe(true)

    // Test with null/undefined
    const { result: nullResult, rerender: nullRerender } = renderHook(
      ({ value }) => usePrevious(value),
      { initialProps: { value: null as null | string } }
    )

    expect(nullResult.current).toBeUndefined()

    nullRerender({ value: 'not null' })
    expect(nullResult.current).toBeNull()

    nullRerender({ value: undefined })
    expect(nullResult.current).toBe('not null')
  })

  it('returns last value after rerender with same value', () => {
    const { result, rerender } = renderHook(
      ({ value }) => usePrevious(value),
      { initialProps: { value: 'value1' } }
    )

    expect(result.current).toBeUndefined()

    rerender({ value: 'value2' })
    expect(result.current).toBe('value1')

    // Rerender with same value
    rerender({ value: 'value2' })
    expect(result.current).toBe('value2')

    rerender({ value: 'value2' })
    expect(result.current).toBe('value2')

    // Change value again
    rerender({ value: 'value3' })
    expect(result.current).toBe('value2')
  })
})