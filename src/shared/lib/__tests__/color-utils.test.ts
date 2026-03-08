import { describe, it, expect } from 'vitest'
import { hexToRgb, rgbToHex, hexToHsl, hslToHex, lighten, darken, opacity, isValidHex, randomColor, getContrastColor } from '../color-utils'

describe('color-utils', () => {
  describe('hexToRgb', () => {
    it('converts #FF0000', () => {
      expect(hexToRgb('#FF0000')).toEqual({ r: 255, g: 0, b: 0 })
    })
    it('converts shorthand #fff', () => {
      expect(hexToRgb('#fff')).toEqual({ r: 255, g: 255, b: 255 })
    })
    it('converts #000000', () => {
      expect(hexToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0 })
    })
  })

  describe('rgbToHex', () => {
    it('converts red', () => {
      expect(rgbToHex({ r: 255, g: 0, b: 0 })).toBe('#ff0000')
    })
    it('converts white', () => {
      expect(rgbToHex({ r: 255, g: 255, b: 255 })).toBe('#ffffff')
    })
  })

  describe('hexToHsl / hslToHex', () => {
    it('red roundtrip', () => {
      const hsl = hexToHsl('#ff0000')
      expect(hsl.h).toBe(0)
      expect(hsl.s).toBeCloseTo(1, 1)
      expect(hsl.l).toBeCloseTo(0.5, 1)
    })
    it('white', () => {
      const hsl = hexToHsl('#ffffff')
      expect(hsl.l).toBeCloseTo(1, 1)
    })
  })

  describe('lighten / darken', () => {
    it('lighten makes lighter', () => {
      const original = hexToHsl('#333333')
      const lighter = hexToHsl(lighten('#333333', 0.2))
      expect(lighter.l).toBeGreaterThan(original.l)
    })
    it('darken makes darker', () => {
      const original = hexToHsl('#cccccc')
      const darker = hexToHsl(darken('#cccccc', 0.2))
      expect(darker.l).toBeLessThan(original.l)
    })
  })

  describe('opacity', () => {
    it('returns rgba string', () => {
      expect(opacity('#ff0000', 0.5)).toBe('rgba(255, 0, 0, 0.5)')
    })
    it('clamps alpha', () => {
      expect(opacity('#000000', 2)).toBe('rgba(0, 0, 0, 1)')
    })
  })

  describe('isValidHex', () => {
    it('valid hex', () => {
      expect(isValidHex('#fff')).toBe(true)
      expect(isValidHex('#FF0000')).toBe(true)
    })
    it('invalid', () => {
      expect(isValidHex('fff')).toBe(false)
      expect(isValidHex('#gg0000')).toBe(false)
    })
  })

  describe('randomColor', () => {
    it('returns valid hex', () => {
      expect(isValidHex(randomColor())).toBe(true)
    })
  })

  describe('getContrastColor', () => {
    it('white bg -> black text', () => {
      expect(getContrastColor('#ffffff')).toBe('#000000')
    })
    it('black bg -> white text', () => {
      expect(getContrastColor('#000000')).toBe('#ffffff')
    })
  })
})
