import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useLocalStorage } from '../useLocalStorage'

describe('useLocalStorage', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
    // Clear any localStorage mocks
    vi.clearAllMocks()
  })

  it('returns initial value when key is missing from localStorage', () => {
    const { result } = renderHook(() => useLocalStorage('testKey', 'default'))

    expect(result.current[0]).toBe('default')
  })

  it('persists value to localStorage when set', () => {
    const { result } = renderHook(() => useLocalStorage('testKey', 'initial'))

    act(() => {
      result.current[1]('updated')
    })

    expect(localStorage.getItem('testKey')).toBe('"updated"')
    expect(result.current[0]).toBe('updated')
  })

  it('reads existing value from localStorage on mount', () => {
    localStorage.setItem('existingKey', '"existing value"')

    const { result } = renderHook(() => useLocalStorage('existingKey', 'default'))

    expect(result.current[0]).toBe('existing value')
  })

  it('updates value in localStorage and state', () => {
    const { result } = renderHook(() => useLocalStorage('updateKey', 1))

    act(() => {
      result.current[1](2)
    })

    expect(result.current[0]).toBe(2)
    expect(localStorage.getItem('updateKey')).toBe('2')

    act(() => {
      result.current[1](3)
    })

    expect(result.current[0]).toBe(3)
    expect(localStorage.getItem('updateKey')).toBe('3')
  })

  it('handles JSON parse error gracefully and returns initial value', () => {
    localStorage.setItem('invalidKey', 'not valid json')

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { result } = renderHook(() => useLocalStorage('invalidKey', 'fallback'))

    expect(result.current[0]).toBe('fallback')
    expect(consoleSpy).toHaveBeenCalled()

    consoleSpy.mockRestore()
  })

  it('removes key from localStorage when set to undefined', () => {
    const { result } = renderHook(() => useLocalStorage<string | undefined>('removeKey', 'initial'))

    expect(localStorage.getItem('removeKey')).toBe('"initial"')

    act(() => {
      result.current[1](undefined)
    })

    expect(localStorage.getItem('removeKey')).toBeNull()
    expect(result.current[0]).toBeUndefined()
  })

  it('works with objects and arrays', () => {
    const initialObject = { name: 'test', value: 123 }
    const { result: objectResult } = renderHook(() => useLocalStorage('objectKey', initialObject))

    expect(objectResult.current[0]).toEqual(initialObject)

    const updatedObject = { name: 'updated', value: 456 }
    act(() => {
      objectResult.current[1](updatedObject)
    })

    expect(objectResult.current[0]).toEqual(updatedObject)
    expect(JSON.parse(localStorage.getItem('objectKey')!)).toEqual(updatedObject)

    // Test with arrays
    const initialArray = [1, 2, 3]
    const { result: arrayResult } = renderHook(() => useLocalStorage('arrayKey', initialArray))

    expect(arrayResult.current[0]).toEqual(initialArray)

    act(() => {
      arrayResult.current[1]([4, 5, 6])
    })

    expect(arrayResult.current[0]).toEqual([4, 5, 6])
    expect(JSON.parse(localStorage.getItem('arrayKey')!)).toEqual([4, 5, 6])
  })

  it('keeps different keys independent', () => {
    const { result: result1 } = renderHook(() => useLocalStorage('key1', 'value1'))
    const { result: result2 } = renderHook(() => useLocalStorage('key2', 'value2'))

    expect(result1.current[0]).toBe('value1')
    expect(result2.current[0]).toBe('value2')

    act(() => {
      result1.current[1]('updated1')
    })

    expect(result1.current[0]).toBe('updated1')
    expect(result2.current[0]).toBe('value2')

    act(() => {
      result2.current[1]('updated2')
    })

    expect(result1.current[0]).toBe('updated1')
    expect(result2.current[0]).toBe('updated2')
  })

  it('supports function updates', () => {
    const { result } = renderHook(() => useLocalStorage('counterKey', 0))

    act(() => {
      result.current[1]((prev) => prev + 1)
    })

    expect(result.current[0]).toBe(1)

    act(() => {
      result.current[1]((prev) => prev * 2)
    })

    expect(result.current[0]).toBe(2)
    expect(localStorage.getItem('counterKey')).toBe('2')
  })
})