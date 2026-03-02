import { describe, it, expect } from 'vitest'
import { estimateTokens } from '../token-estimator'

describe('estimateTokens', () => {
  it('returns 0 for empty string', () => {
    expect(estimateTokens('')).toBe(0)
  })

  it('returns 0 for null/undefined-like values', () => {
    expect(estimateTokens(null as unknown as string)).toBe(0)
    expect(estimateTokens(undefined as unknown as string)).toBe(0)
  })

  it('returns minimum 1 token for non-empty text', () => {
    expect(estimateTokens('a')).toBe(1)
    expect(estimateTokens('ab')).toBe(1)
    expect(estimateTokens('abc')).toBe(1)
  })

  it('estimates ~4 chars per token', () => {
    expect(estimateTokens('abcd')).toBe(1)
    expect(estimateTokens('abcde')).toBe(2)
    expect(estimateTokens('12345678')).toBe(2)
  })

  it('handles longer text', () => {
    const text = 'a'.repeat(100)
    expect(estimateTokens(text)).toBe(25)
  })

  it('rounds up partial tokens', () => {
    // 5 chars → ceil(5/4) = 2
    expect(estimateTokens('hello')).toBe(2)
    // 13 chars → ceil(13/4) = 4
    expect(estimateTokens('Hello, World!')).toBe(4)
  })
})
