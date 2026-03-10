import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useMessageBuilder } from '../useMessageBuilder'
import { useSessionStore } from '@/entities/session/session.store'
import { useSettingsStore } from '@/entities/settings/settings.store'
import { usePersonaStore } from '@/entities/persona/persona.store'
import { useCompressionStore } from '@/entities/compression/compression.store'
import { routeModel } from '@/shared/lib/providers/router'
import type { Message, PdfAttachment, SpreadsheetAttachment } from '@/shared/types'

// Mock the stores
const mockSessionState = {
  currentSessionId: 'test-session-id',
  messages: {
    'test-session-id': [
      {
        id: 'msg-1',
        sessionId: 'test-session-id',
        role: 'user',
        segments: [{ type: 'text', content: 'Hello' }],
        createdAt: '2024-01-01T00:00:00Z',
      },
      {
        id: 'msg-2',
        sessionId: 'test-session-id',
        role: 'assistant',
        segments: [{ type: 'text', content: 'Hi there' }],
        createdAt: '2024-01-01T00:00:01Z',
      },
    ],
  },
  createSession: vi.fn(),
  addMessage: vi.fn(),
  setSessionStreaming: vi.fn(),
}

vi.mock('@/entities/session/session.store', () => ({
  useSessionStore: Object.assign(
    vi.fn((selector) => selector(mockSessionState)),
    {
      getState: () => mockSessionState,
    }
  ),
}))

vi.mock('@/entities/settings/settings.store', () => ({
  useSettingsStore: vi.fn((selector) => {
    const state = {
      selectedModel: 'claude-3-opus-20240229',
      autoRouting: false,
    }
    return selector(state)
  }),
}))

vi.mock('@/entities/persona/persona.store', () => ({
  usePersonaStore: vi.fn((selector) => {
    const state = {
      getActivePersona: () => ({
        id: 'persona-1',
        name: 'Assistant',
        systemPrompt: 'You are a helpful assistant.',
      }),
    }
    return selector(state)
  }),
}))

vi.mock('@/entities/compression/compression.store', () => ({
  useCompressionStore: {
    getState: () => ({
      enabled: true,
      compressMessages: (messages: any[]) => messages, // No-op for tests
      pruneMessages: (messages: any[]) => messages, // No-op for tests
      recordCompression: vi.fn(),
    }),
  },
}))

vi.mock('@/shared/lib/token-estimator', () => ({
  estimateTokens: vi.fn((text: string) => text.length / 4), // Simple mock
}))

vi.mock('@/shared/lib/providers/router', () => ({
  routeModel: vi.fn(() => 'claude-3-haiku-20240307'),
}))

vi.mock('@/shared/constants', () => ({
  MODELS: [
    {
      id: 'claude-3-opus-20240229',
      provider: 'bedrock',
      cost: { input: 15, output: 75 },
    },
    {
      id: 'claude-3-haiku-20240307',
      provider: 'bedrock',
      cost: { input: 0.25, output: 1.25 },
    },
  ],
}))

describe('useMessageBuilder', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-01T00:00:00Z'))

    // Reset mock state
    mockSessionState.currentSessionId = 'test-session-id'
    mockSessionState.messages = {
      'test-session-id': [
        {
          id: 'msg-1',
          sessionId: 'test-session-id',
          role: 'user',
          segments: [{ type: 'text', content: 'Hello' }],
          createdAt: '2024-01-01T00:00:00Z',
        },
        {
          id: 'msg-2',
          sessionId: 'test-session-id',
          role: 'assistant',
          segments: [{ type: 'text', content: 'Hi there' }],
          createdAt: '2024-01-01T00:00:01Z',
        },
      ],
    }
    mockSessionState.createSession = vi.fn()
    mockSessionState.addMessage = vi.fn()
    mockSessionState.setSessionStreaming = vi.fn()
  })

  it('buildChatContext creates session if none exists', () => {
    const mockCreateSession = vi.fn()
    const mockAddMessage = vi.fn()
    const mockSetSessionStreaming = vi.fn()

    // Override the mock state for this test
    const testState = {
      currentSessionId: null,
      messages: {},
      createSession: mockCreateSession,
      addMessage: mockAddMessage,
      setSessionStreaming: mockSetSessionStreaming,
    }

    vi.mocked(useSessionStore).mockImplementation((selector) => {
      return selector(testState as any)
    })

    // Mock getState to return new session ID after creation
    vi.mocked(useSessionStore).getState = vi.fn(() => ({
      currentSessionId: 'new-session-id',
      messages: {},
    })) as any

    const { result } = renderHook(() => useMessageBuilder())
    const { buildChatContext } = result.current

    const messageText = 'Hello world'
    const result2 = buildChatContext(messageText, null, null, null)

    expect(mockCreateSession).toHaveBeenCalledWith('Hello world')
    expect(result2.sessionId).toBe('new-session-id')
  })

  it('buildChatContext returns sessionId, chatHistory, assistantMessageId', () => {
    // Create a fresh mock for addMessage that updates state
    const mockAddMessage = vi.fn((sessionId, message) => {
      // Update the mock state with the new message
      if (!mockSessionState.messages[sessionId]) {
        mockSessionState.messages[sessionId] = []
      }
      mockSessionState.messages[sessionId].push(message)
    })

    // Override the mock to use our custom addMessage
    vi.mocked(useSessionStore).mockImplementation((selector) => {
      const state = {
        ...mockSessionState,
        addMessage: mockAddMessage,
      }
      return selector(state as any)
    })

    // Ensure getState returns the updated messages dynamically
    vi.mocked(useSessionStore).getState = vi.fn(() => ({
      ...mockSessionState,
      addMessage: mockAddMessage,
    })) as any

    const { result } = renderHook(() => useMessageBuilder())
    const { buildChatContext } = result.current

    const messageText = 'Test message'
    const result2 = buildChatContext(messageText, 'test-session-id', null, null)

    // Verify that messages were added
    expect(mockAddMessage).toHaveBeenCalledTimes(2)

    // Check that user message was added
    expect(mockAddMessage).toHaveBeenCalledWith(
      'test-session-id',
      expect.objectContaining({
        role: 'user',
        segments: [{ type: 'text', content: 'Test message' }],
      })
    )

    expect(result2.sessionId).toBe('test-session-id')
    expect(result2.assistantMessageId).toMatch(/^msg-\d+-assistant$/)

    // The chat history should include the existing messages plus the new user message
    // but NOT the empty assistant message (it gets filtered out)
    expect(result2.chatHistory).toEqual([
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi there' },
      { role: 'user', content: 'Test message' },
    ])
    expect(result2.systemPrompt).toBe('You are a helpful assistant.')
    expect(result2.effectiveModel).toBe('claude-3-opus-20240229')
  })

  it('adds user and assistant messages', () => {
    const mockAddMessage = vi.fn()
    const mockSetSessionStreaming = vi.fn()

    vi.mocked(useSessionStore).mockImplementation((selector) => {
      const state = {
        currentSessionId: 'test-session-id',
        messages: { 'test-session-id': [] },
        createSession: vi.fn(),
        addMessage: mockAddMessage,
        setSessionStreaming: mockSetSessionStreaming,
      }
      return selector(state as any)
    })

    const { result } = renderHook(() => useMessageBuilder())
    const { buildChatContext } = result.current

    buildChatContext('Test message', 'test-session-id', null, null)

    // Should add user message
    expect(mockAddMessage).toHaveBeenCalledWith(
      'test-session-id',
      expect.objectContaining({
        role: 'user',
        segments: [{ type: 'text', content: 'Test message' }],
      })
    )

    // Should add assistant message
    expect(mockAddMessage).toHaveBeenCalledWith(
      'test-session-id',
      expect.objectContaining({
        role: 'assistant',
        segments: [{ type: 'text', content: '' }],
      })
    )

    // Should set streaming
    expect(mockSetSessionStreaming).toHaveBeenCalledWith('test-session-id', true)
  })

  it('applies compression when enabled', () => {
    const mockRecordCompression = vi.fn()
    vi.mocked(useCompressionStore).getState = vi.fn(() => ({
      enabled: true,
      compressMessages: (messages: any[]) => {
        // Simulate compression by reducing messages
        if (messages.length > 2) {
          // Return only last 2 messages (shorter content = fewer tokens)
          return messages.slice(-2)
        }
        return messages
      },
      pruneMessages: (messages: any[]) => messages,
      recordCompression: mockRecordCompression,
    })) as any

    // Set up messages with more than 2 messages
    mockSessionState.messages['test-session-id'] = [
      { id: 'msg-1', role: 'user', segments: [{ type: 'text', content: 'This is a very long first message with lots of content' }] },
      { id: 'msg-2', role: 'assistant', segments: [{ type: 'text', content: 'This is a very long response with lots of content too' }] },
      { id: 'msg-3', role: 'user', segments: [{ type: 'text', content: 'Another long message with content' }] },
      { id: 'msg-4', role: 'assistant', segments: [{ type: 'text', content: 'Final response' }] },
    ] as any

    const { result } = renderHook(() => useMessageBuilder())
    const { buildChatContext } = result.current

    buildChatContext('Test message', 'test-session-id', null, null)

    // Should call recordCompression since messages were compressed
    expect(mockRecordCompression).toHaveBeenCalledWith(
      expect.any(Number), // Saved tokens
      expect.any(Number)  // Cost per token
    )
  })

  it('builds system prompt with PDF attachment', () => {
    const pdfAttachment: PdfAttachment = {
      fileName: 'test.pdf',
      pageCount: 10,
      text: 'PDF content here',
    }

    const { result } = renderHook(() => useMessageBuilder())
    const { buildChatContext } = result.current

    const result2 = buildChatContext('Test message', 'test-session-id', pdfAttachment, null)

    expect(result2.systemPrompt).toContain('You are a helpful assistant.')
    expect(result2.systemPrompt).toContain('[PDF Document: test.pdf (10 pages)]')
    expect(result2.systemPrompt).toContain('PDF content here')
  })

  it('builds system prompt with spreadsheet attachment', () => {
    const spreadsheetAttachment: SpreadsheetAttachment = {
      fileName: 'data.xlsx',
      sheets: [],
      summary: 'Spreadsheet contains sales data for Q1 2024',
    }

    const { result } = renderHook(() => useMessageBuilder())
    const { buildChatContext } = result.current

    const result2 = buildChatContext('Test message', 'test-session-id', null, spreadsheetAttachment)

    expect(result2.systemPrompt).toContain('You are a helpful assistant.')
    expect(result2.systemPrompt).toContain('Spreadsheet contains sales data for Q1 2024')
  })

  it('uses auto-routing when enabled', () => {
    vi.mocked(useSettingsStore).mockImplementation((selector) => {
      const state = {
        selectedModel: 'claude-3-opus-20240229',
        autoRouting: true,
      }
      return selector(state as any)
    })

    const { result } = renderHook(() => useMessageBuilder())
    const { buildChatContext } = result.current

    const result2 = buildChatContext('Test message', 'test-session-id', null, null)

    expect(result2.effectiveModel).toBe('claude-3-haiku-20240307') // Routed model
  })

  it('handles no existing messages in session', () => {
    const testState = {
      currentSessionId: 'empty-session',
      messages: {}, // No messages for this session
      createSession: vi.fn(),
      addMessage: vi.fn((sessionId: string, message: any) => {
        if (!testState.messages[sessionId]) {
          testState.messages[sessionId] = []
        }
        testState.messages[sessionId].push(message)
      }),
      setSessionStreaming: vi.fn(),
    }

    vi.mocked(useSessionStore).mockImplementation((selector) => {
      return selector(testState as any)
    })

    vi.mocked(useSessionStore).getState = vi.fn(() => testState) as any

    const { result } = renderHook(() => useMessageBuilder())
    const { buildChatContext } = result.current

    const result2 = buildChatContext('Test message', 'empty-session', null, null)

    expect(result2.chatHistory).toEqual([
      { role: 'user', content: 'Test message' },
    ])
  })

  it('filters out empty content messages from history', () => {
    const testState = {
      currentSessionId: 'test-session-id',
      messages: {
        'test-session-id': [
          {
            id: 'msg-1',
            role: 'user',
            segments: [{ type: 'text', content: 'Hello' }],
          },
          {
            id: 'msg-2',
            role: 'assistant',
            segments: [{ type: 'text', content: '' }], // Empty content
          },
          {
            id: 'msg-3',
            role: 'user',
            segments: [{ type: 'tool', toolCalls: [] }], // No text segment
          },
        ],
      },
      createSession: vi.fn(),
      addMessage: vi.fn((sessionId: string, message: any) => {
        testState.messages[sessionId].push(message)
      }),
      setSessionStreaming: vi.fn(),
    }

    vi.mocked(useSessionStore).mockImplementation((selector) => {
      return selector(testState as any)
    })

    vi.mocked(useSessionStore).getState = vi.fn(() => testState) as any

    const { result } = renderHook(() => useMessageBuilder())
    const { buildChatContext } = result.current

    const result2 = buildChatContext('Test message', 'test-session-id', null, null)

    // Should only include messages with non-empty text content
    expect(result2.chatHistory).toEqual([
      { role: 'user', content: 'Hello' },
      { role: 'user', content: 'Test message' },
    ])
  })
})