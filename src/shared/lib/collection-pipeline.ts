/**
 * Immutable collection pipeline for functional data transformations.
 *
 * @example
 * ```typescript
 * const result = Pipeline.from([5, 3, 8, 1, 9, 2])
 *   .filter(x => x > 2)
 *   .sort((a, b) => a - b)
 *   .map(x => x * 10)
 *   .take(3)
 *   .toArray()
 * // result: [30, 50, 80]
 * ```
 *
 * Each method returns a new Pipeline instance, preserving immutability.
 * The original array is never modified.
 */
export class Pipeline<T> {
  private readonly items: T[]
  private constructor(items: T[]) {
    this.items = items
  }

  /**
   * Creates a new Pipeline from an array
   * @param items Source array (not modified)
   * @returns New Pipeline instance
   */
  static from<T>(items: T[]): Pipeline<T> {
    return new Pipeline([...items])
  }

  /**
   * Transforms each item in the pipeline
   * @param fn Transformation function
   * @returns New Pipeline with transformed items
   */
  map<U>(fn: (item: T) => U): Pipeline<U> {
    return new Pipeline(this.items.map(fn))
  }

  /**
   * Filters items based on a predicate
   * @param fn Predicate function
   * @returns New Pipeline with filtered items
   */
  filter(fn: (item: T) => boolean): Pipeline<T> {
    return new Pipeline(this.items.filter(fn))
  }

  /**
   * Sorts items using a comparison function
   * @param fn Comparison function (a, b) => number
   * @returns New Pipeline with sorted items
   */
  sort(fn: (a: T, b: T) => number): Pipeline<T> {
    return new Pipeline([...this.items].sort(fn))
  }

  /**
   * Takes first N items from the pipeline
   * @param n Number of items to take (negative treated as 0)
   * @returns New Pipeline with at most N items
   */
  take(n: number): Pipeline<T> {
    return new Pipeline(this.items.slice(0, Math.max(0, n)))
  }

  /**
   * Skips first N items from the pipeline
   * @param n Number of items to skip (negative treated as 0)
   * @returns New Pipeline with remaining items
   */
  skip(n: number): Pipeline<T> {
    return new Pipeline(this.items.slice(Math.max(0, n)))
  }

  /**
   * Returns the first item or undefined if empty
   * @returns First item or undefined
   */
  first(): T | undefined {
    return this.items[0]
  }

  /**
   * Returns the last item or undefined if empty
   * @returns Last item or undefined
   */
  last(): T | undefined {
    return this.items[this.items.length - 1]
  }

  /**
   * Returns the count of items in the pipeline
   * @returns Number of items
   */
  count(): number {
    return this.items.length
  }

  /**
   * Converts the pipeline back to an array
   * @returns New array with pipeline items
   */
  toArray(): T[] {
    return [...this.items]
  }

  /**
   * Reduces the pipeline to a single value
   * @param fn Reducer function
   * @param initial Initial value
   * @returns Reduced value
   */
  reduce<U>(fn: (acc: U, item: T) => U, initial: U): U {
    return this.items.reduce(fn, initial)
  }
}
