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

export function compare(name1: string, name2: string): {
  faster: string
  slower: string
  speedup: number
  percentFaster: number
} {
  const result1 = results.find(r => r.name === name1)
  const result2 = results.find(r => r.name === name2)

  if (!result1) {
    throw new Error(`Benchmark "${name1}" not found`)
  }
  if (!result2) {
    throw new Error(`Benchmark "${name2}" not found`)
  }

  const faster = result1.avgMs <= result2.avgMs ? name1 : name2
  const slower = result1.avgMs > result2.avgMs ? name1 : name2
  const fasterTime = Math.min(result1.avgMs, result2.avgMs)
  const slowerTime = Math.max(result1.avgMs, result2.avgMs)

  const speedup = slowerTime / fasterTime
  const percentFaster = ((slowerTime - fasterTime) / slowerTime) * 100

  return {
    faster,
    slower,
    speedup,
    percentFaster
  }
}

export function formatResult(result: BenchmarkResult): string {
  return `${result.name}: ${result.iterations} iterations
  avg: ${result.avgMs.toFixed(2)}ms
  min: ${result.minMs.toFixed(2)}ms
  max: ${result.maxMs.toFixed(2)}ms
  median: ${result.medianMs.toFixed(2)}ms`
}

export function exportResults(): string {
  return JSON.stringify({
    benchmarks: results,
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  }, null, 2)
}
