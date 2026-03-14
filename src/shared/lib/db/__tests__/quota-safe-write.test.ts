import { describe, it, expect, vi } from 'vitest'
import { quotaSafeAdd, quotaSafePut, quotaSafeBulkPut, getStorageEstimate } from '../quota-safe-write'
import { HChatError } from '@/shared/lib/errors/hchat-error'

function mockTable(overrides: Partial<{ add: unknown; put: unknown; bulkPut: unknown }> = {}) {
  return {
    add: vi.fn().mockResolvedValue(undefined),
    put: vi.fn().mockResolvedValue(undefined),
    bulkPut: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  } as never
}

function quotaError() {
  const err = new DOMException('QuotaExceededError', 'QuotaExceededError')
  return err
}

function dexieWrappedQuotaError() {
  return { inner: { name: 'QuotaExceededError' } }
}

describe('quotaSafeAdd', () => {
  it('should add data successfully', async () => {
    const table = mockTable()
    await quotaSafeAdd(table, { id: '1', name: 'test' })
    expect(table.add).toHaveBeenCalledWith({ id: '1', name: 'test' })
  })

  it('should throw HChatError on QuotaExceededError', async () => {
    const table = mockTable({ add: vi.fn().mockRejectedValue(quotaError()) })

    await expect(quotaSafeAdd(table, { id: '1' })).rejects.toThrow(HChatError)
    try {
      await quotaSafeAdd(table, { id: '1' })
    } catch (e) {
      expect((e as HChatError).code).toBe('STORAGE_QUOTA_EXCEEDED')
    }
  })

  it('should detect Dexie-wrapped QuotaExceededError', async () => {
    const table = mockTable({ add: vi.fn().mockRejectedValue(dexieWrappedQuotaError()) })

    await expect(quotaSafeAdd(table, { id: '1' })).rejects.toThrow(HChatError)
  })

  it('should re-throw non-quota errors', async () => {
    const table = mockTable({ add: vi.fn().mockRejectedValue(new Error('other')) })

    await expect(quotaSafeAdd(table, { id: '1' })).rejects.toThrow('other')
  })
})

describe('quotaSafePut', () => {
  it('should put data successfully', async () => {
    const table = mockTable()
    await quotaSafePut(table, { id: '1' })
    expect(table.put).toHaveBeenCalled()
  })

  it('should throw HChatError on quota error', async () => {
    const table = mockTable({ put: vi.fn().mockRejectedValue(quotaError()) })
    await expect(quotaSafePut(table, { id: '1' })).rejects.toThrow(HChatError)
  })
})

describe('quotaSafeBulkPut', () => {
  it('should bulk put data successfully', async () => {
    const table = mockTable()
    await quotaSafeBulkPut(table, [{ id: '1' }, { id: '2' }])
    expect(table.bulkPut).toHaveBeenCalledWith([{ id: '1' }, { id: '2' }])
  })

  it('should throw HChatError on quota error', async () => {
    const table = mockTable({ bulkPut: vi.fn().mockRejectedValue(quotaError()) })
    await expect(quotaSafeBulkPut(table, [{ id: '1' }])).rejects.toThrow(HChatError)
  })
})

describe('getStorageEstimate', () => {
  it('should return storage estimate', async () => {
    vi.stubGlobal('navigator', {
      storage: {
        estimate: vi.fn().mockResolvedValue({ usage: 500_000, quota: 1_000_000 }),
      },
    })

    const result = await getStorageEstimate()
    expect(result.usageBytes).toBe(500_000)
    expect(result.quotaBytes).toBe(1_000_000)
    expect(result.usagePercent).toBe(50)
  })

  it('should return zeros when storage API unavailable', async () => {
    vi.stubGlobal('navigator', { storage: {} })

    const result = await getStorageEstimate()
    expect(result.usageBytes).toBe(0)
    expect(result.usagePercent).toBe(0)
  })
})
