import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { MessageBubble } from '../MessageBubble'
import type { Message } from '@/shared/types'

// Mock react-markdown
vi.mock('react-markdown', () => ({
  default: ({ children }: { children: string }) => <div>{children}</div>,
}))

// Mock remark-gfm
vi.mock('remark-gfm', () => ({
  default: vi.fn(),
}))

// Mock CodeBlock
vi.mock('../CodeBlock', () => ({
  CodeBlock: ({ children, language }: { children: string; language: string }) => (
    <pre data-language={language}>{children}</pre>
  ),
}))

// Mock ToolCallGroup
vi.mock('../ToolCallGroup', () => ({
  ToolCallGroup: ({ toolCalls }: { toolCalls: unknown[] }) => (
    <div data-testid="tool-calls">{toolCalls.length} tool calls</div>
  ),
}))

// Mock TTS
vi.mock('@/shared/lib/tts', () => ({
  isSupported: vi.fn(() => true),
  speak: vi.fn(),
  stop: vi.fn(),
  isSpeaking: vi.fn(() => false),
}))

// Mock compression store
const mockCompressionState = {
  enabled: false,
  threshold: 0.3,
  contextPruningEnabled: false,
  maxContextTokens: 1000,
  stats: {
    totalCompressed: 0,
    totalSavedTokens: 0,
    totalSavedCost: 0,
    averageRatio: 0,
  },
  setEnabled: vi.fn(),
  setThreshold: vi.fn(),
  setContextPruningEnabled: vi.fn(),
  setMaxContextTokens: vi.fn(),
  recordCompression: vi.fn(),
  resetStats: vi.fn(),
  compressPrompt: vi.fn(),
  compressMessages: vi.fn(),
  pruneMessages: vi.fn(),
}

vi.mock('@/entities/compression/compression.store', () => ({
  useCompressionStore: (selector: (s: typeof mockCompressionState) => unknown) =>
    selector(mockCompressionState),
}))

// Mock learning store
const mockLearningState = {
  feedbacks: {},
  submitFeedback: vi.fn(),
  getFeedbackForMessage: vi.fn(() => null),
}

vi.mock('@/entities/learning/learning.store', () => ({
  useLearningStore: (selector: (s: typeof mockLearningState) => unknown) =>
    selector(mockLearningState),
}))

describe('MessageBubble', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    // Reset mock states
    mockCompressionState.enabled = false
    mockCompressionState.stats = {
      totalCompressed: 0,
      totalSavedTokens: 0,
      totalSavedCost: 0,
      averageRatio: 0,
    }
    mockLearningState.feedbacks = {}
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders user message with correct styling', () => {
    const message: Message = {
      id: 'msg-1',
      sessionId: 'session-1',
      role: 'user',
      segments: [{ type: 'text', content: 'Hello AI' }],
      createdAt: new Date().toISOString(),
    }

    render(<MessageBubble message={message} />)

    const container = screen.getByText('Hello AI').closest('div')
    expect(container).toHaveClass('bg-primary', 'text-white', 'rounded-2xl')
  })

  it('renders assistant message with avatar', () => {
    const message: Message = {
      id: 'msg-1',
      sessionId: 'session-1',
      role: 'assistant',
      segments: [{ type: 'text', content: 'Hi there' }],
      createdAt: new Date().toISOString(),
    }

    render(<MessageBubble message={message} />)

    expect(screen.getByText('H')).toBeInTheDocument() // Avatar
    expect(screen.getByText('Hi there')).toBeInTheDocument()
  })

  it('renders tool calls segment', () => {
    const message: Message = {
      id: 'msg-1',
      sessionId: 'session-1',
      role: 'assistant',
      segments: [
        {
          type: 'tool',
          toolCalls: [
            {
              id: 'tool-1',
              toolName: 'search',
              args: { query: 'test' },
              status: 'done',
            },
          ],
        },
      ],
      createdAt: new Date().toISOString(),
    }

    render(<MessageBubble message={message} />)

    expect(screen.getByTestId('tool-calls')).toBeInTheDocument()
    expect(screen.getByText('1 tool calls')).toBeInTheDocument()
  })

  it('shows streaming cursor for assistant message', () => {
    const message: Message = {
      id: 'msg-1',
      sessionId: 'session-1',
      role: 'assistant',
      segments: [{ type: 'text', content: 'Typing...' }],
      createdAt: new Date().toISOString(),
    }

    const { container } = render(<MessageBubble message={message} isStreaming />)

    const cursor = container.querySelector('.animate-cursor-blink')
    expect(cursor).toBeInTheDocument()
  })

  it('shows fork button for completed assistant messages', () => {
    const message: Message = {
      id: 'msg-1',
      sessionId: 'session-1',
      role: 'assistant',
      segments: [{ type: 'text', content: 'Response' }],
      createdAt: new Date().toISOString(),
    }
    const onFork = vi.fn()

    render(<MessageBubble message={message} messageIndex={2} onFork={onFork} />)

    const forkButton = screen.getByLabelText('Fork from here')
    expect(forkButton).toBeInTheDocument()

    fireEvent.click(forkButton)
    expect(onFork).toHaveBeenCalledWith(2)
  })

  it('does not show fork button when streaming', () => {
    const message: Message = {
      id: 'msg-1',
      sessionId: 'session-1',
      role: 'assistant',
      segments: [{ type: 'text', content: 'Response' }],
      createdAt: new Date().toISOString(),
    }
    const onFork = vi.fn()

    render(<MessageBubble message={message} messageIndex={2} onFork={onFork} isStreaming />)

    expect(screen.queryByLabelText('Fork from here')).not.toBeInTheDocument()
  })

  it('shows read button for completed assistant messages', () => {
    const message: Message = {
      id: 'msg-1',
      sessionId: 'session-1',
      role: 'assistant',
      segments: [{ type: 'text', content: 'Response' }],
      createdAt: new Date().toISOString(),
    }

    render(<MessageBubble message={message} />)

    expect(screen.getByLabelText('Read aloud')).toBeInTheDocument()
  })

  it('handles TTS click', async () => {
    const tts = await import('@/shared/lib/tts')
    const message: Message = {
      id: 'msg-1',
      sessionId: 'session-1',
      role: 'assistant',
      segments: [{ type: 'text', content: 'Read this' }],
      createdAt: new Date().toISOString(),
    }

    render(<MessageBubble message={message} />)

    const readButton = screen.getByLabelText('Read aloud')
    fireEvent.click(readButton)

    expect(tts.speak).toHaveBeenCalledWith('Read this')
  })

  it('handles TTS stop', async () => {
    const tts = await import('@/shared/lib/tts')
    vi.mocked(tts.isSpeaking).mockReturnValue(true)

    const message: Message = {
      id: 'msg-1',
      sessionId: 'session-1',
      role: 'assistant',
      segments: [{ type: 'text', content: 'Read this' }],
      createdAt: new Date().toISOString(),
    }

    const { rerender } = render(<MessageBubble message={message} />)

    // First click to start
    const readButton = screen.getByLabelText('Read aloud')
    fireEvent.click(readButton)

    // Update component to reflect speaking state
    rerender(<MessageBubble message={message} />)

    // Click stop button
    const stopButton = screen.getByLabelText('Stop reading')
    fireEvent.click(stopButton)

    expect(tts.stop).toHaveBeenCalled()
  })

  it('renders multiple text segments', () => {
    const message: Message = {
      id: 'msg-1',
      sessionId: 'session-1',
      role: 'assistant',
      segments: [
        { type: 'text', content: 'First part' },
        { type: 'text', content: 'Second part' },
      ],
      createdAt: new Date().toISOString(),
    }

    render(<MessageBubble message={message} />)

    expect(screen.getByText('First part')).toBeInTheDocument()
    expect(screen.getByText('Second part')).toBeInTheDocument()
  })

  it('skips empty segments', () => {
    const message: Message = {
      id: 'msg-1',
      sessionId: 'session-1',
      role: 'assistant',
      segments: [
        { type: 'text', content: '' },
        { type: 'text', content: 'Only this' },
      ],
      createdAt: new Date().toISOString(),
    }

    render(<MessageBubble message={message} />)

    expect(screen.getByText('Only this')).toBeInTheDocument()
  })

  it('shows streaming cursor when no content yet', () => {
    const message: Message = {
      id: 'msg-1',
      sessionId: 'session-1',
      role: 'assistant',
      segments: [],
      createdAt: new Date().toISOString(),
    }

    const { container } = render(<MessageBubble message={message} isStreaming />)

    const cursor = container.querySelector('.animate-cursor-blink')
    expect(cursor).toBeInTheDocument()
  })

  describe('CompressionBadge', () => {
    it('does not show badge when compression is disabled', () => {
      mockCompressionState.enabled = false
      mockCompressionState.stats.totalSavedTokens = 1000

      const message: Message = {
        id: 'msg-1',
        sessionId: 'session-1',
        role: 'assistant',
        segments: [{ type: 'text', content: 'Test message' }],
        createdAt: new Date().toISOString(),
      }

      render(<MessageBubble message={message} />)

      expect(screen.queryByText(/tokens saved/)).not.toBeInTheDocument()
    })

    it('does not show badge when no tokens saved', () => {
      mockCompressionState.enabled = true
      mockCompressionState.stats.totalSavedTokens = 0

      const message: Message = {
        id: 'msg-1',
        sessionId: 'session-1',
        role: 'assistant',
        segments: [{ type: 'text', content: 'Test message' }],
        createdAt: new Date().toISOString(),
      }

      render(<MessageBubble message={message} />)

      expect(screen.queryByText(/tokens saved/)).not.toBeInTheDocument()
    })

    it('shows badge when compression enabled and tokens saved', () => {
      mockCompressionState.enabled = true
      mockCompressionState.stats.totalSavedTokens = 1500

      const message: Message = {
        id: 'msg-1',
        sessionId: 'session-1',
        role: 'assistant',
        segments: [{ type: 'text', content: 'Test message' }],
        createdAt: new Date().toISOString(),
      }

      render(<MessageBubble message={message} />)

      expect(screen.getByText('1,500 tokens saved')).toBeInTheDocument()
    })

    it('formats large numbers with commas', () => {
      mockCompressionState.enabled = true
      mockCompressionState.stats.totalSavedTokens = 1234567

      const message: Message = {
        id: 'msg-1',
        sessionId: 'session-1',
        role: 'assistant',
        segments: [{ type: 'text', content: 'Test message' }],
        createdAt: new Date().toISOString(),
      }

      render(<MessageBubble message={message} />)

      expect(screen.getByText('1,234,567 tokens saved')).toBeInTheDocument()
    })

    it('only shows badge for assistant messages', () => {
      mockCompressionState.enabled = true
      mockCompressionState.stats.totalSavedTokens = 1000

      const userMessage: Message = {
        id: 'msg-1',
        sessionId: 'session-1',
        role: 'user',
        segments: [{ type: 'text', content: 'User message' }],
        createdAt: new Date().toISOString(),
      }

      render(<MessageBubble message={userMessage} />)

      // CompressionBadge is only shown for assistant messages
      expect(screen.queryByText(/tokens saved/)).not.toBeInTheDocument()
    })

    it('displays badge with different token values', () => {
      // Test with small number
      mockCompressionState.enabled = true
      mockCompressionState.stats.totalSavedTokens = 10

      const message: Message = {
        id: 'msg-1',
        sessionId: 'session-1',
        role: 'assistant',
        segments: [{ type: 'text', content: 'Test message' }],
        createdAt: new Date().toISOString(),
      }

      const { unmount } = render(<MessageBubble message={message} />)
      expect(screen.getByText('10 tokens saved')).toBeInTheDocument()
      unmount()

      // Test with larger number
      mockCompressionState.stats.totalSavedTokens = 999
      render(<MessageBubble message={message} />)
      expect(screen.getByText('999 tokens saved')).toBeInTheDocument()
    })
  })
})
