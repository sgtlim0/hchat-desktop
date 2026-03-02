import type { UsageEntry } from '@/shared/types'

interface DailyUsage {
  date: string
  cost: number
  requests: number
}

interface WeeklyUsage {
  weekStart: string
  cost: number
  requests: number
}

export function groupByDate(entries: UsageEntry[]): DailyUsage[] {
  const map = new Map<string, { cost: number; requests: number }>()

  for (const entry of entries) {
    const date = entry.createdAt.slice(0, 10) // YYYY-MM-DD
    const existing = map.get(date) ?? { cost: 0, requests: 0 }
    map.set(date, {
      cost: existing.cost + entry.cost,
      requests: existing.requests + 1,
    })
  }

  return Array.from(map.entries())
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

export function groupByWeek(entries: UsageEntry[]): WeeklyUsage[] {
  const map = new Map<string, { cost: number; requests: number }>()

  for (const entry of entries) {
    const date = new Date(entry.createdAt)
    const dayOfWeek = date.getDay()
    const weekStart = new Date(date)
    weekStart.setDate(date.getDate() - dayOfWeek)
    const key = weekStart.toISOString().slice(0, 10)

    const existing = map.get(key) ?? { cost: 0, requests: 0 }
    map.set(key, {
      cost: existing.cost + entry.cost,
      requests: existing.requests + 1,
    })
  }

  return Array.from(map.entries())
    .map(([weekStart, data]) => ({ weekStart, ...data }))
    .sort((a, b) => a.weekStart.localeCompare(b.weekStart))
}

export function getLast30Days(entries: UsageEntry[]): UsageEntry[] {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 30)
  const cutoffStr = cutoff.toISOString()

  return entries.filter((e) => e.createdAt >= cutoffStr)
}
