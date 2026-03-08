import { describe, it, expect } from 'vitest'
import { EntropyEncoder } from '../entropy-encoder'

describe('EntropyEncoder', () => {
  it('returns original for short text (< 5 words)', () => {
    const encoder = new EntropyEncoder(0.3)
    const result = encoder.encode('hello world')
    expect(result.compressed).toBe('hello world')
    expect(result.ratio).toBe(0)
    expect(result.savedTokens).toBe(0)
  })

  it('compresses text by filtering high-frequency (low information) tokens', () => {
    // self-information: -log2(p). "the" appears 6/12 times → I=1.0 bit
    // unique words appear 1/12 → I=3.58 bits. threshold=3.0 keeps only unique words
    const encoder = new EntropyEncoder(3.0)
    const text = 'the the the the the the cat dog fox bird tree rock'
    const result = encoder.encode(text)
    expect(result.compressedTokens).toBeLessThan(result.originalTokens)
    expect(result.ratio).toBeGreaterThan(0)
    expect(result.compressed).not.toContain('the')
    expect(result.compressed).toContain('cat')
  })

  it('preserves unique/high-entropy tokens', () => {
    const encoder = new EntropyEncoder(0.1)
    const text = 'React TypeScript Zustand Vite Dexie IndexedDB FastAPI Modal'
    const result = encoder.encode(text)
    // All unique words have high entropy — should preserve most
    expect(result.compressed).toContain('React')
    expect(result.compressed).toContain('TypeScript')
  })

  it('does not compress beyond 60% to preserve meaning', () => {
    const encoder = new EntropyEncoder(0.9) // Very aggressive threshold
    const text = 'the quick brown fox jumps over the lazy dog in the park'
    const result = encoder.encode(text)
    // Should fall back to original if too much would be lost
    expect(result.compressedTokens).toBeGreaterThanOrEqual(result.originalTokens * 0.4)
  })

  it('respects threshold setting', () => {
    const encoder = new EntropyEncoder(1.0)
    const text = 'hello world hello world hello foo bar baz qux quux corge extra'
    const low = encoder.encode(text)

    encoder.setThreshold(3.0)
    const high = encoder.encode(text)

    // Higher threshold = more aggressive filtering (removes frequent words) = fewer tokens
    expect(high.compressedTokens).toBeLessThanOrEqual(low.compressedTokens)
  })

  it('analyzeTokens returns sorted entropy data', () => {
    const encoder = new EntropyEncoder()
    const tokens = encoder.analyzeTokens('apple banana apple cherry banana apple date')
    expect(tokens.length).toBeGreaterThan(0)
    expect(tokens[0].entropy).toBeGreaterThanOrEqual(tokens[tokens.length - 1].entropy)

    const appleToken = tokens.find((t) => t.token === 'apple')
    expect(appleToken).toBeDefined()
    expect(appleToken!.frequency).toBe(3)
  })

  it('computeSelfInformation: frequent words have lower value', () => {
    const encoder = new EntropyEncoder()
    const words = ['hello', 'world', 'hello']
    const info = encoder.computeSelfInformation(words)
    expect(info.has('hello')).toBe(true)
    expect(info.has('world')).toBe(true)
    // "hello" appears twice (more frequent) → lower self-information
    expect(info.get('hello')!).toBeLessThan(info.get('world')!)
  })

  it('handles empty string', () => {
    const encoder = new EntropyEncoder()
    const result = encoder.encode('')
    expect(result.compressed).toBe('')
    expect(result.savedTokens).toBe(0)
  })

  it('handles Korean text', () => {
    const encoder = new EntropyEncoder(0.2)
    const text = '리액트 타입스크립트 리액트 리액트 주스탠드 바이트 덱시'
    const result = encoder.encode(text)
    expect(result.originalTokens).toBeGreaterThan(0)
    expect(result.compressed.length).toBeGreaterThan(0)
  })

  it('ratio is between 0 and 1', () => {
    const encoder = new EntropyEncoder(0.3)
    const text = 'the the the the unique word here another unique special token added'
    const result = encoder.encode(text)
    expect(result.ratio).toBeGreaterThanOrEqual(0)
    expect(result.ratio).toBeLessThanOrEqual(1)
  })

  it('entropyScore is non-negative', () => {
    const encoder = new EntropyEncoder()
    const result = encoder.encode('some text with various words for testing entropy calculation')
    expect(result.entropyScore).toBeGreaterThanOrEqual(0)
  })
})
