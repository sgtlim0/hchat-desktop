/**
 * Array utility functions - immutable operations
 */

/**
 * Returns array with unique elements
 * @param arr Input array
 * @param keyFn Optional function to extract comparison key
 */
export function unique<T>(arr: T[], keyFn?: (item: T) => unknown): T[] {
  if (!keyFn) {
    return [...new Set(arr)]
  }

  const seen = new Set<unknown>()
  const result: T[] = []

  for (const item of arr) {
    const key = keyFn(item)
    if (!seen.has(key)) {
      seen.add(key)
      result.push(item)
    }
  }

  return result
}

/**
 * Groups array elements by key
 * @param arr Input array
 * @param keyFn Function to extract grouping key
 */
export function groupBy<T>(
  arr: T[],
  keyFn: (item: T) => string
): Record<string, T[]> {
  const result: Record<string, T[]> = {}

  for (const item of arr) {
    const key = keyFn(item)
    if (!result[key]) {
      result[key] = []
    }
    result[key].push(item)
  }

  return result
}

/**
 * Splits array into chunks of specified size
 * @param arr Input array
 * @param size Chunk size (must be positive)
 */
export function chunk<T>(arr: T[], size: number): T[][] {
  if (size <= 0) {
    throw new Error('Chunk size must be positive')
  }

  const result: T[][] = []
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size))
  }

  return result
}

/**
 * Flattens array one level deep
 * @param arr Input array with potentially nested arrays
 */
export function flatten<T>(arr: (T | T[])[]): T[] {
  const result: T[] = []

  for (const item of arr) {
    if (Array.isArray(item)) {
      result.push(...item)
    } else {
      result.push(item)
    }
  }

  return result
}

/**
 * Recursively flattens deeply nested arrays
 * @param arr Input array with nested arrays
 */
export function flattenDeep(arr: unknown[]): unknown[] {
  const result: unknown[] = []

  for (const item of arr) {
    if (Array.isArray(item)) {
      result.push(...flattenDeep(item))
    } else {
      result.push(item)
    }
  }

  return result
}

/**
 * Shuffles array elements randomly
 * @param arr Input array
 */
export function shuffle<T>(arr: T[]): T[] {
  const result = [...arr]

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }

  return result
}

/**
 * Sorts array by key function
 * @param arr Input array
 * @param keyFn Function to extract sort key
 * @param desc Sort in descending order
 */
export function sortBy<T>(
  arr: T[],
  keyFn: (item: T) => number | string,
  desc = false
): T[] {
  const result = [...arr]

  result.sort((a, b) => {
    const aKey = keyFn(a)
    const bKey = keyFn(b)

    if (aKey < bKey) return desc ? 1 : -1
    if (aKey > bKey) return desc ? -1 : 1
    return 0
  })

  return result
}

/**
 * Removes falsy values from array
 * @param arr Input array
 */
export function compact<T>(
  arr: (T | null | undefined | false | 0 | '')[]
): T[] {
  const result: T[] = []

  for (const item of arr) {
    if (item) {
      result.push(item as T)
    }
  }

  return result
}

/**
 * Returns elements present in both arrays
 * @param a First array
 * @param b Second array
 */
export function intersection<T>(a: T[], b: T[]): T[] {
  const bSet = new Set(b)
  const resultSet = new Set<T>()

  for (const item of a) {
    if (bSet.has(item)) {
      resultSet.add(item)
    }
  }

  return Array.from(resultSet)
}

/**
 * Returns elements in first array not in second
 * @param a First array
 * @param b Second array
 */
export function difference<T>(a: T[], b: T[]): T[] {
  const bSet = new Set(b)
  const resultSet = new Set<T>()

  for (const item of a) {
    if (!bSet.has(item)) {
      resultSet.add(item)
    }
  }

  return Array.from(resultSet)
}
