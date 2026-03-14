import { describe, it, expect } from 'vitest'
import { estimateTokens } from '../src/lib/token-estimator'

describe('estimateTokens', () => {
  it('returns 0 for empty string', () => {
    expect(estimateTokens('')).toBe(0)
  })

  it('returns 0 for undefined-like input', () => {
    expect(estimateTokens(undefined as unknown as string)).toBe(0)
  })

  it('returns at least 1 for short text', () => {
    expect(estimateTokens('hi')).toBe(1)
  })

  it('estimates ~4 chars per token', () => {
    const text = 'a'.repeat(100)
    expect(estimateTokens(text)).toBe(25)
  })

  it('rounds up partial tokens', () => {
    const text = 'a'.repeat(5)
    expect(estimateTokens(text)).toBe(2)
  })
})
