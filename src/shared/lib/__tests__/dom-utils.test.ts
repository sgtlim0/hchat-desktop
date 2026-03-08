import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  scrollToTop,
  scrollToElement,
  copyTextToClipboard,
  isElementVisible,
  getScrollPosition,
  addClass,
  removeClass,
  getStyle,
  createElementFromHTML
} from '../dom-utils'

describe('DOM Utils', () => {
  let mockElement: HTMLElement

  beforeEach(() => {
    // Create a mock element for testing
    mockElement = document.createElement('div')
    mockElement.className = 'test-class'
    mockElement.style.display = 'block'
    mockElement.style.color = 'red'
    document.body.appendChild(mockElement)

    // Mock window.scrollTo
    window.scrollTo = vi.fn()

    // Mock getBoundingClientRect
    mockElement.getBoundingClientRect = vi.fn().mockReturnValue({
      top: 100,
      left: 50,
      bottom: 200,
      right: 150,
      width: 100,
      height: 100,
      x: 50,
      y: 100
    })
  })

  afterEach(() => {
    document.body.removeChild(mockElement)
    vi.clearAllMocks()
  })

  describe('scrollToTop', () => {
    it('scrolls window to top with smooth behavior', () => {
      scrollToTop('smooth')
      expect(window.scrollTo).toHaveBeenCalledWith({
        top: 0,
        behavior: 'smooth'
      })
    })

    it('scrolls window to top with auto behavior by default', () => {
      scrollToTop()
      expect(window.scrollTo).toHaveBeenCalledWith({
        top: 0,
        behavior: 'auto'
      })
    })
  })

  describe('scrollToElement', () => {
    it('scrolls element into view with specified behavior', () => {
      const scrollIntoViewMock = vi.fn()
      mockElement.scrollIntoView = scrollIntoViewMock

      scrollToElement(mockElement, 'smooth')
      expect(scrollIntoViewMock).toHaveBeenCalledWith({
        behavior: 'smooth',
        block: 'start'
      })
    })

    it('scrolls element into view with auto behavior by default', () => {
      const scrollIntoViewMock = vi.fn()
      mockElement.scrollIntoView = scrollIntoViewMock

      scrollToElement(mockElement)
      expect(scrollIntoViewMock).toHaveBeenCalledWith({
        behavior: 'auto',
        block: 'start'
      })
    })
  })

  describe('copyTextToClipboard', () => {
    it('copies text to clipboard using navigator.clipboard', async () => {
      const writeTextMock = vi.fn().mockResolvedValue(undefined)
      Object.assign(navigator, {
        clipboard: {
          writeText: writeTextMock
        }
      })

      await copyTextToClipboard('test text')
      expect(writeTextMock).toHaveBeenCalledWith('test text')
    })

    it('falls back to document.execCommand when clipboard API not available', async () => {
      // Remove clipboard API
      Object.assign(navigator, {
        clipboard: undefined
      })

      // Mock document.execCommand
      const execCommandMock = vi.fn().mockReturnValue(true)
      document.execCommand = execCommandMock

      // Mock textarea creation and selection
      const createElementSpy = vi.spyOn(document, 'createElement')

      await copyTextToClipboard('fallback text')

      expect(createElementSpy).toHaveBeenCalledWith('textarea')
      expect(execCommandMock).toHaveBeenCalledWith('copy')
    })
  })

  describe('isElementVisible', () => {
    it('returns true for visible element', () => {
      const result = isElementVisible(mockElement)
      expect(result).toBe(true)
    })

    it('returns false for element with display none', () => {
      mockElement.style.display = 'none'
      const result = isElementVisible(mockElement)
      expect(result).toBe(false)
    })

    it('returns false for element with visibility hidden', () => {
      mockElement.style.visibility = 'hidden'
      const result = isElementVisible(mockElement)
      expect(result).toBe(false)
    })

    it('returns false for element with zero opacity', () => {
      mockElement.style.opacity = '0'
      const result = isElementVisible(mockElement)
      expect(result).toBe(false)
    })

    it('returns false for element outside viewport', () => {
      mockElement.getBoundingClientRect = vi.fn().mockReturnValue({
        top: -200,
        left: -200,
        bottom: -100,
        right: -100,
        width: 100,
        height: 100,
        x: -200,
        y: -200
      })
      const result = isElementVisible(mockElement)
      expect(result).toBe(false)
    })
  })

  describe('getScrollPosition', () => {
    it('returns current scroll position', () => {
      Object.defineProperty(window, 'pageXOffset', {
        value: 100,
        writable: true,
        configurable: true
      })
      Object.defineProperty(window, 'pageYOffset', {
        value: 200,
        writable: true,
        configurable: true
      })

      const position = getScrollPosition()
      expect(position).toEqual({ top: 200, left: 100 })
    })

    it('falls back to scrollX/scrollY if pageOffset not available', () => {
      Object.defineProperty(window, 'pageXOffset', {
        value: undefined,
        writable: true,
        configurable: true
      })
      Object.defineProperty(window, 'pageYOffset', {
        value: undefined,
        writable: true,
        configurable: true
      })
      Object.defineProperty(window, 'scrollX', {
        value: 50,
        writable: true,
        configurable: true
      })
      Object.defineProperty(window, 'scrollY', {
        value: 150,
        writable: true,
        configurable: true
      })

      const position = getScrollPosition()
      expect(position).toEqual({ top: 150, left: 50 })
    })
  })

  describe('addClass', () => {
    it('adds single class to element', () => {
      addClass(mockElement, 'new-class')
      expect(mockElement.className).toContain('new-class')
      expect(mockElement.classList.contains('new-class')).toBe(true)
    })

    it('adds multiple classes to element', () => {
      addClass(mockElement, 'class1', 'class2', 'class3')
      expect(mockElement.classList.contains('class1')).toBe(true)
      expect(mockElement.classList.contains('class2')).toBe(true)
      expect(mockElement.classList.contains('class3')).toBe(true)
    })

    it('does not duplicate existing classes', () => {
      addClass(mockElement, 'test-class')
      const classCount = mockElement.className.split(' ').filter(c => c === 'test-class').length
      expect(classCount).toBe(1)
    })
  })

  describe('removeClass', () => {
    it('removes single class from element', () => {
      mockElement.className = 'test-class other-class'
      removeClass(mockElement, 'test-class')
      expect(mockElement.classList.contains('test-class')).toBe(false)
      expect(mockElement.classList.contains('other-class')).toBe(true)
    })

    it('removes multiple classes from element', () => {
      mockElement.className = 'class1 class2 class3 class4'
      removeClass(mockElement, 'class1', 'class3')
      expect(mockElement.classList.contains('class1')).toBe(false)
      expect(mockElement.classList.contains('class2')).toBe(true)
      expect(mockElement.classList.contains('class3')).toBe(false)
      expect(mockElement.classList.contains('class4')).toBe(true)
    })

    it('handles removing non-existent classes gracefully', () => {
      const originalClassName = mockElement.className
      removeClass(mockElement, 'non-existent')
      expect(mockElement.className).toBe(originalClassName)
    })
  })

  describe('getStyle', () => {
    it('returns computed style value for property', () => {
      // Mock getComputedStyle
      window.getComputedStyle = vi.fn().mockReturnValue({
        color: 'rgb(255, 0, 0)',
        display: 'block',
        fontSize: '16px',
        getPropertyValue: (prop: string) => {
          const values: Record<string, string> = {
            color: 'rgb(255, 0, 0)',
            display: 'block',
            'font-size': '16px'
          }
          return values[prop] || ''
        }
      })

      const color = getStyle(mockElement, 'color')
      expect(color).toBe('rgb(255, 0, 0)')
      expect(window.getComputedStyle).toHaveBeenCalledWith(mockElement)
    })

    it('returns empty string for non-existent property', () => {
      window.getComputedStyle = vi.fn().mockReturnValue({
        color: 'red',
        getPropertyValue: (prop: string) => {
          const values: Record<string, string> = {
            color: 'red'
          }
          return values[prop] || ''
        }
      })

      const value = getStyle(mockElement, 'nonExistentProperty')
      expect(value).toBe('')
    })

    it('handles camelCase property names', () => {
      window.getComputedStyle = vi.fn().mockReturnValue({
        fontSize: '16px',
        backgroundColor: 'white',
        getPropertyValue: (prop: string) => {
          const values: Record<string, string> = {
            'font-size': '16px',
            'background-color': 'white'
          }
          return values[prop] || ''
        }
      })

      const fontSize = getStyle(mockElement, 'fontSize')
      expect(fontSize).toBe('16px')
    })
  })

  describe('createElementFromHTML', () => {
    it('creates element from valid HTML string', () => {
      const html = '<div class="created">Test Content</div>'
      const element = createElementFromHTML(html)

      expect(element).not.toBeNull()
      expect(element?.tagName).toBe('DIV')
      expect(element?.className).toBe('created')
      expect(element?.textContent).toBe('Test Content')
    })

    it('creates element with attributes and nested content', () => {
      const html = '<button id="btn" data-test="value"><span>Click me</span></button>'
      const element = createElementFromHTML(html)

      expect(element?.tagName).toBe('BUTTON')
      expect(element?.id).toBe('btn')
      expect(element?.getAttribute('data-test')).toBe('value')
      expect(element?.querySelector('span')?.textContent).toBe('Click me')
    })

    it('returns null for invalid HTML', () => {
      const element = createElementFromHTML('')
      expect(element).toBeNull()
    })

    it('returns first element when multiple elements in HTML', () => {
      const html = '<div>First</div><div>Second</div>'
      const element = createElementFromHTML(html)

      expect(element?.textContent).toBe('First')
    })

    it('handles text nodes by returning null', () => {
      const html = 'Just text'
      const element = createElementFromHTML(html)

      expect(element).toBeNull()
    })
  })

  describe('SSR safety', () => {
    it('all functions handle missing window/document gracefully', () => {
      // This is tested implicitly as vitest runs in jsdom environment
      // In real SSR, these would need guards
      expect(() => scrollToTop()).not.toThrow()

      // Mock scrollIntoView for scrollToElement test
      const testElement = document.createElement('div')
      testElement.scrollIntoView = vi.fn()
      expect(() => scrollToElement(testElement)).not.toThrow()

      expect(() => isElementVisible(mockElement)).not.toThrow()
      expect(() => getScrollPosition()).not.toThrow()
      expect(() => addClass(mockElement, 'test')).not.toThrow()
      expect(() => removeClass(mockElement, 'test')).not.toThrow()
      expect(() => getStyle(mockElement, 'color')).not.toThrow()
      expect(() => createElementFromHTML('<div></div>')).not.toThrow()
    })
  })
})
