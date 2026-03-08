import { describe, it, expect } from 'vitest'
import {
  isEmail,
  isUrl,
  isJson,
  isNotEmpty,
  isMinLength,
  isMaxLength,
  isNumericString,
  isPhoneNumber,
  isHexColor
} from '../validators'

describe('validators', () => {
  describe('isEmail', () => {
    it('returns true for valid email addresses', () => {
      expect(isEmail('user@example.com')).toBe(true)
      expect(isEmail('john.doe@company.co.uk')).toBe(true)
      expect(isEmail('test+tag@gmail.com')).toBe(true)
      expect(isEmail('admin@localhost.local')).toBe(true)
    })

    it('returns false for invalid email formats', () => {
      expect(isEmail('notanemail')).toBe(false)
      expect(isEmail('@example.com')).toBe(false)
      expect(isEmail('user@')).toBe(false)
      expect(isEmail('user @example.com')).toBe(false)
      expect(isEmail('user@example')).toBe(false)
    })

    it('returns false for empty string', () => {
      expect(isEmail('')).toBe(false)
      expect(isEmail(' ')).toBe(false)
    })
  })

  describe('isUrl', () => {
    it('returns true for valid URLs with http/https', () => {
      expect(isUrl('http://example.com')).toBe(true)
      expect(isUrl('https://www.google.com')).toBe(true)
      expect(isUrl('https://api.example.com/path?query=1')).toBe(true)
      expect(isUrl('http://localhost:3000')).toBe(true)
    })

    it('returns false for invalid URLs', () => {
      expect(isUrl('not a url')).toBe(false)
      expect(isUrl('example.com')).toBe(false) // no protocol
      expect(isUrl('ftp://example.com')).toBe(false) // not http/https
      expect(isUrl('http://')).toBe(false)
    })

    it('returns false for URLs without protocol', () => {
      expect(isUrl('www.example.com')).toBe(false)
      expect(isUrl('example.com/path')).toBe(false)
    })

    it('returns false for empty string', () => {
      expect(isUrl('')).toBe(false)
    })
  })

  describe('isJson', () => {
    it('returns true for valid JSON strings', () => {
      expect(isJson('{"key": "value"}')).toBe(true)
      expect(isJson('[1, 2, 3]')).toBe(true)
      expect(isJson('"string"')).toBe(true)
      expect(isJson('123')).toBe(true)
      expect(isJson('true')).toBe(true)
      expect(isJson('null')).toBe(true)
    })

    it('returns false for invalid JSON', () => {
      expect(isJson('{key: "value"}')).toBe(false) // unquoted key
      expect(isJson("{'key': 'value'}")).toBe(false) // single quotes
      expect(isJson('[1, 2, 3')).toBe(false) // missing bracket
      expect(isJson('undefined')).toBe(false)
    })

    it('returns false for empty string', () => {
      expect(isJson('')).toBe(false)
      expect(isJson(' ')).toBe(false)
    })
  })

  describe('isNotEmpty', () => {
    it('returns true for non-empty strings', () => {
      expect(isNotEmpty('hello')).toBe(true)
      expect(isNotEmpty('a')).toBe(true)
      expect(isNotEmpty('123')).toBe(true)
      expect(isNotEmpty(' text ')).toBe(true)
    })

    it('returns false for empty string', () => {
      expect(isNotEmpty('')).toBe(false)
    })

    it('returns false for whitespace only', () => {
      expect(isNotEmpty(' ')).toBe(false)
      expect(isNotEmpty('   ')).toBe(false)
      expect(isNotEmpty('\t')).toBe(false)
      expect(isNotEmpty('\n')).toBe(false)
    })
  })

  describe('isMinLength', () => {
    it('returns true when string meets minimum length', () => {
      expect(isMinLength('hello', 5)).toBe(true)
      expect(isMinLength('hello', 3)).toBe(true)
      expect(isMinLength('test', 1)).toBe(true)
    })

    it('returns false when string is too short', () => {
      expect(isMinLength('hi', 3)).toBe(false)
      expect(isMinLength('', 1)).toBe(false)
      expect(isMinLength('abc', 5)).toBe(false)
    })

    it('handles edge cases', () => {
      expect(isMinLength('', 0)).toBe(true)
      expect(isMinLength('a', 1)).toBe(true)
    })
  })

  describe('isMaxLength', () => {
    it('returns true when string is within max length', () => {
      expect(isMaxLength('hello', 5)).toBe(true)
      expect(isMaxLength('hello', 10)).toBe(true)
      expect(isMaxLength('', 5)).toBe(true)
    })

    it('returns false when string exceeds max length', () => {
      expect(isMaxLength('hello world', 5)).toBe(false)
      expect(isMaxLength('test', 3)).toBe(false)
    })

    it('handles edge cases', () => {
      expect(isMaxLength('', 0)).toBe(true)
      expect(isMaxLength('a', 0)).toBe(false)
    })
  })

  describe('isNumericString', () => {
    it('returns true for numeric strings', () => {
      expect(isNumericString('123')).toBe(true)
      expect(isNumericString('0')).toBe(true)
      expect(isNumericString('456789')).toBe(true)
    })

    it('returns false for non-numeric strings', () => {
      expect(isNumericString('abc')).toBe(false)
      expect(isNumericString('12a3')).toBe(false)
      expect(isNumericString('1.23')).toBe(false) // contains decimal
      expect(isNumericString('-123')).toBe(false) // negative sign
      expect(isNumericString('')).toBe(false)
      expect(isNumericString(' ')).toBe(false)
    })
  })

  describe('isPhoneNumber', () => {
    it('returns true for basic phone number formats', () => {
      expect(isPhoneNumber('123-456-7890')).toBe(true)
      expect(isPhoneNumber('(123) 456-7890')).toBe(true)
      expect(isPhoneNumber('123.456.7890')).toBe(true)
      expect(isPhoneNumber('1234567890')).toBe(true)
      expect(isPhoneNumber('+1-123-456-7890')).toBe(true)
    })

    it('returns false for invalid phone numbers', () => {
      expect(isPhoneNumber('123')).toBe(false)
      expect(isPhoneNumber('abc-def-ghij')).toBe(false)
      expect(isPhoneNumber('')).toBe(false)
      expect(isPhoneNumber('123-45')).toBe(false)
    })
  })

  describe('isHexColor', () => {
    it('returns true for valid hex colors', () => {
      expect(isHexColor('#fff')).toBe(true)
      expect(isHexColor('#FFF')).toBe(true)
      expect(isHexColor('#ffffff')).toBe(true)
      expect(isHexColor('#FF0000')).toBe(true)
      expect(isHexColor('#00ff00')).toBe(true)
      expect(isHexColor('#123456')).toBe(true)
      expect(isHexColor('#aAbBcC')).toBe(true)
    })

    it('returns false for invalid hex colors', () => {
      expect(isHexColor('fff')).toBe(false) // no hash
      expect(isHexColor('#ff')).toBe(false) // too short
      expect(isHexColor('#ffff')).toBe(false) // wrong length
      expect(isHexColor('#gggggg')).toBe(false) // invalid chars
      expect(isHexColor('#1234567')).toBe(false) // too long
      expect(isHexColor('')).toBe(false)
      expect(isHexColor('red')).toBe(false)
    })
  })
})