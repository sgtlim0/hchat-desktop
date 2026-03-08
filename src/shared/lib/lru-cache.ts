export class LRUCache<K, V> {
  private cache = new Map<K, V>()
  private readonly maxSize: number

  constructor(maxSize: number) {
    this.maxSize = Math.max(1, maxSize)
  }

  get(key: K): V | undefined {
    if (!this.cache.has(key)) return undefined
    const value = this.cache.get(key)!
    this.cache.delete(key)
    this.cache.set(key, value)
    return value
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) this.cache.delete(key)
    this.cache.set(key, value)
    if (this.cache.size > this.maxSize) {
      const oldest = this.cache.keys().next().value
      if (oldest !== undefined) this.cache.delete(oldest)
    }
  }

  has(key: K): boolean {
    return this.cache.has(key)
  }

  delete(key: K): boolean {
    return this.cache.delete(key)
  }

  peek(key: K): V | undefined {
    return this.cache.get(key)
  }

  clear(): void {
    this.cache.clear()
  }

  get size(): number {
    return this.cache.size
  }

  keys(): K[] {
    return Array.from(this.cache.keys())
  }
}

export function createLRUCache<K, V>(maxSize: number): LRUCache<K, V> {
  return new LRUCache(maxSize)
}
