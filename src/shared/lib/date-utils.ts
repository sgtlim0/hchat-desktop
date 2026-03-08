export function isToday(date: Date): boolean {
  const now = new Date()
  return isSameDay(date, now)
}

export function isYesterday(date: Date): boolean {
  const yesterday = addDays(new Date(), -1)
  return isSameDay(date, yesterday)
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

export function startOfDay(date: Date): Date {
  const result = new Date(date)
  result.setHours(0, 0, 0, 0)
  return result
}

export function endOfDay(date: Date): Date {
  const result = new Date(date)
  result.setHours(23, 59, 59, 999)
  return result
}

export function formatRelative(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)

  if (seconds < 60) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`

  // Check if it's yesterday
  if (isYesterday(date)) return 'yesterday'

  // Format as date for older dates
  const month = date.toLocaleDateString('en-US', { month: 'short' })
  const day = date.getDate()
  const year = date.getFullYear()
  const currentYear = now.getFullYear()

  // Same year: "Mar 8"
  if (year === currentYear) {
    return `${month} ${day}`
  }

  // Different year: "Mar 8, 2023"
  return `${month} ${day}, ${year}`
}

export function daysBetween(a: Date, b: Date): number {
  const msPerDay = 86400000
  const startA = startOfDay(a).getTime()
  const startB = startOfDay(b).getTime()
  return Math.round(Math.abs(startA - startB) / msPerDay)
}
