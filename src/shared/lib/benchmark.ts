export interface BenchmarkResult {
  name: string
  iterations: number
  avgMs: number
  minMs: number
  maxMs: number
  medianMs: number
  totalMs: number
}

const results: BenchmarkResult[] = []

export function measure<T>(fn: () => T): { result: T; durationMs: number } {
  const start = performance.now()
  const result = fn()
  return { result, durationMs: performance.now() - start }
}

export async function measureAsync<T>(fn: () => Promise<T>): Promise<{ result: T; durationMs: number }> {
  const start = performance.now()
  const result = await fn()
  return { result, durationMs: performance.now() - start }
}

export function benchmark(name: string, fn: () => void, iterations = 100): BenchmarkResult {
  const times: number[] = []

  for (let i = 0; i < iterations; i++) {
    const start = performance.now()
    fn()
    times.push(performance.now() - start)
  }

  times.sort((a, b) => a - b)
  const totalMs = times.reduce((s, t) => s + t, 0)

  const result: BenchmarkResult = {
    name,
    iterations,
    avgMs: totalMs / iterations,
    minMs: times[0],
    maxMs: times[times.length - 1],
    medianMs: times[Math.floor(times.length / 2)],
    totalMs,
  }

  results.push(result)
  return result
}

export function getResults(): readonly BenchmarkResult[] {
  return [...results]
}

export function clearResults(): void {
  results.length = 0
}

export function formatResult(result: BenchmarkResult): string {
  return `${result.name}: avg=${result.avgMs.toFixed(3)}ms min=${result.minMs.toFixed(3)}ms max=${result.maxMs.toFixed(3)}ms (${result.iterations} iterations)`
}

export function exportResults(): string {
  return JSON.stringify(results, null, 2)
}
