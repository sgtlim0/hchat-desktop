import { describe, it, expect } from 'vitest'
import { getScrollPosition, addClass, removeClass, createElementFromHTML } from '../dom-utils'

describe('dom-utils', () => {
  it('getScrollPosition returns top/left', () => {
    const pos = getScrollPosition()
    expect(pos).toHaveProperty('top')
    expect(pos).toHaveProperty('left')
  })

  it('addClass adds classes', () => {
    const el = document.createElement('div')
    addClass(el, 'foo', 'bar')
    expect(el.classList.contains('foo')).toBe(true)
    expect(el.classList.contains('bar')).toBe(true)
  })

  it('removeClass removes classes', () => {
    const el = document.createElement('div')
    el.classList.add('foo', 'bar')
    removeClass(el, 'foo')
    expect(el.classList.contains('foo')).toBe(false)
    expect(el.classList.contains('bar')).toBe(true)
  })

  it('createElementFromHTML creates element', () => {
    const el = createElementFromHTML('<div class="test">Hello</div>')
    expect(el).not.toBeNull()
    expect(el?.tagName).toBe('DIV')
    expect(el?.textContent).toBe('Hello')
  })

  it('createElementFromHTML returns null for empty', () => {
    const el = createElementFromHTML('')
    expect(el).toBeNull()
  })
})
