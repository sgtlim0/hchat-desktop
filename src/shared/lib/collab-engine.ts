/**
 * Phase 35: Real-time Collaboration v2 — CRDT operations,
 * presence system, shared state management.
 */

export interface CRDTOperation {
  id: string
  type: 'insert' | 'delete' | 'update'
  path: string[]
  value?: unknown
  timestamp: number
  userId: string
  vectorClock: Record<string, number>
}

export interface PresenceInfo {
  userId: string
  userName: string
  avatar?: string
  status: 'online' | 'idle' | 'typing'
  cursorPosition?: { x: number; y: number }
  lastSeen: number
  color: string
}

export interface SharedDocument {
  id: string
  content: string
  operations: CRDTOperation[]
  participants: string[]
  createdAt: string
  updatedAt: string
}

export interface ActivityEvent {
  id: string
  userId: string
  userName: string
  action: string
  target: string
  timestamp: string
}

const IDLE_TIMEOUT = 30000 // 30 seconds
const PRESENCE_COLORS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B',
  '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16',
]

/** Assign color to user based on participant list position */
export function getPresenceColor(userId: string, participants: string[]): string {
  const idx = participants.indexOf(userId)
  return PRESENCE_COLORS[Math.max(0, idx) % PRESENCE_COLORS.length]
}

/** Create a CRDT insert operation */
export function createInsertOp(
  path: string[],
  value: unknown,
  userId: string,
  clock: Record<string, number>,
): CRDTOperation {
  const newClock = { ...clock, [userId]: (clock[userId] ?? 0) + 1 }
  return {
    id: `op-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type: 'insert',
    path,
    value,
    timestamp: Date.now(),
    userId,
    vectorClock: newClock,
  }
}

/** Create a CRDT delete operation */
export function createDeleteOp(
  path: string[],
  userId: string,
  clock: Record<string, number>,
): CRDTOperation {
  const newClock = { ...clock, [userId]: (clock[userId] ?? 0) + 1 }
  return {
    id: `op-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type: 'delete',
    path,
    timestamp: Date.now(),
    userId,
    vectorClock: newClock,
  }
}

/** Compare vector clocks: returns 'before' | 'after' | 'concurrent' */
export function compareVectorClocks(
  a: Record<string, number>,
  b: Record<string, number>,
): 'before' | 'after' | 'concurrent' {
  const allKeys = new Set([...Object.keys(a), ...Object.keys(b)])
  let aBeforeB = false
  let bBeforeA = false

  for (const key of allKeys) {
    const aVal = a[key] ?? 0
    const bVal = b[key] ?? 0
    if (aVal < bVal) aBeforeB = true
    if (bVal < aVal) bBeforeA = true
  }

  if (aBeforeB && !bBeforeA) return 'before'
  if (bBeforeA && !aBeforeB) return 'after'
  return 'concurrent'
}

/** Merge concurrent operations (last-writer-wins by timestamp) */
export function mergeOperations(ops: CRDTOperation[]): CRDTOperation[] {
  const pathMap = new Map<string, CRDTOperation>()

  for (const op of ops) {
    const pathKey = op.path.join('.')
    const existing = pathMap.get(pathKey)

    if (!existing || op.timestamp > existing.timestamp) {
      pathMap.set(pathKey, op)
    }
  }

  return [...pathMap.values()].sort((a, b) => a.timestamp - b.timestamp)
}

/** Update presence info */
export function updatePresence(
  current: PresenceInfo,
  update: Partial<Pick<PresenceInfo, 'status' | 'cursorPosition'>>,
): PresenceInfo {
  return {
    ...current,
    ...update,
    lastSeen: Date.now(),
  }
}

/** Check if a user is considered idle */
export function isIdle(presence: PresenceInfo): boolean {
  return Date.now() - presence.lastSeen > IDLE_TIMEOUT
}

/** Filter out stale presence entries */
export function getActivePresences(
  presences: PresenceInfo[],
  staleTimeout = 60000,
): PresenceInfo[] {
  const now = Date.now()
  return presences.filter((p) => now - p.lastSeen < staleTimeout)
}

/** Create an activity event */
export function createActivityEvent(
  userId: string,
  userName: string,
  action: string,
  target: string,
): ActivityEvent {
  return {
    id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    userId,
    userName,
    action,
    target,
    timestamp: new Date().toISOString(),
  }
}

/** Apply a CRDT operation to a plain object (simplified) */
export function applyOperation(
  state: Record<string, unknown>,
  op: CRDTOperation,
): Record<string, unknown> {
  const result = { ...state }
  let current: Record<string, unknown> = result

  // Navigate to parent
  for (let i = 0; i < op.path.length - 1; i++) {
    const key = op.path[i]
    if (typeof current[key] !== 'object' || current[key] === null) {
      current[key] = {}
    }
    current = { ...(current[key] as Record<string, unknown>) }
  }

  const lastKey = op.path[op.path.length - 1]

  switch (op.type) {
    case 'insert':
    case 'update':
      current[lastKey] = op.value
      break
    case 'delete':
      delete current[lastKey]
      break
  }

  return result
}
