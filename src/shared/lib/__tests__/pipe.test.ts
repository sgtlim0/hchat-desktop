import { describe, it, expect, vi } from 'vitest'
import { pipe, compose, tap, when, memoize } from '../pipe'

describe('pipe', () => {
  it('pipes functions left to right', () => {
    const add1 = (n: number) => n + 1
    const double = (n: number) => n * 2
    expect(pipe(add1, double)(3)).toBe(8) // (3+1)*2
  })

  it('single function', () => {
    expect(pipe((n: number) => n * 3)(5)).toBe(15)
  })

  it('works with strings', () => {
    const trim = (s: string) => s.trim()
    const lower = (s: string) => s.toLowerCase()
    expect(pipe(trim, lower)(' HELLO ')).toBe('hello')
  })
})

describe('compose', () => {
  it('composes functions right to left', () => {
    const add1 = (n: number) => n + 1
    const double = (n: number) => n * 2
    expect(compose(add1, double)(3)).toBe(7) // (3*2)+1
  })
})

describe('tap', () => {
  it('calls side effect and passes value through', () => {
    const sideEffect = vi.fn()
    const result = tap(sideEffect)(42)
    expect(result).toBe(42)
    expect(sideEffect).toHaveBeenCalledWith(42)
  })
})

describe('when', () => {
  it('transforms when predicate true', () => {
    const doubleIfPositive = when(
      (n: number) => n > 0,
      (n: number) => n * 2,
    )
    expect(doubleIfPositive(5)).toBe(10)
  })

  it('returns unchanged when predicate false', () => {
    const doubleIfPositive = when(
      (n: number) => n > 0,
      (n: number) => n * 2,
    )
    expect(doubleIfPositive(-3)).toBe(-3)
  })
})

describe('memoize', () => {
  it('caches results', () => {
    const fn = vi.fn((n: number) => n * 2)
    const memoized = memoize(fn)
    expect(memoized(5)).toBe(10)
    expect(memoized(5)).toBe(10)
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('different args get different results', () => {
    const fn = vi.fn((n: number) => n * 2)
    const memoized = memoize(fn)
    expect(memoized(3)).toBe(6)
    expect(memoized(5)).toBe(10)
    expect(fn).toHaveBeenCalledTimes(2)
  })
})
