import { describe, it, expect } from 'vitest'
import { escapeHtml, stripHtmlTags, sanitizeUrl, sanitizeFilename, preventXss, isCleanText } from '../sanitize-utils'

describe('sanitize-utils', () => {
  describe('escapeHtml', () => {
    it('escapes entities', () => {
      expect(escapeHtml('<script>alert("xss")</script>')).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;')
    })
    it('preserves safe text', () => {
      expect(escapeHtml('Hello World')).toBe('Hello World')
    })
  })

  describe('stripHtmlTags', () => {
    it('removes tags', () => {
      expect(stripHtmlTags('<b>bold</b> text')).toBe('bold text')
    })
    it('handles nested tags', () => {
      expect(stripHtmlTags('<div><p>hello</p></div>')).toBe('hello')
    })
  })

  describe('sanitizeUrl', () => {
    it('allows http/https', () => {
      expect(sanitizeUrl('https://example.com')).toBe('https://example.com')
    })
    it('blocks javascript:', () => {
      expect(sanitizeUrl('javascript:alert(1)')).toBe('')
    })
    it('blocks data: (non-image)', () => {
      expect(sanitizeUrl('data:text/html,<script>alert(1)</script>')).toBe('')
    })
    it('allows data:image', () => {
      expect(sanitizeUrl('data:image/png;base64,abc')).toBe('data:image/png;base64,abc')
    })
  })

  describe('sanitizeFilename', () => {
    it('removes dangerous chars', () => {
      expect(sanitizeFilename('file<>:"/\\|?*.txt')).toBe('file_________.txt')
    })
    it('limits length', () => {
      expect(sanitizeFilename('a'.repeat(300)).length).toBeLessThanOrEqual(255)
    })
  })

  describe('preventXss', () => {
    it('strips and escapes', () => {
      const result = preventXss('<img onerror=alert(1)>')
      expect(result).not.toContain('<')
      expect(result).not.toContain('onerror')
    })
  })

  describe('isCleanText', () => {
    it('true for safe text', () => expect(isCleanText('Hello')).toBe(true))
    it('false for script', () => expect(isCleanText('<script>bad</script>')).toBe(false))
    it('false for event handler', () => expect(isCleanText('onclick=alert(1)')).toBe(false))
  })
})
