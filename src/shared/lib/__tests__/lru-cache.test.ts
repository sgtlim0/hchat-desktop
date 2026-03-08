import { describe, it, expect, beforeEach } from 'vitest'
import { createLRUCache } from '../lru-cache'

describe('LRUCache', () => {
  let cache: ReturnType<typeof createLRUCache<string, number>>

  beforeEach(() => {
    cache = createLRUCache<string, number>(3)
  })

  it('should get and set basic operations', () => {
    cache.set('a', 1)
    cache.set('b', 2)

    expect(cache.get('a')).toBe(1)
    expect(cache.get('b')).toBe(2)
    expect(cache.get('c')).toBeUndefined()
  })

  it('should evict least recently used when full', () => {
    cache.set('a', 1)
    cache.set('b', 2)
    cache.set('c', 3)
    cache.set('d', 4) // Should evict 'a'

    expect(cache.get('a')).toBeUndefined()
    expect(cache.get('b')).toBe(2)
    expect(cache.get('c')).toBe(3)
    expect(cache.get('d')).toBe(4)
  })

  it('should promote item to most recent on get', () => {
    cache.set('a', 1)
    cache.set('b', 2)
    cache.set('c', 3)

    cache.get('a') // Promote 'a' to most recent
    cache.set('d', 4) // Should evict 'b' instead of 'a'

    expect(cache.get('a')).toBe(1)
    expect(cache.get('b')).toBeUndefined()
    expect(cache.get('c')).toBe(3)
    expect(cache.get('d')).toBe(4)
  })

  it('should track size correctly', () => {
    expect(cache.size).toBe(0)

    cache.set('a', 1)
    expect(cache.size).toBe(1)

    cache.set('b', 2)
    cache.set('c', 3)
    expect(cache.size).toBe(3)

    cache.set('d', 4)
    expect(cache.size).toBe(3) // Still 3 after eviction
  })

  it('should check existence with has', () => {
    cache.set('a', 1)
    cache.set('b', 2)

    expect(cache.has('a')).toBe(true)
    expect(cache.has('b')).toBe(true)
    expect(cache.has('c')).toBe(false)
  })

  it('should delete items', () => {
    cache.set('a', 1)
    cache.set('b', 2)
    cache.set('c', 3)

    expect(cache.delete('b')).toBe(true)
    expect(cache.has('b')).toBe(false)
    expect(cache.size).toBe(2)

    expect(cache.delete('z')).toBe(false) // Non-existent
  })

  it('should clear all items', () => {
    cache.set('a', 1)
    cache.set('b', 2)
    cache.set('c', 3)

    cache.clear()

    expect(cache.size).toBe(0)
    expect(cache.get('a')).toBeUndefined()
    expect(cache.get('b')).toBeUndefined()
    expect(cache.get('c')).toBeUndefined()
  })

  it('should respect maxSize', () => {
    const smallCache = createLRUCache<string, number>(1)

    smallCache.set('a', 1)
    smallCache.set('b', 2)

    expect(smallCache.size).toBe(1)
    expect(smallCache.get('a')).toBeUndefined()
    expect(smallCache.get('b')).toBe(2)
  })

  it('should peek without promoting', () => {
    cache.set('a', 1)
    cache.set('b', 2)
    cache.set('c', 3)

    expect(cache.peek('a')).toBe(1) // Peek doesn't promote
    cache.set('d', 4) // Should evict 'a' since it wasn't promoted

    expect(cache.get('a')).toBeUndefined()
    expect(cache.get('b')).toBe(2)
  })

  it('should return keys in order from oldest to newest', () => {
    cache.set('a', 1)
    cache.set('b', 2)
    cache.set('c', 3)

    expect(cache.keys()).toEqual(['a', 'b', 'c'])

    cache.get('a') // Promote 'a' to most recent
    expect(cache.keys()).toEqual(['b', 'c', 'a'])
  })

  it('should update value when setting existing key', () => {
    cache.set('a', 1)
    cache.set('b', 2)
    cache.set('a', 10) // Update 'a' and promote to most recent

    expect(cache.get('a')).toBe(10)
    expect(cache.keys()).toEqual(['b', 'a'])
  })

  it('should handle edge cases', () => {
    // Zero size cache
    const zeroCache = createLRUCache<string, number>(0)
    zeroCache.set('a', 1)
    expect(zeroCache.size).toBe(0)
    expect(zeroCache.get('a')).toBeUndefined()

    // Negative size defaults to 0
    const negCache = createLRUCache<string, number>(-1)
    negCache.set('a', 1)
    expect(negCache.size).toBe(0)
    expect(negCache.get('a')).toBeUndefined()
  })

  it('should work with different types', () => {
    const objCache = createLRUCache<{ id: number }, string>(2)
    const key1 = { id: 1 }
    const key2 = { id: 2 }

    objCache.set(key1, 'value1')
    objCache.set(key2, 'value2')

    expect(objCache.get(key1)).toBe('value1')
    expect(objCache.get(key2)).toBe('value2')
  })
})
