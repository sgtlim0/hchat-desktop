import { describe, it, expect } from 'vitest'
import { createLRUCache } from '../lru-cache'

describe('LRUCache', () => {
  it('get/set basic', () => {
    const cache = createLRUCache<string, number>(3)
    cache.set('a', 1)
    expect(cache.get('a')).toBe(1)
  })

  it('returns undefined for missing', () => {
    const cache = createLRUCache<string, number>(3)
    expect(cache.get('x')).toBeUndefined()
  })

  it('evicts LRU when full', () => {
    const cache = createLRUCache<string, number>(2)
    cache.set('a', 1)
    cache.set('b', 2)
    cache.set('c', 3)
    expect(cache.has('a')).toBe(false)
    expect(cache.has('b')).toBe(true)
    expect(cache.has('c')).toBe(true)
  })

  it('get promotes to most recent', () => {
    const cache = createLRUCache<string, number>(2)
    cache.set('a', 1)
    cache.set('b', 2)
    cache.get('a') // promote a
    cache.set('c', 3) // should evict b, not a
    expect(cache.has('a')).toBe(true)
    expect(cache.has('b')).toBe(false)
  })

  it('size tracks count', () => {
    const cache = createLRUCache<string, number>(5)
    expect(cache.size).toBe(0)
    cache.set('a', 1)
    cache.set('b', 2)
    expect(cache.size).toBe(2)
  })

  it('has checks existence', () => {
    const cache = createLRUCache<string, number>(3)
    cache.set('a', 1)
    expect(cache.has('a')).toBe(true)
    expect(cache.has('b')).toBe(false)
  })

  it('delete removes item', () => {
    const cache = createLRUCache<string, number>(3)
    cache.set('a', 1)
    cache.delete('a')
    expect(cache.has('a')).toBe(false)
    expect(cache.size).toBe(0)
  })

  it('clear empties cache', () => {
    const cache = createLRUCache<string, number>(3)
    cache.set('a', 1)
    cache.set('b', 2)
    cache.clear()
    expect(cache.size).toBe(0)
  })

  it('peek reads without promoting', () => {
    const cache = createLRUCache<string, number>(2)
    cache.set('a', 1)
    cache.set('b', 2)
    expect(cache.peek('a')).toBe(1) // no promotion
    cache.set('c', 3) // should still evict a
    expect(cache.has('a')).toBe(false)
  })

  it('keys returns all keys', () => {
    const cache = createLRUCache<string, number>(3)
    cache.set('a', 1)
    cache.set('b', 2)
    expect(cache.keys()).toEqual(['a', 'b'])
  })
})
