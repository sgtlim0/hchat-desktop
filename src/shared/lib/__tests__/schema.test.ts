import { describe, it, expect } from 'vitest'
import { s, validate } from '../schema'

describe('schema', () => {
  describe('string', () => {
    it('accepts string', () => expect(validate('hi', s.string()).valid).toBe(true))
    it('rejects number', () => expect(validate(42, s.string()).valid).toBe(false))
  })

  describe('number', () => {
    it('accepts number', () => expect(validate(42, s.number()).valid).toBe(true))
    it('rejects NaN', () => expect(validate(NaN, s.number()).valid).toBe(false))
    it('rejects string', () => expect(validate('42', s.number()).valid).toBe(false))
  })

  describe('boolean', () => {
    it('accepts boolean', () => expect(validate(true, s.boolean()).valid).toBe(true))
    it('rejects number', () => expect(validate(1, s.boolean()).valid).toBe(false))
  })

  describe('array', () => {
    it('accepts array', () => expect(validate([1, 2], s.array()).valid).toBe(true))
    it('rejects non-array', () => expect(validate('a', s.array()).valid).toBe(false))
    it('validates items', () => {
      expect(validate([1, 2], s.array(s.number())).valid).toBe(true)
      expect(validate([1, 'a'], s.array(s.number())).valid).toBe(false)
    })
  })

  describe('object', () => {
    it('validates shape', () => {
      const schema = s.object({ name: s.string(), age: s.number() })
      expect(validate({ name: 'Jo', age: 25 }, schema).valid).toBe(true)
    })
    it('rejects missing fields', () => {
      const schema = s.object({ name: s.string() })
      expect(validate({}, schema).valid).toBe(false)
    })
    it('rejects non-object', () => {
      expect(validate(null, s.object({})).valid).toBe(false)
      expect(validate([], s.object({})).valid).toBe(false)
    })
  })

  describe('optional', () => {
    it('accepts undefined', () => expect(validate(undefined, s.optional(s.string())).valid).toBe(true))
    it('accepts null', () => expect(validate(null, s.optional(s.string())).valid).toBe(true))
    it('validates when present', () => expect(validate(42, s.optional(s.string())).valid).toBe(false))
  })

  describe('oneOf', () => {
    it('accepts valid value', () => expect(validate('a', s.oneOf(['a', 'b'])).valid).toBe(true))
    it('rejects invalid', () => expect(validate('c', s.oneOf(['a', 'b'])).valid).toBe(false))
  })

  describe('min/max', () => {
    it('min passes', () => expect(validate(5, s.min(3)).valid).toBe(true))
    it('min fails', () => expect(validate(2, s.min(3)).valid).toBe(false))
    it('max passes', () => expect(validate(5, s.max(10)).valid).toBe(true))
    it('max fails', () => expect(validate(15, s.max(10)).valid).toBe(false))
  })

  it('returns error message', () => {
    const result = validate(42, s.string())
    expect(result.error).toBe('Expected string')
  })

  it('nested object error path', () => {
    const schema = s.object({ user: s.object({ name: s.string() }) })
    const result = validate({ user: { name: 42 } }, schema)
    expect(result.error).toContain('name')
  })
})
