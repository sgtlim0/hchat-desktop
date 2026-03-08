export interface CronParts {
  minute: string
  hour: string
  dayOfMonth: string
  month: string
  dayOfWeek: string
}

export function parseCron(expression: string): CronParts | null {
  const parts = expression.trim().split(/\s+/)
  if (parts.length !== 5) return null
  return {
    minute: parts[0],
    hour: parts[1],
    dayOfMonth: parts[2],
    month: parts[3],
    dayOfWeek: parts[4],
  }
}

export function isValidCron(expression: string): boolean {
  const parts = parseCron(expression)
  if (!parts) return false
  const ranges: Record<string, [number, number]> = {
    minute: [0, 59], hour: [0, 23], dayOfMonth: [1, 31], month: [1, 12], dayOfWeek: [0, 7],
  }
  for (const [key, [min, max]] of Object.entries(ranges)) {
    const val = parts[key as keyof CronParts]
    if (val === '*') continue
    if (val.includes('/')) {
      const [, step] = val.split('/')
      if (isNaN(Number(step))) return false
      continue
    }
    if (val.includes(',')) {
      if (val.split(',').some((v) => isNaN(Number(v)) || Number(v) < min || Number(v) > max)) return false
      continue
    }
    if (val.includes('-')) {
      const [a, b] = val.split('-').map(Number)
      if (isNaN(a) || isNaN(b) || a < min || b > max) return false
      continue
    }
    const num = Number(val)
    if (isNaN(num) || num < min || num > max) return false
  }
  return true
}

export function describeCron(expression: string): string {
  const parts = parseCron(expression)
  if (!parts) return 'Invalid cron expression'

  const { minute, hour, dayOfMonth, month, dayOfWeek } = parts

  if (minute === '0' && hour === '0' && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') return 'Every day at midnight'
  if (minute === '0' && hour !== '*' && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') return `Every day at ${hour}:00`
  if (minute !== '*' && hour !== '*' && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') return `Every day at ${hour}:${minute.padStart(2, '0')}`
  if (minute.includes('/')) return `Every ${minute.split('/')[1]} minutes`
  if (hour.includes('/')) return `Every ${hour.split('/')[1]} hours`

  return `${minute} ${hour} ${dayOfMonth} ${month} ${dayOfWeek}`
}

export function getNextRun(expression: string): Date | null {
  if (!isValidCron(expression)) return null
  const parts = parseCron(expression)!
  const now = new Date()
  const next = new Date(now)

  if (parts.minute !== '*') next.setMinutes(Number(parts.minute.split('/')[0]) || 0)
  if (parts.hour !== '*') next.setHours(Number(parts.hour.split('/')[0]) || 0)
  next.setSeconds(0, 0)

  if (next <= now) next.setDate(next.getDate() + 1)
  return next
}
