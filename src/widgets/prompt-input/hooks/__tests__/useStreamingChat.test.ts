import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useStreamingChat } from '../useStreamingChat'
import { useSessionStore } from '@/entities/session/session.store'
import { useSettingsStore } from '@/entities/settings/settings.store'
import { createStream, getProviderConfig } from '@/shared/lib/providers/factory'
import { putMessage } from '@/shared/lib/db'

// Mock the stores
vi.mock('@/entities/session/session.store', () => ({
  useSessionStore: vi.fn((selector) => {
    const state = {
      messages: {
        'test-session': [
          {
            id: 'msg-assistant',
            role: 'assistant',
            segments: [{ type: 'text', content: '' }],
          },
        ],
      },
      updateLastMessage: vi.fn(),
      setSessionStreaming: vi.fn(),
    }
    return selector(state)
  }),
}))

vi.mock('@/entities/settings/settings.store', () => ({
  useSettingsStore: vi.fn((selector) => {
    const state = {
      credentials: {
        awsAccessKeyId: 'test-key',
        awsSecretAccessKey: 'test-secret',
        awsRegion: 'us-east-1',
      },
      openaiApiKey: 'sk-test-openai',
      geminiApiKey: 'test-gemini-key',
    }
    return selector(state)
  }),
}))

vi.mock('@/shared/i18n', () => ({
  useTranslation: () => ({
    t: (key: string, vars?: any) => {
      if (key === 'chat.errorOccurred') {
        return `Error occurred: ${vars?.error || 'Unknown'}`
      }
      return key
    },
  }),
}))

vi.mock('@/shared/lib/providers/factory', () => ({
  getProviderConfig: vi.fn(() => ({
    provider: 'bedrock',
    credentials: {
      awsAccessKeyId: 'test-key',
      awsSecretAccessKey: 'test-secret',
      awsRegion: 'us-east-1',
    },
  })),
  createStream: vi.fn(),
}))

vi.mock('@/shared/lib/stream-throttle', () => ({
  createStreamThrottle: () => ({
    update: vi.fn((text, callback) => callback(text)),
    flush: vi.fn((callback) => callback('')),
  }),
}))

vi.mock('@/shared/lib/db', () => ({
  putMessage: vi.fn(() => Promise.resolve()),
}))

describe('useStreamingChat', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('streamResponse starts streaming and returns full text', async () => {
    const mockUpdateLastMessage = vi.fn()
    const mockSetSessionStreaming = vi.fn()

    vi.mocked(useSessionStore).mockImplementation((selector) => {
      const state = {
        messages: {
          'test-session': [
            {
              id: 'msg-assistant',
              role: 'assistant',
              segments: [{ type: 'text', content: '' }],
            },
          ],
        },
        updateLastMessage: mockUpdateLastMessage,
        setSessionStreaming: mockSetSessionStreaming,
      }
      return selector(state as any)
    })

    // Mock the stream
    const mockStream = async function* () {
      yield { type: 'text', content: 'Hello ' }
      yield { type: 'text', content: 'world!' }
      yield { type: 'usage', inputTokens: 10, outputTokens: 5 }
      yield { type: 'done' }
    }

    vi.mocked(createStream).mockReturnValue(mockStream() as any)

    // Mock getState for final message persistence
    vi.mocked(useSessionStore).getState = vi.fn(() => ({
      messages: {
        'test-session': [
          {
            id: 'msg-assistant',
            role: 'assistant',
            segments: [{ type: 'text', content: 'Hello world!' }],
          },
        ],
      },
    })) as any

    const { result } = renderHook(() => useStreamingChat())

    const response = await act(async () => {
      return await result.current.streamResponse(
        'test-session',
        'msg-assistant',
        [{ role: 'user', content: 'Hi' }],
        'claude-3-opus-20240229',
        'You are helpful'
      )
    })

    expect(response.fullText).toBe('Hello world!')
    expect(response.inputTokens).toBe(10)
    expect(response.outputTokens).toBe(5)

    // Check that streaming was set to false (true is set by useMessageBuilder, not this hook)
    expect(mockSetSessionStreaming).toHaveBeenCalledWith('test-session', false)
    expect(mockUpdateLastMessage).toHaveBeenCalled()
  })

  it('streamResponse handles errors gracefully', async () => {
    const mockUpdateLastMessage = vi.fn()

    vi.mocked(useSessionStore).mockImplementation((selector) => {
      const state = {
        messages: {},
        updateLastMessage: mockUpdateLastMessage,
        setSessionStreaming: vi.fn(),
      }
      return selector(state as any)
    })

    // Mock stream that throws error immediately (before yielding text)
    const mockStream = async function* () {
      throw new Error('Network error')
    }

    vi.mocked(createStream).mockReturnValue(mockStream() as any)

    vi.mocked(useSessionStore).getState = vi.fn(() => ({
      messages: {},
    })) as any

    const { result } = renderHook(() => useStreamingChat())

    const response = await act(async () => {
      return await result.current.streamResponse(
        'test-session',
        'msg-assistant',
        [{ role: 'user', content: 'Hi' }],
        'claude-3-opus-20240229'
      )
    })

    // The error handler should have set the error message
    expect(response.fullText).toBe('Error occurred: Network error')
    expect(mockUpdateLastMessage).toHaveBeenCalledWith(
      'test-session',
      'msg-assistant',
      expect.any(Function)
    )
  })

  it('streamResponse handles abort (DOMException)', async () => {
    const mockSetSessionStreaming = vi.fn()

    vi.mocked(useSessionStore).mockImplementation((selector) => {
      const state = {
        messages: {},
        updateLastMessage: vi.fn(),
        setSessionStreaming: mockSetSessionStreaming,
      }
      return selector(state as any)
    })

    // Mock stream that throws AbortError
    const mockStream = async function* () {
      const error = new DOMException('Aborted')
      Object.defineProperty(error, 'name', { value: 'AbortError' })
      throw error
    }

    vi.mocked(createStream).mockReturnValue(mockStream() as any)

    vi.mocked(useSessionStore).getState = vi.fn(() => ({
      messages: {},
    })) as any

    const { result } = renderHook(() => useStreamingChat())

    const response = await act(async () => {
      return await result.current.streamResponse(
        'test-session',
        'msg-assistant',
        [],
        'claude-3-opus-20240229'
      )
    })

    // Should return empty response on abort
    expect(response.fullText).toBe('')
    expect(response.inputTokens).toBeNull()
    expect(response.outputTokens).toBeNull()

    // Should still clean up streaming state
    expect(mockSetSessionStreaming).toHaveBeenCalledWith('test-session', false)
  })

  it('abortStream terminates the stream', async () => {
    const { result } = renderHook(() => useStreamingChat())

    // Start a stream first to set abortRef
    const mockStream = async function* () {
      await new Promise(resolve => setTimeout(resolve, 100)) // Keep stream open
      yield { type: 'text', content: 'Test' }
    }

    vi.mocked(createStream).mockReturnValue(mockStream() as any)

    vi.mocked(useSessionStore).getState = vi.fn(() => ({
      messages: {},
    })) as any

    // Start streaming in the background
    const streamPromise = result.current.streamResponse(
      'test-session',
      'msg-assistant',
      [],
      'claude-3-opus-20240229'
    )

    // Give it a moment to start
    await new Promise(resolve => setTimeout(resolve, 10))

    // Now abort it
    act(() => {
      result.current.abortStream()
    })

    // Wait for the stream to complete
    await streamPromise

    // The stream should have been aborted
    expect(result.current.isStreaming()).toBe(false)
  })

  it('persists final message to IndexedDB', async () => {
    const mockPutMessage = vi.mocked(await import('@/shared/lib/db')).putMessage

    vi.mocked(useSessionStore).getState = vi.fn(() => ({
      messages: {
        'test-session': [
          {
            id: 'msg-assistant',
            role: 'assistant',
            segments: [{ type: 'text', content: 'Final message' }],
          },
        ],
      },
    })) as any

    const mockStream = async function* () {
      yield { type: 'text', content: 'Final message' }
      yield { type: 'done' }
    }

    vi.mocked(createStream).mockReturnValue(mockStream() as any)

    const { result } = renderHook(() => useStreamingChat())

    await act(async () => {
      await result.current.streamResponse(
        'test-session',
        'msg-assistant',
        [],
        'claude-3-opus-20240229'
      )
    })

    expect(mockPutMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'msg-assistant',
        segments: [{ type: 'text', content: 'Final message' }],
      })
    )
  })

  it('handles error events in stream', async () => {
    const mockUpdateLastMessage = vi.fn()

    vi.mocked(useSessionStore).mockImplementation((selector) => {
      const state = {
        messages: {},
        updateLastMessage: mockUpdateLastMessage,
        setSessionStreaming: vi.fn(),
      }
      return selector(state as any)
    })

    const mockStream = async function* () {
      yield { type: 'text', content: 'Start' }
      yield { type: 'error', error: 'API rate limit exceeded' }
    }

    vi.mocked(createStream).mockReturnValue(mockStream() as any)

    vi.mocked(useSessionStore).getState = vi.fn(() => ({
      messages: {},
    })) as any

    const { result } = renderHook(() => useStreamingChat())

    const response = await act(async () => {
      return await result.current.streamResponse(
        'test-session',
        'msg-assistant',
        [],
        'claude-3-opus-20240229'
      )
    })

    expect(response.fullText).toBe('Error occurred: API rate limit exceeded')
  })

  it('isStreaming returns correct state', async () => {
    const { result } = renderHook(() => useStreamingChat())

    // Initially not streaming
    expect(result.current.isStreaming()).toBe(false)

    // Start a stream to set abortRef
    const mockStream = async function* () {
      await new Promise(resolve => setTimeout(resolve, 100)) // Keep stream open
      yield { type: 'text', content: 'Test' }
    }

    vi.mocked(createStream).mockReturnValue(mockStream() as any)

    vi.mocked(useSessionStore).getState = vi.fn(() => ({
      messages: {},
    })) as any

    // Start streaming in the background
    const streamPromise = result.current.streamResponse(
      'test-session',
      'msg-assistant',
      [],
      'claude-3-opus-20240229'
    )

    // Give it a moment to start
    await new Promise(resolve => setTimeout(resolve, 10))

    // Should be streaming now
    expect(result.current.isStreaming()).toBe(true)

    // Abort the stream
    act(() => {
      result.current.abortStream()
    })

    // Wait for completion
    await streamPromise

    // Should not be streaming anymore
    expect(result.current.isStreaming()).toBe(false)
  })

  it('passes system prompt to createStream', async () => {
    const mockCreateStream = vi.mocked(createStream)

    const mockStream = async function* () {
      yield { type: 'text', content: 'Response' }
      yield { type: 'done' }
    }

    mockCreateStream.mockReturnValue(mockStream() as any)

    vi.mocked(useSessionStore).getState = vi.fn(() => ({
      messages: {},
    })) as any

    const { result } = renderHook(() => useStreamingChat())

    await act(async () => {
      await result.current.streamResponse(
        'test-session',
        'msg-assistant',
        [{ role: 'user', content: 'Hello' }],
        'claude-3-opus-20240229',
        'You are a helpful assistant'
      )
    })

    expect(mockCreateStream).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        modelId: 'claude-3-opus-20240229',
        messages: [{ role: 'user', content: 'Hello' }],
        system: 'You are a helpful assistant',
        signal: expect.any(AbortSignal),
      })
    )
  })
})