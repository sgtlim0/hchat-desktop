import { describe, it, expect, vi, beforeEach } from 'vitest'
import { parseProxySSE } from '../proxy-sse'

function createMockReadableStream(chunks: string[]) {
  let index = 0
  return {
    getReader: () => ({
      read: async () => {
        if (index >= chunks.length) {
          return { done: true, value: undefined }
        }
        const value = new TextEncoder().encode(chunks[index++])
        return { done: false, value }
      },
      releaseLock: vi.fn(),
    }),
  }
}

describe('parseProxySSE', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('should parse text events from SSE stream', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      body: createMockReadableStream([
        'data: {"type":"text","content":"Hello"}\n\n',
        'data: {"type":"text","content":" World"}\n\n',
        'data: {"type":"done"}\n\n',
      ]),
    })

    const events = []
    for await (const event of parseProxySSE('/api/chat', {})) {
      events.push(event)
    }

    expect(events).toHaveLength(3)
    expect(events[0]).toEqual({ type: 'text', content: 'Hello' })
    expect(events[1]).toEqual({ type: 'text', content: ' World' })
    expect(events[2]).toEqual({ type: 'done' })
  })

  it('should yield error event on HTTP error', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    })

    const events = []
    for await (const event of parseProxySSE('/api/chat', {})) {
      events.push(event)
    }

    expect(events).toHaveLength(1)
    expect(events[0].type).toBe('error')
    expect(events[0].error).toContain('500')
  })

  it('should yield error when no response body', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      body: null,
    })

    const events = []
    for await (const event of parseProxySSE('/api/chat', {})) {
      events.push(event)
    }

    expect(events).toHaveLength(1)
    expect(events[0]).toEqual({ type: 'error', error: 'No response body' })
  })

  it('should handle usage events', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      body: createMockReadableStream([
        'data: {"type":"text","content":"Hi"}\n\ndata: {"type":"usage","inputTokens":10,"outputTokens":5}\n\ndata: {"type":"done"}\n\n',
      ]),
    })

    const events = []
    for await (const event of parseProxySSE('/api/chat', {})) {
      events.push(event)
    }

    expect(events).toHaveLength(3)
    expect(events[0]).toEqual({ type: 'text', content: 'Hi' })
    expect(events[1]).toEqual({ type: 'usage', inputTokens: 10, outputTokens: 5 })
    expect(events[2]).toEqual({ type: 'done' })
  })

  it('should stop on error event from stream', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      body: createMockReadableStream([
        'data: {"type":"text","content":"partial"}\n\n',
        'data: {"type":"error","error":"model overloaded"}\n\n',
        'data: {"type":"text","content":"should not appear"}\n\n',
      ]),
    })

    const events = []
    for await (const event of parseProxySSE('/api/chat', {})) {
      events.push(event)
    }

    expect(events).toHaveLength(2)
    expect(events[1]).toEqual({ type: 'error', error: 'model overloaded' })
  })

  it('should skip malformed JSON lines', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      body: createMockReadableStream([
        'data: {"type":"text","content":"ok"}\n\ndata: {broken json\n\ndata: {"type":"done"}\n\n',
      ]),
    })

    const events = []
    for await (const event of parseProxySSE('/api/chat', {})) {
      events.push(event)
    }

    expect(events).toHaveLength(2)
    expect(events[0]).toEqual({ type: 'text', content: 'ok' })
    expect(events[1]).toEqual({ type: 'done' })
  })

  it('should handle fetch network error', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Failed to fetch'))

    const events = []
    for await (const event of parseProxySSE('/api/chat', {})) {
      events.push(event)
    }

    expect(events).toHaveLength(1)
    expect(events[0]).toEqual({ type: 'error', error: 'Failed to fetch' })
  })

  it('should handle chunked data split across reads', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      body: createMockReadableStream([
        'data: {"type":"text",',
        '"content":"split"}\n\ndata: {"type":"done"}\n\n',
      ]),
    })

    const events = []
    for await (const event of parseProxySSE('/api/chat', {})) {
      events.push(event)
    }

    expect(events).toHaveLength(2)
    expect(events[0]).toEqual({ type: 'text', content: 'split' })
    expect(events[1]).toEqual({ type: 'done' })
  })
})
