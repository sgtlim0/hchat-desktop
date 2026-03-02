import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MessageList } from '../MessageList'
import type { Message, Session } from '@/shared/types'

// Mock i18n
vi.mock('@/shared/i18n', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    language: 'en',
  }),
}))

// Mock MessageBubble
vi.mock('../MessageBubble', () => ({
  MessageBubble: vi.fn(({ message, isStreaming, messageIndex, onFork }) => (
    <div data-testid={`message-${message.id}`}>
      <div data-role={message.role}>{message.role}</div>
      {isStreaming && <div data-testid="streaming">streaming</div>}
      <div data-index={messageIndex}>{messageIndex}</div>
      {onFork && <button onClick={() => onFork(messageIndex)}>Fork</button>}
    </div>
  )),
}))

// Mock session store
const mockMessages: Record<string, Message[]> = {}
const mockSessions: Session[] = []
const mockForkSession = vi.fn()

vi.mock('@/entities/session/session.store', () => ({
  useSessionStore: vi.fn((selector) => {
    const state = {
      messages: mockMessages,
      sessions: mockSessions,
      forkSession: mockForkSession,
    }
    return selector(state)
  }),
}))

describe('MessageList', () => {
  const sessionId = 'test-session-id'

  beforeEach(() => {
    vi.clearAllMocks()
    // Clear mock data
    Object.keys(mockMessages).forEach((key) => delete mockMessages[key])
    mockSessions.length = 0

    // Mock scrollIntoView
    Element.prototype.scrollIntoView = vi.fn()
  })

  it('renders empty state when no messages', () => {
    mockMessages[sessionId] = []
    render(<MessageList sessionId={sessionId} />)
    expect(screen.getByText('chat.startConversation')).toBeInTheDocument()
  })

  it('renders messages when present', () => {
    const messages: Message[] = [
      {
        id: 'msg-1',
        sessionId,
        role: 'user',
        segments: [{ type: 'text', content: 'Hello' }],
        createdAt: new Date().toISOString(),
      },
      {
        id: 'msg-2',
        sessionId,
        role: 'assistant',
        segments: [{ type: 'text', content: 'Hi there' }],
        createdAt: new Date().toISOString(),
      },
    ]
    mockMessages[sessionId] = messages

    render(<MessageList sessionId={sessionId} />)

    expect(screen.getByTestId('message-msg-1')).toBeInTheDocument()
    expect(screen.getByTestId('message-msg-2')).toBeInTheDocument()
  })

  it('passes correct props to MessageBubble', () => {
    const messages: Message[] = [
      {
        id: 'msg-1',
        sessionId,
        role: 'user',
        segments: [{ type: 'text', content: 'Test' }],
        createdAt: new Date().toISOString(),
      },
    ]
    mockMessages[sessionId] = messages

    render(<MessageList sessionId={sessionId} />)

    const messageBubble = screen.getByTestId('message-msg-1')
    expect(messageBubble).toHaveTextContent('user')
    expect(messageBubble).toHaveTextContent('0') // messageIndex
  })

  it('identifies last assistant message as streaming when session is streaming', () => {
    const messages: Message[] = [
      {
        id: 'msg-1',
        sessionId,
        role: 'user',
        segments: [{ type: 'text', content: 'Hello' }],
        createdAt: new Date().toISOString(),
      },
      {
        id: 'msg-2',
        sessionId,
        role: 'assistant',
        segments: [{ type: 'text', content: 'Thinking...' }],
        createdAt: new Date().toISOString(),
      },
    ]
    mockMessages[sessionId] = messages
    mockSessions.push({
      id: sessionId,
      title: 'Test',
      modelId: 'claude-sonnet-4.6',
      isFavorite: false,
      isStreaming: true,
      pinned: false,
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    render(<MessageList sessionId={sessionId} />)

    expect(screen.getByTestId('streaming')).toBeInTheDocument()
  })

  it('does not mark non-last assistant message as streaming', () => {
    const messages: Message[] = [
      {
        id: 'msg-1',
        sessionId,
        role: 'assistant',
        segments: [{ type: 'text', content: 'First' }],
        createdAt: new Date().toISOString(),
      },
      {
        id: 'msg-2',
        sessionId,
        role: 'user',
        segments: [{ type: 'text', content: 'Second' }],
        createdAt: new Date().toISOString(),
      },
    ]
    mockMessages[sessionId] = messages
    mockSessions.push({
      id: sessionId,
      title: 'Test',
      modelId: 'claude-sonnet-4.6',
      isFavorite: false,
      isStreaming: true,
      pinned: false,
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    render(<MessageList sessionId={sessionId} />)

    expect(screen.queryByTestId('streaming')).not.toBeInTheDocument()
  })

  it('calls forkSession with correct arguments', () => {
    const messages: Message[] = [
      {
        id: 'msg-1',
        sessionId,
        role: 'assistant',
        segments: [{ type: 'text', content: 'Test' }],
        createdAt: new Date().toISOString(),
      },
    ]
    mockMessages[sessionId] = messages

    render(<MessageList sessionId={sessionId} />)

    const forkButton = screen.getByText('Fork')
    forkButton.click()

    expect(mockForkSession).toHaveBeenCalledWith(sessionId, 0)
  })

  it('renders multiple messages with correct indices', () => {
    const messages: Message[] = [
      {
        id: 'msg-1',
        sessionId,
        role: 'user',
        segments: [{ type: 'text', content: 'First' }],
        createdAt: new Date().toISOString(),
      },
      {
        id: 'msg-2',
        sessionId,
        role: 'assistant',
        segments: [{ type: 'text', content: 'Second' }],
        createdAt: new Date().toISOString(),
      },
      {
        id: 'msg-3',
        sessionId,
        role: 'user',
        segments: [{ type: 'text', content: 'Third' }],
        createdAt: new Date().toISOString(),
      },
    ]
    mockMessages[sessionId] = messages

    render(<MessageList sessionId={sessionId} />)

    // Check that all messages are rendered with their indices
    const msg1 = screen.getByTestId('message-msg-1')
    const msg2 = screen.getByTestId('message-msg-2')
    const msg3 = screen.getByTestId('message-msg-3')

    expect(msg1.textContent).toContain('0')
    expect(msg2.textContent).toContain('1')
    expect(msg3.textContent).toContain('2')
  })
})
