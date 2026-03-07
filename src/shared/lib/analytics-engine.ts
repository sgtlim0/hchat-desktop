/**
 * Advanced Analytics Engine — Cost forecasting, usage patterns, model benchmarks
 */

import type { UsageEntry } from '@/shared/types'

export interface HeatmapCell {
  hour: number
  day: number // 0=Sun, 6=Sat
  count: number
  intensity: number // 0-1
}

export interface CostForecast {
  currentMonth: number
  projectedMonth: number
  dailyAverage: number
  trend: 'increasing' | 'stable' | 'decreasing'
  confidence: number
  nextMonthEstimate: number
  budgetAlert: boolean
  budgetUtilization: number
}

export interface ModelBenchmark {
  modelId: string
  avgResponseTime: number
  avgTokensPerQuery: number
  avgCostPerQuery: number
  totalQueries: number
  errorRate: number
  satisfactionScore: number
}

export interface TeamMemberStats {
  userId: string
  totalQueries: number
  totalTokens: number
  totalCost: number
  favoriteModel: string
  topCategories: string[]
  avgQueriesPerDay: number
}

/** Generate usage heatmap (hour x day-of-week) */
export function generateHeatmap(entries: UsageEntry[]): HeatmapCell[] {
  const grid: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0))
  let maxCount = 0

  for (const entry of entries) {
    const date = new Date(entry.createdAt)
    const day = date.getDay()
    const hour = date.getHours()
    grid[day][hour]++
    maxCount = Math.max(maxCount, grid[day][hour])
  }

  const cells: HeatmapCell[] = []
  for (let day = 0; day < 7; day++) {
    for (let hour = 0; hour < 24; hour++) {
      cells.push({
        hour,
        day,
        count: grid[day][hour],
        intensity: maxCount > 0 ? grid[day][hour] / maxCount : 0,
      })
    }
  }

  return cells
}

/** Forecast monthly cost using linear regression on daily costs */
export function forecastCost(
  entries: UsageEntry[],
  monthlyBudget = 100000,
): CostForecast {
  if (entries.length === 0) {
    return {
      currentMonth: 0,
      projectedMonth: 0,
      dailyAverage: 0,
      trend: 'stable',
      confidence: 0,
      nextMonthEstimate: 0,
      budgetAlert: false,
      budgetUtilization: 0,
    }
  }

  // Group by date
  const dailyCosts = new Map<string, number>()
  const now = new Date()
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  let currentMonthCost = 0

  for (const entry of entries) {
    const dateKey = entry.createdAt.slice(0, 10)
    const cost = entry.cost ?? 0
    dailyCosts.set(dateKey, (dailyCosts.get(dateKey) ?? 0) + cost)

    if (entry.createdAt.startsWith(thisMonth)) {
      currentMonthCost += cost
    }
  }

  const sortedDays = [...dailyCosts.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  const recentDays = sortedDays.slice(-14) // last 2 weeks

  if (recentDays.length === 0) {
    return {
      currentMonth: currentMonthCost,
      projectedMonth: currentMonthCost,
      dailyAverage: 0,
      trend: 'stable',
      confidence: 0,
      nextMonthEstimate: 0,
      budgetAlert: false,
      budgetUtilization: monthlyBudget > 0 ? currentMonthCost / monthlyBudget : 0,
    }
  }

  // Linear regression on recent daily costs
  const n = recentDays.length
  const costs = recentDays.map((d) => d[1])
  const dailyAverage = costs.reduce((a, b) => a + b, 0) / n

  // Slope calculation
  let sumXY = 0
  let sumX2 = 0
  const meanX = (n - 1) / 2

  for (let i = 0; i < n; i++) {
    sumXY += (i - meanX) * (costs[i] - dailyAverage)
    sumX2 += (i - meanX) ** 2
  }

  const slope = sumX2 > 0 ? sumXY / sumX2 : 0

  // Project to month end
  const dayOfMonth = now.getDate()
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const remainingDays = daysInMonth - dayOfMonth
  const projectedMonth = currentMonthCost + dailyAverage * remainingDays

  // Next month estimate
  const nextMonthEstimate = dailyAverage * 30 + slope * 15

  // Trend
  const trend: CostForecast['trend'] =
    slope > dailyAverage * 0.05 ? 'increasing' : slope < -dailyAverage * 0.05 ? 'decreasing' : 'stable'

  // Confidence based on data points
  const confidence = Math.min(n / 14, 1)

  return {
    currentMonth: currentMonthCost,
    projectedMonth: Math.max(0, projectedMonth),
    dailyAverage,
    trend,
    confidence,
    nextMonthEstimate: Math.max(0, nextMonthEstimate),
    budgetAlert: projectedMonth > monthlyBudget * 0.8,
    budgetUtilization: monthlyBudget > 0 ? currentMonthCost / monthlyBudget : 0,
  }
}

/** Calculate model performance benchmarks */
export function benchmarkModels(entries: UsageEntry[]): ModelBenchmark[] {
  const modelMap = new Map<string, { costs: number[]; tokens: number[]; count: number }>()

  for (const entry of entries) {
    const existing = modelMap.get(entry.modelId) ?? { costs: [], tokens: [], count: 0 }
    existing.costs.push(entry.cost ?? 0)
    existing.tokens.push((entry.inputTokens ?? 0) + (entry.outputTokens ?? 0))
    existing.count++
    modelMap.set(entry.modelId, existing)
  }

  return [...modelMap.entries()].map(([modelId, data]) => {
    const avgCost = data.costs.reduce((a, b) => a + b, 0) / data.count
    const avgTokens = data.tokens.reduce((a, b) => a + b, 0) / data.count

    return {
      modelId,
      avgResponseTime: 200 + Math.random() * 300, // placeholder until real timing data
      avgTokensPerQuery: avgTokens,
      avgCostPerQuery: avgCost,
      totalQueries: data.count,
      errorRate: 0.02, // placeholder
      satisfactionScore: 0.85 + Math.random() * 0.1, // placeholder
    }
  }).sort((a, b) => b.totalQueries - a.totalQueries)
}

/** Generate analytics report data for export */
export function generateReport(
  entries: UsageEntry[],
  period: 'weekly' | 'monthly',
): {
  period: string
  totalQueries: number
  totalTokens: number
  totalCost: number
  topModels: { model: string; queries: number; cost: number }[]
  dailyBreakdown: { date: string; queries: number; cost: number }[]
} {
  const now = new Date()
  const cutoff = new Date(now)
  if (period === 'weekly') cutoff.setDate(cutoff.getDate() - 7)
  else cutoff.setMonth(cutoff.getMonth() - 1)

  const filtered = entries.filter((e) => new Date(e.createdAt) >= cutoff)

  const modelCounts = new Map<string, { queries: number; cost: number }>()
  const dailyData = new Map<string, { queries: number; cost: number }>()

  let totalTokens = 0
  let totalCost = 0

  for (const entry of filtered) {
    totalTokens += (entry.inputTokens ?? 0) + (entry.outputTokens ?? 0)
    totalCost += entry.cost ?? 0

    const mc = modelCounts.get(entry.modelId) ?? { queries: 0, cost: 0 }
    mc.queries++
    mc.cost += entry.cost ?? 0
    modelCounts.set(entry.modelId, mc)

    const dateKey = entry.createdAt.slice(0, 10)
    const dd = dailyData.get(dateKey) ?? { queries: 0, cost: 0 }
    dd.queries++
    dd.cost += entry.cost ?? 0
    dailyData.set(dateKey, dd)
  }

  return {
    period: `${cutoff.toISOString().slice(0, 10)} ~ ${now.toISOString().slice(0, 10)}`,
    totalQueries: filtered.length,
    totalTokens,
    totalCost,
    topModels: [...modelCounts.entries()]
      .map(([model, data]) => ({ model, ...data }))
      .sort((a, b) => b.queries - a.queries)
      .slice(0, 5),
    dailyBreakdown: [...dailyData.entries()]
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date)),
  }
}
