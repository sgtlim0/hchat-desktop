import { describe, it, expect } from 'vitest'
import { unique, groupBy, chunk, flatten, flattenDeep, sortBy, compact, intersection, difference } from '../array-utils'

describe('array-utils', () => {
  describe('unique', () => {
    it('removes duplicate primitives', () => {
      expect(unique([1, 2, 2, 3, 3])).toEqual([1, 2, 3])
    })
    it('uses keyFn for objects', () => {
      const arr = [{ id: 1, n: 'a' }, { id: 2, n: 'b' }, { id: 1, n: 'c' }]
      expect(unique(arr, (x) => x.id)).toHaveLength(2)
    })
    it('handles empty array', () => {
      expect(unique([])).toEqual([])
    })
  })

  describe('groupBy', () => {
    it('groups by key', () => {
      const arr = [{ type: 'a', v: 1 }, { type: 'b', v: 2 }, { type: 'a', v: 3 }]
      const result = groupBy(arr, (x) => x.type)
      expect(result.a).toHaveLength(2)
      expect(result.b).toHaveLength(1)
    })
    it('handles empty array', () => {
      expect(groupBy([], () => 'k')).toEqual({})
    })
  })

  describe('chunk', () => {
    it('splits into chunks', () => {
      expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]])
    })
    it('handles empty', () => {
      expect(chunk([], 3)).toEqual([])
    })
    it('handles remainder', () => {
      expect(chunk([1, 2, 3], 2)).toEqual([[1, 2], [3]])
    })
  })

  describe('flatten', () => {
    it('flattens one level', () => {
      expect(flatten([[1, 2], [3], [4, 5]])).toEqual([1, 2, 3, 4, 5])
    })
  })

  describe('flattenDeep', () => {
    it('flattens deeply nested', () => {
      expect(flattenDeep([1, [2, [3, [4]]]])).toEqual([1, 2, 3, 4])
    })
  })

  describe('sortBy', () => {
    it('sorts ascending', () => {
      const arr = [{ n: 3 }, { n: 1 }, { n: 2 }]
      expect(sortBy(arr, (x) => x.n)).toEqual([{ n: 1 }, { n: 2 }, { n: 3 }])
    })
    it('sorts descending', () => {
      const arr = [{ n: 1 }, { n: 3 }, { n: 2 }]
      expect(sortBy(arr, (x) => x.n, true)).toEqual([{ n: 3 }, { n: 2 }, { n: 1 }])
    })
    it('does not mutate original', () => {
      const arr = [3, 1, 2]
      sortBy(arr, (x) => x)
      expect(arr).toEqual([3, 1, 2])
    })
  })

  describe('compact', () => {
    it('removes falsy values', () => {
      expect(compact([0, 1, false, 2, '', 3, null, undefined])).toEqual([1, 2, 3])
    })
  })

  describe('intersection', () => {
    it('returns common elements', () => {
      expect(intersection([1, 2, 3], [2, 3, 4])).toEqual([2, 3])
    })
    it('empty when no overlap', () => {
      expect(intersection([1], [2])).toEqual([])
    })
  })

  describe('difference', () => {
    it('returns elements not in second', () => {
      expect(difference([1, 2, 3], [2, 3, 4])).toEqual([1])
    })
  })
})
