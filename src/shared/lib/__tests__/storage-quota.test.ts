import { describe, it, expect, vi } from 'vitest'
import { getStorageEstimate, getUsagePercentage, isStorageAvailable, formatStorageInfo, isNearQuota } from '../storage-quota'

describe('storage-quota', () => {
  describe('getUsagePercentage', () => {
    it('calculates correctly', () => {
      expect(getUsagePercentage(50, 100)).toBe(50)
    })
    it('returns 0 for zero quota', () => {
      expect(getUsagePercentage(50, 0)).toBe(0)
    })
  })

  describe('isStorageAvailable', () => {
    it('localStorage available', () => {
      expect(isStorageAvailable('localStorage')).toBe(true)
    })
    it('sessionStorage available', () => {
      expect(isStorageAvailable('sessionStorage')).toBe(true)
    })
  })

  describe('formatStorageInfo', () => {
    it('formats small sizes', () => {
      const result = formatStorageInfo({ usage: 500, quota: 1024, usagePercentage: 48.83 })
      expect(result).toContain('500 B')
      expect(result).toContain('48.83%')
    })
    it('formats MB sizes', () => {
      const result = formatStorageInfo({ usage: 52428800, quota: 104857600, usagePercentage: 50 })
      expect(result).toContain('50.0 MB')
    })
  })

  describe('isNearQuota', () => {
    it('true above 90%', () => {
      expect(isNearQuota({ usage: 95, quota: 100, usagePercentage: 95 })).toBe(true)
    })
    it('false below 90%', () => {
      expect(isNearQuota({ usage: 50, quota: 100, usagePercentage: 50 })).toBe(false)
    })
    it('custom threshold', () => {
      expect(isNearQuota({ usage: 80, quota: 100, usagePercentage: 80 }, 75)).toBe(true)
    })
  })

  describe('getStorageEstimate', () => {
    it('returns estimate', async () => {
      Object.defineProperty(navigator, 'storage', {
        value: { estimate: vi.fn(() => Promise.resolve({ usage: 1000, quota: 50000 })) },
        writable: true, configurable: true,
      })
      const est = await getStorageEstimate()
      expect(est.usage).toBe(1000)
      expect(est.quota).toBe(50000)
    })
  })
})
