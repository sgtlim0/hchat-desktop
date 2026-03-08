import { describe, it, expect } from 'vitest'
import {
  ok,
  err,
  isOk,
  isErr,
  unwrap,
  unwrapOr,
  map,
  flatMap,
  tryCatch,
  type Result
} from '../result'

describe('Result Type Utilities', () => {
  describe('ok', () => {
    it('creates success result', () => {
      const result = ok(42)
      expect(result.ok).toBe(true)
      expect((result as any).value).toBe(42)
    })

    it('works with any type', () => {
      const stringResult = ok('hello')
      const objectResult = ok({ name: 'test' })
      const arrayResult = ok([1, 2, 3])

      expect((stringResult as any).value).toBe('hello')
      expect((objectResult as any).value).toEqual({ name: 'test' })
      expect((arrayResult as any).value).toEqual([1, 2, 3])
    })
  })

  describe('err', () => {
    it('creates error result', () => {
      const result = err(new Error('failed'))
      expect(result.ok).toBe(false)
      expect((result as any).error.message).toBe('failed')
    })

    it('works with custom error types', () => {
      const stringError = err('error message')
      const objectError = err({ code: 404, message: 'Not found' })

      expect((stringError as any).error).toBe('error message')
      expect((objectError as any).error).toEqual({ code: 404, message: 'Not found' })
    })
  })

  describe('isOk/isErr', () => {
    it('isOk checks type correctly', () => {
      const success = ok(42)
      const failure = err('error')

      expect(isOk(success)).toBe(true)
      expect(isOk(failure)).toBe(false)
    })

    it('isErr checks type correctly', () => {
      const success = ok(42)
      const failure = err('error')

      expect(isErr(success)).toBe(false)
      expect(isErr(failure)).toBe(true)
    })

    it('provides type guards', () => {
      const result: Result<number, string> = ok(42)

      if (isOk(result)) {
        // TypeScript should know result.value is number
        const value: number = result.value
        expect(value).toBe(42)
      }

      const errorResult: Result<number, string> = err('failed')

      if (isErr(errorResult)) {
        // TypeScript should know result.error is string
        const error: string = errorResult.error
        expect(error).toBe('failed')
      }
    })
  })

  describe('unwrap', () => {
    it('returns value for Ok', () => {
      const result = ok(42)
      expect(unwrap(result)).toBe(42)
    })

    it('throws for Err with Error type', () => {
      const result = err(new Error('failed'))
      expect(() => unwrap(result)).toThrow('failed')
    })

    it('throws for Err with non-Error type', () => {
      const result = err('string error')
      expect(() => unwrap(result)).toThrow()
    })
  })

  describe('unwrapOr', () => {
    it('returns fallback for Err', () => {
      const result = err('error')
      expect(unwrapOr(result, 99)).toBe(99)
    })

    it('returns value for Ok', () => {
      const result = ok(42)
      expect(unwrapOr(result, 0)).toBe(42)
    })

    it('works with complex types', () => {
      const okResult: Result<{ value: number }, string> = ok({ value: 42 })
      const errResult: Result<{ value: number }, string> = err('failed')
      const fallback = { value: 0 }

      expect(unwrapOr(okResult, fallback)).toEqual({ value: 42 })
      expect(unwrapOr(errResult, fallback)).toEqual({ value: 0 })
    })
  })

  describe('map', () => {
    it('transforms Ok value', () => {
      const result = ok(42)
      const mapped = map(result, x => x * 2)

      expect(isOk(mapped)).toBe(true)
      expect(unwrap(mapped)).toBe(84)
    })

    it('skips Err', () => {
      const result: Result<number, string> = err('error')
      const mapped = map(result, x => x * 2)

      expect(isErr(mapped)).toBe(true)
      expect((mapped as any).error).toBe('error')
    })

    it('can change value type', () => {
      const result = ok(42)
      const mapped = map(result, x => `Number: ${x}`)

      expect(isOk(mapped)).toBe(true)
      expect(unwrap(mapped)).toBe('Number: 42')
    })
  })

  describe('flatMap', () => {
    it('chains results', () => {
      const result = ok(42)
      const chained = flatMap(result, x => ok(x * 2))

      expect(isOk(chained)).toBe(true)
      expect(unwrap(chained)).toBe(84)
    })

    it('propagates first Err', () => {
      const result: Result<number, string> = err('first error')
      const chained = flatMap(result, x => ok(x * 2))

      expect(isErr(chained)).toBe(true)
      expect((chained as any).error).toBe('first error')
    })

    it('returns Err from function', () => {
      const result = ok(42)
      const chained = flatMap(result, x =>
        x > 40 ? err('too large') : ok(x * 2)
      )

      expect(isErr(chained)).toBe(true)
      expect((chained as any).error).toBe('too large')
    })

    it('allows complex chaining', () => {
      const divide = (x: number, y: number): Result<number, string> =>
        y === 0 ? err('division by zero') : ok(x / y)

      const result = ok(100)
      const chained = flatMap(
        flatMap(result, x => divide(x, 2)),
        x => divide(x, 5)
      )

      expect(isOk(chained)).toBe(true)
      expect(unwrap(chained)).toBe(10)
    })
  })

  describe('tryCatch', () => {
    it('wraps function in Result', () => {
      const result = tryCatch(() => 42)

      expect(isOk(result)).toBe(true)
      expect(unwrap(result)).toBe(42)
    })

    it('catches thrown errors', () => {
      const result = tryCatch(() => {
        throw new Error('failed')
      })

      expect(isErr(result)).toBe(true)
      expect((result as any).error.message).toBe('failed')
    })

    it('handles JSON parsing', () => {
      const parseJson = (str: string) => tryCatch(() => JSON.parse(str))

      const validResult = parseJson('{"key": "value"}')
      expect(isOk(validResult)).toBe(true)
      expect(unwrap(validResult)).toEqual({ key: 'value' })

      const invalidResult = parseJson('invalid json')
      expect(isErr(invalidResult)).toBe(true)
    })

    it('preserves original error', () => {
      const customError = new Error('custom error')
      customError.name = 'CustomError'

      const result = tryCatch(() => {
        throw customError
      })

      expect(isErr(result)).toBe(true)
      if (isErr(result)) {
        expect(result.error).toBe(customError)
        expect(result.error.name).toBe('CustomError')
      }
    })
  })

  describe('Result composition', () => {
    it('allows functional composition', () => {
      const safeDivide = (x: number, y: number): Result<number, string> =>
        y === 0 ? err('division by zero') : ok(x / y)

      const safeSqrt = (x: number): Result<number, string> =>
        x < 0 ? err('negative number') : ok(Math.sqrt(x))

      const compute = (x: number, y: number): Result<number, string> =>
        flatMap(safeDivide(x, y), safeSqrt)

      const result1 = compute(100, 4)
      expect(isOk(result1)).toBe(true)
      expect(unwrap(result1)).toBe(5)

      const result2 = compute(100, 0)
      expect(isErr(result2)).toBe(true)
      expect((result2 as any).error).toBe('division by zero')

      const result3 = compute(-100, 4)
      expect(isErr(result3)).toBe(true)
      expect((result3 as any).error).toBe('negative number')
    })

    it('works with pipeline pattern', () => {
      const pipeline = (input: string): Result<number, string | Error> => {
        const parsed = tryCatch(() => JSON.parse(input))
        const extracted = map(parsed, (obj: any) => obj.value)
        const validated = flatMap(extracted, (val: any): Result<number, string | Error> =>
          typeof val === 'number' ? ok(val) : err('not a number' as string | Error)
        )
        const doubled = map(validated, x => x * 2)
        return doubled
      }

      const result1 = pipeline('{"value": 21}')
      expect(isOk(result1)).toBe(true)
      expect(unwrap(result1)).toBe(42)

      const result2 = pipeline('{"value": "not a number"}')
      expect(isErr(result2)).toBe(true)
      expect((result2 as any).error).toBe('not a number')

      const result3 = pipeline('invalid json')
      expect(isErr(result3)).toBe(true)
    })
  })
})
