import { describe, it, expect } from 'vitest'
import {
  detectSource,
  importFromAnySource,
  parseImportJson,
  readFileAsText,
  type ImportSource,
} from '../import-chat'

describe('detectSource', () => {
  it('returns chatgpt for array with mapping', () => {
    const data = [
      {
        title: 'Test Chat',
        mapping: {
          node1: {
            message: {
              author: { role: 'user' },
              content: { parts: ['Hello'] },
            },
          },
        },
      },
    ]

    expect(detectSource(data)).toBe('chatgpt' as ImportSource)
  })

  it('returns claude for object with chat_messages', () => {
    const data = {
      name: 'Test Chat',
      chat_messages: [
        { sender: 'human', text: 'Hello' },
      ],
    }

    expect(detectSource(data)).toBe('claude' as ImportSource)
  })

  it('returns hchat for object with session and messages', () => {
    const data = {
      session: {
        id: 'session-1',
        title: 'Test',
        modelId: 'gpt-4o',
        createdAt: '2026-03-02T00:00:00Z',
        updatedAt: '2026-03-02T00:00:00Z',
        tags: [],
      },
      messages: [],
    }

    expect(detectSource(data)).toBe('hchat' as ImportSource)
  })

  it('returns unknown for unrecognized format', () => {
    const data = { foo: 'bar' }
    expect(detectSource(data)).toBe('unknown' as ImportSource)
  })

  it('returns unknown for null', () => {
    expect(detectSource(null)).toBe('unknown' as ImportSource)
  })

  it('returns unknown for primitive types', () => {
    expect(detectSource('string')).toBe('unknown' as ImportSource)
    expect(detectSource(123)).toBe('unknown' as ImportSource)
  })

  it('returns unknown for empty array', () => {
    expect(detectSource([])).toBe('unknown' as ImportSource)
  })
})

describe('importFromAnySource', () => {
  it('converts ChatGPT format correctly', () => {
    const chatgptData = JSON.stringify([
      {
        title: 'ChatGPT Import',
        create_time: 1709337600,
        mapping: {
          node1: {
            message: {
              author: { role: 'user' },
              content: { parts: ['Hello'] },
              create_time: 1709337600,
            },
          },
          node2: {
            message: {
              author: { role: 'assistant' },
              content: { parts: ['Hi there!'] },
              create_time: 1709337610,
            },
          },
        },
      },
    ])

    const result = importFromAnySource(chatgptData)

    expect(result.session.title).toBe('ChatGPT Import')
    expect(result.session.modelId).toBe('gpt-4o')
    expect(result.session.tags).toContain('imported')
    expect(result.session.tags).toContain('chatgpt')
    expect(result.messages).toHaveLength(2)
    expect(result.messages[0].role).toBe('user')
    expect(result.messages[0].segments[0].content).toBe('Hello')
    expect(result.messages[1].role).toBe('assistant')
    expect(result.messages[1].segments[0].content).toBe('Hi there!')
  })

  it('converts Claude format correctly', () => {
    const claudeData = JSON.stringify({
      name: 'Claude Import',
      created_at: '2026-03-02T00:00:00Z',
      chat_messages: [
        { sender: 'human', text: 'Hello', created_at: '2026-03-02T00:00:00Z' },
        { sender: 'assistant', text: 'Hi!', created_at: '2026-03-02T00:01:00Z' },
      ],
    })

    const result = importFromAnySource(claudeData)

    expect(result.session.title).toBe('Claude Import')
    expect(result.session.modelId).toBe('anthropic.claude-sonnet-v2')
    expect(result.session.tags).toContain('imported')
    expect(result.session.tags).toContain('claude')
    expect(result.messages).toHaveLength(2)
    expect(result.messages[0].role).toBe('user')
    expect(result.messages[0].segments[0].content).toBe('Hello')
    expect(result.messages[1].role).toBe('assistant')
    expect(result.messages[1].segments[0].content).toBe('Hi!')
  })

  it('parses H Chat format correctly', () => {
    const hchatData = JSON.stringify({
      session: {
        id: 'session-1',
        title: 'Test Session',
        modelId: 'gpt-4o',
        isFavorite: false,
        isStreaming: false,
        pinned: false,
        tags: ['test'],
        createdAt: '2026-03-02T00:00:00Z',
        updatedAt: '2026-03-02T00:00:00Z',
      },
      messages: [
        {
          id: 'msg-1',
          sessionId: 'session-1',
          role: 'user',
          segments: [{ type: 'text', content: 'Hello' }],
          createdAt: '2026-03-02T00:00:00Z',
        },
      ],
    })

    const result = importFromAnySource(hchatData)

    expect(result.session.title).toBe('Test Session')
    expect(result.session.modelId).toBe('gpt-4o')
    expect(result.messages).toHaveLength(1)
    expect(result.messages[0].role).toBe('user')
  })

  it('throws for unsupported format', () => {
    const invalidData = JSON.stringify({ foo: 'bar' })

    expect(() => importFromAnySource(invalidData)).toThrow('Unsupported import format')
  })

  it('throws for invalid JSON', () => {
    expect(() => importFromAnySource('invalid json')).toThrow()
  })

  it('converts ChatGPT with multiline content', () => {
    const chatgptData = JSON.stringify([
      {
        title: 'Test',
        mapping: {
          node1: {
            message: {
              author: { role: 'user' },
              content: { parts: ['Line 1', 'Line 2', 'Line 3'] },
              create_time: 1709337600,
            },
          },
        },
      },
    ])

    const result = importFromAnySource(chatgptData)

    expect(result.messages[0].segments[0].content).toBe('Line 1\nLine 2\nLine 3')
  })

  it('filters out empty ChatGPT messages', () => {
    const chatgptData = JSON.stringify([
      {
        title: 'Test',
        mapping: {
          node1: {
            message: {
              author: { role: 'system' },
              content: { parts: [] },
            },
          },
          node2: {
            message: {
              author: { role: 'user' },
              content: { parts: ['Hello'] },
            },
          },
        },
      },
    ])

    const result = importFromAnySource(chatgptData)

    expect(result.messages).toHaveLength(1)
    expect(result.messages[0].role).toBe('user')
  })

  it('filters out empty Claude messages', () => {
    const claudeData = JSON.stringify({
      name: 'Test',
      chat_messages: [
        { sender: null, text: 'Should be filtered' },
        { sender: 'human', text: null },
        { sender: 'human', text: 'Valid message' },
      ],
    })

    const result = importFromAnySource(claudeData)

    expect(result.messages).toHaveLength(1)
    expect(result.messages[0].segments[0].content).toBe('Valid message')
  })
})

describe('parseImportJson', () => {
  it('validates session structure', () => {
    const validJson = JSON.stringify({
      session: {
        id: 'session-1',
        title: 'Test',
        modelId: 'gpt-4o',
        isFavorite: false,
        isStreaming: false,
        pinned: false,
        tags: [],
        createdAt: '2026-03-02T00:00:00Z',
        updatedAt: '2026-03-02T00:00:00Z',
      },
      messages: [],
    })

    const result = parseImportJson(validJson)

    expect(result.session).toBeDefined()
    expect(result.session.title).toBe('Test')
    expect(result.messages).toEqual([])
  })

  it('throws for invalid JSON structure', () => {
    expect(() => parseImportJson('null')).toThrow('Invalid JSON structure')
    expect(() => parseImportJson('"string"')).toThrow('Invalid JSON structure')
  })

  it('throws for missing session', () => {
    const json = JSON.stringify({ messages: [] })
    expect(() => parseImportJson(json)).toThrow('Invalid session data')
  })

  it('throws for invalid session data', () => {
    const json = JSON.stringify({
      session: { id: 'test' }, // Missing required fields
      messages: [],
    })
    expect(() => parseImportJson(json)).toThrow('Invalid session data')
  })

  it('throws for non-array messages', () => {
    const json = JSON.stringify({
      session: {
        id: 'session-1',
        title: 'Test',
        modelId: 'gpt-4o',
        createdAt: '2026-03-02T00:00:00Z',
        updatedAt: '2026-03-02T00:00:00Z',
        tags: [],
      },
      messages: 'not-an-array',
    })
    expect(() => parseImportJson(json)).toThrow('Invalid messages data')
  })

  it('throws for invalid message data', () => {
    const json = JSON.stringify({
      session: {
        id: 'session-1',
        title: 'Test',
        modelId: 'gpt-4o',
        createdAt: '2026-03-02T00:00:00Z',
        updatedAt: '2026-03-02T00:00:00Z',
        tags: [],
      },
      messages: [
        { id: 'msg-1' }, // Missing required fields
      ],
    })
    expect(() => parseImportJson(json)).toThrow('Invalid message data')
  })

  it('generates new session ID to avoid collisions', () => {
    const json = JSON.stringify({
      session: {
        id: 'original-id',
        title: 'Test',
        modelId: 'gpt-4o',
        isFavorite: false,
        isStreaming: false,
        pinned: false,
        tags: [],
        createdAt: '2026-03-02T00:00:00Z',
        updatedAt: '2026-03-02T00:00:00Z',
      },
      messages: [],
    })

    const result = parseImportJson(json)

    expect(result.session.id).not.toBe('original-id')
    expect(result.session.id).toMatch(/^session-\d+-imported$/)
  })

  it('generates new message IDs and updates sessionId', () => {
    const json = JSON.stringify({
      session: {
        id: 'session-1',
        title: 'Test',
        modelId: 'gpt-4o',
        isFavorite: false,
        isStreaming: false,
        pinned: false,
        tags: [],
        createdAt: '2026-03-02T00:00:00Z',
        updatedAt: '2026-03-02T00:00:00Z',
      },
      messages: [
        {
          id: 'original-msg-1',
          sessionId: 'session-1',
          role: 'user',
          segments: [{ type: 'text', content: 'Hello' }],
          createdAt: '2026-03-02T00:00:00Z',
        },
      ],
    })

    const result = parseImportJson(json)

    expect(result.messages[0].id).not.toBe('original-msg-1')
    expect(result.messages[0].id).toMatch(/^msg-\d+-import-0$/)
    expect(result.messages[0].sessionId).toBe(result.session.id)
  })

  it('sets isStreaming to false', () => {
    const json = JSON.stringify({
      session: {
        id: 'session-1',
        title: 'Test',
        modelId: 'gpt-4o',
        isFavorite: false,
        isStreaming: true, // Will be overridden
        pinned: false,
        tags: [],
        createdAt: '2026-03-02T00:00:00Z',
        updatedAt: '2026-03-02T00:00:00Z',
      },
      messages: [],
    })

    const result = parseImportJson(json)

    expect(result.session.isStreaming).toBe(false)
  })

  it('preserves createdAt but updates updatedAt', () => {
    const originalCreated = '2025-01-01T00:00:00Z'
    const json = JSON.stringify({
      session: {
        id: 'session-1',
        title: 'Test',
        modelId: 'gpt-4o',
        isFavorite: false,
        isStreaming: false,
        pinned: false,
        tags: [],
        createdAt: originalCreated,
        updatedAt: '2025-01-01T00:00:00Z',
      },
      messages: [],
    })

    const result = parseImportJson(json)

    expect(result.session.createdAt).toBe(originalCreated)
    expect(result.session.updatedAt).not.toBe(originalCreated)
  })
})

describe('readFileAsText', () => {
  it('returns file content as string', async () => {
    const content = 'test content'
    const file = new File([content], 'test.txt', { type: 'text/plain' })

    const result = await readFileAsText(file)

    expect(result).toBe(content)
  })

  it('handles JSON files', async () => {
    const content = JSON.stringify({ test: 'data' })
    const file = new File([content], 'test.json', { type: 'application/json' })

    const result = await readFileAsText(file)

    expect(result).toBe(content)
    expect(JSON.parse(result)).toEqual({ test: 'data' })
  })

  it('rejects on file read error', async () => {
    const file = new File([], 'test.txt')
    // Mock FileReader to trigger error
    const originalFileReader = global.FileReader
    global.FileReader = class MockFileReader {
      onerror: ((error: unknown) => void) | null = null
      readAsText() {
        setTimeout(() => {
          if (this.onerror) {
            this.onerror(new Error('Mock error'))
          }
        }, 0)
      }
    } as unknown as typeof FileReader

    await expect(readFileAsText(file)).rejects.toThrow('Failed to read file')

    global.FileReader = originalFileReader
  })
})
