/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest'
import { fingerprint, shallowFingerprint, fingerprintSimilarity, selectorPath } from '../content/dom-fingerprint'

function el(html: string): Element {
  const div = document.createElement('div')
  div.innerHTML = html
  return div.firstElementChild!
}

describe('fingerprint', () => {
  it('returns tag.classCount for leaf elements', () => {
    const result = fingerprint(el('<span class="a b">text</span>'))
    expect(result).toBe('span.2c')
  })

  it('includes child structure', () => {
    const result = fingerprint(el('<div><span>a</span><p>b</p></div>'))
    expect(result).toContain('div.')
    expect(result).toContain('span.0c')
    expect(result).toContain('p.0c')
  })

  it('ignores script/style tags', () => {
    const result = fingerprint(el('<div><script></script><p>text</p></div>'))
    expect(result).not.toContain('script')
    expect(result).toContain('p.0c')
  })

  it('limits depth', () => {
    const result = fingerprint(
      el('<div><div><div><div><div>deep</div></div></div></div></div>'),
      2,
    )
    // At depth 2, deepest should just be tag name
    expect(result).toBeTruthy()
  })
})

describe('shallowFingerprint', () => {
  it('includes child tag list', () => {
    const result = shallowFingerprint(el('<div><span></span><p></p></div>'))
    expect(result).toContain('[span,p]')
  })

  it('includes class count', () => {
    const result = shallowFingerprint(el('<div class="a b c"><p></p></div>'))
    expect(result).toContain('3c')
  })
})

describe('fingerprintSimilarity', () => {
  it('returns 1.0 for identical fingerprints', () => {
    expect(fingerprintSimilarity('div.2c.3ch', 'div.2c.3ch')).toBe(1.0)
  })

  it('returns 0.0 for empty strings', () => {
    expect(fingerprintSimilarity('', 'div')).toBe(0.0)
  })

  it('returns high similarity for similar structures', () => {
    const a = 'div.2c.3ch{span.0c,p.0c,a.1c}'
    const b = 'div.2c.3ch{span.0c,p.0c,a.0c}'
    expect(fingerprintSimilarity(a, b)).toBeGreaterThan(0.8)
  })

  it('returns low similarity for different structures', () => {
    const a = 'div.0c.1ch{p.0c}'
    const b = 'ul.0c.5ch{li.0c,li.0c,li.0c,li.0c,li.0c}'
    expect(fingerprintSimilarity(a, b)).toBeLessThan(0.3)
  })
})

describe('selectorPath', () => {
  it('uses tag.classes when classes available', () => {
    const result = selectorPath(el('<div class="card product">text</div>'))
    expect(result).toBe('div.card.product')
  })

  it('uses tag for elements without classes', () => {
    const result = selectorPath(el('<span>text</span>'))
    expect(result).toBe('span')
  })

  it('limits to 3 classes', () => {
    const result = selectorPath(el('<div class="a b c d e">text</div>'))
    expect(result).toBe('div.a.b.c')
  })

  it('skips js- prefixed classes', () => {
    const result = selectorPath(el('<div class="js-hook card">text</div>'))
    expect(result).toBe('div.card')
  })
})
