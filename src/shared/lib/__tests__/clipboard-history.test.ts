import { describe, it, expect, beforeEach } from 'vitest'
import { clipboardHistory } from '../clipboard-history'

describe('ClipboardHistory', () => {
  beforeEach(() => {
    clipboardHistory.clearHistory()
  })

  it('adds entry to history', () => {
    const entry = clipboardHistory.addEntry('test content', 'manual')

    expect(entry.id).toBeTruthy()
    expect(entry.content).toBe('test content')
    expect(entry.source).toBe('manual')
    expect(entry.createdAt).toBeTruthy()

    const history = clipboardHistory.getHistory()
    expect(history).toHaveLength(1)
    expect(history[0]).toEqual(entry)
  })

  it('maintains history in newest-first order', () => {
    const entry1 = clipboardHistory.addEntry('first')
    const entry2 = clipboardHistory.addEntry('second')
    const entry3 = clipboardHistory.addEntry('third')

    const history = clipboardHistory.getHistory()
    expect(history).toHaveLength(3)
    expect(history[0]).toEqual(entry3)
    expect(history[1]).toEqual(entry2)
    expect(history[2]).toEqual(entry1)
  })

  it('enforces max 30 entries with FIFO eviction', () => {
    // Add 35 entries
    for (let i = 1; i <= 35; i++) {
      clipboardHistory.addEntry(`entry ${i}`)
    }

    const history = clipboardHistory.getHistory()
    expect(history).toHaveLength(30)

    // Newest entry should be first
    expect(history[0].content).toBe('entry 35')
    // Oldest surviving entry should be last
    expect(history[29].content).toBe('entry 6')

    // First 5 entries should be evicted
    expect(history.find(e => e.content === 'entry 1')).toBeUndefined()
    expect(history.find(e => e.content === 'entry 5')).toBeUndefined()
  })

  it('returns a copy of history to prevent external mutations', () => {
    clipboardHistory.addEntry('test')

    const history1 = clipboardHistory.getHistory()
    const history2 = clipboardHistory.getHistory()

    expect(history1).not.toBe(history2)
    expect(history1).toEqual(history2)

    // Mutation test
    history1[0] = { id: 'hacked', content: 'modified', createdAt: 'now' }
    const history3 = clipboardHistory.getHistory()
    expect(history3[0].content).toBe('test')
  })

  it('clears all history', () => {
    clipboardHistory.addEntry('entry1')
    clipboardHistory.addEntry('entry2')
    clipboardHistory.addEntry('entry3')

    expect(clipboardHistory.getHistory()).toHaveLength(3)

    clipboardHistory.clearHistory()

    expect(clipboardHistory.getHistory()).toHaveLength(0)
    expect(clipboardHistory.getEntryCount()).toBe(0)
  })

  it('removes entry by id', () => {
    const entry1 = clipboardHistory.addEntry('keep1')
    const entry2 = clipboardHistory.addEntry('remove')
    const entry3 = clipboardHistory.addEntry('keep2')

    clipboardHistory.removeEntry(entry2.id)

    const history = clipboardHistory.getHistory()
    expect(history).toHaveLength(2)
    expect(history.find(e => e.id === entry1.id)).toBeTruthy()
    expect(history.find(e => e.id === entry2.id)).toBeUndefined()
    expect(history.find(e => e.id === entry3.id)).toBeTruthy()
  })

  it('searches history by content (case-insensitive)', () => {
    clipboardHistory.addEntry('Hello World')
    clipboardHistory.addEntry('JavaScript code')
    clipboardHistory.addEntry('hello there')
    clipboardHistory.addEntry('Python script')

    const results = clipboardHistory.search('hello')
    expect(results).toHaveLength(2)
    expect(results[0].content).toBe('hello there')
    expect(results[1].content).toBe('Hello World')

    const codeResults = clipboardHistory.search('CODE')
    expect(codeResults).toHaveLength(1)
    expect(codeResults[0].content).toBe('JavaScript code')

    const noResults = clipboardHistory.search('xyz')
    expect(noResults).toHaveLength(0)
  })

  it('skips duplicate if same as last entry', () => {
    const entry1 = clipboardHistory.addEntry('unique')
    const entry2 = clipboardHistory.addEntry('duplicate')
    const entry3 = clipboardHistory.addEntry('duplicate')

    const history = clipboardHistory.getHistory()
    expect(history).toHaveLength(2)
    expect(history[0]).toEqual(entry2)
    expect(history[1]).toEqual(entry1)

    // Should return the existing entry
    expect(entry3).toEqual(entry2)
  })

  it('allows duplicate if not consecutive', () => {
    clipboardHistory.addEntry('content1')
    clipboardHistory.addEntry('content2')
    clipboardHistory.addEntry('content1')

    const history = clipboardHistory.getHistory()
    expect(history).toHaveLength(3)
    expect(history[0].content).toBe('content1')
    expect(history[1].content).toBe('content2')
    expect(history[2].content).toBe('content1')
  })

  it('returns accurate entry count', () => {
    expect(clipboardHistory.getEntryCount()).toBe(0)

    clipboardHistory.addEntry('entry1')
    expect(clipboardHistory.getEntryCount()).toBe(1)

    clipboardHistory.addEntry('entry2')
    clipboardHistory.addEntry('entry3')
    expect(clipboardHistory.getEntryCount()).toBe(3)

    const entry = clipboardHistory.addEntry('entry4')
    clipboardHistory.removeEntry(entry.id)
    expect(clipboardHistory.getEntryCount()).toBe(3)

    clipboardHistory.clearHistory()
    expect(clipboardHistory.getEntryCount()).toBe(0)
  })

  it('exports history as formatted JSON', () => {
    const entry1 = clipboardHistory.addEntry('first', 'manual')
    const entry2 = clipboardHistory.addEntry('second', 'paste')

    const json = clipboardHistory.exportHistory()
    const parsed = JSON.parse(json)

    expect(parsed).toHaveProperty('version')
    expect(parsed).toHaveProperty('exportedAt')
    expect(parsed).toHaveProperty('count', 2)
    expect(parsed).toHaveProperty('entries')
    expect(parsed.entries).toHaveLength(2)

    expect(parsed.entries[0]).toEqual({
      id: entry2.id,
      content: 'second',
      source: 'paste',
      createdAt: entry2.createdAt
    })

    expect(parsed.entries[1]).toEqual({
      id: entry1.id,
      content: 'first',
      source: 'manual',
      createdAt: entry1.createdAt
    })
  })

  it('handles empty history export', () => {
    const json = clipboardHistory.exportHistory()
    const parsed = JSON.parse(json)

    expect(parsed.count).toBe(0)
    expect(parsed.entries).toHaveLength(0)
  })

  it('handles removeEntry with invalid id gracefully', () => {
    clipboardHistory.addEntry('test')

    // Should not throw
    expect(() => clipboardHistory.removeEntry('invalid-id')).not.toThrow()

    // History should remain unchanged
    expect(clipboardHistory.getHistory()).toHaveLength(1)
  })

  it('handles edge cases for search', () => {
    clipboardHistory.addEntry('test')

    // Empty query returns all
    const allResults = clipboardHistory.search('')
    expect(allResults).toHaveLength(1)

    // Whitespace-only query returns all
    const whitespaceResults = clipboardHistory.search('   ')
    expect(whitespaceResults).toHaveLength(1)

    // Special characters
    clipboardHistory.addEntry('test@email.com')
    const specialResults = clipboardHistory.search('@email')
    expect(specialResults).toHaveLength(1)
  })
})