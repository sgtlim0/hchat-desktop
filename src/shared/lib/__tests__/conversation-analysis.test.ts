import { describe, it, expect } from 'vitest'
import {
  analyzeSentiment,
  generateSmartTitle,
  suggestTags,
  findSimilarSessions,
  analyzeConversation,
} from '../conversation-analysis'
import type { Message } from '@/shared/types'

function createMessage(role: 'user' | 'assistant', text: string): Message {
  return {
    id: crypto.randomUUID(),
    sessionId: 'test-session',
    role,
    segments: [{ type: 'text', content: text }],
    createdAt: new Date().toISOString(),
  }
}

describe('conversation-analysis', () => {
  describe('analyzeSentiment', () => {
    it('should return positive for positive messages', () => {
      const messages = [
        createMessage('user', 'This is great and awesome!'),
        createMessage('assistant', 'Thanks for your positive feedback!'),
        createMessage('user', 'Perfect solution, very helpful'),
      ]

      const sentiment = analyzeSentiment(messages)
      expect(sentiment).toBe('positive')
    })

    it('should return negative for negative messages', () => {
      const messages = [
        createMessage('user', 'This has an error and a bug'),
        createMessage('assistant', 'Sorry about the issue'),
        createMessage('user', 'Still broken and failing'),
      ]

      const sentiment = analyzeSentiment(messages)
      expect(sentiment).toBe('negative')
    })

    it('should return neutral for neutral messages', () => {
      const messages = [
        createMessage('user', 'Can you help me with this task?'),
        createMessage('assistant', 'Sure, I can help you'),
      ]

      const sentiment = analyzeSentiment(messages)
      expect(sentiment).toBe('neutral')
    })

    it('should return neutral when positive and negative are balanced', () => {
      const messages = [
        createMessage('user', 'Great start but there is an error'),
        createMessage('assistant', 'Thanks, I will fix the bug'),
      ]

      const sentiment = analyzeSentiment(messages)
      expect(sentiment).toBe('neutral')
    })
  })

  describe('generateSmartTitle', () => {
    it('should use first user message', () => {
      const messages = [
        createMessage('user', 'How do I implement a binary search?'),
        createMessage('assistant', 'Here is how to implement binary search'),
      ]

      const title = generateSmartTitle(messages)
      expect(title).toBe('How do I implement a binary search?')
    })

    it('should truncate long titles at word boundary', () => {
      const messages = [
        createMessage(
          'user',
          'Can you help me understand how to implement a complex algorithm for sorting large datasets efficiently?'
        ),
      ]

      const title = generateSmartTitle(messages)
      expect(title.length).toBeLessThanOrEqual(43) // 40 + "..."
      expect(title.endsWith('...')).toBe(true)
      expect(title).not.toContain('  ') // no double spaces
    })

    it('should return fallback for empty messages', () => {
      const messages: Message[] = []

      const title = generateSmartTitle(messages)
      expect(title).toBe('New Conversation')
    })

    it('should return fallback when no user messages', () => {
      const messages = [createMessage('assistant', 'Hello! How can I help?')]

      const title = generateSmartTitle(messages)
      expect(title).toBe('New Conversation')
    })

    it('should handle messages with newlines', () => {
      const messages = [createMessage('user', 'First line\nSecond line\nThird line')]

      const title = generateSmartTitle(messages)
      expect(title).toBe('First line Second line Third line')
    })

    it('should return short messages as-is', () => {
      const messages = [createMessage('user', 'Quick question')]

      const title = generateSmartTitle(messages)
      expect(title).toBe('Quick question')
    })
  })

  describe('suggestTags', () => {
    it('should suggest coding tag for code-related messages', () => {
      const messages = [
        createMessage('user', 'How do I write a function in TypeScript?'),
        createMessage('assistant', 'Here is a sample code implementation'),
      ]

      const tags = suggestTags(messages)
      expect(tags).toContain('coding')
    })

    it('should suggest translation tag for translation messages', () => {
      const messages = [
        createMessage('user', 'Can you translate this to English?'),
        createMessage('assistant', 'Sure, here is the translation'),
      ]

      const tags = suggestTags(messages)
      expect(tags).toContain('translation')
    })

    it('should suggest multiple relevant tags', () => {
      const messages = [
        createMessage('user', 'Can you analyze this data and create a report?'),
        createMessage('assistant', 'I will analyze the data and write a business report'),
      ]

      const tags = suggestTags(messages)
      expect(tags.length).toBeGreaterThan(0)
      expect(tags).toContain('analysis')
    })

    it('should limit to max 4 tags', () => {
      const messages = [
        createMessage(
          'user',
          'Can you help me learn to code a design for business analysis with creative ideas and write a translation tutorial?'
        ),
        createMessage('assistant', 'Sure, I can help with coding, design, business, writing, translation, and learning'),
      ]

      const tags = suggestTags(messages)
      expect(tags.length).toBeLessThanOrEqual(4)
    })

    it('should return empty array when no keywords match', () => {
      const messages = [createMessage('user', 'Hello'), createMessage('assistant', 'Hi there')]

      const tags = suggestTags(messages)
      expect(tags).toEqual([])
    })

    it('should require at least 2 keyword matches per tag', () => {
      const messages = [createMessage('user', 'I need to code something')] // only 1 coding keyword

      const tags = suggestTags(messages)
      expect(tags).toEqual([])
    })
  })

  describe('findSimilarSessions', () => {
    it('should return matching sessions based on keyword overlap', () => {
      const currentMessages = [
        createMessage('user', 'How to implement binary search algorithm in Python?'),
        createMessage('assistant', 'Here is a binary search implementation'),
      ]

      const allSessions = [
        { id: 'session-1', title: 'Python sorting algorithms', lastMessage: 'binary search example' },
        { id: 'session-2', title: 'JavaScript array methods', lastMessage: 'filter and map' },
        { id: 'session-3', title: 'Binary tree implementation', lastMessage: 'search algorithm' },
      ]

      const similar = findSimilarSessions(currentMessages, allSessions, 'current-session')

      expect(similar.length).toBeGreaterThan(0)
      expect(similar).toContain('session-1')
      expect(similar).toContain('session-3')
    })

    it('should exclude current session from results', () => {
      const currentMessages = [createMessage('user', 'Test message about coding')]

      const allSessions = [
        { id: 'current-session', title: 'Current session about coding', lastMessage: 'test' },
        { id: 'other-session', title: 'Other session about coding', lastMessage: 'test' },
      ]

      const similar = findSimilarSessions(currentMessages, allSessions, 'current-session')

      expect(similar).not.toContain('current-session')
      expect(similar).toContain('other-session')
    })

    it('should return empty array when no similar sessions found', () => {
      const currentMessages = [createMessage('user', 'xyzu1234abcd5678efgh')]

      const allSessions = [
        { id: 'session-1', title: 'qwertyuiop', lastMessage: 'asdfghjkl' },
        { id: 'session-2', title: 'zxcvbnm', lastMessage: 'mnbvcxz' },
      ]

      const similar = findSimilarSessions(currentMessages, allSessions, 'current-session')

      expect(similar).toEqual([])
    })

    it('should limit results to maxResults parameter', () => {
      const currentMessages = [createMessage('user', 'test test test test test')]

      const allSessions = Array.from({ length: 10 }, (_, i) => ({
        id: `session-${i}`,
        title: 'test',
        lastMessage: 'test',
      }))

      const similar = findSimilarSessions(currentMessages, allSessions, 'current-session', 3)

      expect(similar.length).toBeLessThanOrEqual(3)
    })

    it('should sort results by similarity score', () => {
      const currentMessages = [createMessage('user', 'python code function algorithm binary search')]

      const allSessions = [
        { id: 'session-1', title: 'Python basics', lastMessage: 'function' }, // 2 matches
        { id: 'session-2', title: 'Binary search algorithm in Python', lastMessage: 'code implementation' }, // 4 matches
        { id: 'session-3', title: 'Python code', lastMessage: 'algorithm' }, // 3 matches
      ]

      const similar = findSimilarSessions(currentMessages, allSessions, 'current-session')

      expect(similar[0]).toBe('session-2') // highest score first
    })
  })

  describe('analyzeConversation', () => {
    it('should return full analysis object', () => {
      const messages = [
        createMessage('user', 'Can you help me write a Python function for data analysis?'),
        createMessage('assistant', 'Sure! Here is a great excellent awesome helpful function for analyzing data'),
      ]

      const analysis = analyzeConversation('test-session-123', messages)

      expect(analysis.sessionId).toBe('test-session-123')
      expect(analysis.sentiment).toBe('positive')
      expect(analysis.autoTags.length).toBeGreaterThan(0)
      expect(analysis.smartTitle).toBeTruthy()
      expect(analysis.analyzedAt).toBeTruthy()
    })

    it('should include all analysis components', () => {
      const messages = [createMessage('user', 'Quick test message')]

      const analysis = analyzeConversation('test-session', messages)

      expect(analysis).toHaveProperty('sessionId')
      expect(analysis).toHaveProperty('sentiment')
      expect(analysis).toHaveProperty('autoTags')
      expect(analysis).toHaveProperty('smartTitle')
      expect(analysis).toHaveProperty('analyzedAt')
    })

    it('should generate smart title from conversation', () => {
      const messages = [createMessage('user', 'How do I implement a React component?')]

      const analysis = analyzeConversation('test-session', messages)

      expect(analysis.smartTitle).toBe('How do I implement a React component?')
    })
  })
})
