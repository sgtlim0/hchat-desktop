import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useMemoryStore } from '../memory.store'

vi.mock('@/shared/lib/db', () => ({
  getAllMemories: vi.fn().mockResolvedValue([]),
  putMemory: vi.fn().mockResolvedValue(undefined),
  deleteMemoryFromDb: vi.fn().mockResolvedValue(undefined),
}))

describe('useMemoryStore', () => {
  beforeEach(() => {
    // Reset to initial state with mock entries
    useMemoryStore.setState({
      entries: [
        {
          id: 'mem-1',
          key: '사용자 선호 언어',
          value: 'TypeScript를 선호하며, 함수형 프로그래밍 패턴을 주로 사용합니다.',
          scope: 'session',
          sessionId: 'session-1',
          source: 'auto',
          createdAt: '2026-03-01T10:00:00Z',
          updatedAt: '2026-03-01T10:00:00Z',
        },
        {
          id: 'mem-2',
          key: '프로젝트 구조',
          value: 'Feature-Sliced Design (FSD) 아키텍처를 사용합니다.',
          scope: 'project',
          projectId: 'proj-1',
          source: 'manual',
          createdAt: '2026-02-28T09:00:00Z',
          updatedAt: '2026-03-01T08:00:00Z',
        },
      ],
      scope: 'session',
      autoExtract: true,
      searchQuery: '',
    })
  })

  describe('initial state', () => {
    it('has mock entries', () => {
      expect(useMemoryStore.getState().entries.length).toBeGreaterThan(0)
    })

    it('defaults to session scope', () => {
      expect(useMemoryStore.getState().scope).toBe('session')
    })

    it('has autoExtract enabled', () => {
      expect(useMemoryStore.getState().autoExtract).toBe(true)
    })

    it('has empty search query', () => {
      expect(useMemoryStore.getState().searchQuery).toBe('')
    })
  })

  describe('setScope', () => {
    it('changes scope to session', () => {
      useMemoryStore.getState().setScope('session')
      expect(useMemoryStore.getState().scope).toBe('session')
    })

    it('changes scope to project', () => {
      useMemoryStore.getState().setScope('project')
      expect(useMemoryStore.getState().scope).toBe('project')
    })

    it('changes scope to project', () => {
      useMemoryStore.getState().setScope('project')
      expect(useMemoryStore.getState().scope).toBe('project')
    })
  })

  describe('setAutoExtract', () => {
    it('enables auto extract', () => {
      useMemoryStore.getState().setAutoExtract(true)
      expect(useMemoryStore.getState().autoExtract).toBe(true)
    })

    it('disables auto extract', () => {
      useMemoryStore.getState().setAutoExtract(false)
      expect(useMemoryStore.getState().autoExtract).toBe(false)
    })
  })

  describe('setSearchQuery', () => {
    it('sets search query', () => {
      useMemoryStore.getState().setSearchQuery('TypeScript')
      expect(useMemoryStore.getState().searchQuery).toBe('TypeScript')
    })

    it('allows empty query', () => {
      useMemoryStore.getState().setSearchQuery('test')
      useMemoryStore.getState().setSearchQuery('')
      expect(useMemoryStore.getState().searchQuery).toBe('')
    })
  })

  describe('addEntry', () => {
    it('adds a new entry', async () => {
      const initialLength = useMemoryStore.getState().entries.length

      await useMemoryStore.getState().addEntry({
        key: 'New Key',
        value: 'New Value',
        scope: 'session',
        sessionId: 'session-1',
        source: 'manual',
      })

      expect(useMemoryStore.getState().entries).toHaveLength(initialLength + 1)
    })

    it('generates unique ID', async () => {
      await useMemoryStore.getState().addEntry({
        key: 'Entry 1',
        value: 'Value 1',
        scope: 'session',
        source: 'manual',
      })

      const entry = useMemoryStore.getState().entries[0]
      expect(entry.id).toMatch(/^mem-\d+$/)
    })

    it('sets createdAt and updatedAt', async () => {
      await useMemoryStore.getState().addEntry({
        key: 'Test',
        value: 'Value',
        scope: 'session',
        source: 'manual',
      })

      const entry = useMemoryStore.getState().entries[0]
      expect(entry.createdAt).toBeDefined()
      expect(entry.updatedAt).toBe(entry.createdAt)
    })

    it('adds entry to beginning of list', async () => {
      await useMemoryStore.getState().addEntry({
        key: 'New Entry',
        value: 'New Value',
        scope: 'session',
        source: 'manual',
      })

      expect(useMemoryStore.getState().entries[0].key).toBe('New Entry')
    })

    it('preserves optional fields', async () => {
      await useMemoryStore.getState().addEntry({
        key: 'Test',
        value: 'Value',
        scope: 'session',
        sessionId: 'session-123',
        source: 'auto',
      })

      const entry = useMemoryStore.getState().entries[0]
      expect(entry.sessionId).toBe('session-123')
      expect(entry.source).toBe('auto')
    })
  })

  describe('updateEntry', () => {
    it('updates entry key', async () => {
      const entryId = useMemoryStore.getState().entries[0].id

      await useMemoryStore.getState().updateEntry(entryId, { key: 'Updated Key' })

      const updated = useMemoryStore.getState().entries.find((e) => e.id === entryId)
      expect(updated?.key).toBe('Updated Key')
    })

    it('updates entry value', async () => {
      const entryId = useMemoryStore.getState().entries[0].id

      await useMemoryStore.getState().updateEntry(entryId, { value: 'Updated Value' })

      const updated = useMemoryStore.getState().entries.find((e) => e.id === entryId)
      expect(updated?.value).toBe('Updated Value')
    })

    it('updates both key and value', async () => {
      const entryId = useMemoryStore.getState().entries[0].id

      await useMemoryStore.getState().updateEntry(entryId, {
        key: 'New Key',
        value: 'New Value',
      })

      const updated = useMemoryStore.getState().entries.find((e) => e.id === entryId)
      expect(updated?.key).toBe('New Key')
      expect(updated?.value).toBe('New Value')
    })

    it('updates updatedAt timestamp', async () => {
      const entryId = useMemoryStore.getState().entries[0].id
      const originalUpdatedAt = useMemoryStore.getState().entries[0].updatedAt

      await useMemoryStore.getState().updateEntry(entryId, { key: 'Updated' })

      const updated = useMemoryStore.getState().entries.find((e) => e.id === entryId)
      expect(updated?.updatedAt).not.toBe(originalUpdatedAt)
    })

    it('preserves other fields', async () => {
      const entryId = useMemoryStore.getState().entries[0].id
      const original = useMemoryStore.getState().entries[0]

      await useMemoryStore.getState().updateEntry(entryId, { key: 'Updated' })

      const updated = useMemoryStore.getState().entries.find((e) => e.id === entryId)
      expect(updated?.scope).toBe(original.scope)
      expect(updated?.sessionId).toBe(original.sessionId)
      expect(updated?.source).toBe(original.source)
      expect(updated?.createdAt).toBe(original.createdAt)
    })

    it('does not update other entries', async () => {
      const entryId = useMemoryStore.getState().entries[0].id
      const otherEntry = useMemoryStore.getState().entries[1]

      await useMemoryStore.getState().updateEntry(entryId, { key: 'Updated' })

      const unchanged = useMemoryStore.getState().entries.find((e) => e.id === otherEntry.id)
      expect(unchanged).toEqual(otherEntry)
    })
  })

  describe('deleteEntry', () => {
    it('removes entry from list', async () => {
      const initialLength = useMemoryStore.getState().entries.length
      const entryId = useMemoryStore.getState().entries[0].id

      await useMemoryStore.getState().deleteEntry(entryId)

      expect(useMemoryStore.getState().entries).toHaveLength(initialLength - 1)
      expect(useMemoryStore.getState().entries.find((e) => e.id === entryId)).toBeUndefined()
    })

    it('does not affect other entries', async () => {
      const entryToDelete = useMemoryStore.getState().entries[0].id
      const entryToKeep = useMemoryStore.getState().entries[1]

      await useMemoryStore.getState().deleteEntry(entryToDelete)

      const remaining = useMemoryStore.getState().entries.find((e) => e.id === entryToKeep.id)
      expect(remaining).toEqual(entryToKeep)
    })
  })

  describe('filteredEntries', () => {
    beforeEach(() => {
      useMemoryStore.setState({
        entries: [
          {
            id: 'mem-1',
            key: 'Session Key',
            value: 'Session Value',
            scope: 'session',
            source: 'auto',
            createdAt: '2026-03-01T00:00:00Z',
            updatedAt: '2026-03-01T00:00:00Z',
          },
          {
            id: 'mem-2',
            key: 'Project Key',
            value: 'Project Value',
            scope: 'project',
            source: 'manual',
            createdAt: '2026-03-01T00:00:00Z',
            updatedAt: '2026-03-01T00:00:00Z',
          },
          {
            id: 'mem-3',
            key: 'Global Key',
            value: 'Global Value',
            scope: 'session',
            source: 'auto',
            createdAt: '2026-03-01T00:00:00Z',
            updatedAt: '2026-03-01T00:00:00Z',
          },
        ],
        scope: 'session',
        searchQuery: '',
      })
    })

    it('filters by session scope', () => {
      useMemoryStore.getState().setScope('session')
      const filtered = useMemoryStore.getState().filteredEntries()

      expect(filtered).toHaveLength(2)
      expect(filtered.every(e => e.scope === 'session')).toBe(true)
    })

    it('filters by project scope', () => {
      useMemoryStore.getState().setScope('project')
      const filtered = useMemoryStore.getState().filteredEntries()

      expect(filtered).toHaveLength(1)
      expect(filtered[0].scope).toBe('project')
    })

    it('filters by session scope when set', () => {
      useMemoryStore.getState().setScope('session')
      const filtered = useMemoryStore.getState().filteredEntries()

      expect(filtered).toHaveLength(2)
      expect(filtered.every(e => e.scope === 'session')).toBe(true)
    })

    it('filters by search query in key', () => {
      useMemoryStore.getState().setScope('session')
      useMemoryStore.getState().setSearchQuery('session')
      const filtered = useMemoryStore.getState().filteredEntries()

      expect(filtered).toHaveLength(1)
      expect(filtered[0].key).toContain('Session')
    })

    it('filters by search query in value', () => {
      useMemoryStore.getState().setScope('project')
      useMemoryStore.getState().setSearchQuery('value')
      const filtered = useMemoryStore.getState().filteredEntries()

      expect(filtered).toHaveLength(1)
      expect(filtered[0].value).toContain('Value')
    })

    it('search is case insensitive', () => {
      useMemoryStore.getState().setScope('session')
      useMemoryStore.getState().setSearchQuery('SESSION')
      const filtered = useMemoryStore.getState().filteredEntries()

      expect(filtered).toHaveLength(1)
    })

    it('returns all entries in scope when search is empty', () => {
      useMemoryStore.setState({
        entries: [
          {
            id: 'mem-1',
            key: 'Key 1',
            value: 'Value 1',
            scope: 'session',
            source: 'auto',
            createdAt: '2026-03-01T00:00:00Z',
            updatedAt: '2026-03-01T00:00:00Z',
          },
          {
            id: 'mem-2',
            key: 'Key 2',
            value: 'Value 2',
            scope: 'session',
            source: 'manual',
            createdAt: '2026-03-01T00:00:00Z',
            updatedAt: '2026-03-01T00:00:00Z',
          },
        ],
        scope: 'session',
        searchQuery: '',
      })

      const filtered = useMemoryStore.getState().filteredEntries()
      expect(filtered).toHaveLength(2)
    })

    it('returns empty when no matches', () => {
      useMemoryStore.getState().setScope('session')
      useMemoryStore.getState().setSearchQuery('nonexistent')
      const filtered = useMemoryStore.getState().filteredEntries()

      expect(filtered).toHaveLength(0)
    })

    it('combines scope and search filters', () => {
      useMemoryStore.setState({
        entries: [
          {
            id: 'mem-1',
            key: 'TypeScript',
            value: 'Language',
            scope: 'session',
            source: 'auto',
            createdAt: '2026-03-01T00:00:00Z',
            updatedAt: '2026-03-01T00:00:00Z',
          },
          {
            id: 'mem-2',
            key: 'TypeScript',
            value: 'Project',
            scope: 'project',
            source: 'manual',
            createdAt: '2026-03-01T00:00:00Z',
            updatedAt: '2026-03-01T00:00:00Z',
          },
        ],
        scope: 'session',
        searchQuery: 'typescript',
      })

      const filtered = useMemoryStore.getState().filteredEntries()
      expect(filtered).toHaveLength(1)
      expect(filtered[0].scope).toBe('session')
    })
  })
})
