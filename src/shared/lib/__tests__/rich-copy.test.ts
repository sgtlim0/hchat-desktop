import { describe, it, expect } from 'vitest'
import { formatCodeForCopy, formatMarkdownForCopy } from '../rich-copy'

describe('rich-copy', () => {
  describe('formatCodeForCopy', () => {
    it('adds language comment', () => {
      expect(formatCodeForCopy('const x = 1', 'typescript')).toContain('Language: typescript')
    })

    it('returns plain code without language', () => {
      expect(formatCodeForCopy('code')).toBe('code')
    })
  })

  describe('formatMarkdownForCopy', () => {
    it('strips bold', () => {
      expect(formatMarkdownForCopy('**bold** text')).toBe('bold text')
    })

    it('strips italic', () => {
      expect(formatMarkdownForCopy('*italic* text')).toBe('italic text')
    })

    it('strips inline code', () => {
      expect(formatMarkdownForCopy('use `npm install`')).toBe('use npm install')
    })

    it('preserves plain text', () => {
      expect(formatMarkdownForCopy('hello world')).toBe('hello world')
    })
  })
})
