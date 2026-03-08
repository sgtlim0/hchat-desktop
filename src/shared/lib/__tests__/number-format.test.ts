import { describe, it, expect } from 'vitest'
import {
  formatCompact,
  formatCurrency,
  formatPercent,
  formatBytes,
  formatDuration,
  clamp,
  roundTo,
} from '../number-format'

describe('number-format', () => {
  describe('formatCompact', () => {
    it('returns number as-is below 1000', () => {
      expect(formatCompact(500)).toBe('500')
      expect(formatCompact(0)).toBe('0')
    })

    it('formats thousands as K', () => {
      expect(formatCompact(1500)).toBe('1.5K')
      expect(formatCompact(10000)).toBe('10.0K')
    })

    it('formats millions as M', () => {
      expect(formatCompact(2500000)).toBe('2.5M')
    })

    it('formats billions as B', () => {
      expect(formatCompact(1000000000)).toBe('1.0B')
    })

    it('handles negative numbers', () => {
      expect(formatCompact(-500)).toBe('-500')
      expect(formatCompact(-1500)).toBe('-1.5K')
    })
  })

  describe('formatCurrency', () => {
    it('formats USD by default', () => {
      expect(formatCurrency(10.5)).toBe('$10.50')
    })

    it('formats zero', () => {
      expect(formatCurrency(0)).toBe('$0.00')
    })
  })

  describe('formatPercent', () => {
    it('converts ratio to percent', () => {
      expect(formatPercent(0.5)).toBe('50.0%')
      expect(formatPercent(1)).toBe('100.0%')
    })

    it('respects decimal places', () => {
      expect(formatPercent(0.333, 2)).toBe('33.30%')
      expect(formatPercent(0.5, 0)).toBe('50%')
    })
  })

  describe('formatBytes', () => {
    it('formats bytes', () => {
      expect(formatBytes(0)).toBe('0 B')
      expect(formatBytes(500)).toBe('500 B')
    })

    it('formats kilobytes', () => {
      expect(formatBytes(1024)).toBe('1.0 KB')
      expect(formatBytes(2048)).toBe('2.0 KB')
    })

    it('formats megabytes', () => {
      expect(formatBytes(1048576)).toBe('1.0 MB')
    })

    it('formats gigabytes', () => {
      expect(formatBytes(1073741824)).toBe('1.0 GB')
    })
  })

  describe('formatDuration', () => {
    it('formats milliseconds', () => {
      expect(formatDuration(500)).toBe('500ms')
    })

    it('formats seconds', () => {
      expect(formatDuration(2500)).toBe('2.5s')
    })

    it('formats minutes and seconds', () => {
      expect(formatDuration(90000)).toBe('1m 30s')
    })

    it('formats hours and minutes', () => {
      expect(formatDuration(3660000)).toBe('1h 1m')
    })
  })

  describe('clamp', () => {
    it('clamps below min', () => {
      expect(clamp(-5, 0, 100)).toBe(0)
    })

    it('clamps above max', () => {
      expect(clamp(150, 0, 100)).toBe(100)
    })

    it('returns value within range', () => {
      expect(clamp(50, 0, 100)).toBe(50)
    })
  })

  describe('roundTo', () => {
    it('rounds to decimal places', () => {
      expect(roundTo(3.14159, 2)).toBe(3.14)
      expect(roundTo(3.14159, 0)).toBe(3)
      expect(roundTo(3.145, 2)).toBe(3.15)
    })
  })
})
