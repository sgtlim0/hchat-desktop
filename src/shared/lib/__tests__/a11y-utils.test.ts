import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  generateAriaId,
  announceToScreenReader,
  getFocusableSelector,
  trapFocus,
  isReducedMotion,
  getRelativeLuminance,
  getContrastRatio,
  meetsContrastAA,
  meetsContrastAAA
} from '../a11y-utils'

describe('a11y-utils', () => {
  describe('generateAriaId', () => {
    it('returns unique aria IDs', () => {
      const id1 = generateAriaId()
      const id2 = generateAriaId()
      const id3 = generateAriaId()

      expect(id1).toMatch(/^aria-\d+$/)
      expect(id2).toMatch(/^aria-\d+$/)
      expect(id3).toMatch(/^aria-\d+$/)
      expect(id1).not.toBe(id2)
      expect(id2).not.toBe(id3)
      expect(id1).not.toBe(id3)
    })

    it('uses custom prefix when provided', () => {
      const id1 = generateAriaId('dialog')
      const id2 = generateAriaId('modal')
      const id3 = generateAriaId('tooltip')

      expect(id1).toMatch(/^dialog-\d+$/)
      expect(id2).toMatch(/^modal-\d+$/)
      expect(id3).toMatch(/^tooltip-\d+$/)
    })

    it('generates different IDs with same prefix', () => {
      const id1 = generateAriaId('button')
      const id2 = generateAriaId('button')

      expect(id1).toMatch(/^button-\d+$/)
      expect(id2).toMatch(/^button-\d+$/)
      expect(id1).not.toBe(id2)
    })
  })

  describe('announceToScreenReader', () => {
    let announcer: HTMLElement | null

    afterEach(() => {
      // Clean up any created live regions
      announcer = document.getElementById('aria-announcer')
      if (announcer) {
        announcer.remove()
      }
    })

    it('creates live region and announces message', () => {
      announceToScreenReader('Form submitted successfully')

      announcer = document.getElementById('aria-announcer')
      expect(announcer).toBeTruthy()
      expect(announcer?.getAttribute('role')).toBe('status')
      expect(announcer?.getAttribute('aria-live')).toBe('polite')
      expect(announcer?.getAttribute('aria-atomic')).toBe('true')
      expect(announcer?.textContent).toBe('Form submitted successfully')
      expect(announcer?.style.position).toBe('absolute')
      expect(announcer?.style.left).toBe('-10000px')
    })

    it('uses assertive priority when specified', () => {
      announceToScreenReader('Critical error occurred', 'assertive')

      announcer = document.getElementById('aria-announcer')
      expect(announcer?.getAttribute('aria-live')).toBe('assertive')
      expect(announcer?.textContent).toBe('Critical error occurred')
    })

    it('reuses existing announcer element', () => {
      announceToScreenReader('First message')
      const firstAnnouncer = document.getElementById('aria-announcer')

      announceToScreenReader('Second message')
      const secondAnnouncer = document.getElementById('aria-announcer')

      expect(firstAnnouncer).toBe(secondAnnouncer)
      expect(secondAnnouncer?.textContent).toBe('Second message')
    })

    it('clears message after delay', async () => {
      vi.useFakeTimers()

      announceToScreenReader('Temporary message')
      announcer = document.getElementById('aria-announcer')
      expect(announcer?.textContent).toBe('Temporary message')

      vi.advanceTimersByTime(100)
      expect(announcer?.textContent).toBe('')

      vi.useRealTimers()
    })
  })

  describe('getFocusableSelector', () => {
    it('returns focusable elements selector string', () => {
      const selector = getFocusableSelector()

      expect(selector).toContain('a[href]')
      expect(selector).toContain('button:not([disabled])')
      expect(selector).toContain('input:not([disabled])')
      expect(selector).toContain('select:not([disabled])')
      expect(selector).toContain('textarea:not([disabled])')
      expect(selector).toContain('[tabindex]:not([tabindex="-1"])')
      expect(selector).toContain('[contenteditable="true"]')
    })
  })

  describe('trapFocus', () => {
    let container: HTMLElement

    beforeEach(() => {
      container = document.createElement('div')
      container.innerHTML = `
        <button id="btn1">Button 1</button>
        <input id="input1" type="text" />
        <button id="btn2">Button 2</button>
        <button id="btn3" disabled>Disabled Button</button>
        <a id="link1" href="#">Link</a>
      `
      document.body.appendChild(container)
    })

    afterEach(() => {
      container.remove()
    })

    it('keeps focus within container on Tab', () => {
      const btn1 = document.getElementById('btn1') as HTMLElement
      const link1 = document.getElementById('link1') as HTMLElement

      // Focus last focusable element
      link1.focus()

      // Simulate Tab key
      const event = new KeyboardEvent('keydown', {
        key: 'Tab',
        shiftKey: false,
        bubbles: true
      })

      const cleanup = trapFocus(container)
      container.dispatchEvent(event)

      // Should wrap to first focusable element
      expect(document.activeElement).toBe(btn1)

      cleanup()
    })

    it('keeps focus within container on Shift+Tab', () => {
      const btn1 = document.getElementById('btn1') as HTMLElement
      const link1 = document.getElementById('link1') as HTMLElement

      // Focus first focusable element
      btn1.focus()

      // Simulate Shift+Tab key
      const event = new KeyboardEvent('keydown', {
        key: 'Tab',
        shiftKey: true,
        bubbles: true
      })

      const cleanup = trapFocus(container)
      container.dispatchEvent(event)

      // Should wrap to last focusable element
      expect(document.activeElement).toBe(link1)

      cleanup()
    })
  })

  describe('isReducedMotion', () => {
    it('detects reduced motion preference', () => {
      // Mock matchMedia
      const originalMatchMedia = window.matchMedia

      // Test when prefers-reduced-motion is true
      window.matchMedia = vi.fn().mockImplementation((query) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
        onchange: null
      }))

      expect(isReducedMotion()).toBe(true)

      // Test when prefers-reduced-motion is false
      window.matchMedia = vi.fn().mockImplementation(() => ({
        matches: false,
        media: '',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
        onchange: null
      }))

      expect(isReducedMotion()).toBe(false)

      // Restore
      window.matchMedia = originalMatchMedia
    })

    it('returns false when matchMedia is not supported', () => {
      const originalMatchMedia = window.matchMedia
      // @ts-ignore - Testing unsupported browser scenario
      delete window.matchMedia

      expect(isReducedMotion()).toBe(false)

      window.matchMedia = originalMatchMedia
    })
  })

  describe('getRelativeLuminance', () => {
    it('calculates relative luminance for black', () => {
      const luminance = getRelativeLuminance(0, 0, 0)
      expect(luminance).toBe(0)
    })

    it('calculates relative luminance for white', () => {
      const luminance = getRelativeLuminance(255, 255, 255)
      expect(luminance).toBe(1)
    })

    it('calculates relative luminance for gray', () => {
      const luminance = getRelativeLuminance(128, 128, 128)
      expect(luminance).toBeCloseTo(0.2159, 4)
    })

    it('calculates relative luminance for red', () => {
      const luminance = getRelativeLuminance(255, 0, 0)
      expect(luminance).toBeCloseTo(0.2126, 4)
    })
  })

  describe('getContrastRatio', () => {
    it('calculates WCAG ratio for black on white', () => {
      const ratio = getContrastRatio([0, 0, 0], [255, 255, 255])
      expect(ratio).toBeCloseTo(21, 1)
    })

    it('calculates WCAG ratio for white on black', () => {
      const ratio = getContrastRatio([255, 255, 255], [0, 0, 0])
      expect(ratio).toBeCloseTo(21, 1)
    })

    it('calculates WCAG ratio for same colors', () => {
      const ratio = getContrastRatio([128, 128, 128], [128, 128, 128])
      expect(ratio).toBe(1)
    })

    it('calculates WCAG ratio for gray on white', () => {
      const ratio = getContrastRatio([128, 128, 128], [255, 255, 255])
      expect(ratio).toBeCloseTo(3.95, 2)
    })
  })

  describe('meetsContrastAA', () => {
    it('checks AA compliance for normal text (4.5:1)', () => {
      expect(meetsContrastAA(4.5)).toBe(true)
      expect(meetsContrastAA(4.6)).toBe(true)
      expect(meetsContrastAA(4.4)).toBe(false)
      expect(meetsContrastAA(3)).toBe(false)
    })

    it('checks AA compliance for large text (3:1)', () => {
      expect(meetsContrastAA(3, true)).toBe(true)
      expect(meetsContrastAA(3.1, true)).toBe(true)
      expect(meetsContrastAA(2.9, true)).toBe(false)
      expect(meetsContrastAA(2, true)).toBe(false)
    })
  })

  describe('meetsContrastAAA', () => {
    it('checks AAA compliance for normal text (7:1)', () => {
      expect(meetsContrastAAA(7)).toBe(true)
      expect(meetsContrastAAA(7.1)).toBe(true)
      expect(meetsContrastAAA(6.9)).toBe(false)
      expect(meetsContrastAAA(4.5)).toBe(false)
    })

    it('checks AAA compliance for large text (4.5:1)', () => {
      expect(meetsContrastAAA(4.5, true)).toBe(true)
      expect(meetsContrastAAA(4.6, true)).toBe(true)
      expect(meetsContrastAAA(4.4, true)).toBe(false)
      expect(meetsContrastAAA(3, true)).toBe(false)
    })
  })
})
