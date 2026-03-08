export function sum(arr: number[]): number {
  return arr.reduce((s, v) => s + v, 0)
}

export function mean(arr: number[]): number {
  if (arr.length === 0) return 0
  return sum(arr) / arr.length
}

export function median(arr: number[]): number {
  if (arr.length === 0) return 0
  const sorted = [...arr].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

export function mode(arr: number[]): number | undefined {
  if (arr.length === 0) return undefined
  const freq = new Map<number, number>()
  for (const v of arr) freq.set(v, (freq.get(v) ?? 0) + 1)
  let maxFreq = 0
  let modeVal: number | undefined
  for (const [v, f] of freq) {
    if (f > maxFreq) { maxFreq = f; modeVal = v }
  }
  return modeVal
}

export function standardDeviation(arr: number[]): number {
  if (arr.length < 2) return 0
  const avg = mean(arr)
  const variance = arr.reduce((s, v) => s + (v - avg) ** 2, 0) / arr.length
  return Math.sqrt(variance)
}

export function min(arr: number[]): number {
  return Math.min(...arr)
}

export function max(arr: number[]): number {
  return Math.max(...arr)
}

export function range(arr: number[]): number {
  return max(arr) - min(arr)
}

export function percentile(arr: number[], p: number): number {
  if (arr.length === 0) return 0
  const sorted = [...arr].sort((a, b) => a - b)
  const index = (p / 100) * (sorted.length - 1)
  const lower = Math.floor(index)
  const upper = Math.ceil(index)
  if (lower === upper) return sorted[lower]
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower)
}
