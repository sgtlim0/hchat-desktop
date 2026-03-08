export interface StorageEstimate {
  usage: number
  quota: number
  usagePercentage: number
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
