import { describe, it, expect } from 'vitest'
import {
  getPresenceColor,
  createInsertOp,
  createDeleteOp,
  compareVectorClocks,
  mergeOperations,
  updatePresence,
  isIdle,
  getActivePresences,
  createActivityEvent,
  applyOperation,
  type PresenceInfo,
} from '@/shared/lib/collab-engine'

describe('collab-engine', () => {
  describe('presence', () => {
    it('should assign color based on participant list', () => {
      const color = getPresenceColor('alice', ['alice', 'bob', 'charlie'])
      expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/)
    })

    it('should assign consistent colors', () => {
      const participants = ['a', 'b', 'c']
      expect(getPresenceColor('a', participants)).toBe(getPresenceColor('a', participants))
    })

    it('should detect idle users', () => {
      const presence: PresenceInfo = {
        userId: 'u1', userName: 'Alice', status: 'online',
        lastSeen: Date.now() - 60000, color: '#3B82F6',
      }
      expect(isIdle(presence)).toBe(true)
    })

    it('should detect active users', () => {
      const presence: PresenceInfo = {
        userId: 'u1', userName: 'Alice', status: 'online',
        lastSeen: Date.now(), color: '#3B82F6',
      }
      expect(isIdle(presence)).toBe(false)
    })

    it('should filter stale presences', () => {
      const presences: PresenceInfo[] = [
        { userId: 'active', userName: 'A', status: 'online', lastSeen: Date.now(), color: '#000' },
        { userId: 'stale', userName: 'B', status: 'online', lastSeen: Date.now() - 120000, color: '#000' },
      ]
      const active = getActivePresences(presences, 60000)
      expect(active).toHaveLength(1)
      expect(active[0].userId).toBe('active')
    })

    it('should update presence', () => {
      const p: PresenceInfo = {
        userId: 'u1', userName: 'A', status: 'online', lastSeen: 0, color: '#000',
      }
      const updated = updatePresence(p, { status: 'typing' })
      expect(updated.status).toBe('typing')
      expect(updated.lastSeen).toBeGreaterThan(0)
    })
  })

  describe('CRDT operations', () => {
    it('should create insert operation', () => {
      const op = createInsertOp(['doc', 'title'], 'Hello', 'user1', {})
      expect(op.type).toBe('insert')
      expect(op.value).toBe('Hello')
      expect(op.vectorClock.user1).toBe(1)
    })

    it('should create delete operation', () => {
      const op = createDeleteOp(['doc', 'title'], 'user1', { user1: 1 })
      expect(op.type).toBe('delete')
      expect(op.vectorClock.user1).toBe(2)
    })

    it('should increment vector clock', () => {
      const clock = { user1: 3, user2: 2 }
      const op = createInsertOp(['x'], 'v', 'user1', clock)
      expect(op.vectorClock.user1).toBe(4)
      expect(op.vectorClock.user2).toBe(2)
    })
  })

  describe('compareVectorClocks', () => {
    it('should detect before', () => {
      expect(compareVectorClocks({ a: 1 }, { a: 2 })).toBe('before')
    })

    it('should detect after', () => {
      expect(compareVectorClocks({ a: 3 }, { a: 2 })).toBe('after')
    })

    it('should detect concurrent', () => {
      expect(compareVectorClocks({ a: 1, b: 2 }, { a: 2, b: 1 })).toBe('concurrent')
    })

    it('should handle missing keys', () => {
      expect(compareVectorClocks({ a: 1 }, { b: 1 })).toBe('concurrent')
    })
  })

  describe('mergeOperations', () => {
    it('should keep latest for same path', () => {
      const ops = [
        createInsertOp(['title'], 'Old', 'u1', {}),
        createInsertOp(['title'], 'New', 'u2', {}),
      ]
      // Make second op newer
      ops[1] = { ...ops[1], timestamp: ops[0].timestamp + 1000 }

      const merged = mergeOperations(ops)
      expect(merged).toHaveLength(1)
      expect(merged[0].value).toBe('New')
    })

    it('should keep different paths', () => {
      const ops = [
        createInsertOp(['title'], 'A', 'u1', {}),
        createInsertOp(['body'], 'B', 'u2', {}),
      ]
      const merged = mergeOperations(ops)
      expect(merged).toHaveLength(2)
    })
  })

  describe('applyOperation', () => {
    it('should apply insert', () => {
      const op = createInsertOp(['name'], 'Alice', 'u1', {})
      const result = applyOperation({}, op)
      expect(result.name).toBe('Alice')
    })

    it('should apply delete', () => {
      const op = createDeleteOp(['name'], 'u1', {})
      const result = applyOperation({ name: 'Alice' }, op)
      expect(result.name).toBeUndefined()
    })
  })

  describe('activity events', () => {
    it('should create activity event', () => {
      const event = createActivityEvent('u1', 'Alice', 'edited', 'document-1')
      expect(event.userId).toBe('u1')
      expect(event.action).toBe('edited')
      expect(event.timestamp).toBeTruthy()
    })
  })
})
