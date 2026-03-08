import { describe, it, expect } from 'vitest'
import { parseUrl, buildUrl, getQueryParam, isAbsoluteUrl, getDomain, joinPaths } from '../url-parser'

describe('url-parser', () => {
  describe('parseUrl', () => {
    it('parses full URL', () => {
      const result = parseUrl('https://example.com:8080/path?key=value#hash')
      expect(result.protocol).toBe('https:')
      expect(result.hostname).toBe('example.com')
      expect(result.port).toBe('8080')
      expect(result.pathname).toBe('/path')
      expect(result.search).toBe('?key=value')
      expect(result.hash).toBe('#hash')
      expect(result.params.key).toBe('value')
    })

    it('parses multiple params', () => {
      const result = parseUrl('https://example.com?a=1&b=2&c=3')
      expect(result.params).toEqual({ a: '1', b: '2', c: '3' })
    })
  })

  describe('buildUrl', () => {
    it('builds URL with params', () => {
      const url = buildUrl('https://example.com', { q: 'hello', page: '1' })
      expect(url).toContain('q=hello')
      expect(url).toContain('page=1')
    })

    it('builds URL without params', () => {
      const url = buildUrl('https://example.com/path')
      expect(url).toBe('https://example.com/path')
    })
  })

  describe('getQueryParam', () => {
    it('gets param value', () => {
      expect(getQueryParam('https://x.com?key=val', 'key')).toBe('val')
    })
    it('returns null for missing', () => {
      expect(getQueryParam('https://x.com', 'key')).toBeNull()
    })
    it('returns null for invalid URL', () => {
      expect(getQueryParam('not a url', 'key')).toBeNull()
    })
  })

  describe('isAbsoluteUrl', () => {
    it('http is absolute', () => expect(isAbsoluteUrl('http://x.com')).toBe(true))
    it('https is absolute', () => expect(isAbsoluteUrl('https://x.com')).toBe(true))
    it('relative is not', () => expect(isAbsoluteUrl('/path')).toBe(false))
    it('empty is not', () => expect(isAbsoluteUrl('')).toBe(false))
  })

  describe('getDomain', () => {
    it('extracts domain', () => expect(getDomain('https://sub.example.com/path')).toBe('sub.example.com'))
    it('returns empty for invalid', () => expect(getDomain('not-url')).toBe(''))
  })

  describe('joinPaths', () => {
    it('joins paths', () => {
      expect(joinPaths('https://api.com', 'v1', 'users')).toBe('https://api.com/v1/users')
    })
    it('handles trailing slashes', () => {
      expect(joinPaths('https://api.com/', '/v1/', '/users')).toBe('https://api.com/v1/users')
    })
    it('handles single part', () => {
      expect(joinPaths('/api')).toBe('/api')
    })
  })
})
