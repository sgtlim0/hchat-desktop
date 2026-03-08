export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

export function randomBool(probability = 0.5): boolean {
  return Math.random() < probability
}

export function sample<T>(arr: T[]): T | undefined {
  if (arr.length === 0) return undefined
  return arr[Math.floor(Math.random() * arr.length)]
}

export function sampleN<T>(arr: T[], n: number): T[] {
  const shuffled = shuffleArray(arr)
  return shuffled.slice(0, Math.min(n, arr.length))
}

export function randomString(length: number, charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'): string {
  let result = ''
  for (let i = 0; i < length; i++) {
    result += charset.charAt(Math.floor(Math.random() * charset.length))
  }
  return result
}

export function weightedRandom<T>(items: T[], weights: number[]): T {
  const total = weights.reduce((s, w) => s + w, 0)
  let random = Math.random() * total
  for (let i = 0; i < items.length; i++) {
    random -= weights[i]
    if (random <= 0) return items[i]
  }
  return items[items.length - 1]
}

export function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}
