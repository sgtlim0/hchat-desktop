/**
 * Quota-safe IndexedDB write wrapper.
 *
 * Catches QuotaExceededError and provides user-friendly error handling
 * instead of silently dropping data.
 */

import type { Table } from 'dexie'
import { HChatError } from '@/shared/lib/errors/hchat-error'

function isQuotaError(error: unknown): boolean {
  if (error instanceof DOMException && error.name === 'QuotaExceededError') {
    return true
  }
  // Dexie wraps errors
  const inner = (error as { inner?: { name?: string } })?.inner
  if (inner?.name === 'QuotaExceededError') {
    return true
  }
  return false
}

export async function quotaSafeAdd<T>(
  table: Table<T>,
  data: T,
): Promise<void> {
  try {
    await table.add(data)
  } catch (error) {
    if (isQuotaError(error)) {
      throw new HChatError('STORAGE_QUOTA_EXCEEDED')
    }
    throw error
  }
}

export async function quotaSafePut<T>(
  table: Table<T>,
  data: T,
): Promise<void> {
  try {
    await table.put(data)
  } catch (error) {
    if (isQuotaError(error)) {
      throw new HChatError('STORAGE_QUOTA_EXCEEDED')
    }
    throw error
  }
}

export async function quotaSafeBulkPut<T>(
  table: Table<T>,
  items: T[],
): Promise<void> {
  try {
    await table.bulkPut(items)
  } catch (error) {
    if (isQuotaError(error)) {
      throw new HChatError('STORAGE_QUOTA_EXCEEDED')
    }
    throw error
  }
}

export async function getStorageEstimate(): Promise<{
  usageBytes: number
  quotaBytes: number
  usagePercent: number
}> {
  if (!navigator.storage?.estimate) {
    return { usageBytes: 0, quotaBytes: 0, usagePercent: 0 }
  }

  const estimate = await navigator.storage.estimate()
  const usageBytes = estimate.usage ?? 0
  const quotaBytes = estimate.quota ?? 0
  const usagePercent = quotaBytes > 0 ? Math.round((usageBytes / quotaBytes) * 100) : 0

  return { usageBytes, quotaBytes, usagePercent }
}
