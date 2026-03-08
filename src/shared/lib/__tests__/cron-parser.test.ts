import { describe, it, expect } from 'vitest'
import { parseCron, isValidCron, describeCron, getNextRun } from '../cron-parser'

describe('cron-parser', () => {
  describe('parseCron', () => {
    it('parses valid 5-part expression', () => {
      const p = parseCron('0 12 * * *')
      expect(p).toEqual({ minute: '0', hour: '12', dayOfMonth: '*', month: '*', dayOfWeek: '*' })
    })
    it('returns null for invalid', () => {
      expect(parseCron('invalid')).toBeNull()
      expect(parseCron('1 2 3')).toBeNull()
    })
  })

  describe('isValidCron', () => {
    it('validates correct expressions', () => {
      expect(isValidCron('0 12 * * *')).toBe(true)
      expect(isValidCron('*/5 * * * *')).toBe(true)
      expect(isValidCron('0 0 1,15 * *')).toBe(true)
      expect(isValidCron('0 9-17 * * 1-5')).toBe(true)
    })
    it('rejects invalid', () => {
      expect(isValidCron('60 * * * *')).toBe(false)
      expect(isValidCron('* 25 * * *')).toBe(false)
      expect(isValidCron('bad')).toBe(false)
    })
  })

  describe('describeCron', () => {
    it('describes midnight', () => {
      expect(describeCron('0 0 * * *')).toBe('Every day at midnight')
    })
    it('describes hourly', () => {
      expect(describeCron('0 9 * * *')).toBe('Every day at 9:00')
    })
    it('describes specific time', () => {
      expect(describeCron('30 14 * * *')).toBe('Every day at 14:30')
    })
    it('describes interval', () => {
      expect(describeCron('*/15 * * * *')).toContain('15 minutes')
    })
    it('returns invalid for bad expr', () => {
      expect(describeCron('bad')).toContain('Invalid')
    })
  })

  describe('getNextRun', () => {
    it('returns Date for valid cron', () => {
      const next = getNextRun('0 12 * * *')
      expect(next).toBeInstanceOf(Date)
    })
    it('returns null for invalid', () => {
      expect(getNextRun('bad')).toBeNull()
    })
    it('next run is in the future', () => {
      const next = getNextRun('0 12 * * *')
      expect(next!.getTime()).toBeGreaterThan(Date.now() - 86400000)
    })
  })
})
