import { describe, it, expect } from 'vitest'
import {
  linear,
  easeInQuad,
  easeOutQuad,
  easeInOutQuad,
  easeInCubic,
  easeOutCubic,
  easeInOutCubic,
  lerp,
  clamp01,
  getEasingFunction
} from '../easing'

describe('easing', () => {
  describe('linear', () => {
    it('returns t unchanged', () => {
      expect(linear(0)).toBe(0)
      expect(linear(0.5)).toBe(0.5)
      expect(linear(1)).toBe(1)
    })
  })

  describe('easeInQuad', () => {
    it('returns 0 at t=0', () => {
      expect(easeInQuad(0)).toBe(0)
    })

    it('returns 1 at t=1', () => {
      expect(easeInQuad(1)).toBe(1)
    })

    it('accelerates from slow to fast', () => {
      // At t=0.5, quad easing should return 0.25 (0.5^2)
      expect(easeInQuad(0.5)).toBe(0.25)
      expect(easeInQuad(0.5)).toBeLessThan(0.5)
    })
  })

  describe('easeOutQuad', () => {
    it('returns value > 0.5 at t=0.5', () => {
      // easeOut decelerates, so at halfway point should be > 0.5
      expect(easeOutQuad(0.5)).toBeGreaterThan(0.5)
      expect(easeOutQuad(0.5)).toBe(0.75) // t * (2 - t) = 0.5 * 1.5 = 0.75
    })

    it('returns correct boundary values', () => {
      expect(easeOutQuad(0)).toBe(0)
      expect(easeOutQuad(1)).toBe(1)
    })
  })

  describe('easeInOutCubic', () => {
    it('has symmetry around t=0.5', () => {
      // easeInOut should be symmetric: f(0.25) + f(0.75) = 1
      const quarter = easeInOutCubic(0.25)
      const threeQuarter = easeInOutCubic(0.75)
      expect(quarter + threeQuarter).toBeCloseTo(1, 10)
    })

    it('returns 0.5 at t=0.5', () => {
      expect(easeInOutCubic(0.5)).toBe(0.5)
    })

    it('returns correct boundary values', () => {
      expect(easeInOutCubic(0)).toBe(0)
      expect(easeInOutCubic(1)).toBe(1)
    })
  })

  describe('lerp', () => {
    it('interpolates between values', () => {
      expect(lerp(0, 100, 0)).toBe(0)
      expect(lerp(0, 100, 0.5)).toBe(50)
      expect(lerp(0, 100, 1)).toBe(100)
    })

    it('works with negative values', () => {
      expect(lerp(-50, 50, 0.5)).toBe(0)
      expect(lerp(-100, -50, 0.5)).toBe(-75)
    })

    it('can extrapolate beyond 0-1 range', () => {
      expect(lerp(0, 100, 1.5)).toBe(150)
      expect(lerp(0, 100, -0.5)).toBe(-50)
    })
  })

  describe('clamp01', () => {
    it('clamps values to 0-1 range', () => {
      expect(clamp01(-1)).toBe(0)
      expect(clamp01(0)).toBe(0)
      expect(clamp01(0.5)).toBe(0.5)
      expect(clamp01(1)).toBe(1)
      expect(clamp01(2)).toBe(1)
    })

    it('preserves values within range', () => {
      expect(clamp01(0.25)).toBe(0.25)
      expect(clamp01(0.75)).toBe(0.75)
      expect(clamp01(0.999)).toBe(0.999)
    })
  })

  describe('getEasingFunction', () => {
    it('returns function by name', () => {
      expect(getEasingFunction('linear')).toBe(linear)
      expect(getEasingFunction('easeInQuad')).toBe(easeInQuad)
      expect(getEasingFunction('easeOutQuad')).toBe(easeOutQuad)
      expect(getEasingFunction('easeInOutQuad')).toBe(easeInOutQuad)
      expect(getEasingFunction('easeInCubic')).toBe(easeInCubic)
      expect(getEasingFunction('easeOutCubic')).toBe(easeOutCubic)
      expect(getEasingFunction('easeInOutCubic')).toBe(easeInOutCubic)
    })

    it('returns linear for unknown names', () => {
      expect(getEasingFunction('unknown')).toBe(linear)
      expect(getEasingFunction('')).toBe(linear)
    })
  })

  describe('easing functions integration', () => {
    it('all easing functions return 0 at t=0 and 1 at t=1', () => {
      const easings = [
        linear,
        easeInQuad,
        easeOutQuad,
        easeInOutQuad,
        easeInCubic,
        easeOutCubic,
        easeInOutCubic
      ]

      easings.forEach(easing => {
        expect(easing(0)).toBe(0)
        expect(easing(1)).toBe(1)
      })
    })

    it('all easing functions produce values in 0-1 range for t in 0-1', () => {
      const easings = [
        linear,
        easeInQuad,
        easeOutQuad,
        easeInOutQuad,
        easeInCubic,
        easeOutCubic,
        easeInOutCubic
      ]

      const testValues = [0, 0.1, 0.25, 0.5, 0.75, 0.9, 1]

      easings.forEach(easing => {
        testValues.forEach(t => {
          const result = easing(t)
          expect(result).toBeGreaterThanOrEqual(0)
          expect(result).toBeLessThanOrEqual(1)
        })
      })
    })
  })
})
