import { describe, it, expect } from 'vitest'
import { randomInt, randomFloat, randomBool, sample, sampleN, randomString, shuffleArray } from '../random-utils'

describe('random-utils', () => {
  it('randomInt within range', () => {
    for (let i = 0; i < 50; i++) {
      const r = randomInt(1, 10)
      expect(r).toBeGreaterThanOrEqual(1)
      expect(r).toBeLessThanOrEqual(10)
    }
  })

  it('randomFloat within range', () => {
    const r = randomFloat(0, 1)
    expect(r).toBeGreaterThanOrEqual(0)
    expect(r).toBeLessThan(1)
  })

  it('randomBool returns boolean', () => {
    expect(typeof randomBool()).toBe('boolean')
  })

  it('sample returns element from array', () => {
    const arr = [1, 2, 3]
    expect(arr).toContain(sample(arr))
  })

  it('sample returns undefined for empty', () => {
    expect(sample([])).toBeUndefined()
  })

  it('sampleN returns N elements', () => {
    expect(sampleN([1, 2, 3, 4, 5], 3)).toHaveLength(3)
  })

  it('randomString correct length', () => {
    expect(randomString(10)).toHaveLength(10)
    expect(randomString(0)).toBe('')
  })

  it('shuffleArray same length, all elements', () => {
    const arr = [1, 2, 3, 4, 5]
    const shuffled = shuffleArray(arr)
    expect(shuffled).toHaveLength(5)
    expect(shuffled.sort()).toEqual([1, 2, 3, 4, 5])
  })

  it('shuffleArray does not mutate', () => {
    const arr = [1, 2, 3]
    shuffleArray(arr)
    expect(arr).toEqual([1, 2, 3])
  })
})
