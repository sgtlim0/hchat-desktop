import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useSessionStore } from '../session.store'
import type { Message } from '@/shared/types'

// Mock the db module
vi.mock('@/shared/lib/db', () => ({
  putSession: vi.fn().mockResolvedValue(undefined),
  deleteSessionFromDb: vi.fn().mockResolvedValue(undefined),
  putMessage: vi.fn().mockResolvedValue(undefined),
  hydrateFromDb: vi.fn().mockResolvedValue({ sessions: [], projects: [], messagesMap: {} }),
}))

// Mock localStorage for settings store dependency
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value }),
    removeItem: vi.fn((key: string) => { delete store[key] }),
    clear: vi.fn(() => { store = {} }),
  }
})()

Object.defineProperty(window, 'localStorage', { value: localStorageMock })

function resetStore() {
  useSessionStore.setState({
    sessions: [],
    currentSessionId: null,
    messages: {},
    view: 'home',
    searchOpen: false,
    hydrated: false,
  })
}

describe('SessionStore', () => {
  beforeEach(() => {
    resetStore()
    vi.clearAllMocks()
  })

  describe('view management', () => {
    it('defaults to home view', () => {
      expect(useSessionStore.getState().view).toBe('home')
    })

    it('sets view', () => {
      useSessionStore.getState().setView('allChats')
      expect(useSessionStore.getState().view).toBe('allChats')
    })

    it('goHome resets to home', () => {
      useSessionStore.getState().setView('chat')
      useSessionStore.getState().goHome()
      expect(useSessionStore.getState().view).toBe('home')
      expect(useSessionStore.getState().currentSessionId).toBeNull()
    })
  })

  describe('session CRUD', () => {
    it('creates a session', () => {
      useSessionStore.getState().createSession('Test Chat')
      const { sessions, currentSessionId, view } = useSessionStore.getState()

      expect(sessions).toHaveLength(1)
      expect(sessions[0].title).toBe('Test Chat')
      expect(sessions[0].isFavorite).toBe(false)
      expect(sessions[0].pinned).toBe(false)
      expect(sessions[0].tags).toEqual([])
      expect(currentSessionId).toBe(sessions[0].id)
      expect(view).toBe('chat')
    })

    it('selects a session', () => {
      useSessionStore.getState().createSession('Chat 1')
      const sessionId = useSessionStore.getState().sessions[0].id

      useSessionStore.getState().goHome()
      useSessionStore.getState().selectSession(sessionId)

      expect(useSessionStore.getState().currentSessionId).toBe(sessionId)
      expect(useSessionStore.getState().view).toBe('chat')
    })

    it('deletes a session', () => {
      useSessionStore.getState().createSession('Chat 1')
      const sessionId = useSessionStore.getState().sessions[0].id

      useSessionStore.getState().deleteSession(sessionId)

      expect(useSessionStore.getState().sessions).toHaveLength(0)
      expect(useSessionStore.getState().currentSessionId).toBeNull()
      expect(useSessionStore.getState().view).toBe('home')
    })

    it('renames a session', () => {
      useSessionStore.getState().createSession('Old Title')
      const sessionId = useSessionStore.getState().sessions[0].id

      useSessionStore.getState().renameSession(sessionId, 'New Title')

      expect(useSessionStore.getState().sessions[0].title).toBe('New Title')
    })
  })

  describe('favorite / pin / tags', () => {
    it('toggles favorite', () => {
      useSessionStore.getState().createSession('Chat')
      const id = useSessionStore.getState().sessions[0].id

      useSessionStore.getState().toggleFavorite(id)
      expect(useSessionStore.getState().sessions[0].isFavorite).toBe(true)

      useSessionStore.getState().toggleFavorite(id)
      expect(useSessionStore.getState().sessions[0].isFavorite).toBe(false)
    })

    it('toggles pin', () => {
      useSessionStore.getState().createSession('Chat')
      const id = useSessionStore.getState().sessions[0].id

      useSessionStore.getState().togglePin(id)
      expect(useSessionStore.getState().sessions[0].pinned).toBe(true)
    })

    it('adds and removes tags', () => {
      useSessionStore.getState().createSession('Chat')
      const id = useSessionStore.getState().sessions[0].id

      useSessionStore.getState().addTag(id, 'work')
      expect(useSessionStore.getState().sessions[0].tags).toEqual(['work'])

      useSessionStore.getState().addTag(id, 'important')
      expect(useSessionStore.getState().sessions[0].tags).toEqual(['work', 'important'])

      useSessionStore.getState().removeTag(id, 'work')
      expect(useSessionStore.getState().sessions[0].tags).toEqual(['important'])
    })

    it('does not add duplicate tags', () => {
      useSessionStore.getState().createSession('Chat')
      const id = useSessionStore.getState().sessions[0].id

      useSessionStore.getState().addTag(id, 'work')
      useSessionStore.getState().addTag(id, 'work')
      expect(useSessionStore.getState().sessions[0].tags).toEqual(['work'])
    })
  })

  describe('messages', () => {
    it('adds messages to a session', () => {
      useSessionStore.getState().createSession('Chat')
      const sessionId = useSessionStore.getState().sessions[0].id

      const msg: Message = {
        id: 'msg-1',
        sessionId,
        role: 'user',
        segments: [{ type: 'text', content: 'Hello' }],
        createdAt: new Date().toISOString(),
      }

      useSessionStore.getState().addMessage(sessionId, msg)

      expect(useSessionStore.getState().messages[sessionId]).toHaveLength(1)
      expect(useSessionStore.getState().messages[sessionId][0].id).toBe('msg-1')
    })

    it('updates last message via updater function', () => {
      useSessionStore.getState().createSession('Chat')
      const sessionId = useSessionStore.getState().sessions[0].id

      const msg: Message = {
        id: 'msg-1',
        sessionId,
        role: 'assistant',
        segments: [{ type: 'text', content: 'Hello' }],
        createdAt: new Date().toISOString(),
      }
      useSessionStore.getState().addMessage(sessionId, msg)

      useSessionStore.getState().updateLastMessage(sessionId, 'msg-1', (m) => ({
        ...m,
        segments: [{ type: 'text', content: 'Hello World' }],
      }))

      const updated = useSessionStore.getState().messages[sessionId][0]
      expect(updated.segments[0].content).toBe('Hello World')
    })

    it('updates session lastMessage when message added', () => {
      useSessionStore.getState().createSession('Chat')
      const sessionId = useSessionStore.getState().sessions[0].id

      const msg: Message = {
        id: 'msg-1',
        sessionId,
        role: 'user',
        segments: [{ type: 'text', content: 'Test message' }],
        createdAt: new Date().toISOString(),
      }
      useSessionStore.getState().addMessage(sessionId, msg)

      expect(useSessionStore.getState().sessions[0].lastMessage).toBe('Test message')
    })
  })

  describe('streaming', () => {
    it('sets session streaming state', () => {
      useSessionStore.getState().createSession('Chat')
      const id = useSessionStore.getState().sessions[0].id

      useSessionStore.getState().setSessionStreaming(id, true)
      expect(useSessionStore.getState().sessions[0].isStreaming).toBe(true)

      useSessionStore.getState().setSessionStreaming(id, false)
      expect(useSessionStore.getState().sessions[0].isStreaming).toBe(false)
    })
  })

  describe('search', () => {
    it('opens and closes search', () => {
      useSessionStore.getState().setSearchOpen(true)
      expect(useSessionStore.getState().searchOpen).toBe(true)

      useSessionStore.getState().setSearchOpen(false)
      expect(useSessionStore.getState().searchOpen).toBe(false)
    })

    it('searches messages by content', () => {
      useSessionStore.getState().createSession('Chat')
      const sessionId = useSessionStore.getState().sessions[0].id

      const msg: Message = {
        id: 'msg-1',
        sessionId,
        role: 'user',
        segments: [{ type: 'text', content: 'Hello World' }],
        createdAt: new Date().toISOString(),
      }
      useSessionStore.getState().addMessage(sessionId, msg)

      const results = useSessionStore.getState().searchMessages('hello')
      expect(results).toHaveLength(1)
      expect(results[0].content).toBe('Hello World')
    })

    it('returns empty for empty query', () => {
      const results = useSessionStore.getState().searchMessages('')
      expect(results).toEqual([])
    })

    it('returns empty when no match', () => {
      useSessionStore.getState().createSession('Chat')
      const sessionId = useSessionStore.getState().sessions[0].id

      const msg: Message = {
        id: 'msg-1',
        sessionId,
        role: 'user',
        segments: [{ type: 'text', content: 'Hello' }],
        createdAt: new Date().toISOString(),
      }
      useSessionStore.getState().addMessage(sessionId, msg)

      const results = useSessionStore.getState().searchMessages('xyz')
      expect(results).toHaveLength(0)
    })
  })
})
