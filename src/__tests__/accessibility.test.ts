import { describe, it, expect } from 'vitest'
import { contrastRatio, meetsContrastAA, prefersReducedMotion, announce } from '@/shared/lib/accessibility'

describe('accessibility', () => {
  describe('contrastRatio', () => {
    it('should return 21:1 for black on white', () => {
      const ratio = contrastRatio('#000000', '#FFFFFF')
      expect(ratio).toBeCloseTo(21, 0)
    })

    it('should return 1:1 for same colors', () => {
      expect(contrastRatio('#FF0000', '#FF0000')).toBeCloseTo(1, 0)
    })

    it('should be symmetric', () => {
      const r1 = contrastRatio('#333333', '#FFFFFF')
      const r2 = contrastRatio('#FFFFFF', '#333333')
      expect(r1).toBeCloseTo(r2, 2)
    })
  })

  describe('meetsContrastAA', () => {
    it('should pass black on white', () => {
      expect(meetsContrastAA('#000000', '#FFFFFF')).toBe(true)
    })

    it('should fail light gray on white', () => {
      expect(meetsContrastAA('#CCCCCC', '#FFFFFF')).toBe(false)
    })

    it('should have lower threshold for large text', () => {
      // 3:1 is enough for large text
      expect(meetsContrastAA('#767676', '#FFFFFF', true)).toBe(true)
    })
  })

  describe('prefersReducedMotion', () => {
    it('should return boolean', () => {
      expect(typeof prefersReducedMotion()).toBe('boolean')
    })
  })

  describe('announce', () => {
    it('should not throw', () => {
      expect(() => announce('test message')).not.toThrow()
      expect(() => announce('urgent', 'assertive')).not.toThrow()
    })
  })
})
