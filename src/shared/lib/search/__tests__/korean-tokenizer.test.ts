import { describe, it, expect } from 'vitest'
import { tokenize, computeRelevanceScore } from '../korean-tokenizer'

describe('tokenize', () => {
  describe('basic space split (Tier 1)', () => {
    it('should split space-separated Korean words', () => {
      const tokens = tokenize('삼성 갤럭시 스마트폰')
      expect(tokens).toContain('삼성')
      expect(tokens).toContain('갤럭시')
      expect(tokens).toContain('스마트폰')
    })

    it('should filter out single-character tokens', () => {
      const tokens = tokenize('a b 삼성')
      expect(tokens).not.toContain('a')
      expect(tokens).not.toContain('b')
      expect(tokens).toContain('삼성')
    })

    it('should return empty array for empty string', () => {
      expect(tokenize('')).toEqual([])
    })

    it('should return empty array for whitespace only', () => {
      expect(tokenize('   ')).toEqual([])
    })

    it('should lowercase all tokens', () => {
      const tokens = tokenize('React TypeScript')
      expect(tokens).toContain('react')
      expect(tokens).toContain('typescript')
      expect(tokens).not.toContain('React')
    })
  })

  describe('Korean n-gram (Tier 2)', () => {
    it('should generate 2-4 char n-grams for long Korean words', () => {
      const tokens = tokenize('갤럭시스마트폰')
      expect(tokens).toContain('갤럭')
      expect(tokens).toContain('럭시')
      expect(tokens).toContain('시스')
      expect(tokens).toContain('스마')
      expect(tokens).toContain('마트')
    })

    it('should include 3-char and 4-char n-grams', () => {
      const tokens = tokenize('갤럭시스마트폰')
      expect(tokens).toContain('갤럭시')
      expect(tokens).toContain('럭시스')
      expect(tokens).toContain('갤럭시스')
    })

    it('should not generate n-grams for 2-char words', () => {
      const tokens = tokenize('삼성')
      const samTokens = tokens.filter((t) => /^[가-힣]+$/.test(t))
      expect(samTokens).toEqual(['삼성'])
    })

    it('should keep original word as a token', () => {
      const tokens = tokenize('갤럭시스마트폰')
      expect(tokens).toContain('갤럭시스마트폰')
    })
  })

  describe('compound word decomposition (Tier 3)', () => {
    it('should decompose 스마트폰 into 스마트 (폰 is 1-char, filtered)', () => {
      const tokens = tokenize('스마트폰')
      expect(tokens).toContain('스마트')
      // '폰' is 1 char → excluded by min length filter
      expect(tokens).not.toContain('폰')
    })

    it('should decompose 가격비교 into 가격 and 비교', () => {
      const tokens = tokenize('가격비교')
      expect(tokens).toContain('가격')
      expect(tokens).toContain('비교')
    })

    it('should decompose 인공지능 into 인공 and 지능', () => {
      const tokens = tokenize('인공지능')
      expect(tokens).toContain('인공')
      expect(tokens).toContain('지능')
    })

    it('should handle words not in compound dictionary', () => {
      const tokens = tokenize('고양이')
      expect(tokens).toContain('고양이')
      expect(tokens).toContain('고양')
    })
  })

  describe('English prefix generation', () => {
    it('should generate prefixes for English words (3+ chars)', () => {
      const tokens = tokenize('search')
      expect(tokens).toContain('sea')
      expect(tokens).toContain('sear')
      expect(tokens).toContain('searc')
      expect(tokens).toContain('search')
    })

    it('should not generate prefixes for short English words', () => {
      const tokens = tokenize('ai ml')
      expect(tokens).toContain('ai')
      expect(tokens).toContain('ml')
      expect(tokens).not.toContain('a')
    })
  })

  describe('special characters and edge cases', () => {
    it('should strip special characters', () => {
      const tokens = tokenize('삼성!갤럭시@스마트폰')
      expect(tokens).toContain('삼성')
      expect(tokens).toContain('갤럭시')
    })

    it('should handle mixed Korean and English', () => {
      const tokens = tokenize('React 컴포넌트 설계')
      expect(tokens).toContain('react')
      expect(tokens).toContain('컴포넌트')
      expect(tokens).toContain('설계')
    })

    it('should not produce duplicate tokens', () => {
      const tokens = tokenize('삼성 삼성 갤럭시')
      expect(tokens.length).toBe(new Set(tokens).size)
    })

    it('should cap token length at 20 characters', () => {
      const longWord = '가'.repeat(25)
      const tokens = tokenize(longWord)
      expect(tokens.every((t) => t.length <= 20)).toBe(true)
    })
  })
})

describe('computeRelevanceScore', () => {
  it('should give higher score for more matched tokens', () => {
    const score1 = computeRelevanceScore('test', 'title', 1, 3)
    const score2 = computeRelevanceScore('test', 'title', 3, 3)
    expect(score2).toBeGreaterThan(score1)
  })

  it('should give title match bonus', () => {
    const withTitle = computeRelevanceScore('react', 'React Guide', 1, 1)
    const noTitle = computeRelevanceScore('react', 'JavaScript Tips', 1, 1)
    expect(withTitle).toBeGreaterThan(noTitle)
  })

  it('should give recency bonus for recent items', () => {
    const recent = computeRelevanceScore('test', 'title', 1, 1, Date.now())
    const old = computeRelevanceScore('test', 'title', 1, 1, Date.now() - 30 * 86_400_000)
    expect(recent).toBeGreaterThan(old)
  })

  it('should return title bonus even with zero query tokens', () => {
    // With empty query, matchRatio = 0, but title match still gives 30 points
    const score = computeRelevanceScore('title', 'title', 0, 0)
    expect(score).toBe(30)
  })

  it('should return 0 for completely unrelated query', () => {
    const score = computeRelevanceScore('xyz', 'title', 0, 1)
    expect(score).toBe(0)
  })
})
