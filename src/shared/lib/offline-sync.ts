/**
 * Offline Sync Engine — Queue API calls when offline, replay on reconnect.
 * Provides connectivity detection, sync queue, and conflict resolution.
 */

export interface SyncQueueItem {
  id: string
  url: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  body?: string
  headers?: Record<string, string>
  createdAt: string
  retries: number
  maxRetries: number
  status: 'pending' | 'syncing' | 'failed' | 'completed'
}

export interface SyncStatus {
  isOnline: boolean
  pendingCount: number
  lastSyncAt: string | null
  isSyncing: boolean
}

export interface ConflictResolution {
  strategy: 'last-write-wins' | 'manual' | 'merge'
  localVersion: string
  remoteVersion?: string
  resolvedAt?: string
}

export interface StorageQuota {
  used: number
  available: number
  utilization: number
  warning: boolean
}

let queue: SyncQueueItem[] = []
let syncStatus: SyncStatus = {
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  pendingCount: 0,
  lastSyncAt: null,
  isSyncing: false,
}
const listeners: Set<(status: SyncStatus) => void> = new Set()

function notifyListeners() {
  syncStatus = { ...syncStatus, pendingCount: queue.filter((i) => i.status === 'pending').length }
  for (const listener of listeners) {
    listener(syncStatus)
  }
}

/** Subscribe to sync status changes */
export function onSyncStatusChange(callback: (status: SyncStatus) => void): () => void {
  listeners.add(callback)
  return () => listeners.delete(callback)
}

/** Get current sync status */
export function getSyncStatus(): SyncStatus {
  return { ...syncStatus }
}

/** Add an API call to the sync queue */
export function enqueue(item: Omit<SyncQueueItem, 'id' | 'createdAt' | 'retries' | 'status'>): string {
  const id = `sync-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
  queue.push({
    ...item,
    id,
    createdAt: new Date().toISOString(),
    retries: 0,
    status: 'pending',
  })
  notifyListeners()
  return id
}

/** Process all pending items in the queue */
export async function processQueue(): Promise<{ succeeded: number; failed: number }> {
  if (syncStatus.isSyncing) return { succeeded: 0, failed: 0 }
  if (!syncStatus.isOnline) return { succeeded: 0, failed: 0 }

  syncStatus = { ...syncStatus, isSyncing: true }
  notifyListeners()

  let succeeded = 0
  let failed = 0
  const pending = queue.filter((i) => i.status === 'pending')

  for (const item of pending) {
    item.status = 'syncing'
    try {
      await fetch(item.url, {
        method: item.method,
        headers: item.headers ? { ...item.headers } : undefined,
        body: item.body,
      })
      item.status = 'completed'
      succeeded++
    } catch {
      item.retries++
      if (item.retries >= item.maxRetries) {
        item.status = 'failed'
        failed++
      } else {
        item.status = 'pending'
      }
    }
  }

  // Clean completed items
  queue = queue.filter((i) => i.status !== 'completed')

  syncStatus = {
    ...syncStatus,
    isSyncing: false,
    lastSyncAt: new Date().toISOString(),
  }
  notifyListeners()

  return { succeeded, failed }
}

/** Get all pending queue items */
export function getQueue(): SyncQueueItem[] {
  return [...queue]
}

/** Clear all items from queue */
export function clearQueue(): void {
  queue = []
  notifyListeners()
}

/** Remove a specific item from queue */
export function removeFromQueue(id: string): boolean {
  const before = queue.length
  queue = queue.filter((i) => i.id !== id)
  notifyListeners()
  return queue.length < before
}

/** Set online/offline status */
export function setOnlineStatus(isOnline: boolean): void {
  const wasOffline = !syncStatus.isOnline
  syncStatus = { ...syncStatus, isOnline }
  notifyListeners()

  // Auto-sync when coming back online
  if (isOnline && wasOffline && queue.some((i) => i.status === 'pending')) {
    processQueue()
  }
}

/** Resolve conflict using last-write-wins strategy */
export function resolveConflict(
  localData: { updatedAt: string; data: unknown },
  remoteData: { updatedAt: string; data: unknown },
  strategy: ConflictResolution['strategy'] = 'last-write-wins',
): { winner: 'local' | 'remote'; data: unknown } {
  if (strategy === 'last-write-wins') {
    const localTime = new Date(localData.updatedAt).getTime()
    const remoteTime = new Date(remoteData.updatedAt).getTime()
    return localTime >= remoteTime
      ? { winner: 'local', data: localData.data }
      : { winner: 'remote', data: remoteData.data }
  }

  // Default: local wins
  return { winner: 'local', data: localData.data }
}

/** Estimate IndexedDB storage usage */
export async function getStorageQuota(): Promise<StorageQuota> {
  if (typeof navigator === 'undefined' || !navigator.storage?.estimate) {
    return { used: 0, available: 0, utilization: 0, warning: false }
  }

  try {
    const estimate = await navigator.storage.estimate()
    const used = estimate.usage ?? 0
    const available = estimate.quota ?? 0
    const utilization = available > 0 ? used / available : 0

    return {
      used,
      available,
      utilization,
      warning: utilization > 0.8,
    }
  } catch {
    return { used: 0, available: 0, utilization: 0, warning: false }
  }
}

/** Format bytes to human-readable string */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / 1024 ** i).toFixed(1)} ${units[i]}`
}

// Auto-detect connectivity if in browser
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => setOnlineStatus(true))
  window.addEventListener('offline', () => setOnlineStatus(false))
}
