import { describe, it, expect } from 'vitest'
import { generateAriaId, getFocusableSelector, isReducedMotion, getRelativeLuminance, getContrastRatio, meetsContrastAA, meetsContrastAAA } from '../a11y-utils'

describe('a11y-utils', () => {
  it('generateAriaId returns unique IDs', () => {
    const id1 = generateAriaId()
    const id2 = generateAriaId()
    expect(id1).not.toBe(id2)
    expect(id1).toMatch(/^aria-\d+$/)
  })

  it('generateAriaId uses custom prefix', () => {
    expect(generateAriaId('dialog')).toMatch(/^dialog-\d+$/)
  })

  it('getFocusableSelector returns selector string', () => {
    const sel = getFocusableSelector()
    expect(sel).toContain('button')
    expect(sel).toContain('input')
    expect(sel).toContain('a[href]')
  })

  it('isReducedMotion returns false in test env', () => {
    // matchMedia may not exist in jsdom
    expect(isReducedMotion()).toBe(false)
  })

  it('getRelativeLuminance for white is ~1', () => {
    expect(getRelativeLuminance(255, 255, 255)).toBeCloseTo(1, 1)
  })

  it('getRelativeLuminance for black is ~0', () => {
    expect(getRelativeLuminance(0, 0, 0)).toBeCloseTo(0, 1)
  })

  it('getContrastRatio black/white is ~21', () => {
    const ratio = getContrastRatio([0, 0, 0], [255, 255, 255])
    expect(ratio).toBeCloseTo(21, 0)
  })

  it('meetsContrastAA normal text needs 4.5:1', () => {
    expect(meetsContrastAA(4.5)).toBe(true)
    expect(meetsContrastAA(4.4)).toBe(false)
  })

  it('meetsContrastAA large text needs 3:1', () => {
    expect(meetsContrastAA(3, true)).toBe(true)
    expect(meetsContrastAA(2.9, true)).toBe(false)
  })

  it('meetsContrastAAA normal text needs 7:1', () => {
    expect(meetsContrastAAA(7)).toBe(true)
    expect(meetsContrastAAA(6.9)).toBe(false)
  })
})
