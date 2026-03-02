import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getRelativeTime, getGreeting, getDateGroup } from '../time'

describe('getRelativeTime', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-02T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns 방금 전 for less than 60 seconds', () => {
    const result = getRelativeTime('2026-03-02T11:59:30Z')
    expect(result).toBe('방금 전')
  })

  it('returns minutes ago', () => {
    const result = getRelativeTime('2026-03-02T11:55:00Z')
    expect(result).toBe('5분 전')
  })

  it('returns hours ago', () => {
    const result = getRelativeTime('2026-03-02T09:00:00Z')
    expect(result).toBe('3시간 전')
  })

  it('returns days ago', () => {
    const result = getRelativeTime('2026-02-28T12:00:00Z')
    expect(result).toBe('2일 전')
  })

  it('returns weeks ago', () => {
    const result = getRelativeTime('2026-02-16T12:00:00Z')
    expect(result).toBe('2주 전')
  })

  it('returns months ago', () => {
    const result = getRelativeTime('2025-12-02T12:00:00Z')
    expect(result).toBe('3개월 전')
  })

  it('returns years ago', () => {
    const result = getRelativeTime('2024-03-02T12:00:00Z')
    expect(result).toBe('2년 전')
  })

  it('uses t function when provided', () => {
    const t = vi.fn((key: string) => `translated:${key}`)
    getRelativeTime('2026-03-02T11:55:00Z', t)
    expect(t).toHaveBeenCalledWith('time.minutesAgo', { n: 5 })
  })

  it('returns translated "just now" for less than 60 seconds', () => {
    const t = vi.fn((key: string) => key === 'time.justNow' ? 'just now' : key)
    const result = getRelativeTime('2026-03-02T11:59:30Z', t)
    expect(result).toBe('just now')
    expect(t).toHaveBeenCalledWith('time.justNow')
  })

  it('returns translated hours ago with t function', () => {
    const t = vi.fn((_key: string, params?: any) => `${params?.n} hours ago`)
    const result = getRelativeTime('2026-03-02T09:00:00Z', t)
    expect(result).toBe('3 hours ago')
    expect(t).toHaveBeenCalledWith('time.hoursAgo', { n: 3 })
  })

  it('returns translated days ago with t function', () => {
    const t = vi.fn((_key: string, params?: any) => `${params?.n} days ago`)
    const result = getRelativeTime('2026-02-28T12:00:00Z', t)
    expect(result).toBe('2 days ago')
    expect(t).toHaveBeenCalledWith('time.daysAgo', { n: 2 })
  })

  it('returns translated weeks ago with t function', () => {
    const t = vi.fn((_key: string, params?: any) => `${params?.n} weeks ago`)
    const result = getRelativeTime('2026-02-16T12:00:00Z', t)
    expect(result).toBe('2 weeks ago')
    expect(t).toHaveBeenCalledWith('time.weeksAgo', { n: 2 })
  })

  it('returns translated months ago with t function', () => {
    const t = vi.fn((_key: string, params?: any) => `${params?.n} months ago`)
    const result = getRelativeTime('2025-12-02T12:00:00Z', t)
    expect(result).toBe('3 months ago')
    expect(t).toHaveBeenCalledWith('time.monthsAgo', { n: 3 })
  })

  it('returns translated years ago with t function', () => {
    const t = vi.fn((_key: string, params?: any) => `${params?.n} years ago`)
    const result = getRelativeTime('2024-03-02T12:00:00Z', t)
    expect(result).toBe('2 years ago')
    expect(t).toHaveBeenCalledWith('time.yearsAgo', { n: 2 })
  })
})

describe('getGreeting', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns morning greeting between 6-12', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-02T08:00:00'))
    const result = getGreeting()
    expect(result.title).toContain('아침')
  })

  it('returns afternoon greeting between 12-18', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-02T14:00:00'))
    const result = getGreeting()
    expect(result.title).toContain('오후')
  })

  it('returns evening greeting after 18', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-02T20:00:00'))
    const result = getGreeting()
    expect(result.title).toContain('저녁')
  })

  it('uses t function when provided', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-02T08:00:00'))
    const t = vi.fn((key: string) => `translated:${key}`)
    getGreeting(t)
    expect(t).toHaveBeenCalledWith('greeting.morning')
  })

  it('returns translated afternoon greeting with t function', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-02T14:00:00'))
    const t = vi.fn((key: string) => key === 'greeting.afternoon' ? 'Good afternoon' : 'Subtitle')
    const result = getGreeting(t)
    expect(result.title).toBe('Good afternoon')
    expect(t).toHaveBeenCalledWith('greeting.afternoon')
  })

  it('returns translated evening greeting with t function', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-02T20:00:00'))
    const t = vi.fn((key: string) => key === 'greeting.evening' ? 'Good evening' : 'Subtitle')
    const result = getGreeting(t)
    expect(result.title).toBe('Good evening')
    expect(t).toHaveBeenCalledWith('greeting.evening')
  })
})

describe('getDateGroup', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-02T12:00:00'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns 오늘 for today', () => {
    expect(getDateGroup('2026-03-02T08:00:00')).toBe('오늘')
  })

  it('returns 어제 for yesterday', () => {
    expect(getDateGroup('2026-03-01T08:00:00')).toBe('어제')
  })

  it('returns 이번 주 for this week', () => {
    expect(getDateGroup('2026-02-27T08:00:00')).toBe('이번 주')
  })

  it('returns 이번 달 for this month', () => {
    expect(getDateGroup('2026-02-15T08:00:00')).toBe('이번 달')
  })

  it('returns 이전 for older dates', () => {
    expect(getDateGroup('2025-12-01T08:00:00')).toBe('이전')
  })

  it('returns translated "today" with t function', () => {
    const t = vi.fn((key: string) => key === 'time.today' ? 'Today' : key)
    const result = getDateGroup('2026-03-02T08:00:00', t)
    expect(result).toBe('Today')
    expect(t).toHaveBeenCalledWith('time.today')
  })

  it('returns translated "yesterday" with t function', () => {
    const t = vi.fn((key: string) => key === 'time.yesterday' ? 'Yesterday' : key)
    const result = getDateGroup('2026-03-01T08:00:00', t)
    expect(result).toBe('Yesterday')
    expect(t).toHaveBeenCalledWith('time.yesterday')
  })

  it('returns translated "this week" with t function', () => {
    const t = vi.fn((key: string) => key === 'time.thisWeek' ? 'This week' : key)
    const result = getDateGroup('2026-02-27T08:00:00', t)
    expect(result).toBe('This week')
    expect(t).toHaveBeenCalledWith('time.thisWeek')
  })

  it('returns translated "this month" with t function', () => {
    const t = vi.fn((key: string) => key === 'time.thisMonth' ? 'This month' : key)
    const result = getDateGroup('2026-02-15T08:00:00', t)
    expect(result).toBe('This month')
    expect(t).toHaveBeenCalledWith('time.thisMonth')
  })

  it('returns translated "earlier" with t function', () => {
    const t = vi.fn((key: string) => key === 'time.earlier' ? 'Earlier' : key)
    const result = getDateGroup('2025-12-01T08:00:00', t)
    expect(result).toBe('Earlier')
    expect(t).toHaveBeenCalledWith('time.earlier')
  })
})
