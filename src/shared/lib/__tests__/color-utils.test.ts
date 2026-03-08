import { describe, it, expect } from 'vitest'
import { hexToRgb, rgbToHex, hexToHsl, hslToHex, lighten, darken, opacity, isValidHex, randomColor, contrastRatio, getContrastColor } from '../color-utils'

describe('color-utils', () => {
  describe('hexToRgb', () => {
    it('converts #FF0000 to {r:255,g:0,b:0}', () => {
      expect(hexToRgb('#FF0000')).toEqual({ r: 255, g: 0, b: 0 })
    })
    it('converts shorthand #fff', () => {
      expect(hexToRgb('#fff')).toEqual({ r: 255, g: 255, b: 255 })
    })
    it('converts #000000', () => {
      expect(hexToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0 })
    })
    it('handles hex without hash', () => {
      expect(hexToRgb('0000FF')).toEqual({ r: 0, g: 0, b: 255 })
    })
    it('throws for invalid hex', () => {
      expect(() => hexToRgb('invalid')).toThrow()
    })
  })

  describe('rgbToHex', () => {
    it('converts {r:255,g:0,b:0} to #ff0000', () => {
      expect(rgbToHex({ r: 255, g: 0, b: 0 })).toBe('#ff0000')
    })
    it('converts white', () => {
      expect(rgbToHex({ r: 255, g: 255, b: 255 })).toBe('#ffffff')
    })
    it('clamps values above 255', () => {
      expect(rgbToHex({ r: 300, g: 300, b: 300 })).toBe('#ffffff')
    })
    it('clamps negative values to 0', () => {
      expect(rgbToHex({ r: -10, g: -20, b: -30 })).toBe('#000000')
    })
  })

  describe('hexToHsl', () => {
    it('basic conversions', () => {
      const red = hexToHsl('#ff0000')
      expect(red.h).toBe(0)
      expect(red.s).toBeCloseTo(1, 1)
      expect(red.l).toBeCloseTo(0.5, 1)

      const white = hexToHsl('#ffffff')
      expect(white.l).toBeCloseTo(1, 1)

      const black = hexToHsl('#000000')
      expect(black.l).toBe(0)
    })
  })

  describe('hslToHex', () => {
    it('basic conversions', () => {
      expect(hslToHex({ h: 0, s: 1, l: 0.5 })).toBe('#ff0000')
      expect(hslToHex({ h: 0, s: 0, l: 1 })).toBe('#ffffff')
      expect(hslToHex({ h: 0, s: 0, l: 0 })).toBe('#000000')
    })
  })

  describe('lighten', () => {
    it('makes color lighter', () => {
      const original = hexToHsl('#333333')
      const lighter = hexToHsl(lighten('#333333', 0.2))
      expect(lighter.l).toBeGreaterThan(original.l)
    })
  })

  describe('darken', () => {
    it('makes color darker', () => {
      const original = hexToHsl('#cccccc')
      const darker = hexToHsl(darken('#cccccc', 0.2))
      expect(darker.l).toBeLessThan(original.l)
    })
  })

  describe('opacity', () => {
    it('adds alpha', () => {
      expect(opacity('#ff0000', 0.5)).toBe('#ff000080')
    })
    it('clamps alpha', () => {
      expect(opacity('#000000', 2)).toBe('#000000ff')
      expect(opacity('#000000', -1)).toBe('#00000000')
    })
  })

  describe('isValidHex', () => {
    it('valid/invalid', () => {
      expect(isValidHex('#fff')).toBe(true)
      expect(isValidHex('#FF0000')).toBe(true)
      expect(isValidHex('fff')).toBe(true)  // valid without hash
      expect(isValidHex('FF0000')).toBe(true)  // valid without hash
      expect(isValidHex('#gg0000')).toBe(false)
      expect(isValidHex('invalid')).toBe(false)
      expect(isValidHex('')).toBe(false)
    })
  })

  describe('randomColor', () => {
    it('returns valid hex', () => {
      const color = randomColor()
      expect(isValidHex(color)).toBe(true)
      expect(color).toMatch(/^#[0-9a-f]{6}$/i)
    })
  })

  describe('contrastRatio', () => {
    it('black/white high contrast', () => {
      const ratio = contrastRatio('#000000', '#ffffff')
      expect(ratio).toBeCloseTo(21, 1)
    })
    it('same color minimal contrast', () => {
      const ratio = contrastRatio('#ff0000', '#ff0000')
      expect(ratio).toBe(1)
    })
  })

  describe('getContrastColor', () => {
    it('returns black or white for readability', () => {
      expect(getContrastColor('#ffffff')).toBe('#000000')
      expect(getContrastColor('#000000')).toBe('#ffffff')
      expect(getContrastColor('#ffff00')).toBe('#000000')
      expect(getContrastColor('#0000ff')).toBe('#ffffff')
    })
  })
})
