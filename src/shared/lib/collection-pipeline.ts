export class Pipeline<T> {
  private constructor(private readonly items: T[]) {}

  static from<T>(items: T[]): Pipeline<T> {
    return new Pipeline([...items])
  }

  map<U>(fn: (item: T) => U): Pipeline<U> {
    return new Pipeline(this.items.map(fn))
  }

  filter(fn: (item: T) => boolean): Pipeline<T> {
    return new Pipeline(this.items.filter(fn))
  }

  sort(fn: (a: T, b: T) => number): Pipeline<T> {
    return new Pipeline([...this.items].sort(fn))
  }

  take(n: number): Pipeline<T> {
    return new Pipeline(this.items.slice(0, Math.max(0, n)))
  }

  skip(n: number): Pipeline<T> {
    return new Pipeline(this.items.slice(Math.max(0, n)))
  }

  first(): T | undefined {
    return this.items[0]
  }

  last(): T | undefined {
    return this.items[this.items.length - 1]
  }

  count(): number {
    return this.items.length
  }

  toArray(): T[] {
    return [...this.items]
  }

  reduce<U>(fn: (acc: U, item: T) => U, initial: U): U {
    return this.items.reduce(fn, initial)
  }
}
