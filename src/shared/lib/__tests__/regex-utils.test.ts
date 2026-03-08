import { describe, it, expect } from 'vitest'
import { escapeRegex, createSearchRegex, matchAll, extractEmails, extractPhoneNumbers, isMatch, replaceAll, highlightMatches, countMatches, testPattern } from '../regex-utils'

describe('regex-utils', () => {
  it('escapeRegex escapes special chars', () => {
    expect(escapeRegex('hello.world')).toBe('hello\\.world')
    expect(escapeRegex('a+b*c')).toBe('a\\+b\\*c')
  })

  it('createSearchRegex case insensitive', () => {
    const r = createSearchRegex('hello')
    expect(r.test('Hello World')).toBe(true)
  })

  it('matchAll returns all matches', () => {
    const results = matchAll('abc abc abc', /abc/g)
    expect(results).toHaveLength(3)
    expect(results[0].index).toBe(0)
    expect(results[1].index).toBe(4)
  })

  it('extractEmails finds emails', () => {
    expect(extractEmails('Contact user@example.com or admin@test.org')).toEqual(['user@example.com', 'admin@test.org'])
  })

  it('extractPhoneNumbers finds numbers', () => {
    const nums = extractPhoneNumbers('Call 123-456-7890 or (555) 123-4567')
    expect(nums.length).toBeGreaterThanOrEqual(1)
  })

  it('isMatch tests pattern', () => {
    expect(isMatch('hello123', /\d+/)).toBe(true)
    expect(isMatch('hello', /\d+/)).toBe(false)
  })

  it('replaceAll replaces all', () => {
    expect(replaceAll('a.b.c', '.', '-')).toBe('a-b-c')
  })

  it('highlightMatches wraps matches', () => {
    expect(highlightMatches('hello world', 'hello')).toBe('<mark>hello</mark> world')
  })

  it('countMatches returns count', () => {
    expect(countMatches('aaa', 'a')).toBe(3)
    expect(countMatches('hello', /l/)).toBe(2)
  })

  it('testPattern validates regex', () => {
    expect(testPattern('\\d+')).toEqual({ valid: true })
    expect(testPattern('[invalid').valid).toBe(false)
  })
})
