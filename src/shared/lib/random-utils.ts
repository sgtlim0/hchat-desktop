/**
 * Generate a random integer between min and max (inclusive)
 * @param min - Minimum value (inclusive)
 * @param max - Maximum value (inclusive)
 * @returns Random integer in range [min, max]
 */
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/**
 * Generate a random float between min and max (exclusive of max)
 * @param min - Minimum value (inclusive)
 * @param max - Maximum value (exclusive)
 * @returns Random float in range [min, max)
 */
export function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

/**
 * Generate a random boolean with optional probability
 * @param probability - Probability of returning true (0-1), defaults to 0.5
 * @returns Random boolean value
 */
export function randomBool(probability = 0.5): boolean {
  return Math.random() < probability
}

/**
 * Pick a random element from an array
 * @param arr - Array to sample from
 * @returns Random element or undefined if array is empty
 */
export function sample<T>(arr: T[]): T | undefined {
  if (arr.length === 0) return undefined
  return arr[Math.floor(Math.random() * arr.length)]
}

/**
 * Pick N random unique elements from an array
 * @param arr - Array to sample from
 * @param n - Number of elements to sample
 * @returns Array of n random elements (or all elements if n > array length)
 */
export function sampleN<T>(arr: T[], n: number): T[] {
  const shuffled = shuffleArray(arr)
  return shuffled.slice(0, Math.min(n, arr.length))
}

/**
 * Generate a random string of given length
 * @param length - Length of the string to generate
 * @param charset - Characters to use (defaults to alphanumeric)
 * @returns Random string of specified length
 */
export function randomString(length: number, charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'): string {
  let result = ''
  for (let i = 0; i < length; i++) {
    result += charset.charAt(Math.floor(Math.random() * charset.length))
  }
  return result
}

/**
 * Select a random item based on weights
 * @param items - Array of items to choose from
 * @param weights - Array of weights (same length as items)
 * @returns Randomly selected item based on weight distribution
 * @throws Error if arrays have different lengths
 */
export function weightedRandom<T>(items: T[], weights: number[]): T {
  if (items.length !== weights.length) {
    throw new Error('Items and weights arrays must have the same length')
  }

  const total = weights.reduce((s, w) => s + w, 0)
  let random = Math.random() * total
  for (let i = 0; i < items.length; i++) {
    random -= weights[i]
    if (random <= 0) return items[i]
  }
  return items[items.length - 1]
}

/**
 * Shuffle an array using Fisher-Yates algorithm
 * Returns a new shuffled array without modifying the original
 * @param arr - Array to shuffle
 * @returns New shuffled array
 */
export function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}
