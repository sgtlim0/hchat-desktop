import { describe, it, expect } from 'vitest'
import { ok, err, isOk, isErr, unwrap, unwrapOr, map, flatMap, tryCatch } from '../result'

describe('result', () => {
  it('ok creates success', () => {
    const r = ok(42)
    expect(r.ok).toBe(true)
    expect(isOk(r)).toBe(true)
  })

  it('err creates error', () => {
    const r = err(new Error('fail'))
    expect(r.ok).toBe(false)
    expect(isErr(r)).toBe(true)
  })

  it('unwrap returns value for Ok', () => {
    expect(unwrap(ok('hello'))).toBe('hello')
  })

  it('unwrap throws for Err', () => {
    expect(() => unwrap(err(new Error('fail')))).toThrow('fail')
  })

  it('unwrapOr returns fallback for Err', () => {
    expect(unwrapOr(err(new Error('x')), 'default')).toBe('default')
    expect(unwrapOr(ok('value'), 'default')).toBe('value')
  })

  it('map transforms Ok', () => {
    const r = map(ok(5), (v) => v * 2)
    expect(unwrap(r)).toBe(10)
  })

  it('map skips Err', () => {
    const r = map(err(new Error('x')), (v: number) => v * 2)
    expect(isErr(r)).toBe(true)
  })

  it('flatMap chains results', () => {
    const r = flatMap(ok(5), (v) => ok(v * 3))
    expect(unwrap(r)).toBe(15)
  })

  it('flatMap skips Err', () => {
    const r = flatMap(err(new Error('x')), (v: number) => ok(v * 3))
    expect(isErr(r)).toBe(true)
  })

  it('tryCatch wraps success', () => {
    const r = tryCatch(() => 42)
    expect(isOk(r)).toBe(true)
    expect(unwrap(r)).toBe(42)
  })

  it('tryCatch wraps error', () => {
    const r = tryCatch(() => { throw new Error('boom') })
    expect(isErr(r)).toBe(true)
  })
})
