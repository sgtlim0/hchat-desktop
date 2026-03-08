import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { isToday, isYesterday, isSameDay, addDays, startOfDay, endOfDay, formatRelative, daysBetween } from '../date-utils'

describe('date-utils', () => {
  describe('isToday', () => {
    it('returns true for today', () => {
      expect(isToday(new Date())).toBe(true)
    })
    it('returns false for yesterday', () => {
      const y = new Date()
      y.setDate(y.getDate() - 1)
      expect(isToday(y)).toBe(false)
    })
  })

  describe('isYesterday', () => {
    it('detects yesterday', () => {
      const y = new Date()
      y.setDate(y.getDate() - 1)
      expect(isYesterday(y)).toBe(true)
    })
    it('today is not yesterday', () => {
      expect(isYesterday(new Date())).toBe(false)
    })
  })

  describe('isSameDay', () => {
    it('same day returns true', () => {
      expect(isSameDay(new Date(2026, 2, 8, 10), new Date(2026, 2, 8, 22))).toBe(true)
    })
    it('different day returns false', () => {
      expect(isSameDay(new Date(2026, 2, 8), new Date(2026, 2, 9))).toBe(false)
    })
  })

  describe('addDays', () => {
    it('adds days', () => {
      expect(addDays(new Date(2026, 0, 1), 5).getDate()).toBe(6)
    })
    it('subtracts days', () => {
      expect(addDays(new Date(2026, 0, 10), -3).getDate()).toBe(7)
    })
    it('immutable', () => {
      const d = new Date(2026, 0, 1)
      addDays(d, 5)
      expect(d.getDate()).toBe(1)
    })
  })

  describe('startOfDay', () => {
    it('zeros time', () => {
      const r = startOfDay(new Date(2026, 2, 8, 15, 30))
      expect(r.getHours()).toBe(0)
      expect(r.getMinutes()).toBe(0)
    })
  })

  describe('endOfDay', () => {
    it('sets to 23:59:59', () => {
      const r = endOfDay(new Date(2026, 2, 8))
      expect(r.getHours()).toBe(23)
      expect(r.getMinutes()).toBe(59)
    })
  })

  describe('formatRelative', () => {
    beforeEach(() => vi.useFakeTimers())
    afterEach(() => vi.useRealTimers())

    it('just now', () => {
      vi.setSystemTime(new Date(2026, 2, 8, 12, 0, 30))
      expect(formatRelative(new Date(2026, 2, 8, 12, 0, 0))).toBe('just now')
    })
    it('minutes ago', () => {
      vi.setSystemTime(new Date(2026, 2, 8, 12, 5, 0))
      expect(formatRelative(new Date(2026, 2, 8, 12, 0, 0))).toBe('5m ago')
    })
    it('hours ago', () => {
      vi.setSystemTime(new Date(2026, 2, 8, 14, 0, 0))
      expect(formatRelative(new Date(2026, 2, 8, 12, 0, 0))).toBe('2h ago')
    })
    it('yesterday', () => {
      vi.setSystemTime(new Date(2026, 2, 9, 12, 0, 0))
      expect(formatRelative(new Date(2026, 2, 8, 12, 0, 0))).toBe('yesterday')
    })
  })

  describe('daysBetween', () => {
    it('correct count', () => {
      expect(daysBetween(new Date(2026, 0, 1), new Date(2026, 0, 11))).toBe(10)
    })
    it('is absolute', () => {
      expect(daysBetween(new Date(2026, 0, 11), new Date(2026, 0, 1))).toBe(10)
    })
  })
})
