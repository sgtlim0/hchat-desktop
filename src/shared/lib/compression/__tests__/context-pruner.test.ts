import { describe, it, expect } from 'vitest'
import { pruneContext, summarizeOldMessages } from '../context-pruner'

const makeMessages = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    role: i % 2 === 0 ? 'user' : 'assistant',
    content: `Message ${i + 1} with some content that takes up tokens for testing the pruning logic.`,
  }))

describe('pruneContext', () => {
  it('returns all messages when under token budget', () => {
    const messages = makeMessages(4)
    const result = pruneContext(messages, { maxTokens: 10000 })
    expect(result.messages).toHaveLength(4)
    expect(result.prunedCount).toBe(0)
  })

  it('prunes old messages to fit budget', () => {
    const messages = makeMessages(20)
    const result = pruneContext(messages, { maxTokens: 100, minMessagesToKeep: 4 })
    expect(result.messages.length).toBeLessThan(20)
    expect(result.prunedCount).toBeGreaterThan(0)
    // Always keeps the last 4
    expect(result.messages.slice(-4)).toEqual(messages.slice(-4))
  })

  it('keeps minimum number of recent messages', () => {
    const messages = makeMessages(10)
    const result = pruneContext(messages, { maxTokens: 50, minMessagesToKeep: 6 })
    expect(result.messages.length).toBeGreaterThanOrEqual(6)
  })

  it('handles empty messages array', () => {
    const result = pruneContext([], { maxTokens: 1000 })
    expect(result.messages).toHaveLength(0)
    expect(result.prunedCount).toBe(0)
  })

  it('handles single message', () => {
    const messages = [{ role: 'user', content: 'hello' }]
    const result = pruneContext(messages, { maxTokens: 1000 })
    expect(result.messages).toHaveLength(1)
  })

  it('reports correct original tokens', () => {
    const messages = makeMessages(5)
    const result = pruneContext(messages, { maxTokens: 10000 })
    expect(result.originalTokens).toBeGreaterThan(0)
    expect(result.totalTokens).toBe(result.originalTokens)
  })
})

describe('summarizeOldMessages', () => {
  it('returns all when count <= keepRecent', () => {
    const messages = makeMessages(3)
    const result = summarizeOldMessages(messages, 5)
    expect(result.summary).toBe('')
    expect(result.kept).toHaveLength(3)
  })

  it('summarizes old messages and keeps recent', () => {
    const messages = makeMessages(10)
    const result = summarizeOldMessages(messages, 4)
    expect(result.kept).toHaveLength(4)
    expect(result.summary).toContain('[Previous context summary')
    expect(result.summary).toContain('6 messages')
  })

  it('summary contains role labels', () => {
    const messages = makeMessages(6)
    const result = summarizeOldMessages(messages, 2)
    expect(result.summary).toContain('[user]')
    expect(result.summary).toContain('[assistant]')
  })
})
