import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePostProcessing } from '../usePostProcessing'
import { useArtifactStore } from '@/entities/artifact/artifact.store'
import { useUsageStore } from '@/entities/usage/usage.store'
import { useMemoryStore } from '@/entities/memory/memory.store'
import { useSettingsStore } from '@/entities/settings/settings.store'
import { detectArtifacts } from '@/shared/lib/artifact-detector'
import type { UsageEntry } from '@/shared/types'

// Mock the stores
vi.mock('@/entities/artifact/artifact.store', () => ({
  useArtifactStore: vi.fn((selector) => {
    const state = {
      createArtifact: vi.fn(),
    }
    return selector(state)
  }),
}))

vi.mock('@/entities/usage/usage.store', () => ({
  useUsageStore: vi.fn((selector) => {
    const state = {
      addUsage: vi.fn(),
    }
    return selector(state)
  }),
  calculateCost: vi.fn((modelId, inputTokens, outputTokens) => {
    // Simple mock calculation
    return inputTokens * 0.001 + outputTokens * 0.002
  }),
}))

vi.mock('@/entities/memory/memory.store', () => ({
  useMemoryStore: vi.fn((selector) => {
    const state = {
      autoExtract: true,
      extractFromMessages: vi.fn(() => Promise.resolve()),
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
    }
    return selector(state)
  }),
}))

vi.mock('@/shared/lib/artifact-detector', () => ({
  detectArtifacts: vi.fn((text: string) => {
    // Mock artifact detection
    if (text.includes('```javascript')) {
      return [
        {
          title: 'Code Block',
          language: 'javascript',
          type: 'code',
          content: 'console.log("hello");',
        },
      ]
    }
    if (text.includes('<html>')) {
      return [
        {
          title: 'HTML Document',
          language: 'html',
          type: 'html',
          content: '<html><body>Test</body></html>',
        },
      ]
    }
    return []
  }),
}))

vi.mock('@/shared/lib/token-estimator', () => ({
  estimateTokens: vi.fn((text: string) => text.length / 4), // Simple mock
}))

vi.mock('@/shared/constants', () => ({
  MODELS: [
    {
      id: 'claude-3-opus-20240229',
      provider: 'bedrock',
      cost: { input: 15, output: 75 },
    },
    {
      id: 'gpt-4-turbo',
      provider: 'openai',
      cost: { input: 10, output: 30 },
    },
  ],
}))

describe('usePostProcessing', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('processResponse detects artifacts', async () => {
    const mockCreateArtifact = vi.fn()

    vi.mocked(useArtifactStore).mockImplementation((selector) => {
      const state = {
        createArtifact: mockCreateArtifact,
      }
      return selector(state as any)
    })

    const { result } = renderHook(() => usePostProcessing())

    const fullText = 'Here is some code:\n```javascript\nconsole.log("hello");\n```'

    await act(async () => {
      await result.current.processResponse(
        'session-1',
        'msg-assistant',
        'Show me code',
        fullText,
        [],
        'claude-3-opus-20240229',
        null,
        null
      )
    })

    expect(mockCreateArtifact).toHaveBeenCalledWith({
      sessionId: 'session-1',
      messageId: 'msg-assistant',
      title: 'Code Block',
      language: 'javascript',
      type: 'code',
      content: 'console.log("hello");',
    })
  })

  it('processResponse records usage', async () => {
    const mockAddUsage = vi.fn()

    vi.mocked(useUsageStore).mockImplementation((selector) => {
      const state = {
        addUsage: mockAddUsage,
      }
      return selector(state as any)
    })

    const { result } = renderHook(() => usePostProcessing())

    await act(async () => {
      await result.current.processResponse(
        'session-1',
        'msg-assistant',
        'Hello', // 5 chars = ~1.25 tokens
        'Hi there', // 8 chars = ~2 tokens
        [],
        'claude-3-opus-20240229',
        100, // Actual input tokens
        50, // Actual output tokens
      )
    })

    expect(mockAddUsage).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionId: 'session-1',
        modelId: 'claude-3-opus-20240229',
        provider: 'bedrock',
        inputTokens: 100, // Uses actual tokens when provided
        outputTokens: 50, // Uses actual tokens when provided
        cost: expect.any(Number),
        category: 'chat',
      })
    )
  })

  it('processResponse extracts memories when autoExtract is on', async () => {
    const mockExtractFromMessages = vi.fn(() => Promise.resolve())

    vi.mocked(useMemoryStore).mockImplementation((selector) => {
      const state = {
        autoExtract: true,
        extractFromMessages: mockExtractFromMessages,
      }
      return selector(state as any)
    })

    const { result } = renderHook(() => usePostProcessing())

    const chatHistory = [
      { role: 'user' as const, content: 'What is the capital of France?' },
      { role: 'assistant' as const, content: 'The capital of France is Paris.' },
    ]

    await act(async () => {
      await result.current.processResponse(
        'session-1',
        'msg-assistant',
        'Question',
        'The answer is Paris',
        chatHistory,
        'claude-3-opus-20240229',
        null,
        null
      )
    })

    expect(mockExtractFromMessages).toHaveBeenCalledWith(
      expect.arrayContaining([
        { role: 'user', content: 'What is the capital of France?' },
        { role: 'assistant', content: 'The capital of France is Paris.' },
        { role: 'assistant', content: 'The answer is Paris' },
      ]),
      expect.objectContaining({
        awsAccessKeyId: 'test-key',
      })
    )
  })

  it('processResponse skips memory extraction when disabled', async () => {
    const mockExtractFromMessages = vi.fn()

    vi.mocked(useMemoryStore).mockImplementation((selector) => {
      const state = {
        autoExtract: false, // Disabled
        extractFromMessages: mockExtractFromMessages,
      }
      return selector(state as any)
    })

    const { result } = renderHook(() => usePostProcessing())

    await act(async () => {
      await result.current.processResponse(
        'session-1',
        'msg-assistant',
        'Question',
        'Answer',
        [],
        'claude-3-opus-20240229',
        null,
        null
      )
    })

    expect(mockExtractFromMessages).not.toHaveBeenCalled()
  })

  it('handles missing model gracefully', async () => {
    const mockAddUsage = vi.fn()

    vi.mocked(useUsageStore).mockImplementation((selector) => {
      const state = {
        addUsage: mockAddUsage,
      }
      return selector(state as any)
    })

    const { result } = renderHook(() => usePostProcessing())

    await act(async () => {
      await result.current.processResponse(
        'session-1',
        'msg-assistant',
        'Hello',
        'Hi there',
        [],
        'unknown-model-id', // Model not in MODELS array
        null,
        null
      )
    })

    // Should not record usage for unknown model
    expect(mockAddUsage).not.toHaveBeenCalled()
  })

  it('uses estimated tokens when actual tokens not provided', async () => {
    const mockAddUsage = vi.fn()

    vi.mocked(useUsageStore).mockImplementation((selector) => {
      const state = {
        addUsage: mockAddUsage,
      }
      return selector(state as any)
    })

    const { result } = renderHook(() => usePostProcessing())

    await act(async () => {
      await result.current.processResponse(
        'session-1',
        'msg-assistant',
        'Hello world', // 11 chars = ~2.75 tokens
        'Hi there friend', // 15 chars = ~3.75 tokens
        [],
        'gpt-4-turbo',
        null, // No actual input tokens
        null, // No actual output tokens
      )
    })

    expect(mockAddUsage).toHaveBeenCalledWith(
      expect.objectContaining({
        inputTokens: 2.75, // Estimated
        outputTokens: 3.75, // Estimated
      })
    )
  })

  it('detects multiple artifacts', async () => {
    const mockCreateArtifact = vi.fn()

    vi.mocked(useArtifactStore).mockImplementation((selector) => {
      const state = {
        createArtifact: mockCreateArtifact,
      }
      return selector(state as any)
    })

    vi.mocked(detectArtifacts).mockReturnValue([
      {
        title: 'Code Block 1',
        language: 'javascript',
        type: 'code',
        content: 'const a = 1;',
      },
      {
        title: 'Code Block 2',
        language: 'python',
        type: 'code',
        content: 'print("hello")',
      },
    ])

    const { result } = renderHook(() => usePostProcessing())

    await act(async () => {
      await result.current.processResponse(
        'session-1',
        'msg-assistant',
        'Show code',
        'Multiple code blocks here',
        [],
        'claude-3-opus-20240229',
        null,
        null
      )
    })

    expect(mockCreateArtifact).toHaveBeenCalledTimes(2)
    expect(mockCreateArtifact).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Code Block 1',
        language: 'javascript',
      })
    )
    expect(mockCreateArtifact).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Code Block 2',
        language: 'python',
      })
    )
  })

  it('skips memory extraction when no credentials', async () => {
    const mockExtractFromMessages = vi.fn()

    vi.mocked(useMemoryStore).mockImplementation((selector) => {
      const state = {
        autoExtract: true,
        extractFromMessages: mockExtractFromMessages,
      }
      return selector(state as any)
    })

    vi.mocked(useSettingsStore).mockImplementation((selector) => {
      const state = {
        credentials: null, // No credentials
      }
      return selector(state as any)
    })

    const { result } = renderHook(() => usePostProcessing())

    await act(async () => {
      await result.current.processResponse(
        'session-1',
        'msg-assistant',
        'Question',
        'Answer',
        [],
        'claude-3-opus-20240229',
        null,
        null
      )
    })

    expect(mockExtractFromMessages).not.toHaveBeenCalled()
  })

  it('handles memory extraction failure silently', async () => {
    const mockExtractFromMessages = vi.fn(() => Promise.reject(new Error('API error')))

    vi.mocked(useMemoryStore).mockImplementation((selector) => {
      const state = {
        autoExtract: true,
        extractFromMessages: mockExtractFromMessages,
      }
      return selector(state as any)
    })

    const { result } = renderHook(() => usePostProcessing())

    // Should not throw
    await expect(
      act(async () => {
        await result.current.processResponse(
          'session-1',
          'msg-assistant',
          'Question',
          'Answer',
          [],
          'claude-3-opus-20240229',
          null,
          null
        )
      })
    ).resolves.not.toThrow()
  })
})