import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useContextManagerStore } from '../context-manager.store'
import type { ContextTemplate } from '@/shared/types'

// Mock the db module
vi.mock('@/shared/lib/db', () => ({
  putPinnedMessage: vi.fn(() => Promise.resolve()),
  deletePinnedMessageFromDb: vi.fn(() => Promise.resolve()),
}))

describe('ContextManagerStore', () => {
  beforeEach(() => {
    useContextManagerStore.setState({
      pinnedMessages: [],
      selectedTemplate: null,
      autoCompression: false,
      tokenUsage: { used: 0, max: 200000 },
    })
  })

  it('should pin a message', () => {
    const { pinMessage } = useContextManagerStore.getState()

    pinMessage('session-1', 'message-1', 'Important context')

    const pinnedMessages = useContextManagerStore.getState().pinnedMessages
    expect(pinnedMessages).toHaveLength(1)
    expect(pinnedMessages[0].sessionId).toBe('session-1')
    expect(pinnedMessages[0].messageId).toBe('message-1')
    expect(pinnedMessages[0].label).toBe('Important context')
    expect(pinnedMessages[0].id).toMatch(/^pin-/)
  })

  it('should unpin a message', () => {
    const { pinMessage, unpinMessage } = useContextManagerStore.getState()

    // First pin a message
    pinMessage('session-1', 'message-1', 'Test')
    const pinnedMessages = useContextManagerStore.getState().pinnedMessages
    const pinId = pinnedMessages[0].id

    // Then unpin it
    unpinMessage(pinId)

    expect(useContextManagerStore.getState().pinnedMessages).toHaveLength(0)
  })

  it('should set context template', () => {
    const { setTemplate } = useContextManagerStore.getState()

    const template: ContextTemplate = {
      id: 'template-1',
      name: 'Coding Assistant',
      instructions: 'You are a helpful coding assistant',
      maxTokens: 100000,
    }

    setTemplate(template)

    expect(useContextManagerStore.getState().selectedTemplate).toEqual(template)
  })

  it('should toggle auto compression', () => {
    const { toggleAutoCompression } = useContextManagerStore.getState()

    expect(useContextManagerStore.getState().autoCompression).toBe(false)

    toggleAutoCompression()
    expect(useContextManagerStore.getState().autoCompression).toBe(true)

    toggleAutoCompression()
    expect(useContextManagerStore.getState().autoCompression).toBe(false)
  })

  it('should update token usage', () => {
    const { updateTokenUsage } = useContextManagerStore.getState()

    updateTokenUsage(5000, 150000)

    const tokenUsage = useContextManagerStore.getState().tokenUsage
    expect(tokenUsage.used).toBe(5000)
    expect(tokenUsage.max).toBe(150000)
  })

  it('should get pinned messages for a specific session', () => {
    const { pinMessage, getPinnedForSession } = useContextManagerStore.getState()

    // Pin messages for different sessions
    pinMessage('session-1', 'message-1', 'Context 1')
    pinMessage('session-1', 'message-2', 'Context 2')
    pinMessage('session-2', 'message-3', 'Context 3')

    const session1Pins = getPinnedForSession('session-1')
    const session2Pins = getPinnedForSession('session-2')

    expect(session1Pins).toHaveLength(2)
    expect(session1Pins.every(p => p.sessionId === 'session-1')).toBe(true)

    expect(session2Pins).toHaveLength(1)
    expect(session2Pins[0].sessionId).toBe('session-2')
  })

  it('should handle multiple pins and unpins correctly', () => {
    const { pinMessage, unpinMessage } = useContextManagerStore.getState()

    // Pin multiple messages
    pinMessage('session-1', 'msg-1', 'First')
    pinMessage('session-1', 'msg-2', 'Second')
    pinMessage('session-2', 'msg-3', 'Third')

    expect(useContextManagerStore.getState().pinnedMessages).toHaveLength(3)

    // Unpin the middle one
    const pins = useContextManagerStore.getState().pinnedMessages
    unpinMessage(pins[1].id)

    const remainingPins = useContextManagerStore.getState().pinnedMessages
    expect(remainingPins).toHaveLength(2)
    expect(remainingPins.map(p => p.label)).toEqual(['First', 'Third'])
  })

  it('should clear template when set to null', () => {
    const { setTemplate } = useContextManagerStore.getState()

    const template: ContextTemplate = {
      id: 'template-1',
      name: 'Test Template',
      instructions: 'Test instructions',
      maxTokens: 50000,
    }

    setTemplate(template)
    expect(useContextManagerStore.getState().selectedTemplate).toBeTruthy()

    setTemplate(null)
    expect(useContextManagerStore.getState().selectedTemplate).toBeNull()
  })
})