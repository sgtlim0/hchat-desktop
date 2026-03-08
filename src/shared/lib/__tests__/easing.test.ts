import { describe, it, expect } from 'vitest'
import { linear, easeInQuad, easeOutQuad, easeInOutCubic, lerp, clamp01, getEasingFunction } from '../easing'

describe('easing', () => {
  it('linear returns t', () => {
    expect(linear(0)).toBe(0)
    expect(linear(0.5)).toBe(0.5)
    expect(linear(1)).toBe(1)
  })

  it('easeInQuad at boundaries', () => {
    expect(easeInQuad(0)).toBe(0)
    expect(easeInQuad(1)).toBe(1)
    expect(easeInQuad(0.5)).toBeLessThan(0.5)
  })

  it('easeOutQuad at 0.5 > 0.5', () => {
    expect(easeOutQuad(0.5)).toBeGreaterThan(0.5)
  })

  it('easeInOutCubic symmetry', () => {
    expect(easeInOutCubic(0)).toBe(0)
    expect(easeInOutCubic(1)).toBe(1)
    expect(easeInOutCubic(0.5)).toBeCloseTo(0.5, 1)
  })

  it('lerp interpolates', () => {
    expect(lerp(0, 100, 0.5)).toBe(50)
    expect(lerp(10, 20, 0)).toBe(10)
    expect(lerp(10, 20, 1)).toBe(20)
  })

  it('clamp01 clamps', () => {
    expect(clamp01(-0.5)).toBe(0)
    expect(clamp01(1.5)).toBe(1)
    expect(clamp01(0.5)).toBe(0.5)
  })

  it('getEasingFunction returns by name', () => {
    expect(getEasingFunction('linear')(0.5)).toBe(0.5)
    expect(getEasingFunction('easeInQuad')).toBeDefined()
  })

  it('getEasingFunction defaults to linear', () => {
    expect(getEasingFunction('unknown')(0.5)).toBe(0.5)
  })
})
