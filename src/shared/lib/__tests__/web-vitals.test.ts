import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import {
  initWebVitals,
  getMetrics,
  onMetric,
  clearMetrics,
  exportMetrics,
  type WebVitalMetric
} from '../web-vitals'

describe('Web Vitals Monitor', () => {
  let mockPerformanceObserver: typeof PerformanceObserver
  let observerCallbacks: Map<string, PerformanceObserverCallback>

  beforeEach(() => {
    // Clear any existing metrics
    clearMetrics()

    // Set up mock PerformanceObserver
    observerCallbacks = new Map()

    mockPerformanceObserver = vi.fn().mockImplementation(function(this: PerformanceObserver, callback: PerformanceObserverCallback) {
      const observer = {
        observe: vi.fn((options: PerformanceObserverInit) => {
          if (options.type) {
            observerCallbacks.set(options.type, callback)
          }
        }),
        disconnect: vi.fn()
      }
      return observer
    })

    // Mock global PerformanceObserver
    global.PerformanceObserver = mockPerformanceObserver as unknown as typeof PerformanceObserver

    // Mock performance.getEntriesByType for TTFB
    global.performance = {
      ...global.performance,
      getEntriesByType: vi.fn((type: string) => {
        if (type === 'navigation') {
          return [{
            name: 'https://example.com',
            entryType: 'navigation',
            startTime: 0,
            responseStart: 850
          }] as PerformanceNavigationTiming[]
        }
        return []
      })
    } as Performance
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('records LCP metric', () => {
    initWebVitals()

    // Simulate LCP entry
    const lcpCallback = observerCallbacks.get('largest-contentful-paint')
    expect(lcpCallback).toBeDefined()

    lcpCallback?.({
      getEntries: () => [{
        name: '',
        entryType: 'largest-contentful-paint',
        startTime: 2400,
        renderTime: 2400,
        loadTime: 0
      }]
    })

    const metrics = getMetrics()
    expect(metrics.LCP).toBeDefined()
    expect(metrics.LCP.name).toBe('LCP')
    expect(metrics.LCP.value).toBe(2400)
    expect(metrics.LCP.rating).toBe('good') // < 2500ms
  })

  it('records FCP metric', () => {
    initWebVitals()

    // Simulate FCP entry
    const paintCallback = observerCallbacks.get('paint')
    expect(paintCallback).toBeDefined()

    paintCallback?.({
      getEntries: () => [
        {
          name: 'first-contentful-paint',
          entryType: 'paint',
          startTime: 1700
        },
        {
          name: 'first-paint',
          entryType: 'paint',
          startTime: 1600
        }
      ]
    })

    const metrics = getMetrics()
    expect(metrics.FCP).toBeDefined()
    expect(metrics.FCP.name).toBe('FCP')
    expect(metrics.FCP.value).toBe(1700)
    expect(metrics.FCP.rating).toBe('good') // < 1800ms
  })

  it('records CLS metric', () => {
    initWebVitals()

    // Simulate layout shift entries
    const clsCallback = observerCallbacks.get('layout-shift')
    expect(clsCallback).toBeDefined()

    clsCallback?.({
      getEntries: () => [
        {
          name: '',
          entryType: 'layout-shift',
          value: 0.05,
          hadRecentInput: false
        },
        {
          name: '',
          entryType: 'layout-shift',
          value: 0.03,
          hadRecentInput: false
        }
      ]
    })

    const metrics = getMetrics()
    expect(metrics.CLS).toBeDefined()
    expect(metrics.CLS.name).toBe('CLS')
    expect(metrics.CLS.value).toBeCloseTo(0.08, 2)
    expect(metrics.CLS.rating).toBe('good') // < 0.1
  })

  it('records TTFB metric', () => {
    initWebVitals()

    const metrics = getMetrics()
    expect(metrics.TTFB).toBeDefined()
    expect(metrics.TTFB.name).toBe('TTFB')
    expect(metrics.TTFB.value).toBe(850)
    expect(metrics.TTFB.rating).toBe('needs-improvement') // 800-1800ms
  })

  it('getMetrics returns all recorded metrics', () => {
    initWebVitals()

    // Simulate multiple metrics
    const lcpCallback = observerCallbacks.get('largest-contentful-paint')
    lcpCallback?.({
      getEntries: () => [{
        name: '',
        entryType: 'largest-contentful-paint',
        startTime: 3000,
        renderTime: 3000,
        loadTime: 0
      }]
    })

    const paintCallback = observerCallbacks.get('paint')
    paintCallback?.({
      getEntries: () => [{
        name: 'first-contentful-paint',
        entryType: 'paint',
        startTime: 2000
      }]
    })

    const metrics = getMetrics()
    expect(Object.keys(metrics)).toContain('LCP')
    expect(Object.keys(metrics)).toContain('FCP')
    expect(Object.keys(metrics)).toContain('TTFB')
    expect(metrics.LCP.value).toBe(3000)
    expect(metrics.FCP.value).toBe(2000)
  })

  it('getMetrics returns empty object initially', () => {
    const metrics = getMetrics()
    expect(Object.keys(metrics)).toHaveLength(0)
  })

  it('onMetric callback fires when metric recorded', () => {
    const callback = vi.fn()
    const unsubscribe = onMetric(callback)

    initWebVitals()

    // Simulate LCP entry
    const lcpCallback = observerCallbacks.get('largest-contentful-paint')
    lcpCallback?.({
      getEntries: () => [{
        name: '',
        entryType: 'largest-contentful-paint',
        startTime: 2000,
        renderTime: 2000,
        loadTime: 0
      }]
    })

    expect(callback).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'LCP',
        value: 2000,
        rating: 'good'
      })
    )

    // Test unsubscribe
    unsubscribe()

    // Simulate another metric
    const paintCallback = observerCallbacks.get('paint')
    paintCallback?.({
      getEntries: () => [{
        name: 'first-contentful-paint',
        entryType: 'paint',
        startTime: 1500
      }]
    })

    // Callback should not be called after unsubscribe
    expect(callback).toHaveBeenCalledTimes(2) // Once for LCP, once for TTFB (auto-recorded on init)
  })

  it('clearMetrics resets all', () => {
    initWebVitals()

    // Add some metrics
    const lcpCallback = observerCallbacks.get('largest-contentful-paint')
    lcpCallback?.({
      getEntries: () => [{
        name: '',
        entryType: 'largest-contentful-paint',
        startTime: 2000,
        renderTime: 2000,
        loadTime: 0
      }]
    })

    expect(Object.keys(getMetrics()).length).toBeGreaterThan(0)

    clearMetrics()
    expect(Object.keys(getMetrics())).toHaveLength(0)
  })

  it('exportMetrics returns JSON string', () => {
    initWebVitals()

    // Add some metrics
    const lcpCallback = observerCallbacks.get('largest-contentful-paint')
    lcpCallback?.({
      getEntries: () => [{
        name: '',
        entryType: 'largest-contentful-paint',
        startTime: 2500,
        renderTime: 2500,
        loadTime: 0
      }]
    })

    const exported = exportMetrics()
    const parsed = JSON.parse(exported)

    expect(parsed.LCP).toBeDefined()
    expect(parsed.LCP.name).toBe('LCP')
    expect(parsed.LCP.value).toBe(2500)
    expect(parsed.LCP.rating).toBe('needs-improvement')
    expect(parsed.LCP.timestamp).toBeDefined()
  })

  it('multiple metrics of same type keep latest value', () => {
    initWebVitals()

    const lcpCallback = observerCallbacks.get('largest-contentful-paint')

    // First LCP
    lcpCallback?.({
      getEntries: () => [{
        name: '',
        entryType: 'largest-contentful-paint',
        startTime: 2000,
        renderTime: 2000,
        loadTime: 0
      }]
    })

    let metrics = getMetrics()
    expect(metrics.LCP.value).toBe(2000)

    // Second LCP (should replace)
    lcpCallback?.({
      getEntries: () => [{
        name: '',
        entryType: 'largest-contentful-paint',
        startTime: 3000,
        renderTime: 3000,
        loadTime: 0
      }]
    })

    metrics = getMetrics()
    expect(metrics.LCP.value).toBe(3000)
    expect(metrics.LCP.rating).toBe('needs-improvement')
  })

  it('handles FID metric properly', () => {
    initWebVitals()

    // Simulate FID entry
    const fidCallback = observerCallbacks.get('first-input')
    expect(fidCallback).toBeDefined()

    fidCallback?.({
      getEntries: () => [{
        name: 'mousedown',
        entryType: 'first-input',
        startTime: 1000,
        processingStart: 1050
      }]
    })

    const metrics = getMetrics()
    expect(metrics.FID).toBeDefined()
    expect(metrics.FID.name).toBe('FID')
    expect(metrics.FID.value).toBe(50)
    expect(metrics.FID.rating).toBe('good') // < 100ms
  })

  it('correctly rates metrics based on thresholds', () => {
    initWebVitals()

    // Test LCP ratings
    const lcpCallback = observerCallbacks.get('largest-contentful-paint')

    // Good LCP (< 2500ms)
    lcpCallback?.({
      getEntries: () => [{
        name: '',
        entryType: 'largest-contentful-paint',
        startTime: 2000,
        renderTime: 2000,
        loadTime: 0
      }]
    })
    expect(getMetrics().LCP.rating).toBe('good')

    // Needs improvement LCP (2500-4000ms)
    lcpCallback?.({
      getEntries: () => [{
        name: '',
        entryType: 'largest-contentful-paint',
        startTime: 3500,
        renderTime: 3500,
        loadTime: 0
      }]
    })
    expect(getMetrics().LCP.rating).toBe('needs-improvement')

    // Poor LCP (> 4000ms)
    lcpCallback?.({
      getEntries: () => [{
        name: '',
        entryType: 'largest-contentful-paint',
        startTime: 5000,
        renderTime: 5000,
        loadTime: 0
      }]
    })
    expect(getMetrics().LCP.rating).toBe('poor')
  })

  it('handles missing PerformanceObserver gracefully', () => {
    // Remove PerformanceObserver
    global.PerformanceObserver = undefined as unknown as typeof PerformanceObserver

    expect(() => initWebVitals()).not.toThrow()
    expect(getMetrics()).toEqual({})
  })
})