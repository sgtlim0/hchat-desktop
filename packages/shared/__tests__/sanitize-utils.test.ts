import { describe, it, expect } from 'vitest'
import {
  escapeHtml,
  stripHtmlTags,
  sanitizeUrl,
  sanitizeFilename,
  preventXss,
  isCleanText,
} from '../src/lib/sanitize-utils'

describe('escapeHtml', () => {
  it('escapes HTML entities', () => {
    expect(escapeHtml('<script>alert("xss")</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;'
    )
  })

  it('escapes ampersands', () => {
    expect(escapeHtml('a & b')).toBe('a &amp; b')
  })
})

describe('stripHtmlTags', () => {
  it('removes HTML tags', () => {
    expect(stripHtmlTags('<p>Hello <b>world</b></p>')).toBe('Hello world')
  })
})

describe('sanitizeUrl', () => {
  it('blocks javascript: URLs', () => {
    expect(sanitizeUrl('javascript:alert(1)')).toBe('')
  })

  it('blocks vbscript: URLs', () => {
    expect(sanitizeUrl('vbscript:msgbox')).toBe('')
  })

  it('allows data:image URLs', () => {
    expect(sanitizeUrl('data:image/png;base64,abc')).toBe('data:image/png;base64,abc')
  })

  it('blocks non-image data: URLs', () => {
    expect(sanitizeUrl('data:text/html,<script>alert(1)</script>')).toBe('')
  })

  it('allows normal URLs', () => {
    expect(sanitizeUrl('https://example.com')).toBe('https://example.com')
  })
})

describe('sanitizeFilename', () => {
  it('replaces invalid characters', () => {
    expect(sanitizeFilename('file<>:"/\\|?*name.txt')).toBe('file_________name.txt')
  })

  it('removes leading dots', () => {
    expect(sanitizeFilename('...hidden')).toBe('hidden')
  })

  it('truncates to 255 chars', () => {
    const long = 'a'.repeat(300)
    expect(sanitizeFilename(long).length).toBe(255)
  })
})

describe('preventXss', () => {
  it('strips tags and escapes entities', () => {
    expect(preventXss('<script>alert("xss")</script>')).toBe(
      'alert(&quot;xss&quot;)'
    )
  })
})

describe('isCleanText', () => {
  it('returns true for clean text', () => {
    expect(isCleanText('Hello world')).toBe(true)
  })

  it('returns false for script tags', () => {
    expect(isCleanText('<script>alert(1)</script>')).toBe(false)
  })

  it('returns false for event handlers', () => {
    expect(isCleanText('<div onclick="alert(1)">')).toBe(false)
  })

  it('returns false for javascript: protocol', () => {
    expect(isCleanText('javascript:alert(1)')).toBe(false)
  })
})
