import { describe, it, expect } from 'vitest'
import { Pipeline } from '../collection-pipeline'

describe('Pipeline', () => {
  describe('from', () => {
    it('creates pipeline from array', () => {
      const pipeline = Pipeline.from([1, 2, 3])
      expect(pipeline.toArray()).toEqual([1, 2, 3])
    })

    it('creates empty pipeline from empty array', () => {
      const pipeline = Pipeline.from([])
      expect(pipeline.toArray()).toEqual([])
    })
  })

  describe('map', () => {
    it('transforms items', () => {
      const result = Pipeline.from([1, 2, 3])
        .map(x => x * 2)
        .toArray()
      expect(result).toEqual([2, 4, 6])
    })

    it('changes type of items', () => {
      const result = Pipeline.from([1, 2, 3])
        .map(x => `num-${x}`)
        .toArray()
      expect(result).toEqual(['num-1', 'num-2', 'num-3'])
    })
  })

  describe('filter', () => {
    it('removes items', () => {
      const result = Pipeline.from([1, 2, 3, 4, 5])
        .filter(x => x % 2 === 0)
        .toArray()
      expect(result).toEqual([2, 4])
    })

    it('keeps all items if all match', () => {
      const result = Pipeline.from([2, 4, 6])
        .filter(x => x % 2 === 0)
        .toArray()
      expect(result).toEqual([2, 4, 6])
    })

    it('removes all items if none match', () => {
      const result = Pipeline.from([1, 3, 5])
        .filter(x => x % 2 === 0)
        .toArray()
      expect(result).toEqual([])
    })
  })

  describe('sort', () => {
    it('orders items ascending', () => {
      const result = Pipeline.from([3, 1, 4, 1, 5])
        .sort((a, b) => a - b)
        .toArray()
      expect(result).toEqual([1, 1, 3, 4, 5])
    })

    it('orders items descending', () => {
      const result = Pipeline.from([3, 1, 4, 1, 5])
        .sort((a, b) => b - a)
        .toArray()
      expect(result).toEqual([5, 4, 3, 1, 1])
    })

    it('sorts strings alphabetically', () => {
      const result = Pipeline.from(['banana', 'apple', 'cherry'])
        .sort((a, b) => a.localeCompare(b))
        .toArray()
      expect(result).toEqual(['apple', 'banana', 'cherry'])
    })
  })

  describe('take', () => {
    it('limits results to N items', () => {
      const result = Pipeline.from([1, 2, 3, 4, 5])
        .take(3)
        .toArray()
      expect(result).toEqual([1, 2, 3])
    })

    it('returns all items if N exceeds length', () => {
      const result = Pipeline.from([1, 2, 3])
        .take(10)
        .toArray()
      expect(result).toEqual([1, 2, 3])
    })

    it('returns empty array for take(0)', () => {
      const result = Pipeline.from([1, 2, 3])
        .take(0)
        .toArray()
      expect(result).toEqual([])
    })
  })

  describe('skip', () => {
    it('skips N items', () => {
      const result = Pipeline.from([1, 2, 3, 4, 5])
        .skip(2)
        .toArray()
      expect(result).toEqual([3, 4, 5])
    })

    it('returns empty array if skip exceeds length', () => {
      const result = Pipeline.from([1, 2, 3])
        .skip(10)
        .toArray()
      expect(result).toEqual([])
    })

    it('returns all items for skip(0)', () => {
      const result = Pipeline.from([1, 2, 3])
        .skip(0)
        .toArray()
      expect(result).toEqual([1, 2, 3])
    })
  })

  describe('first/last', () => {
    it('first returns first item', () => {
      const result = Pipeline.from([1, 2, 3]).first()
      expect(result).toBe(1)
    })

    it('first returns undefined for empty pipeline', () => {
      const result = Pipeline.from([]).first()
      expect(result).toBeUndefined()
    })

    it('last returns last item', () => {
      const result = Pipeline.from([1, 2, 3]).last()
      expect(result).toBe(3)
    })

    it('last returns undefined for empty pipeline', () => {
      const result = Pipeline.from([]).last()
      expect(result).toBeUndefined()
    })
  })

  describe('count', () => {
    it('returns number of items', () => {
      expect(Pipeline.from([1, 2, 3]).count()).toBe(3)
      expect(Pipeline.from([]).count()).toBe(0)
    })
  })

  describe('reduce', () => {
    it('reduces to single value', () => {
      const sum = Pipeline.from([1, 2, 3, 4])
        .reduce((acc, x) => acc + x, 0)
      expect(sum).toBe(10)
    })

    it('works with different type', () => {
      const result = Pipeline.from([1, 2, 3])
        .reduce((acc, x) => acc + x.toString(), '')
      expect(result).toBe('123')
    })
  })

  describe('chaining operations', () => {
    it('chains filter, map, sort, and take', () => {
      const result = Pipeline.from([5, 3, 8, 1, 9, 2, 7, 4, 6])
        .filter(x => x > 3)
        .map(x => x * 2)
        .sort((a, b) => a - b)
        .take(3)
        .toArray()
      expect(result).toEqual([8, 10, 12])
    })

    it('complex object transformation', () => {
      interface User {
        id: number
        name: string
        age: number
      }

      const users: User[] = [
        { id: 1, name: 'Alice', age: 30 },
        { id: 2, name: 'Bob', age: 25 },
        { id: 3, name: 'Charlie', age: 35 },
        { id: 4, name: 'Diana', age: 28 },
      ]

      const result = Pipeline.from(users)
        .filter(u => u.age < 35)
        .sort((a, b) => b.age - a.age)
        .map(u => u.name)
        .toArray()

      expect(result).toEqual(['Alice', 'Diana', 'Bob'])
    })

    it('pagination with skip and take', () => {
      const items = Array.from({ length: 20 }, (_, i) => i + 1)

      // Page 1 (items 1-5)
      const page1 = Pipeline.from(items)
        .skip(0)
        .take(5)
        .toArray()
      expect(page1).toEqual([1, 2, 3, 4, 5])

      // Page 2 (items 6-10)
      const page2 = Pipeline.from(items)
        .skip(5)
        .take(5)
        .toArray()
      expect(page2).toEqual([6, 7, 8, 9, 10])

      // Page 3 (items 11-15)
      const page3 = Pipeline.from(items)
        .skip(10)
        .take(5)
        .toArray()
      expect(page3).toEqual([11, 12, 13, 14, 15])
    })
  })

  describe('immutability', () => {
    it('does not modify original array', () => {
      const original = [3, 1, 2]
      const pipeline = Pipeline.from(original)

      pipeline.sort((a, b) => a - b).toArray()

      expect(original).toEqual([3, 1, 2]) // unchanged
    })

    it('each operation returns new pipeline', () => {
      const pipeline1 = Pipeline.from([1, 2, 3])
      const pipeline2 = pipeline1.map(x => x * 2)
      const pipeline3 = pipeline2.filter(x => x > 2)

      expect(pipeline1.toArray()).toEqual([1, 2, 3])
      expect(pipeline2.toArray()).toEqual([2, 4, 6])
      expect(pipeline3.toArray()).toEqual([4, 6])
    })
  })

  describe('edge cases', () => {
    it('handles null/undefined in filter', () => {
      const result = Pipeline.from([1, null, 2, undefined, 3] as (number | null | undefined)[])
        .filter(x => x != null)
        .toArray()
      expect(result).toEqual([1, 2, 3])
    })

    it('handles negative take/skip', () => {
      const pipeline = Pipeline.from([1, 2, 3])

      // Negative take should be treated as 0
      expect(pipeline.take(-1).toArray()).toEqual([])

      // Negative skip should be treated as 0
      expect(pipeline.skip(-1).toArray()).toEqual([1, 2, 3])
    })

    it('works with empty pipeline throughout chain', () => {
      const result = Pipeline.from<number>([])
        .filter(x => x > 0)
        .map(x => x * 2)
        .sort((a, b) => a - b)
        .take(5)
        .toArray()
      expect(result).toEqual([])
    })
  })
})