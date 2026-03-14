import { describe, it, expect } from 'vitest'
import { estimateReadingTime } from '../content/content-density'

describe('estimateReadingTime', () => {
  it('returns 0 for empty text', () => {
    expect(estimateReadingTime('', 'en')).toBe(0)
  })

  it('returns at least 1 minute for short text', () => {
    expect(estimateReadingTime('Hello world', 'en')).toBe(1)
  })

  it('estimates English reading time at ~250 wpm', () => {
    const words = Array(500).fill('word').join(' ')
    expect(estimateReadingTime(words, 'en')).toBe(2)
  })

  it('estimates Korean reading time at ~200 wpm', () => {
    // 800 Korean characters / 2 chars per word = 400 words / 200 wpm = 2 min
    const text = '가'.repeat(800)
    expect(estimateReadingTime(text, 'ko')).toBe(2)
  })

  it('handles mixed content', () => {
    const words = Array(1000).fill('word').join(' ')
    expect(estimateReadingTime(words, 'en')).toBe(4)
  })
})
