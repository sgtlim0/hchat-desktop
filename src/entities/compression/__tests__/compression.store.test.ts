import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useCompressionStore } from '../compression.store'

// Mock the compression utilities
vi.mock('@/shared/lib/compression/prompt-compressor', () => ({
  PromptCompressor: class {
    compress(prompt: string) {
      return {
        compressed: prompt.slice(0, Math.floor(prompt.length * 0.7)),
        savedTokens: Math.floor(prompt.length * 0.3),
      }
    }
    compressMessages(messages: any[]) {
      return messages.map(m => ({ ...m, content: m.content.slice(0, Math.floor(m.content.length * 0.7)) }))
    }
  },
}))

vi.mock('@/shared/lib/compression/context-pruner', () => ({
  pruneContext: vi.fn((messages: any[]) => ({
    messages: messages.slice(-5), // Keep last 5 messages
    prunedCount: Math.max(0, messages.length - 5),
  })),
}))

describe('CompressionStore', () => {
  beforeEach(() => {
    useCompressionStore.setState({
      enabled: false,
      threshold: 0.3,
      contextPruningEnabled: false,
      maxContextTokens: 8000,
      stats: {
        totalCompressed: 0,
        totalSavedTokens: 0,
        totalSavedCost: 0,
        averageRatio: 0,
      },
    })
  })

  it('should have correct initial state', () => {
    const state = useCompressionStore.getState()
    expect(state.enabled).toBe(false)
    expect(state.threshold).toBe(0.3)
    expect(state.contextPruningEnabled).toBe(false)
    expect(state.maxContextTokens).toBe(8000)
    expect(state.stats.totalCompressed).toBe(0)
  })

  it('should toggle compression enabled state', () => {
    const { setEnabled } = useCompressionStore.getState()

    setEnabled(true)
    expect(useCompressionStore.getState().enabled).toBe(true)

    setEnabled(false)
    expect(useCompressionStore.getState().enabled).toBe(false)
  })

  it('should update threshold and recreate compressor', () => {
    const { setThreshold } = useCompressionStore.getState()

    setThreshold(0.5)
    expect(useCompressionStore.getState().threshold).toBe(0.5)
  })

  it('should compress prompt when enabled', () => {
    const { setEnabled, compressPrompt } = useCompressionStore.getState()

    // When disabled, should return original
    const result1 = compressPrompt('Hello world this is a test prompt')
    expect(result1.compressed).toBe('Hello world this is a test prompt')
    expect(result1.savedTokens).toBe(0)

    // When enabled, should compress
    setEnabled(true)
    const testPrompt = 'Hello world this is a test prompt' // 34 chars
    const result2 = compressPrompt(testPrompt)
    // Compressed is 70% of original length
    expect(result2.compressed).toHaveLength(Math.floor(testPrompt.length * 0.7))
    // Saved tokens is 30% of original length
    expect(result2.savedTokens).toBe(Math.floor(testPrompt.length * 0.3))
  })

  it('should compress messages when enabled', () => {
    const { setEnabled, compressMessages } = useCompressionStore.getState()
    const messages = [
      { role: 'user', content: 'Hello world' },
      { role: 'assistant', content: 'How can I help you?' },
    ]

    // When disabled, return original
    const result1 = compressMessages(messages)
    expect(result1).toEqual(messages)

    // When enabled, compress content
    setEnabled(true)
    const result2 = compressMessages(messages)
    expect(result2[0].content).toHaveLength(7) // 70% of 11
    expect(result2[1].content).toHaveLength(13) // 70% of 19
  })

  it('should prune messages when context pruning enabled', () => {
    const { setContextPruningEnabled, pruneMessages } = useCompressionStore.getState()
    const messages = Array.from({ length: 10 }, (_, i) => ({
      role: i % 2 === 0 ? 'user' : 'assistant',
      content: `Message ${i}`,
    }))

    // When disabled, return all
    const result1 = pruneMessages(messages)
    expect(result1).toHaveLength(10)

    // When enabled, prune to last 5
    setContextPruningEnabled(true)
    const result2 = pruneMessages(messages)
    expect(result2).toHaveLength(5)
  })

  it('should record compression statistics', () => {
    const { recordCompression } = useCompressionStore.getState()

    recordCompression(100, 0.001)
    let currentStats = useCompressionStore.getState().stats
    expect(currentStats.totalCompressed).toBe(1)
    expect(currentStats.totalSavedTokens).toBe(100)
    expect(currentStats.totalSavedCost).toBe(0.1)

    recordCompression(50, 0.001)
    currentStats = useCompressionStore.getState().stats
    expect(currentStats.totalCompressed).toBe(2)
    expect(currentStats.totalSavedTokens).toBe(150)
    expect(currentStats.totalSavedCost).toBeCloseTo(0.15, 5)
  })

  it('should reset statistics', () => {
    const { recordCompression, resetStats } = useCompressionStore.getState()

    recordCompression(100, 0.001)
    expect(useCompressionStore.getState().stats.totalCompressed).toBe(1)

    resetStats()
    const stats = useCompressionStore.getState().stats
    expect(stats.totalCompressed).toBe(0)
    expect(stats.totalSavedTokens).toBe(0)
    expect(stats.totalSavedCost).toBe(0)
    expect(stats.averageRatio).toBe(0)
  })
})