import { describe, it, expect } from 'vitest'
import { generateId, generateUUID, generateShortId, generateSlug, isValidUUID } from '../id-generator'

describe('id-generator', () => {
  describe('generateId', () => {
    it('generates with default prefix', () => {
      expect(generateId()).toMatch(/^id-/)
    })
    it('uses custom prefix', () => {
      expect(generateId('user')).toMatch(/^user-/)
    })
    it('generates unique ids', () => {
      const ids = new Set(Array.from({ length: 100 }, () => generateId()))
      expect(ids.size).toBe(100)
    })
  })

  describe('generateUUID', () => {
    it('generates valid UUID v4', () => {
      const uuid = generateUUID()
      expect(isValidUUID(uuid)).toBe(true)
    })
    it('generates unique UUIDs', () => {
      const uuids = new Set(Array.from({ length: 50 }, () => generateUUID()))
      expect(uuids.size).toBe(50)
    })
  })

  describe('generateShortId', () => {
    it('generates default 8 chars', () => {
      expect(generateShortId()).toHaveLength(8)
    })
    it('generates custom length', () => {
      expect(generateShortId(16)).toHaveLength(16)
    })
    it('contains only alphanumeric', () => {
      expect(generateShortId(32)).toMatch(/^[A-Za-z0-9]+$/)
    })
  })

  describe('generateSlug', () => {
    it('converts text to slug', () => {
      expect(generateSlug('Hello World')).toBe('hello-world')
    })
    it('removes special chars', () => {
      expect(generateSlug('Hello! @World#')).toBe('hello-world')
    })
    it('trims dashes', () => {
      expect(generateSlug('  hello  ')).toBe('hello')
    })
  })

  describe('isValidUUID', () => {
    it('valid UUID', () => {
      expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true)
    })
    it('invalid string', () => {
      expect(isValidUUID('not-a-uuid')).toBe(false)
    })
    it('empty string', () => {
      expect(isValidUUID('')).toBe(false)
    })
  })
})
