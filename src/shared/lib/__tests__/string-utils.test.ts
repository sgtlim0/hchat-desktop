import { describe, it, expect } from 'vitest'
import { padStart, padEnd, mask, slugify, capitalize, reverse, repeat, contains, startsWith, endsWith } from '../string-utils'

describe('string-utils', () => {
  describe('padStart/padEnd', () => {
    it('pads start', () => { expect(padStart('5', 3, '0')).toBe('005') })
    it('pads end', () => { expect(padEnd('hi', 5, '.')).toBe('hi...') })
    it('no pad when already long enough', () => { expect(padStart('hello', 3)).toBe('hello') })
  })

  describe('mask', () => {
    it('masks middle', () => { expect(mask('hello@email.com', 2, 4)).toBe('he*********.com') })
    it('short string unchanged', () => { expect(mask('ab', 3)).toBe('ab') })
    it('custom mask char', () => { expect(mask('secret', 1, 1, '#')).toBe('s####t') })
    it('default params', () => { expect(mask('password')).toBe('pa******') })
  })

  describe('slugify', () => {
    it('converts to slug', () => { expect(slugify('Hello World!')).toBe('hello-world') })
    it('handles spaces', () => { expect(slugify('  a  b  ')).toBe('a-b') })
    it('handles Korean', () => { expect(slugify('한국어 테스트')).toBe('한국어-테스트') })
  })

  describe('capitalize', () => {
    it('capitalizes', () => { expect(capitalize('hello')).toBe('Hello') })
    it('empty', () => { expect(capitalize('')).toBe('') })
  })

  describe('reverse', () => {
    it('reverses', () => { expect(reverse('hello')).toBe('olleh') })
    it('empty', () => { expect(reverse('')).toBe('') })
  })

  describe('repeat', () => {
    it('with separator', () => { expect(repeat('ha', 3, '-')).toBe('ha-ha-ha') })
    it('no separator', () => { expect(repeat('ab', 2)).toBe('abab') })
    it('zero', () => { expect(repeat('x', 0)).toBe('') })
  })

  describe('contains', () => {
    it('case sensitive', () => {
      expect(contains('Hello', 'Hello')).toBe(true)
      expect(contains('Hello', 'hello')).toBe(false)
    })
    it('case insensitive', () => {
      expect(contains('Hello', 'hello', true)).toBe(true)
    })
  })

  describe('startsWith', () => {
    it('case sensitive', () => {
      expect(startsWith('Hello World', 'Hello')).toBe(true)
      expect(startsWith('Hello World', 'hello')).toBe(false)
    })
    it('case insensitive', () => {
      expect(startsWith('Hello World', 'hello', true)).toBe(true)
    })
  })

  describe('endsWith', () => {
    it('case sensitive', () => {
      expect(endsWith('Hello World', 'World')).toBe(true)
      expect(endsWith('Hello World', 'world')).toBe(false)
    })
    it('case insensitive', () => {
      expect(endsWith('Hello World', 'world', true)).toBe(true)
    })
  })
})
