/**
 * Phase 33: Performance & Bundle Optimization utilities
 * Code splitting helpers, lazy loading, Web Worker offloading.
 */

export interface PerfMetrics {
  fcp: number | null
  lcp: number | null
  cls: number | null
  tbt: number | null
  ttfb: number | null
  timestamp: string
}

export interface BundleAnalysis {
  totalSize: number
  chunkCount: number
  largestChunk: { name: string; size: number }
  suggestions: string[]
}

/** Collect Core Web Vitals from Performance API */
export function collectWebVitals(): PerfMetrics {
  const metrics: PerfMetrics = {
    fcp: null, lcp: null, cls: null, tbt: null, ttfb: null,
    timestamp: new Date().toISOString(),
  }

  if (typeof performance === 'undefined') return metrics

  // FCP
  const fcpEntry = performance.getEntriesByName('first-contentful-paint')[0]
  if (fcpEntry) metrics.fcp = Math.round(fcpEntry.startTime)

  // TTFB
  const navEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[]
  if (navEntries[0]) metrics.ttfb = Math.round(navEntries[0].responseStart)

  return metrics
}

/** Debounce function for performance-sensitive operations */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | null = null
  return (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}

/** Throttle function using requestAnimationFrame */
export function rafThrottle<T extends (...args: unknown[]) => unknown>(
  fn: T,
): (...args: Parameters<T>) => void {
  let scheduled = false
  let lastArgs: Parameters<T> | null = null

  return (...args: Parameters<T>) => {
    lastArgs = args
    if (scheduled) return
    scheduled = true
    requestAnimationFrame(() => {
      scheduled = false
      if (lastArgs) fn(...lastArgs)
    })
  }
}

/** Lazy load a module only when needed */
export function lazyModule<T>(loader: () => Promise<T>): { get: () => Promise<T> } {
  let cached: T | null = null
  let loading: Promise<T> | null = null

  return {
    async get() {
      if (cached) return cached
      if (loading) return loading
      loading = loader().then((mod) => {
        cached = mod
        loading = null
        return mod
      })
      return loading
    },
  }
}

/** Estimate token count from text (rough approximation) */
export function estimateTokens(text: string): number {
  // ~4 chars per token for English, ~2 chars for Korean
  const koreanChars = (text.match(/[가-힣]/g) ?? []).length
  const otherChars = text.length - koreanChars
  return Math.ceil(koreanChars / 2 + otherChars / 4)
}

/** Create an idle callback wrapper with timeout fallback */
export function whenIdle(callback: () => void, timeout = 2000): void {
  if (typeof requestIdleCallback !== 'undefined') {
    requestIdleCallback(callback, { timeout })
  } else {
    setTimeout(callback, 50)
  }
}

/** Measure execution time of an async function */
export async function measureAsync<T>(
  _label: string,
  fn: () => Promise<T>,
): Promise<{ result: T; durationMs: number }> {
  const start = performance.now()
  const result = await fn()
  const durationMs = Math.round(performance.now() - start)
  return { result, durationMs }
}
