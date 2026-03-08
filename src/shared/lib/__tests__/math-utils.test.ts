import { describe, it, expect } from 'vitest'
import { sum, mean, median, mode, standardDeviation, min, max, range, percentile } from '../math-utils'

describe('math-utils', () => {
  it('sum', () => {
    expect(sum([1, 2, 3])).toBe(6)
    expect(sum([])).toBe(0)
  })

  it('mean', () => {
    expect(mean([1, 2, 3, 4])).toBe(2.5)
    expect(mean([])).toBe(0)
  })

  it('median odd', () => {
    expect(median([3, 1, 2])).toBe(2)
  })

  it('median even', () => {
    expect(median([1, 2, 3, 4])).toBe(2.5)
  })

  it('median empty', () => {
    expect(median([])).toBe(0)
  })

  it('mode', () => {
    expect(mode([1, 2, 2, 3])).toBe(2)
    expect(mode([])).toBeUndefined()
  })

  it('standardDeviation', () => {
    expect(standardDeviation([2, 4, 4, 4, 5, 5, 7, 9])).toBeCloseTo(2, 0)
    expect(standardDeviation([1])).toBe(0)
  })

  it('min/max', () => {
    expect(min([3, 1, 4, 1, 5])).toBe(1)
    expect(max([3, 1, 4, 1, 5])).toBe(5)
  })

  it('range', () => {
    expect(range([1, 5, 3])).toBe(4)
  })

  it('percentile', () => {
    expect(percentile([1, 2, 3, 4, 5], 50)).toBe(3)
    expect(percentile([1, 2, 3, 4, 5], 0)).toBe(1)
    expect(percentile([1, 2, 3, 4, 5], 100)).toBe(5)
    expect(percentile([], 50)).toBe(0)
  })
})
