import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getStorageEstimate,
  getUsagePercentage,
  isStorageAvailable,
  formatStorageInfo,
  isNearQuota,
  getStorageBreakdown,
  clearStorageType
} from '../storage-quota'

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

    it('handles unavailable StorageManager gracefully', async () => {
      Object.defineProperty(navigator, 'storage', {
        value: undefined,
        writable: true, configurable: true,
      })
      const result = await getStorageEstimate()
      expect(result).toEqual({ usage: 0, quota: 0, usagePercentage: 0 })
    })
  })

  describe('getStorageBreakdown', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('returns per-type storage sizes', async () => {
      // Mock localStorage
      const localStorageMock = {
        length: 2,
        key: vi.fn((i) => ['key1', 'key2'][i]),
        getItem: vi.fn((key) => (key === 'key1' ? 'value1' : 'value2')),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      }
      Object.defineProperty(window, 'localStorage', {
        value: localStorageMock,
        writable: true,
      })

      // Mock sessionStorage
      const sessionStorageMock = {
        length: 1,
        key: vi.fn((i) => (i === 0 ? 'sessionKey' : null)),
        getItem: vi.fn(() => 'sessionValue'),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      }
      Object.defineProperty(window, 'sessionStorage', {
        value: sessionStorageMock,
        writable: true,
      })

      // Mock navigator.storage
      Object.defineProperty(navigator, 'storage', {
        value: {
          estimate: vi.fn().mockResolvedValue({
            usage: 5000,
            usageDetails: { indexedDB: 3000 },
          }),
        },
        writable: true,
        configurable: true,
      })

      const result = await getStorageBreakdown()

      // key1(4) + value1(6) + key2(4) + value2(6) = 20
      expect(result.localStorage).toBe(20)
      // sessionKey(10) + sessionValue(12) = 22
      expect(result.sessionStorage).toBe(22)
      expect(result.indexedDB).toBe(3000)
    })

    it('handles missing storage types', async () => {
      Object.defineProperty(window, 'localStorage', { value: null, writable: true })
      Object.defineProperty(window, 'sessionStorage', { value: null, writable: true })
      Object.defineProperty(navigator, 'storage', { value: undefined, writable: true, configurable: true })

      const result = await getStorageBreakdown()
      expect(result).toEqual({ localStorage: 0, sessionStorage: 0, indexedDB: 0 })
    })
  })

  describe('clearStorageType', () => {
    it('clears localStorage when specified', async () => {
      const clearMock = vi.fn()
      Object.defineProperty(window, 'localStorage', {
        value: { clear: clearMock },
        writable: true,
      })

      await clearStorageType('localStorage')
      expect(clearMock).toHaveBeenCalled()
    })

    it('clears sessionStorage when specified', async () => {
      const clearMock = vi.fn()
      Object.defineProperty(window, 'sessionStorage', {
        value: { clear: clearMock },
        writable: true,
      })

      await clearStorageType('sessionStorage')
      expect(clearMock).toHaveBeenCalled()
    })

    it('clears all IndexedDB databases when specified', async () => {
      const deleteDBMock = vi.fn().mockResolvedValue(undefined)
      Object.defineProperty(window, 'indexedDB', {
        value: {
          databases: vi.fn().mockResolvedValue([{ name: 'db1' }, { name: 'db2' }]),
          deleteDatabase: deleteDBMock,
        },
        writable: true,
      })

      await clearStorageType('indexedDB')
      expect(deleteDBMock).toHaveBeenCalledWith('db1')
      expect(deleteDBMock).toHaveBeenCalledWith('db2')
    })

    it('handles errors gracefully', async () => {
      Object.defineProperty(window, 'localStorage', {
        value: {
          clear: vi.fn().mockImplementation(() => {
            throw new Error('Clear failed')
          }),
        },
        writable: true,
      })

      await expect(clearStorageType('localStorage')).resolves.toBeUndefined()
    })
  })
})
