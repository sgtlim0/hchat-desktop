import { describe, it, expect } from 'vitest'
import {
  escapeRegex,
  createSearchRegex,
  matchAll,
  extractEmails,
  extractPhoneNumbers,
  isMatch,
  replaceAll,
  highlightMatches,
  countMatches,
  testPattern
} from '../regex-utils'

describe('regex-utils', () => {
  describe('escapeRegex', () => {
    it('escapes special regex characters', () => {
      expect(escapeRegex('hello.world')).toBe('hello\\.world')
      expect(escapeRegex('test[123]')).toBe('test\\[123\\]')
      expect(escapeRegex('$100.00')).toBe('\\$100\\.00')
      expect(escapeRegex('(a+b)*c?')).toBe('\\(a\\+b\\)\\*c\\?')
      expect(escapeRegex('^start|end$')).toBe('\\^start\\|end\\$')
      expect(escapeRegex('normal text')).toBe('normal text')
    })

    it('handles empty string', () => {
      expect(escapeRegex('')).toBe('')
    })

    it('escapes backslashes', () => {
      expect(escapeRegex('path\\to\\file')).toBe('path\\\\to\\\\file')
      expect(escapeRegex('\\d+')).toBe('\\\\d\\+')
    })
  })

  describe('createSearchRegex', () => {
    it('returns case-insensitive regex by default', () => {
      const regex = createSearchRegex('test')
      expect(regex.flags).toContain('i')
      expect(regex.test('TEST')).toBe(true)
      expect(regex.test('Test')).toBe(true)
      expect(regex.test('test')).toBe(true)
    })

    it('escapes special characters in query', () => {
      const regex = createSearchRegex('test.com')
      expect(regex.source).toBe('test\\.com')
      expect(regex.test('test.com')).toBe(true)
      expect(regex.test('testXcom')).toBe(false)
    })

    it('accepts custom flags', () => {
      const regex = createSearchRegex('test', 'g')
      expect(regex.flags).toBe('g')
      expect(regex.global).toBe(true)
    })

    it('handles empty query', () => {
      const regex = createSearchRegex('')
      expect(regex.source).toBe('(?:)') // JavaScript converts empty pattern to (?:)
      expect(regex.test('')).toBe(true)
    })
  })

  describe('matchAll', () => {
    it('returns all matches with indices', () => {
      const text = 'The cat in the hat sat on the mat'
      const pattern = /at/g
      const matches = matchAll(text, pattern)

      expect(matches).toHaveLength(4) // cat, hat, sat, mat
      expect(matches[0]).toEqual({ match: 'at', index: 5 })  // cat
      expect(matches[1]).toEqual({ match: 'at', index: 16 }) // hat
      expect(matches[2]).toEqual({ match: 'at', index: 20 }) // sat
      expect(matches[3]).toEqual({ match: 'at', index: 31 }) // mat
    })

    it('returns empty array for no matches', () => {
      const matches = matchAll('hello world', /xyz/g)
      expect(matches).toEqual([])
    })

    it('works with non-global regex', () => {
      const matches = matchAll('test test test', /test/)
      expect(matches).toHaveLength(1)
      expect(matches[0]).toEqual({ match: 'test', index: 0 })
    })

    it('handles capture groups', () => {
      const text = 'price: $100, cost: $50'
      const pattern = /\$(\d+)/g
      const matches = matchAll(text, pattern)

      expect(matches).toHaveLength(2)
      expect(matches[0].match).toBe('$100')
      expect(matches[1].match).toBe('$50')
    })
  })

  describe('extractEmails', () => {
    it('finds emails in text', () => {
      const text = 'Contact us at info@example.com or support@test.co.uk'
      const emails = extractEmails(text)

      expect(emails).toEqual(['info@example.com', 'support@test.co.uk'])
    })

    it('handles complex email formats', () => {
      const text = 'Email: john.doe+tag@company-name.com'
      const emails = extractEmails(text)

      expect(emails).toEqual(['john.doe+tag@company-name.com'])
    })

    it('returns empty array for no emails', () => {
      const emails = extractEmails('No emails here!')
      expect(emails).toEqual([])
    })

    it('deduplicates emails', () => {
      const text = 'Email test@test.com and again test@test.com'
      const emails = extractEmails(text)

      expect(emails).toEqual(['test@test.com'])
    })

    it('handles mixed case emails', () => {
      const text = 'Contact Admin@EXAMPLE.COM'
      const emails = extractEmails(text)

      expect(emails.length).toBe(1)
      expect(emails[0].toLowerCase()).toBe('admin@example.com')
    })
  })

  describe('extractPhoneNumbers', () => {
    it('finds phone numbers in various formats', () => {
      const text = 'Call us at 123-456-7890 or (555) 123-4567'
      const phones = extractPhoneNumbers(text)

      expect(phones).toContain('123-456-7890')
      expect(phones).toContain('(555) 123-4567')
    })

    it('finds international phone numbers', () => {
      const text = 'International: +1-123-456-7890 or +82 10 1234 5678'
      const phones = extractPhoneNumbers(text)

      expect(phones).toContain('+1-123-456-7890')
      expect(phones).toContain('+82 10 1234 5678')
    })

    it('returns empty array for no phone numbers', () => {
      const phones = extractPhoneNumbers('No phone numbers here')
      expect(phones).toEqual([])
    })

    it('deduplicates phone numbers', () => {
      const text = 'Call 123-456-7890 or 123-456-7890'
      const phones = extractPhoneNumbers(text)

      expect(phones).toEqual(['123-456-7890'])
    })

    it('handles dot notation', () => {
      const text = 'Phone: 123.456.7890'
      const phones = extractPhoneNumbers(text)

      expect(phones).toContain('123.456.7890')
    })
  })

  describe('isMatch', () => {
    it('tests pattern against text', () => {
      expect(isMatch('hello world', 'hello')).toBe(true)
      expect(isMatch('hello world', 'HELLO')).toBe(true) // case-insensitive
      expect(isMatch('hello world', 'goodbye')).toBe(false)
    })

    it('works with regex patterns', () => {
      expect(isMatch('test123', /^\w+\d+$/)).toBe(true)
      expect(isMatch('test123', /^[a-z]+$/)).toBe(false)
    })

    it('handles empty text', () => {
      expect(isMatch('', '')).toBe(true)
      expect(isMatch('', 'test')).toBe(false)
    })

    it('escapes special characters in string patterns', () => {
      expect(isMatch('test.com', 'test.com')).toBe(true)
      expect(isMatch('testXcom', 'test.com')).toBe(false)
    })
  })

  describe('replaceAll', () => {
    it('replaces all occurrences', () => {
      const result = replaceAll('hello world, hello universe', 'hello', 'hi')
      expect(result).toBe('hi world, hi universe')
    })

    it('handles special characters', () => {
      const result = replaceAll('price: $100, cost: $50', '$', '€')
      expect(result).toBe('price: €100, cost: €50')
    })

    it('returns original text if pattern not found', () => {
      const result = replaceAll('hello world', 'xyz', 'abc')
      expect(result).toBe('hello world')
    })

    it('handles empty replacement', () => {
      const result = replaceAll('hello world', 'hello ', '')
      expect(result).toBe('world')
    })

    it('is case-insensitive', () => {
      const result = replaceAll('Hello HELLO hello', 'hello', 'hi')
      expect(result).toBe('hi hi hi')
    })
  })

  describe('highlightMatches', () => {
    it('wraps matches in default markers', () => {
      const result = highlightMatches('hello world', 'world')
      expect(result).toBe('hello <mark>world</mark>')
    })

    it('uses custom markers', () => {
      const result = highlightMatches('hello world', 'hello', ['<em>', '</em>'])
      expect(result).toBe('<em>hello</em> world')
    })

    it('highlights multiple matches', () => {
      const result = highlightMatches('test test test', 'test')
      expect(result).toBe('<mark>test</mark> <mark>test</mark> <mark>test</mark>')
    })

    it('is case-insensitive', () => {
      const result = highlightMatches('Hello WORLD', 'hello')
      expect(result).toBe('<mark>Hello</mark> WORLD')
    })

    it('handles special characters in query', () => {
      const result = highlightMatches('price: $100', '$100')
      expect(result).toBe('price: <mark>$100</mark>')
    })

    it('returns original text if no matches', () => {
      const result = highlightMatches('hello world', 'xyz')
      expect(result).toBe('hello world')
    })
  })

  describe('countMatches', () => {
    it('returns match count', () => {
      expect(countMatches('hello hello hello', 'hello')).toBe(3)
      expect(countMatches('test', 'test')).toBe(1)
      expect(countMatches('no match', 'xyz')).toBe(0)
    })

    it('works with regex patterns', () => {
      expect(countMatches('123 456 789', /\d+/g)).toBe(3)
      expect(countMatches('abc def ghi', /[a-z]+/g)).toBe(3)
    })

    it('is case-insensitive for string patterns', () => {
      expect(countMatches('Hello HELLO hello', 'hello')).toBe(3)
    })

    it('handles overlapping matches correctly', () => {
      expect(countMatches('aaa', 'aa')).toBe(1) // not overlapping by default
    })

    it('handles empty string', () => {
      expect(countMatches('', 'test')).toBe(0)
      expect(countMatches('test', '')).toBe(0)
    })
  })

  describe('testPattern', () => {
    it('validates regex without throwing', () => {
      expect(testPattern('^[a-z]+$')).toEqual({ valid: true })
      expect(testPattern('\\d+')).toEqual({ valid: true })
      expect(testPattern('test.*')).toEqual({ valid: true })
    })

    it('returns error for invalid regex', () => {
      const result = testPattern('[unclosed')
      expect(result.valid).toBe(false)
      expect(result.error).toBeDefined()
      expect(result.error).toContain('Invalid regular expression')
    })

    it('handles complex patterns', () => {
      expect(testPattern('(?:[a-z]+|[A-Z]+)')).toEqual({ valid: true })
      expect(testPattern('\\b\\w+@\\w+\\.\\w+\\b')).toEqual({ valid: true })
    })

    it('catches unbalanced parentheses', () => {
      const result = testPattern('(abc')
      expect(result.valid).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('validates empty pattern', () => {
      expect(testPattern('')).toEqual({ valid: true })
    })
  })
})
