/**
 * Web Vitals Performance Monitor
 * Tracks Core Web Vitals (LCP, FID, CLS, FCP, TTFB) using PerformanceObserver API
 */

export interface WebVitalMetric {
  name: 'LCP' | 'FID' | 'CLS' | 'FCP' | 'TTFB'
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  timestamp: string
}

// Google's Web Vitals thresholds
const THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 },      // milliseconds
  FID: { good: 100, poor: 300 },        // milliseconds
  CLS: { good: 0.1, poor: 0.25 },       // score
  FCP: { good: 1800, poor: 3000 },      // milliseconds
  TTFB: { good: 800, poor: 1800 }       // milliseconds
}

// Store metrics
let metrics: Record<string, WebVitalMetric> = {}

// Store subscribers
let subscribers: Set<(metric: WebVitalMetric) => void> = new Set()

// Store observer instances for cleanup
let observers: PerformanceObserver[] = []

// CLS tracking
let clsValue = 0
let clsEntries: PerformanceEntry[] = []

/**
 * Calculate rating based on thresholds
 */
function getRating(name: WebVitalMetric['name'], value: number): WebVitalMetric['rating'] {
  const threshold = THRESHOLDS[name]
  if (value < threshold.good) return 'good'
  if (value <= threshold.poor) return 'needs-improvement'
  return 'poor'
}

/**
 * Record a metric and notify subscribers
 */
function recordMetric(name: WebVitalMetric['name'], value: number) {
  const metric: WebVitalMetric = {
    name,
    value,
    rating: getRating(name, value),
    timestamp: new Date().toISOString()
  }

  metrics[name] = metric

  // Notify all subscribers
  subscribers.forEach(callback => callback(metric))
}

/**
 * Initialize Web Vitals monitoring
 */
export function initWebVitals(): void {
  // Guard for SSR or missing API
  if (typeof PerformanceObserver === 'undefined') {
    return
  }

  // Clean up any existing observers
  observers.forEach(observer => observer.disconnect())
  observers = []

  try {
    // Observe Largest Contentful Paint (LCP)
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const lastEntry = entries[entries.length - 1]
      if (lastEntry) {
        // LCP is the render time or load time, whichever is later
        const lcpEntry = lastEntry as PerformanceEntry & { renderTime?: number; loadTime?: number }
        const value = lcpEntry.renderTime || lcpEntry.loadTime || lcpEntry.startTime
        recordMetric('LCP', value)
      }
    })
    lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true })
    observers.push(lcpObserver)

    // Observe First Input Delay (FID)
    const fidObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const firstEntry = entries[0]
      if (firstEntry) {
        // FID is the delay between input and processing
        const fidEntry = firstEntry as PerformanceEntry & { processingStart?: number }
        const value = (fidEntry.processingStart || 0) - firstEntry.startTime
        recordMetric('FID', value)
      }
    })
    fidObserver.observe({ type: 'first-input', buffered: true })
    observers.push(fidObserver)

    // Observe Cumulative Layout Shift (CLS)
    const clsObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      entries.forEach((entry) => {
        // Only count shifts without recent input
        const clsEntry = entry as PerformanceEntry & { hadRecentInput?: boolean; value?: number }
        if (!clsEntry.hadRecentInput) {
          clsValue += clsEntry.value || 0
          clsEntries.push(entry)
        }
      })
      // Record current CLS value
      recordMetric('CLS', clsValue)
    })
    clsObserver.observe({ type: 'layout-shift', buffered: true })
    observers.push(clsObserver)

    // Observe First Contentful Paint (FCP)
    const paintObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      entries.forEach((entry) => {
        if (entry.name === 'first-contentful-paint') {
          recordMetric('FCP', entry.startTime)
        }
      })
    })
    paintObserver.observe({ type: 'paint', buffered: true })
    observers.push(paintObserver)

    // Get Time to First Byte (TTFB) from navigation timing
    if (performance && performance.getEntriesByType) {
      const navEntries = performance.getEntriesByType('navigation')
      if (navEntries.length > 0) {
        const navEntry = navEntries[0] as PerformanceNavigationTiming
        if (navEntry.responseStart) {
          recordMetric('TTFB', navEntry.responseStart)
        }
      }
    }
  } catch (error) {
    console.warn('Failed to initialize Web Vitals monitoring:', error)
  }
}

/**
 * Get all recorded metrics
 */
export function getMetrics(): Record<string, WebVitalMetric> {
  return { ...metrics }
}

/**
 * Subscribe to metric updates
 * @returns Unsubscribe function
 */
export function onMetric(callback: (metric: WebVitalMetric) => void): () => void {
  subscribers.add(callback)
  return () => {
    subscribers.delete(callback)
  }
}

/**
 * Clear all recorded metrics
 */
export function clearMetrics(): void {
  metrics = {}
  clsValue = 0
  clsEntries = []
}

/**
 * Export metrics as JSON string
 */
export function exportMetrics(): string {
  return JSON.stringify(metrics, null, 2)
}