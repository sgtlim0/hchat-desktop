export function pipe<T>(...fns: Array<(arg: T) => T>): (arg: T) => T {
  return (arg: T) => fns.reduce((result, fn) => fn(result), arg)
}

export function compose<T>(...fns: Array<(arg: T) => T>): (arg: T) => T {
  return (arg: T) => fns.reduceRight((result, fn) => fn(result), arg)
}

export function pipeAsync<T>(
  ...fns: Array<(arg: T) => T | Promise<T>>
): (arg: T) => Promise<T> {
  return async (arg: T) => {
    let result = arg
    for (const fn of fns) {
      result = await fn(result)
    }
    return result
  }
}

export function tap<T>(fn: (arg: T) => void): (arg: T) => T {
  return (arg: T) => {
    fn(arg)
    return arg
  }
}

export function when<T>(
  predicate: (arg: T) => boolean,
  transform: (arg: T) => T,
): (arg: T) => T {
  return (arg: T) => (predicate(arg) ? transform(arg) : arg)
}

export function memoize<T extends (...args: unknown[]) => unknown>(fn: T): T {
  const cache = new Map<string, unknown>()
  return ((...args: unknown[]) => {
    const key = JSON.stringify(args)
    if (cache.has(key)) return cache.get(key)
    const result = fn(...args)
    cache.set(key, result)
    return result
  }) as T
}
