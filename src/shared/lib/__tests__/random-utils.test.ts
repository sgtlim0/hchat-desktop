import { describe, it, expect } from 'vitest'
import {
  randomInt,
  randomFloat,
  randomBool,
  sample,
  sampleN,
  randomString,
  weightedRandom,
  shuffleArray
} from '../random-utils'

describe('random-utils', () => {
  describe('randomInt', () => {
    it('returns integer within range', () => {
      for (let i = 0; i < 100; i++) {
        const result = randomInt(1, 10)
        expect(Number.isInteger(result)).toBe(true)
        expect(result).toBeGreaterThanOrEqual(1)
        expect(result).toBeLessThanOrEqual(10)
      }
    })

    it('handles single value range', () => {
      const result = randomInt(5, 5)
      expect(result).toBe(5)
    })

    it('handles negative ranges', () => {
      for (let i = 0; i < 50; i++) {
        const result = randomInt(-10, -1)
        expect(result).toBeGreaterThanOrEqual(-10)
        expect(result).toBeLessThanOrEqual(-1)
      }
    })
  })

  describe('randomFloat', () => {
    it('returns float within range', () => {
      for (let i = 0; i < 100; i++) {
        const result = randomFloat(0.0, 1.0)
        expect(typeof result).toBe('number')
        expect(result).toBeGreaterThanOrEqual(0.0)
        expect(result).toBeLessThan(1.0)
      }
    })

    it('handles larger ranges', () => {
      for (let i = 0; i < 50; i++) {
        const result = randomFloat(10.5, 20.5)
        expect(result).toBeGreaterThanOrEqual(10.5)
        expect(result).toBeLessThan(20.5)
      }
    })
  })

  describe('randomBool', () => {
    it('returns boolean values', () => {
      for (let i = 0; i < 50; i++) {
        const result = randomBool()
        expect(typeof result).toBe('boolean')
      }
    })

    it('respects probability 0', () => {
      for (let i = 0; i < 20; i++) {
        expect(randomBool(0)).toBe(false)
      }
    })

    it('respects probability 1', () => {
      for (let i = 0; i < 20; i++) {
        expect(randomBool(1)).toBe(true)
      }
    })

    it('generates mixed results with 0.5 probability', () => {
      const results = Array.from({ length: 100 }, () => randomBool(0.5))
      const trueCount = results.filter(r => r).length
      // Should be roughly 50/50, allow 30-70 range for randomness
      expect(trueCount).toBeGreaterThan(20)
      expect(trueCount).toBeLessThan(80)
    })
  })

  describe('sample', () => {
    it('returns random element from array', () => {
      const arr = [1, 2, 3, 4, 5]
      for (let i = 0; i < 50; i++) {
        const result = sample(arr)
        expect(arr).toContain(result)
      }
    })

    it('returns undefined for empty array', () => {
      expect(sample([])).toBeUndefined()
    })

    it('returns only element for single-item array', () => {
      expect(sample(['only'])).toBe('only')
    })

    it('samples different types', () => {
      const objects = [{ id: 1 }, { id: 2 }, { id: 3 }]
      const result = sample(objects)
      expect(objects).toContain(result)
    })
  })

  describe('sampleN', () => {
    it('returns N random elements', () => {
      const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
      const result = sampleN(arr, 3)
      expect(result).toHaveLength(3)
      result.forEach(item => {
        expect(arr).toContain(item)
      })
    })

    it('returns all elements when n >= array length', () => {
      const arr = [1, 2, 3]
      const result = sampleN(arr, 5)
      expect(result).toHaveLength(3)
      expect(result.sort()).toEqual([1, 2, 3])
    })

    it('returns empty array when n is 0', () => {
      expect(sampleN([1, 2, 3], 0)).toEqual([])
    })

    it('returns empty array for empty input', () => {
      expect(sampleN([], 3)).toEqual([])
    })

    it('returns unique elements', () => {
      const arr = [1, 2, 3, 4, 5]
      const result = sampleN(arr, 3)
      const unique = new Set(result)
      expect(unique.size).toBe(result.length)
    })
  })

  describe('randomString', () => {
    it('returns string of given length', () => {
      const result = randomString(10)
      expect(result).toHaveLength(10)
      expect(typeof result).toBe('string')
    })

    it('uses default charset (alphanumeric)', () => {
      const result = randomString(20)
      expect(result).toMatch(/^[a-zA-Z0-9]+$/)
    })

    it('uses custom charset', () => {
      const result = randomString(15, 'ABC123')
      expect(result).toHaveLength(15)
      expect(result).toMatch(/^[ABC123]+$/)
    })

    it('returns empty string for length 0', () => {
      expect(randomString(0)).toBe('')
    })

    it('generates different strings', () => {
      const results = new Set(Array.from({ length: 10 }, () => randomString(5)))
      // Should generate at least some different strings
      expect(results.size).toBeGreaterThan(1)
    })
  })

  describe('weightedRandom', () => {
    it('respects weights distribution', () => {
      const items = ['A', 'B', 'C']
      const weights = [10, 1, 1] // A should be selected much more often

      const results: Record<string, number> = { A: 0, B: 0, C: 0 }
      for (let i = 0; i < 1000; i++) {
        const result = weightedRandom(items, weights)
        results[result]++
      }

      // A should be selected significantly more than B or C
      expect(results.A).toBeGreaterThan(results.B * 5)
      expect(results.A).toBeGreaterThan(results.C * 5)
    })

    it('handles single item', () => {
      const result = weightedRandom(['only'], [1])
      expect(result).toBe('only')
    })

    it('handles equal weights', () => {
      const items = ['X', 'Y', 'Z']
      const weights = [1, 1, 1]

      const results = new Set<string>()
      for (let i = 0; i < 50; i++) {
        results.add(weightedRandom(items, weights))
      }

      // Should eventually select all items with equal weights
      expect(results.size).toBe(3)
    })

    it('handles zero weights gracefully', () => {
      const items = ['A', 'B', 'C']
      const weights = [0, 1, 0]

      for (let i = 0; i < 20; i++) {
        const result = weightedRandom(items, weights)
        expect(result).toBe('B')
      }
    })

    it('throws for mismatched lengths', () => {
      expect(() => weightedRandom(['A', 'B'], [1])).toThrow()
    })
  })

  describe('shuffleArray', () => {
    it('returns same length array', () => {
      const arr = [1, 2, 3, 4, 5]
      const result = shuffleArray(arr)
      expect(result).toHaveLength(5)
    })

    it('contains all original elements', () => {
      const arr = ['a', 'b', 'c', 'd']
      const result = shuffleArray(arr)
      expect(result.sort()).toEqual(['a', 'b', 'c', 'd'])
    })

    it('does not modify original array', () => {
      const original = [1, 2, 3, 4, 5]
      const copy = [...original]
      shuffleArray(original)
      expect(original).toEqual(copy)
    })

    it('actually shuffles the array', () => {
      const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
      let differentOrder = false

      // Try multiple times to account for random chance
      for (let i = 0; i < 10; i++) {
        const shuffled = shuffleArray(arr)
        if (JSON.stringify(shuffled) !== JSON.stringify(arr)) {
          differentOrder = true
          break
        }
      }

      expect(differentOrder).toBe(true)
    })

    it('handles empty array', () => {
      expect(shuffleArray([])).toEqual([])
    })

    it('handles single element array', () => {
      expect(shuffleArray([42])).toEqual([42])
    })
  })
})
