import { describe, it, expect, vi, beforeEach } from 'vitest'
import { buildToolSystemPrompt } from '../tool-context-injector'

// Only test pure functions (injectToolContext needs fetch mocking which is complex)

describe('tool-context-injector', () => {
  describe('buildToolSystemPrompt', () => {
    it('returns base prompt when no tool context', () => {
      expect(buildToolSystemPrompt('You are helpful.', '')).toBe('You are helpful.')
    })

    it('appends tool context to base prompt', () => {
      const result = buildToolSystemPrompt('Be helpful.', '---사내 검색 결과---\nsome results\n---')
      expect(result).toContain('Be helpful.')
      expect(result).toContain('사내 검색 결과')
      expect(result).toContain('출처')
    })

    it('works without base prompt', () => {
      const result = buildToolSystemPrompt('', '---사내 검색 결과---\ndata\n---')
      expect(result).toContain('사내 검색 결과')
      expect(result).toContain('출처')
    })

    it('includes citation instruction', () => {
      const result = buildToolSystemPrompt('', 'context data')
      expect(result).toContain('출처')
      expect(result).toContain('언급')
    })
  })
})
