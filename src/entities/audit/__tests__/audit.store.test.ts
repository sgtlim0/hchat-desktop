import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useAuditStore } from '../audit.store'
import type { AuditEntry } from '@/shared/types'

// Mock the db module
vi.mock('@/shared/lib/db', () => ({
  getAllAuditEntries: vi.fn(() => Promise.resolve([])),
  putAuditEntry: vi.fn(() => Promise.resolve()),
  clearAllAuditEntries: vi.fn(() => Promise.resolve()),
}))

describe('AuditStore', () => {
  beforeEach(() => {
    useAuditStore.setState({
      entries: [],
      filterAction: 'all',
      filterDateRange: null,
      searchQuery: '',
      hydrated: false,
    })
  })

  it('should add an audit entry', () => {
    const { addEntry } = useAuditStore.getState()

    addEntry('session_create', 'Created new session', {
      modelId: 'claude-3-5-sonnet',
      sessionId: 'test-session-id',
      cost: 0.0025,
    })

    const newEntries = useAuditStore.getState().entries
    expect(newEntries).toHaveLength(1)
    expect(newEntries[0].action).toBe('session_create')
    expect(newEntries[0].details).toBe('Created new session')
    expect(newEntries[0].modelId).toBe('claude-3-5-sonnet')
    expect(newEntries[0].cost).toBe(0.0025)
  })

  it('should filter entries by action', () => {
    const { addEntry, setFilterAction, getFilteredEntries } = useAuditStore.getState()

    addEntry('session_create', 'Created session 1')
    addEntry('message_send', 'Sent message 1')
    addEntry('session_delete', 'Deleted session 1')
    addEntry('message_send', 'Sent message 2')

    setFilterAction('message_send')
    const filtered = getFilteredEntries()

    expect(filtered).toHaveLength(2)
    expect(filtered.every((e) => e.action === 'message_send')).toBe(true)
  })

  it('should filter entries by search query', () => {
    const { addEntry, setSearchQuery, getFilteredEntries } = useAuditStore.getState()

    addEntry('session_create', 'Created new session')
    addEntry('message_send', 'Sent important message')
    addEntry('file_upload', 'Uploaded document.pdf')

    setSearchQuery('document')
    const filtered = getFilteredEntries()

    expect(filtered).toHaveLength(1)
    expect(filtered[0].details).toContain('document')
  })

  it('should filter entries by date range', () => {
    const { setFilterDateRange, getFilteredEntries } = useAuditStore.getState()

    // Manually create entries with specific dates
    const entry1: AuditEntry = {
      id: '1',
      action: 'session_create',
      details: 'Session 1',
      createdAt: '2026-03-01T10:00:00Z',
    }
    const entry2: AuditEntry = {
      id: '2',
      action: 'message_send',
      details: 'Message 1',
      createdAt: '2026-03-05T10:00:00Z',
    }
    const entry3: AuditEntry = {
      id: '3',
      action: 'session_delete',
      details: 'Session 2',
      createdAt: '2026-03-10T10:00:00Z',
    }

    useAuditStore.setState({ entries: [entry3, entry2, entry1] })

    setFilterDateRange({ start: '2026-03-04', end: '2026-03-09' })
    const filtered = getFilteredEntries()

    expect(filtered).toHaveLength(1)
    expect(filtered[0].id).toBe('2')
  })

  it('should export as JSON', () => {
    const { addEntry, exportAsJson } = useAuditStore.getState()

    addEntry('session_create', 'Created session')
    addEntry('message_send', 'Sent message')

    const json = exportAsJson()
    const parsed = JSON.parse(json)

    expect(Array.isArray(parsed)).toBe(true)
    expect(parsed).toHaveLength(2)
    expect(parsed[0].action).toBe('message_send') // newest first
  })

  it('should export as CSV', () => {
    const { addEntry, exportAsCsv } = useAuditStore.getState()

    addEntry('session_create', 'Created session', {
      modelId: 'claude-3-5-sonnet',
      cost: 0.0025,
    })

    const csv = exportAsCsv()
    const lines = csv.split('\n')

    expect(lines[0]).toContain('Timestamp')
    expect(lines[0]).toContain('Action')
    expect(lines[0]).toContain('Details')
    expect(lines[1]).toContain('session_create')
    expect(lines[1]).toContain('Created session')
  })

  it('should clear all entries', async () => {
    const { addEntry, clearAll } = useAuditStore.getState()

    addEntry('session_create', 'Session 1')
    addEntry('message_send', 'Message 1')

    expect(useAuditStore.getState().entries).toHaveLength(2)

    await clearAll()

    expect(useAuditStore.getState().entries).toHaveLength(0)
  })

  it('should apply multiple filters simultaneously', () => {
    const { addEntry, setFilterAction, setSearchQuery, getFilteredEntries } = useAuditStore.getState()

    addEntry('message_send', 'Sent important message')
    addEntry('message_send', 'Sent regular message')
    addEntry('session_create', 'Created important session')

    setFilterAction('message_send')
    setSearchQuery('important')

    const filtered = getFilteredEntries()

    expect(filtered).toHaveLength(1)
    expect(filtered[0].action).toBe('message_send')
    expect(filtered[0].details).toContain('important')
  })
})
