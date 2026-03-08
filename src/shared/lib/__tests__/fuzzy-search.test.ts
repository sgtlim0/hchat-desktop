import { describe, it, expect } from 'vitest'
import { fuzzyScore, fuzzySearch } from '../fuzzy-search'

describe('fuzzyScore', () => {
  it('exact match returns score 1', () => {
    expect(fuzzyScore('hello', 'hello').score).toBe(1)
  })

  it('substring match returns high score', () => {
    const { score } = fuzzyScore('chat', 'H Chat Desktop')
    expect(score).toBeGreaterThan(0.5)
  })

  it('case insensitive', () => {
    const { score } = fuzzyScore('HELLO', 'hello world')
    expect(score).toBeGreaterThan(0.5)
  })

  it('no match returns 0', () => {
    expect(fuzzyScore('xyz', 'hello').score).toBe(0)
  })

  it('empty query matches everything', () => {
    expect(fuzzyScore('', 'anything').score).toBe(1)
  })

  it('empty text returns 0', () => {
    expect(fuzzyScore('query', '').score).toBe(0)
  })

  it('subsequence match works', () => {
    const { score } = fuzzyScore('hlo', 'hello')
    expect(score).toBeGreaterThan(0)
  })

  it('works with Korean text', () => {
    const { score } = fuzzyScore('채팅', '새 채팅 시작')
    expect(score).toBeGreaterThan(0.5)
  })

  it('returns matched ranges', () => {
    const { ranges } = fuzzyScore('chat', 'H Chat Desktop')
    expect(ranges.length).toBeGreaterThan(0)
  })
})

describe('fuzzySearch', () => {
  const items = [
    { id: 1, name: 'Hello World' },
    { id: 2, name: 'H Chat Desktop' },
    { id: 3, name: 'TypeScript Guide' },
    { id: 4, name: 'React Hooks' },
  ]

  it('filters and sorts by score', () => {
    const results = fuzzySearch('chat', items, (i) => i.name)
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].item.name).toBe('H Chat Desktop')
  })

  it('returns all items for empty query', () => {
    const results = fuzzySearch('', items, (i) => i.name)
    expect(results).toHaveLength(4)
  })

  it('filters below threshold', () => {
    const results = fuzzySearch('xyzabc', items, (i) => i.name, { threshold: 0.3 })
    expect(results).toHaveLength(0)
  })

  it('respects limit', () => {
    const results = fuzzySearch('', items, (i) => i.name, { limit: 2 })
    expect(results).toHaveLength(2)
  })

  it('results sorted descending', () => {
    const results = fuzzySearch('h', items, (i) => i.name)
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].score).toBeGreaterThanOrEqual(results[i].score)
    }
  })
})
