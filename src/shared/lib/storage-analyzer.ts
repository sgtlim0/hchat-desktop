import { db, getAllSessions } from './db'

export interface StorageInfo {
  totalSize: number // bytes
  sessionsCount: number
  messagesCount: number
  estimatedBySession: {
    sessionId: string
    title: string
    messageCount: number
    estimatedSize: number
  }[]
}

/**
 * Analyze IndexedDB storage usage
 */
export async function analyzeStorage(): Promise<StorageInfo> {
  const sessions = await getAllSessions()
  const sessionsCount = sessions.length

  let messagesCount = 0
  const estimatedBySession: StorageInfo['estimatedBySession'] = []

  // Estimate size per session
  for (const session of sessions) {
    const messages = await db.messages
      .where('sessionId')
      .equals(session.id)
      .toArray()

    const sessionMessagesCount = messages.length
    messagesCount += sessionMessagesCount

    // Estimate size: JSON stringified length as rough approximation
    const estimatedSize =
      JSON.stringify(session).length +
      messages.reduce(
        (sum, msg) => sum + JSON.stringify(msg).length,
        0
      )

    estimatedBySession.push({
      sessionId: session.id,
      title: session.title,
      messageCount: sessionMessagesCount,
      estimatedSize,
    })
  }

  // Get total storage usage from StorageManager API
  let totalSize = 0
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    try {
      const estimate = await navigator.storage.estimate()
      totalSize = estimate.usage ?? 0
    } catch (error) {
      console.error('Failed to estimate storage:', error)
    }
  }

  return {
    totalSize,
    sessionsCount,
    messagesCount,
    estimatedBySession: estimatedBySession.sort(
      (a, b) => b.estimatedSize - a.estimatedSize
    ),
  }
}

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

/**
 * Get storage quota
 */
export async function getStorageQuota(): Promise<{
  usage: number
  quota: number
}> {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    try {
      const estimate = await navigator.storage.estimate()
      return {
        usage: estimate.usage ?? 0,
        quota: estimate.quota ?? 0,
      }
    } catch (error) {
      console.error('Failed to get storage quota:', error)
      return { usage: 0, quota: 0 }
    }
  }
  return { usage: 0, quota: 0 }
}

/**
 * Delete sessions older than specified days
 */
export async function deleteOldSessions(days: number): Promise<number> {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - days)
  const cutoffTimestamp = cutoffDate.toISOString()

  const sessions = await getAllSessions()
  const oldSessions = sessions.filter(
    (s) => s.updatedAt < cutoffTimestamp
  )

  // Delete sessions and their messages
  await Promise.all(
    oldSessions.map(async (session) => {
      await db.sessions.delete(session.id)
      await db.messages.where('sessionId').equals(session.id).delete()
    })
  )

  return oldSessions.length
}

/**
 * Clear all data from IndexedDB
 */
export async function clearAllData(): Promise<void> {
  await db.transaction('rw', [db.sessions, db.messages, db.projects, db.usages, db.prompts, db.personas, db.folders, db.tags], async () => {
    await db.sessions.clear()
    await db.messages.clear()
    await db.projects.clear()
    await db.usages.clear()
    await db.prompts.clear()
    await db.personas.clear()
    await db.folders.clear()
    await db.tags.clear()
  })
}

/**
 * Export all data as JSON string
 */
export async function exportAllData(): Promise<string> {
  const [sessions, messages, projects, usages, prompts, personas, folders, tags] = await Promise.all([
    db.sessions.toArray(),
    db.messages.toArray(),
    db.projects.toArray(),
    db.usages.toArray(),
    db.prompts.toArray(),
    db.personas.toArray(),
    db.folders.toArray(),
    db.tags.toArray(),
  ])

  const backup = {
    version: 3,
    timestamp: new Date().toISOString(),
    data: {
      sessions,
      messages,
      projects,
      usages,
      prompts,
      personas,
      folders,
      tags,
    },
  }

  return JSON.stringify(backup, null, 2)
}

/**
 * Import data from JSON string
 */
export async function importAllData(jsonString: string): Promise<void> {
  try {
    const backup = JSON.parse(jsonString)

    if (!backup.data) {
      throw new Error('Invalid backup format')
    }

    const { sessions, messages, projects, usages, prompts, personas, folders, tags } = backup.data

    await db.transaction('rw', [db.sessions, db.messages, db.projects, db.usages, db.prompts, db.personas, db.folders, db.tags], async () => {
      // Clear existing data
      await db.sessions.clear()
      await db.messages.clear()
      await db.projects.clear()
      await db.usages.clear()
      await db.prompts.clear()
      await db.personas.clear()
      await db.folders.clear()
      await db.tags.clear()

      // Import new data
      if (sessions) await db.sessions.bulkAdd(sessions)
      if (messages) await db.messages.bulkAdd(messages)
      if (projects) await db.projects.bulkAdd(projects)
      if (usages) await db.usages.bulkAdd(usages)
      if (prompts) await db.prompts.bulkAdd(prompts)
      if (personas) await db.personas.bulkAdd(personas)
      if (folders) await db.folders.bulkAdd(folders)
      if (tags) await db.tags.bulkAdd(tags)
    })
  } catch (error) {
    throw new Error(`Failed to import backup: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}
