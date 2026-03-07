import { describe, it, expect } from 'vitest'
import {
  generateHeatmap,
  forecastCost,
  benchmarkModels,
  generateReport,
} from '@/shared/lib/analytics-engine'
import type { UsageEntry } from '@/shared/types'

function createEntry(overrides: Partial<UsageEntry> = {}): UsageEntry {
  const now = new Date()
  return {
    id: `usage-${Math.random().toString(36).slice(2, 8)}`,
    sessionId: 'session-1',
    modelId: 'claude-3-5-sonnet',
    inputTokens: 500,
    outputTokens: 200,
    cost: 0.01,
    category: 'chat' as UsageEntry['category'],
    createdAt: now.toISOString(),
    ...overrides,
  }
}

function createEntries(count: number, days = 14): UsageEntry[] {
  const entries: UsageEntry[] = []
  const now = Date.now()

  for (let i = 0; i < count; i++) {
    const date = new Date(now - Math.random() * days * 86400000)
    entries.push(
      createEntry({
        id: `usage-${i}`,
        modelId: ['claude-3-5-sonnet', 'gpt-4o', 'gemini-pro'][i % 3],
        cost: 0.005 + Math.random() * 0.02,
        inputTokens: 200 + Math.floor(Math.random() * 800),
        outputTokens: 100 + Math.floor(Math.random() * 500),
        createdAt: date.toISOString(),
      }),
    )
  }

  return entries
}

describe('analytics-engine', () => {
  describe('generateHeatmap', () => {
    it('should return 168 cells (7 days x 24 hours)', () => {
      const cells = generateHeatmap([])
      expect(cells).toHaveLength(168)
    })

    it('should have correct structure', () => {
      const entries = createEntries(50)
      const cells = generateHeatmap(entries)

      for (const cell of cells) {
        expect(cell.hour).toBeGreaterThanOrEqual(0)
        expect(cell.hour).toBeLessThan(24)
        expect(cell.day).toBeGreaterThanOrEqual(0)
        expect(cell.day).toBeLessThan(7)
        expect(cell.intensity).toBeGreaterThanOrEqual(0)
        expect(cell.intensity).toBeLessThanOrEqual(1)
      }
    })

    it('should count entries correctly', () => {
      const now = new Date()
      const entries = [
        createEntry({ createdAt: now.toISOString() }),
        createEntry({ createdAt: now.toISOString() }),
      ]
      const cells = generateHeatmap(entries)
      const cell = cells.find((c) => c.hour === now.getHours() && c.day === now.getDay())
      expect(cell!.count).toBe(2)
      expect(cell!.intensity).toBe(1)
    })
  })

  describe('forecastCost', () => {
    it('should return zero forecast for empty entries', () => {
      const forecast = forecastCost([])
      expect(forecast.currentMonth).toBe(0)
      expect(forecast.projectedMonth).toBe(0)
      expect(forecast.trend).toBe('stable')
      expect(forecast.confidence).toBe(0)
    })

    it('should calculate current month cost', () => {
      const entries = createEntries(30, 15)
      const forecast = forecastCost(entries)
      expect(forecast.currentMonth).toBeGreaterThan(0)
      expect(forecast.dailyAverage).toBeGreaterThan(0)
    })

    it('should project monthly cost', () => {
      const entries = createEntries(100, 20)
      const forecast = forecastCost(entries)
      expect(forecast.projectedMonth).toBeGreaterThanOrEqual(forecast.currentMonth)
    })

    it('should detect budget alert', () => {
      const entries = createEntries(200, 10)
      const forecast = forecastCost(entries, 0.01) // very low budget
      expect(forecast.budgetAlert).toBe(true)
    })

    it('should have confidence based on data points', () => {
      const fewEntries = createEntries(5, 3)
      const manyEntries = createEntries(100, 14)
      const f1 = forecastCost(fewEntries)
      const f2 = forecastCost(manyEntries)
      expect(f2.confidence).toBeGreaterThanOrEqual(f1.confidence)
    })

    it('should identify trend direction', () => {
      const forecast = forecastCost(createEntries(50))
      expect(['increasing', 'stable', 'decreasing']).toContain(forecast.trend)
    })

    it('should calculate budget utilization', () => {
      const entries = createEntries(20)
      const forecast = forecastCost(entries, 1000)
      expect(forecast.budgetUtilization).toBeGreaterThanOrEqual(0)
      expect(forecast.budgetUtilization).toBeLessThanOrEqual(1)
    })
  })

  describe('benchmarkModels', () => {
    it('should benchmark each model', () => {
      const entries = createEntries(30)
      const benchmarks = benchmarkModels(entries)

      expect(benchmarks.length).toBeGreaterThan(0)
      for (const b of benchmarks) {
        expect(b.modelId).toBeTruthy()
        expect(b.totalQueries).toBeGreaterThan(0)
        expect(b.avgCostPerQuery).toBeGreaterThanOrEqual(0)
        expect(b.avgTokensPerQuery).toBeGreaterThan(0)
      }
    })

    it('should sort by total queries descending', () => {
      const entries = createEntries(50)
      const benchmarks = benchmarkModels(entries)

      for (let i = 1; i < benchmarks.length; i++) {
        expect(benchmarks[i - 1].totalQueries).toBeGreaterThanOrEqual(benchmarks[i].totalQueries)
      }
    })

    it('should return empty for no entries', () => {
      expect(benchmarkModels([])).toEqual([])
    })
  })

  describe('generateReport', () => {
    it('should generate weekly report', () => {
      const entries = createEntries(50, 5)
      const report = generateReport(entries, 'weekly')

      expect(report.totalQueries).toBeGreaterThan(0)
      expect(report.totalTokens).toBeGreaterThan(0)
      expect(report.totalCost).toBeGreaterThan(0)
      expect(report.topModels.length).toBeGreaterThan(0)
      expect(report.period).toContain('~')
    })

    it('should generate monthly report', () => {
      const entries = createEntries(100, 25)
      const report = generateReport(entries, 'monthly')
      expect(report.totalQueries).toBeGreaterThan(0)
    })

    it('should sort top models by queries', () => {
      const entries = createEntries(60)
      const report = generateReport(entries, 'monthly')

      for (let i = 1; i < report.topModels.length; i++) {
        expect(report.topModels[i - 1].queries).toBeGreaterThanOrEqual(report.topModels[i].queries)
      }
    })

    it('should sort daily breakdown by date', () => {
      const entries = createEntries(50, 10)
      const report = generateReport(entries, 'monthly')

      for (let i = 1; i < report.dailyBreakdown.length; i++) {
        expect(report.dailyBreakdown[i - 1].date <= report.dailyBreakdown[i].date).toBe(true)
      }
    })

    it('should handle empty entries', () => {
      const report = generateReport([], 'weekly')
      expect(report.totalQueries).toBe(0)
      expect(report.totalCost).toBe(0)
      expect(report.topModels).toEqual([])
    })

    it('should limit top models to 5', () => {
      const entries = createEntries(200, 7)
      const report = generateReport(entries, 'weekly')
      expect(report.topModels.length).toBeLessThanOrEqual(5)
    })
  })
})
