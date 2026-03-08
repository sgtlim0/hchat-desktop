import { describe, it, expect } from 'vitest'
import {
  deepClone,
  deepMerge,
  pick,
  omit,
  isEqual,
  isEmpty
} from '../object-utils'

describe('deepClone', () => {
  it('clones primitive values', () => {
    expect(deepClone(42)).toBe(42)
    expect(deepClone('hello')).toBe('hello')
    expect(deepClone(true)).toBe(true)
    expect(deepClone(null)).toBe(null)
    expect(deepClone(undefined)).toBe(undefined)
  })

  it('clones flat objects', () => {
    const obj = { a: 1, b: 'test', c: true }
    const cloned = deepClone(obj)

    expect(cloned).toEqual(obj)
    expect(cloned).not.toBe(obj)
  })

  it('clones nested objects', () => {
    const obj = {
      a: 1,
      b: {
        c: 2,
        d: {
          e: 3,
          f: 'nested'
        }
      },
      g: [1, 2, 3]
    }
    const cloned = deepClone(obj)

    expect(cloned).toEqual(obj)
    expect(cloned).not.toBe(obj)
    expect(cloned.b).not.toBe(obj.b)
    expect(cloned.b.d).not.toBe(obj.b.d)
    expect(cloned.g).not.toBe(obj.g)
  })

  it('clones arrays', () => {
    const arr = [1, 'test', { a: 1 }, [2, 3]]
    const cloned = deepClone(arr)

    expect(cloned).toEqual(arr)
    expect(cloned).not.toBe(arr)
    expect(cloned[2]).not.toBe(arr[2])
    expect(cloned[3]).not.toBe(arr[3])
  })

  it('clones Date objects', () => {
    const date = new Date('2024-01-01')
    const cloned = deepClone(date)

    expect(cloned).toEqual(date)
    expect(cloned).not.toBe(date)
    expect(cloned.getTime()).toBe(date.getTime())
  })

  it('does not share references after cloning', () => {
    const obj = { a: { b: { c: 1 } } }
    const cloned = deepClone(obj)

    cloned.a.b.c = 2
    expect(obj.a.b.c).toBe(1)
    expect(cloned.a.b.c).toBe(2)
  })
})

describe('deepMerge', () => {
  it('merges flat objects', () => {
    const target = { a: 1, b: 2 }
    const source = { b: 3, c: 4 }
    const result = deepMerge(target, source)

    expect(result).toEqual({ a: 1, b: 3, c: 4 })
    expect(result).not.toBe(target)
    expect(target).toEqual({ a: 1, b: 2 }) // Original unchanged
  })

  it('deep merges nested objects', () => {
    const target = {
      a: 1,
      b: {
        c: 2,
        d: 3
      }
    }
    const source = {
      b: {
        d: 4,
        e: 5
      },
      f: 6
    }
    const result = deepMerge(target, source)

    expect(result).toEqual({
      a: 1,
      b: {
        c: 2,
        d: 4,
        e: 5
      },
      f: 6
    })
    expect(result).not.toBe(target)
    expect(result.b).not.toBe(target.b)
    expect(target.b.d).toBe(3) // Original unchanged
  })

  it('target values override source in arrays', () => {
    const target = { arr: [1, 2, 3] }
    const source = { arr: [4, 5] }
    const result = deepMerge(target, source)

    expect(result).toEqual({ arr: [4, 5] })
  })

  it('merges multiple sources', () => {
    const target = { a: 1 }
    const source1 = { b: 2 }
    const source2 = { c: 3 }
    const source3 = { a: 4, d: 5 }
    const result = deepMerge(target, source1, source2, source3)

    expect(result).toEqual({ a: 4, b: 2, c: 3, d: 5 })
  })

  it('handles null and undefined values', () => {
    const target = { a: 1, b: null, c: 3 }
    const source = { b: 2, c: undefined, d: 4 }
    const result = deepMerge(target, source)

    expect(result).toEqual({ a: 1, b: 2, c: undefined, d: 4 })
  })
})

describe('pick', () => {
  it('picks specified keys from object', () => {
    const obj = { a: 1, b: 2, c: 3, d: 4 }
    const result = pick(obj, ['a', 'c'])

    expect(result).toEqual({ a: 1, c: 3 })
    expect(result).not.toBe(obj)
  })

  it('ignores missing keys', () => {
    const obj = { a: 1, b: 2 }
    const result = pick(obj, ['a', 'c' as keyof typeof obj])

    expect(result).toEqual({ a: 1 })
  })

  it('returns empty object when no keys match', () => {
    const obj = { a: 1, b: 2 }
    const result = pick(obj, ['c' as keyof typeof obj, 'd' as keyof typeof obj])

    expect(result).toEqual({})
  })

  it('handles empty keys array', () => {
    const obj = { a: 1, b: 2 }
    const result = pick(obj, [])

    expect(result).toEqual({})
  })
})

describe('omit', () => {
  it('omits specified keys from object', () => {
    const obj = { a: 1, b: 2, c: 3, d: 4 }
    const result = omit(obj, ['b', 'd'])

    expect(result).toEqual({ a: 1, c: 3 })
    expect(result).not.toBe(obj)
  })

  it('returns copy when omitting non-existent keys', () => {
    const obj = { a: 1, b: 2 }
    const result = omit(obj, ['c' as keyof typeof obj])

    expect(result).toEqual({ a: 1, b: 2 })
    expect(result).not.toBe(obj)
  })

  it('returns empty object when omitting all keys', () => {
    const obj = { a: 1, b: 2 }
    const result = omit(obj, ['a', 'b'])

    expect(result).toEqual({})
  })

  it('returns full copy when empty keys array', () => {
    const obj = { a: 1, b: 2 }
    const result = omit(obj, [])

    expect(result).toEqual({ a: 1, b: 2 })
    expect(result).not.toBe(obj)
  })
})

describe('isEqual', () => {
  it('returns true for identical primitives', () => {
    expect(isEqual(42, 42)).toBe(true)
    expect(isEqual('test', 'test')).toBe(true)
    expect(isEqual(true, true)).toBe(true)
    expect(isEqual(null, null)).toBe(true)
    expect(isEqual(undefined, undefined)).toBe(true)
  })

  it('returns false for different primitives', () => {
    expect(isEqual(42, 43)).toBe(false)
    expect(isEqual('test', 'Test')).toBe(false)
    expect(isEqual(true, false)).toBe(false)
    expect(isEqual(null, undefined)).toBe(false)
  })

  it('returns true for objects with same structure', () => {
    const obj1 = { a: 1, b: { c: 2, d: [3, 4] } }
    const obj2 = { a: 1, b: { c: 2, d: [3, 4] } }

    expect(isEqual(obj1, obj2)).toBe(true)
  })

  it('returns false for objects with different values', () => {
    const obj1 = { a: 1, b: { c: 2 } }
    const obj2 = { a: 1, b: { c: 3 } }

    expect(isEqual(obj1, obj2)).toBe(false)
  })

  it('returns false for objects with different keys', () => {
    const obj1 = { a: 1, b: 2 }
    const obj2 = { a: 1, c: 2 }

    expect(isEqual(obj1, obj2)).toBe(false)
  })

  it('returns true for equal arrays', () => {
    const arr1 = [1, 'test', { a: 1 }, [2, 3]]
    const arr2 = [1, 'test', { a: 1 }, [2, 3]]

    expect(isEqual(arr1, arr2)).toBe(true)
  })

  it('returns false for arrays with different lengths', () => {
    expect(isEqual([1, 2, 3], [1, 2])).toBe(false)
  })

  it('returns false for arrays with different values', () => {
    expect(isEqual([1, 2, 3], [1, 2, 4])).toBe(false)
  })
})

describe('isEmpty', () => {
  it('returns true for empty objects', () => {
    expect(isEmpty({})).toBe(true)
  })

  it('returns true for empty arrays', () => {
    expect(isEmpty([])).toBe(true)
  })

  it('returns true for empty strings', () => {
    expect(isEmpty('')).toBe(true)
  })

  it('returns true for null', () => {
    expect(isEmpty(null)).toBe(true)
  })

  it('returns true for undefined', () => {
    expect(isEmpty(undefined)).toBe(true)
  })

  it('returns false for non-empty objects', () => {
    expect(isEmpty({ a: 1 })).toBe(false)
  })

  it('returns false for non-empty arrays', () => {
    expect(isEmpty([1])).toBe(false)
  })

  it('returns false for non-empty strings', () => {
    expect(isEmpty('test')).toBe(false)
    expect(isEmpty(' ')).toBe(false)
  })

  it('returns false for numbers', () => {
    expect(isEmpty(0)).toBe(false)
    expect(isEmpty(42)).toBe(false)
  })

  it('returns false for booleans', () => {
    expect(isEmpty(true)).toBe(false)
    expect(isEmpty(false)).toBe(false)
  })
})