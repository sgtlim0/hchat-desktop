import { describe, it, expect } from 'vitest'
import {
  isString,
  isNumber,
  isBoolean,
  isArray,
  isObject,
  isFunction,
  isNullish,
  isDefined,
  isNonEmptyString,
  isNonEmptyArray
} from '../type-guards'

describe('type-guards', () => {
  describe('isString', () => {
    it('returns true for string', () => {
      expect(isString('hello')).toBe(true)
      expect(isString('')).toBe(true)
      expect(isString(String('world'))).toBe(true)
    })

    it('returns false for number', () => {
      expect(isString(123)).toBe(false)
      expect(isString(0)).toBe(false)
      expect(isString(NaN)).toBe(false)
    })

    it('returns false for other types', () => {
      expect(isString(null)).toBe(false)
      expect(isString(undefined)).toBe(false)
      expect(isString(true)).toBe(false)
      expect(isString([])).toBe(false)
      expect(isString({})).toBe(false)
    })
  })

  describe('isNumber', () => {
    it('returns true for number', () => {
      expect(isNumber(123)).toBe(true)
      expect(isNumber(0)).toBe(true)
      expect(isNumber(-456)).toBe(true)
      expect(isNumber(3.14)).toBe(true)
      expect(isNumber(Infinity)).toBe(true)
    })

    it('returns false for string', () => {
      expect(isNumber('123')).toBe(false)
      expect(isNumber('')).toBe(false)
    })

    it('returns false for NaN', () => {
      expect(isNumber(NaN)).toBe(false)
    })

    it('returns false for other types', () => {
      expect(isNumber(null)).toBe(false)
      expect(isNumber(undefined)).toBe(false)
      expect(isNumber(true)).toBe(false)
      expect(isNumber([])).toBe(false)
      expect(isNumber({})).toBe(false)
    })
  })

  describe('isBoolean', () => {
    it('returns true for boolean', () => {
      expect(isBoolean(true)).toBe(true)
      expect(isBoolean(false)).toBe(true)
      expect(isBoolean(Boolean(1))).toBe(true)
    })

    it('returns false for non-boolean', () => {
      expect(isBoolean(1)).toBe(false)
      expect(isBoolean(0)).toBe(false)
      expect(isBoolean('true')).toBe(false)
      expect(isBoolean(null)).toBe(false)
      expect(isBoolean(undefined)).toBe(false)
    })
  })

  describe('isArray', () => {
    it('returns true for array', () => {
      expect(isArray([])).toBe(true)
      expect(isArray([1, 2, 3])).toBe(true)
      expect(isArray(new Array())).toBe(true)
      expect(isArray(['a', 'b'])).toBe(true)
    })

    it('returns false for non-array', () => {
      expect(isArray({})).toBe(false)
      expect(isArray('array')).toBe(false)
      expect(isArray(123)).toBe(false)
      expect(isArray(null)).toBe(false)
      expect(isArray(undefined)).toBe(false)
      expect(isArray({ length: 0 })).toBe(false)
    })
  })

  describe('isObject', () => {
    it('returns true for plain object', () => {
      expect(isObject({})).toBe(true)
      expect(isObject({ a: 1 })).toBe(true)
      expect(isObject(new Object())).toBe(true)
      expect(isObject(Object.create(null))).toBe(true)
    })

    it('returns false for array', () => {
      expect(isObject([])).toBe(false)
      expect(isObject([1, 2, 3])).toBe(false)
    })

    it('returns false for null', () => {
      expect(isObject(null)).toBe(false)
    })

    it('returns false for other types', () => {
      expect(isObject(undefined)).toBe(false)
      expect(isObject('object')).toBe(false)
      expect(isObject(123)).toBe(false)
      expect(isObject(true)).toBe(false)
      expect(isObject(() => {})).toBe(false)
      expect(isObject(new Date())).toBe(false)
      expect(isObject(new RegExp(''))).toBe(false)
    })
  })

  describe('isFunction', () => {
    it('returns true for function', () => {
      expect(isFunction(() => {})).toBe(true)
      expect(isFunction(function() {})).toBe(true)
      expect(isFunction(async () => {})).toBe(true)
      expect(isFunction(function* () {})).toBe(true)
      expect(isFunction(Math.max)).toBe(true)
      expect(isFunction(Date)).toBe(true)
    })

    it('returns false for non-function', () => {
      expect(isFunction({})).toBe(false)
      expect(isFunction([])).toBe(false)
      expect(isFunction('function')).toBe(false)
      expect(isFunction(123)).toBe(false)
      expect(isFunction(null)).toBe(false)
      expect(isFunction(undefined)).toBe(false)
    })
  })

  describe('isNullish', () => {
    it('returns true for null', () => {
      expect(isNullish(null)).toBe(true)
    })

    it('returns true for undefined', () => {
      expect(isNullish(undefined)).toBe(true)
      expect(isNullish(void 0)).toBe(true)
    })

    it('returns false for defined values', () => {
      expect(isNullish(0)).toBe(false)
      expect(isNullish('')).toBe(false)
      expect(isNullish(false)).toBe(false)
      expect(isNullish([])).toBe(false)
      expect(isNullish({})).toBe(false)
      expect(isNullish(NaN)).toBe(false)
    })
  })

  describe('isDefined', () => {
    it('returns true for non-null/undefined', () => {
      expect(isDefined(0)).toBe(true)
      expect(isDefined('')).toBe(true)
      expect(isDefined(false)).toBe(true)
      expect(isDefined([])).toBe(true)
      expect(isDefined({})).toBe(true)
      expect(isDefined('hello')).toBe(true)
      expect(isDefined(123)).toBe(true)
    })

    it('returns false for null', () => {
      expect(isDefined(null)).toBe(false)
    })

    it('returns false for undefined', () => {
      expect(isDefined(undefined)).toBe(false)
      expect(isDefined(void 0)).toBe(false)
    })
  })

  describe('isNonEmptyString', () => {
    it('returns true for "hello"', () => {
      expect(isNonEmptyString('hello')).toBe(true)
      expect(isNonEmptyString('world')).toBe(true)
      expect(isNonEmptyString(' ')).toBe(true)
      expect(isNonEmptyString('0')).toBe(true)
    })

    it('returns false for ""', () => {
      expect(isNonEmptyString('')).toBe(false)
    })

    it('returns false for non-string', () => {
      expect(isNonEmptyString(null)).toBe(false)
      expect(isNonEmptyString(undefined)).toBe(false)
      expect(isNonEmptyString(123)).toBe(false)
      expect(isNonEmptyString([])).toBe(false)
      expect(isNonEmptyString({})).toBe(false)
      expect(isNonEmptyString(true)).toBe(false)
    })
  })

  describe('isNonEmptyArray', () => {
    it('returns true for [1]', () => {
      expect(isNonEmptyArray([1])).toBe(true)
      expect(isNonEmptyArray([1, 2, 3])).toBe(true)
      expect(isNonEmptyArray(['a'])).toBe(true)
      expect(isNonEmptyArray([null])).toBe(true)
      expect(isNonEmptyArray([undefined])).toBe(true)
    })

    it('returns false for []', () => {
      expect(isNonEmptyArray([])).toBe(false)
    })

    it('returns false for non-array', () => {
      expect(isNonEmptyArray(null)).toBe(false)
      expect(isNonEmptyArray(undefined)).toBe(false)
      expect(isNonEmptyArray('array')).toBe(false)
      expect(isNonEmptyArray(123)).toBe(false)
      expect(isNonEmptyArray({})).toBe(false)
      expect(isNonEmptyArray({ length: 1 })).toBe(false)
    })
  })

  describe('type narrowing', () => {
    it('narrows types correctly', () => {
      const value: unknown = 'test'

      if (isString(value)) {
        // TypeScript should narrow value to string
        expect(value.toUpperCase()).toBe('TEST')
      }
    })

    it('narrows arrays correctly', () => {
      const value: unknown = [1, 2, 3]

      if (isArray(value)) {
        // TypeScript should narrow value to unknown[]
        expect(value.length).toBe(3)
      }
    })

    it('narrows objects correctly', () => {
      const value: unknown = { foo: 'bar' }

      if (isObject(value)) {
        // TypeScript should narrow value to Record<string, unknown>
        expect(value.foo).toBe('bar')
      }
    })

    it('narrows non-empty arrays correctly', () => {
      const value: unknown = ['a', 'b']

      if (isNonEmptyArray<string>(value)) {
        // TypeScript should narrow value to string[]
        expect(value[0]).toBe('a')
        expect(value.length).toBeGreaterThan(0)
      }
    })

    it('handles isDefined type narrowing', () => {
      const value: string | null | undefined = 'test'

      if (isDefined(value)) {
        // TypeScript should narrow value to string
        expect(value.toUpperCase()).toBe('TEST')
      }
    })
  })
})