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
})
