export interface StorageEstimate {
  usage: number
  quota: number
  usagePercentage: number
}

export interface StorageBreakdown {
  localStorage: number
  sessionStorage: number
  indexedDB: number
}

export async function getStorageEstimate(): Promise<StorageEstimate> {
  if (typeof navigator === 'undefined' || !navigator.storage?.estimate) {
    return { usage: 0, quota: 0, usagePercentage: 0 }
  }
  const estimate = await navigator.storage.estimate()
  const usage = estimate.usage ?? 0
  const quota = estimate.quota ?? 0
  return {
    usage,
    quota,
    usagePercentage: getUsagePercentage(usage, quota),
  }
}

export function getUsagePercentage(usage: number, quota: number): number {
  if (quota <= 0) return 0
  return Math.round((usage / quota) * 10000) / 100
}

export function isStorageAvailable(type: 'localStorage' | 'sessionStorage'): boolean {
  try {
    const storage = window[type]
    const key = '__test__'
    storage.setItem(key, '1')
    storage.removeItem(key)
    return true
  } catch {
    return false
  }
}

export function formatStorageInfo(estimate: StorageEstimate): string {
  const formatBytes = (b: number) => {
    if (b < 1024) return `${b} B`
    if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`
    if (b < 1073741824) return `${(b / 1048576).toFixed(1)} MB`
    return `${(b / 1073741824).toFixed(1)} GB`
  }
  return `${formatBytes(estimate.usage)} / ${formatBytes(estimate.quota)} (${estimate.usagePercentage}%)`
}

export function isNearQuota(estimate: StorageEstimate, threshold = 90): boolean {
  return estimate.usagePercentage >= threshold
}

export async function getStorageBreakdown(): Promise<StorageBreakdown> {
  const breakdown: StorageBreakdown = {
    localStorage: 0,
    sessionStorage: 0,
    indexedDB: 0,
  }

  // Calculate localStorage size
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      let size = 0
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key) {
          const value = localStorage.getItem(key) || ''
          size += key.length + value.length
        }
      }
      breakdown.localStorage = size
    }
  } catch (e) {
    console.error('Failed to calculate localStorage size:', e)
  }

  // Calculate sessionStorage size
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      let size = 0
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i)
        if (key) {
          const value = sessionStorage.getItem(key) || ''
          size += key.length + value.length
        }
      }
      breakdown.sessionStorage = size
    }
  } catch (e) {
    console.error('Failed to calculate sessionStorage size:', e)
  }

  // Get IndexedDB size from storage estimate
  try {
    if (navigator.storage?.estimate) {
      const estimate = await navigator.storage.estimate()
      // Some browsers provide usageDetails
      if ('usageDetails' in estimate && estimate.usageDetails) {
        const details = estimate.usageDetails as any
        breakdown.indexedDB = details.indexedDB || 0
      } else if (estimate.usage) {
        // Estimate IndexedDB as total minus web storage
        const webStorageSize = breakdown.localStorage + breakdown.sessionStorage
        if (estimate.usage > webStorageSize) {
          breakdown.indexedDB = estimate.usage - webStorageSize
        }
      }
    }
  } catch (e) {
    console.error('Failed to get IndexedDB size:', e)
  }

  return breakdown
}

export async function clearStorageType(type: 'localStorage' | 'sessionStorage' | 'indexedDB'): Promise<void> {
  try {
    switch (type) {
      case 'localStorage':
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.clear()
        }
        break

      case 'sessionStorage':
        if (typeof window !== 'undefined' && window.sessionStorage) {
          sessionStorage.clear()
        }
        break

      case 'indexedDB':
        if (typeof window !== 'undefined' && typeof window.indexedDB?.databases === 'function') {
          const databases = await indexedDB.databases()
          for (const db of databases) {
            if (db.name) {
              await indexedDB.deleteDatabase(db.name)
            }
          }
        }
        break
    }
  } catch (error) {
    console.error(`Failed to clear ${type}:`, error)
  }
}
