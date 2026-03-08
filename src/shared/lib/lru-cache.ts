export class LRUCache<K, V> {
  private cache = new Map<K, V>()
  private readonly maxSize: number

  constructor(maxSize: number) {
    // Handle edge cases: zero or negative size
    this.maxSize = Math.max(0, maxSize)
  }

  get(key: K): V | undefined {
    if (!this.cache.has(key)) return undefined

    // Promote to most recent
    const value = this.cache.get(key)!
    this.cache.delete(key)
    this.cache.set(key, value)
    return value
  }

  set(key: K, value: V): void {
    // Don't store if maxSize is 0
    if (this.maxSize === 0) return

    // If key exists, delete it first to ensure it's added as most recent
    if (this.cache.has(key)) {
      this.cache.delete(key)
    }

    // Add as most recent
    this.cache.set(key, value)

    // Evict oldest if over capacity
    if (this.cache.size > this.maxSize) {
      const oldest = this.cache.keys().next().value
      if (oldest !== undefined) {
        this.cache.delete(oldest)
      }
    }
  }

  has(key: K): boolean {
    return this.cache.has(key)
  }

  delete(key: K): boolean {
    return this.cache.delete(key)
  }

  peek(key: K): V | undefined {
    // Get without promoting
    return this.cache.get(key)
  }

  clear(): void {
    this.cache.clear()
  }

  get size(): number {
    return this.cache.size
  }

  keys(): K[] {
    // Return keys in order from oldest to newest
    return Array.from(this.cache.keys())
  }
}

export function createLRUCache<K, V>(maxSize: number): LRUCache<K, V> {
  return new LRUCache(maxSize)
}
