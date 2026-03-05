import { describe, it, expect } from 'vitest'
import { detectSearchIntent } from '../search-intent'

describe('detectSearchIntent', () => {
  it('should detect keyword-based search intents', () => {
    expect(detectSearchIntent('search for latest news')).toBe(true)
    expect(detectSearchIntent('look up the weather')).toBe(true)
    expect(detectSearchIntent('find me a recipe')).toBe(true)
    expect(detectSearchIntent('what is the latest version of Node')).toBe(true)
    expect(detectSearchIntent('stock price of AAPL')).toBe(true)
  })

  it('should detect time-related keywords', () => {
    expect(detectSearchIntent('what happened today')).toBe(true)
    expect(detectSearchIntent('news from yesterday')).toBe(true)
    expect(detectSearchIntent('events this week')).toBe(true)
    expect(detectSearchIntent('in 2025 release')).toBe(true)
    expect(detectSearchIntent('in 2026 update')).toBe(true)
  })

  it('should detect regex pattern matches', () => {
    expect(detectSearchIntent("what's the score right now")).toBe(true)
    expect(detectSearchIntent('when is the next election happening')).toBe(true)
    expect(detectSearchIntent('check https://example.com')).toBe(true)
  })

  it('should detect Korean search keywords', () => {
    expect(detectSearchIntent('최신 뉴스 알려줘')).toBe(true)
    expect(detectSearchIntent('오늘 날씨 어때')).toBe(true)
    expect(detectSearchIntent('검색해줘')).toBe(true)
  })

  it('should return false for non-search intents', () => {
    expect(detectSearchIntent('hello how are you')).toBe(false)
    expect(detectSearchIntent('write me a poem')).toBe(false)
    expect(detectSearchIntent('explain quantum physics')).toBe(false)
    expect(detectSearchIntent('translate this to Korean')).toBe(false)
  })

  it('should be case-insensitive for keywords', () => {
    expect(detectSearchIntent('SEARCH FOR something')).toBe(true)
    expect(detectSearchIntent('Google this')).toBe(true)
  })

  it('should handle empty string', () => {
    expect(detectSearchIntent('')).toBe(false)
  })
})
