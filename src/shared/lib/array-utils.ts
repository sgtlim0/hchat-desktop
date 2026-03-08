export function unique<T>(arr: T[], keyFn?: (item: T) => unknown): T[] {
  if (!keyFn) return [...new Set(arr)]
  const seen = new Set()
  return arr.filter((item) => {
    const key = keyFn(item)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export function groupBy<T>(arr: T[], keyFn: (item: T) => string): Record<string, T[]> {
  const result: Record<string, T[]> = {}
  for (const item of arr) {
    const key = keyFn(item)
    ;(result[key] ??= []).push(item)
  }
  return result
}

export function chunk<T>(arr: T[], size: number): T[][] {
  if (size <= 0) return []
  const result: T[][] = []
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size))
  }
  return result
}

export function flatten<T>(arr: (T | T[])[]): T[] {
  return arr.flat() as T[]
}

export function flattenDeep(arr: unknown[]): unknown[] {
  return arr.flat(Infinity)
}

export function sortBy<T>(arr: T[], keyFn: (item: T) => number | string, desc = false): T[] {
  return [...arr].sort((a, b) => {
    const ka = keyFn(a)
    const kb = keyFn(b)
    const cmp = ka < kb ? -1 : ka > kb ? 1 : 0
    return desc ? -cmp : cmp
  })
}

export function compact<T>(arr: (T | null | undefined | false | 0 | '')[]): T[] {
  return arr.filter(Boolean) as T[]
}

export function intersection<T>(a: T[], b: T[]): T[] {
  const set = new Set(b)
  return a.filter((item) => set.has(item))
}

export function difference<T>(a: T[], b: T[]): T[] {
  const set = new Set(b)
  return a.filter((item) => !set.has(item))
}
