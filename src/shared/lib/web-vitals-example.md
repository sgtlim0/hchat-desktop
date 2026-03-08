# Web Vitals Performance Monitor Usage

## Basic Usage

```typescript
import { initWebVitals, getMetrics, onMetric } from '@/shared/lib/web-vitals'

// Initialize monitoring (typically in App.tsx or main.tsx)
initWebVitals()

// Subscribe to metric updates
const unsubscribe = onMetric((metric) => {
  console.log(`${metric.name}: ${metric.value}ms (${metric.rating})`)

  // Send to analytics
  if (window.gtag) {
    window.gtag('event', metric.name, {
      value: Math.round(metric.value),
      metric_rating: metric.rating,
      non_interaction: true
    })
  }
})

// Get current metrics
const metrics = getMetrics()
console.table(metrics)

// Export metrics as JSON
const metricsJson = exportMetrics()
console.log(metricsJson)

// Clean up when done
unsubscribe()
```

## Integration in React Component

```tsx
import { useEffect } from 'react'
import { initWebVitals, onMetric } from '@/shared/lib/web-vitals'

function App() {
  useEffect(() => {
    // Initialize Web Vitals monitoring
    initWebVitals()

    // Subscribe to metrics
    const unsubscribe = onMetric((metric) => {
      // Log to console in development
      if (import.meta.env.DEV) {
        console.log(`Web Vital: ${metric.name}`, {
          value: metric.value,
          rating: metric.rating,
          timestamp: metric.timestamp
        })
      }

      // You could also send to your analytics service
      // or display in a performance dashboard
    })

    return () => {
      unsubscribe()
    }
  }, [])

  return <div>Your App</div>
}
```

## Metrics Explained

- **LCP (Largest Contentful Paint)**: Time until the largest content element is rendered
  - Good: < 2500ms
  - Needs Improvement: 2500-4000ms
  - Poor: > 4000ms

- **FID (First Input Delay)**: Time from first user interaction to browser response
  - Good: < 100ms
  - Needs Improvement: 100-300ms
  - Poor: > 300ms

- **CLS (Cumulative Layout Shift)**: Visual stability score
  - Good: < 0.1
  - Needs Improvement: 0.1-0.25
  - Poor: > 0.25

- **FCP (First Contentful Paint)**: Time until first content is rendered
  - Good: < 1800ms
  - Needs Improvement: 1800-3000ms
  - Poor: > 3000ms

- **TTFB (Time to First Byte)**: Server response time
  - Good: < 800ms
  - Needs Improvement: 800-1800ms
  - Poor: > 1800ms