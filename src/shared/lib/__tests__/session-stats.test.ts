import { describe, it, expect } from 'vitest'
import { calculateSessionStats, formatDuration } from '../session-stats'

describe('session-stats', () => {
  it('returns zeros for empty messages', () => {
    const stats = calculateSessionStats([])
    expect(stats.messageCount).toBe(0)
    expect(stats.totalTokensEstimate).toBe(0)
  })

  it('counts user and assistant messages', () => {
    const messages = [
      { role: 'user' as const, segments: [{ type: 'text', content: 'Hi' }] },
      { role: 'assistant' as const, segments: [{ type: 'text', content: 'Hello!' }] },
      { role: 'user' as const, segments: [{ type: 'text', content: 'How?' }] },
    ]
    const stats = calculateSessionStats(messages)
    expect(stats.messageCount).toBe(3)
    expect(stats.userMessages).toBe(2)
    expect(stats.assistantMessages).toBe(1)
  })

  it('estimates tokens (chars / 4)', () => {
    const messages = [
      { role: 'user' as const, segments: [{ type: 'text', content: 'A'.repeat(100) }] },
    ]
    expect(calculateSessionStats(messages).totalTokensEstimate).toBe(25)
  })

  it('calculates average message length', () => {
    const messages = [
      { role: 'user' as const, segments: [{ type: 'text', content: 'AAAA' }] },
      { role: 'assistant' as const, segments: [{ type: 'text', content: 'BBBBBB' }] },
    ]
    expect(calculateSessionStats(messages).avgMessageLength).toBe(5) // (4+6)/2
  })

  it('tracks longest message', () => {
    const messages = [
      { role: 'user' as const, segments: [{ type: 'text', content: 'short' }] },
      { role: 'assistant' as const, segments: [{ type: 'text', content: 'A'.repeat(200) }] },
    ]
    expect(calculateSessionStats(messages).longestMessage).toBe(200)
  })

  it('counts tool calls', () => {
    const messages = [
      { role: 'assistant' as const, segments: [{ type: 'tool', toolCalls: [{}, {}] }] },
      { role: 'assistant' as const, segments: [{ type: 'tool', toolCalls: [{}] }] },
    ]
    expect(calculateSessionStats(messages).toolCallCount).toBe(3)
  })

  it('calculates duration from createdAt', () => {
    const messages = [
      { role: 'user' as const, segments: [{ type: 'text', content: 'a' }], createdAt: '2026-01-01T10:00:00Z' },
      { role: 'assistant' as const, segments: [{ type: 'text', content: 'b' }], createdAt: '2026-01-01T10:05:00Z' },
    ]
    expect(calculateSessionStats(messages).durationMs).toBe(300000) // 5 min
  })
})

describe('formatDuration', () => {
  it('formats seconds', () => expect(formatDuration(30000)).toBe('30s'))
  it('formats minutes', () => expect(formatDuration(120000)).toBe('2m'))
  it('formats hours', () => expect(formatDuration(3660000)).toContain('1h'))
})
