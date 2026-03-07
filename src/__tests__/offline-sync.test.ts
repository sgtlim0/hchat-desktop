import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  enqueue,
  getQueue,
  clearQueue,
  removeFromQueue,
  processQueue,
  getSyncStatus,
  setOnlineStatus,
  onSyncStatusChange,
  resolveConflict,
  formatBytes,
} from '@/shared/lib/offline-sync'

describe('offline-sync', () => {
  beforeEach(() => {
    clearQueue()
    setOnlineStatus(true)
  })

  describe('enqueue', () => {
    it('should add item to queue', () => {
      const id = enqueue({ url: '/api/test', method: 'POST', body: '{}', maxRetries: 3 })
      expect(id).toBeTruthy()
      expect(getQueue()).toHaveLength(1)
      expect(getQueue()[0].status).toBe('pending')
    })

    it('should generate unique IDs', () => {
      const id1 = enqueue({ url: '/api/a', method: 'GET', maxRetries: 3 })
      const id2 = enqueue({ url: '/api/b', method: 'GET', maxRetries: 3 })
      expect(id1).not.toBe(id2)
    })

    it('should set createdAt timestamp', () => {
      enqueue({ url: '/api/test', method: 'GET', maxRetries: 3 })
      expect(getQueue()[0].createdAt).toBeTruthy()
    })
  })

  describe('removeFromQueue', () => {
    it('should remove item by ID', () => {
      const id = enqueue({ url: '/api/test', method: 'GET', maxRetries: 3 })
      expect(removeFromQueue(id)).toBe(true)
      expect(getQueue()).toHaveLength(0)
    })

    it('should return false for non-existent ID', () => {
      expect(removeFromQueue('non-existent')).toBe(false)
    })
  })

  describe('clearQueue', () => {
    it('should remove all items', () => {
      enqueue({ url: '/api/a', method: 'GET', maxRetries: 3 })
      enqueue({ url: '/api/b', method: 'GET', maxRetries: 3 })
      clearQueue()
      expect(getQueue()).toHaveLength(0)
    })
  })

  describe('processQueue', () => {
    it('should not process when offline', async () => {
      setOnlineStatus(false)
      enqueue({ url: '/api/test', method: 'POST', maxRetries: 3 })
      const result = await processQueue()
      expect(result.succeeded).toBe(0)
      expect(getQueue()).toHaveLength(1)
    })

    it('should process when online', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('ok'))
      enqueue({ url: '/api/test', method: 'POST', maxRetries: 3 })
      const result = await processQueue()
      expect(result.succeeded).toBe(1)
      expect(getQueue()).toHaveLength(0)
      vi.restoreAllMocks()
    })

    it('should retry on failure', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network error'))
      enqueue({ url: '/api/test', method: 'POST', maxRetries: 3 })
      const result = await processQueue()
      expect(result.failed).toBe(0) // not yet max retries
      expect(getQueue()[0].retries).toBe(1)
      expect(getQueue()[0].status).toBe('pending')
      vi.restoreAllMocks()
    })

    it('should mark as failed after max retries', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('fail'))
      enqueue({ url: '/api/test', method: 'POST', maxRetries: 1 })
      await processQueue()
      expect(getQueue()[0].status).toBe('failed')
      vi.restoreAllMocks()
    })

    it('should update lastSyncAt after processing', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('ok'))
      enqueue({ url: '/api/test', method: 'GET', maxRetries: 1 })
      await processQueue()
      expect(getSyncStatus().lastSyncAt).toBeTruthy()
      vi.restoreAllMocks()
    })
  })

  describe('getSyncStatus', () => {
    it('should report online status', () => {
      setOnlineStatus(true)
      expect(getSyncStatus().isOnline).toBe(true)
    })

    it('should report pending count', () => {
      enqueue({ url: '/api/a', method: 'GET', maxRetries: 3 })
      enqueue({ url: '/api/b', method: 'GET', maxRetries: 3 })
      expect(getSyncStatus().pendingCount).toBe(2)
    })
  })

  describe('onSyncStatusChange', () => {
    it('should notify listeners on status change', () => {
      const callback = vi.fn()
      const unsubscribe = onSyncStatusChange(callback)

      enqueue({ url: '/api/test', method: 'GET', maxRetries: 1 })
      expect(callback).toHaveBeenCalled()
      expect(callback.mock.calls[0][0].pendingCount).toBe(1)

      unsubscribe()
    })

    it('should stop notifying after unsubscribe', () => {
      const callback = vi.fn()
      const unsubscribe = onSyncStatusChange(callback)
      unsubscribe()

      enqueue({ url: '/api/test', method: 'GET', maxRetries: 1 })
      expect(callback).not.toHaveBeenCalled()
    })
  })

  describe('resolveConflict', () => {
    it('should pick local when newer (last-write-wins)', () => {
      const result = resolveConflict(
        { updatedAt: '2026-03-08T10:00:00Z', data: { text: 'local' } },
        { updatedAt: '2026-03-08T09:00:00Z', data: { text: 'remote' } },
      )
      expect(result.winner).toBe('local')
      expect(result.data).toEqual({ text: 'local' })
    })

    it('should pick remote when newer', () => {
      const result = resolveConflict(
        { updatedAt: '2026-03-08T09:00:00Z', data: { text: 'local' } },
        { updatedAt: '2026-03-08T10:00:00Z', data: { text: 'remote' } },
      )
      expect(result.winner).toBe('remote')
    })

    it('should pick local when timestamps equal', () => {
      const result = resolveConflict(
        { updatedAt: '2026-03-08T10:00:00Z', data: 'A' },
        { updatedAt: '2026-03-08T10:00:00Z', data: 'B' },
      )
      expect(result.winner).toBe('local')
    })
  })

  describe('formatBytes', () => {
    it('should format 0 bytes', () => {
      expect(formatBytes(0)).toBe('0 B')
    })

    it('should format KB', () => {
      expect(formatBytes(1024)).toBe('1.0 KB')
    })

    it('should format MB', () => {
      expect(formatBytes(1024 * 1024)).toBe('1.0 MB')
    })

    it('should format GB', () => {
      expect(formatBytes(1024 * 1024 * 1024)).toBe('1.0 GB')
    })

    it('should format with decimals', () => {
      expect(formatBytes(1536)).toBe('1.5 KB')
    })
  })
})
