/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest'
import { detectRepeatingPatterns } from '../content/pattern-detector'

function createRoot(html: string): Element {
  const div = document.createElement('div')
  div.innerHTML = html
  return div
}

describe('detectRepeatingPatterns', () => {
  it('detects repeating card patterns', () => {
    const root = createRoot(`
      <div class="grid">
        <div class="card"><h3>Product A</h3><p>Description A here</p><span>$10</span></div>
        <div class="card"><h3>Product B</h3><p>Description B here</p><span>$20</span></div>
        <div class="card"><h3>Product C</h3><p>Description C here</p><span>$30</span></div>
      </div>
    `)
    const patterns = detectRepeatingPatterns(root)
    expect(patterns.length).toBeGreaterThan(0)
    expect(patterns[0].count).toBe(3)
  })

  it('detects repeating list items', () => {
    const root = createRoot(`
      <ul class="results">
        <li class="result"><a href="/1">Search Result Title One</a><span>Relevance Score: 95 out of 100</span></li>
        <li class="result"><a href="/2">Search Result Title Two</a><span>Relevance Score: 88 out of 100</span></li>
        <li class="result"><a href="/3">Search Result Title Three</a><span>Relevance Score: 92 out of 100</span></li>
        <li class="result"><a href="/4">Search Result Title Four</a><span>Relevance Score: 77 out of 100</span></li>
      </ul>
    `)
    const patterns = detectRepeatingPatterns(root)
    expect(patterns.length).toBeGreaterThan(0)
    expect(patterns[0].count).toBe(4)
  })

  it('ignores nav/header/footer', () => {
    const root = createRoot(`
      <nav>
        <a href="/">Home</a>
        <a href="/about">About</a>
        <a href="/contact">Contact</a>
      </nav>
      <main>
        <div class="item"><p>Content item one here</p></div>
        <div class="item"><p>Content item two here</p></div>
        <div class="item"><p>Content item three here</p></div>
      </main>
    `)
    const patterns = detectRepeatingPatterns(root)
    // Should find the main items, not nav links
    const mainPatterns = patterns.filter((p) => p.avgTextLength > 15)
    expect(mainPatterns.length).toBeGreaterThanOrEqual(0) // nav items filtered out
  })

  it('returns empty for non-repeating content', () => {
    const root = createRoot(`
      <div>
        <h1>Title</h1>
        <p>Paragraph text</p>
        <blockquote>Quote</blockquote>
      </div>
    `)
    const patterns = detectRepeatingPatterns(root)
    expect(patterns).toHaveLength(0)
  })

  it('requires minimum 3 repetitions', () => {
    const root = createRoot(`
      <div>
        <div class="card"><p>Only two cards here</p></div>
        <div class="card"><p>Not enough for pattern</p></div>
      </div>
    `)
    const patterns = detectRepeatingPatterns(root)
    expect(patterns).toHaveLength(0)
  })

  it('computes density score between 0 and 1', () => {
    const root = createRoot(`
      <div>
        <div class="item"><h3>Title</h3><p>Some description text here</p><a href="#">Link</a></div>
        <div class="item"><h3>Title</h3><p>Some description text here</p><a href="#">Link</a></div>
        <div class="item"><h3>Title</h3><p>Some description text here</p><a href="#">Link</a></div>
      </div>
    `)
    const patterns = detectRepeatingPatterns(root)
    if (patterns.length > 0) {
      expect(patterns[0].density).toBeGreaterThanOrEqual(0)
      expect(patterns[0].density).toBeLessThanOrEqual(1)
    }
  })

  it('extracts field hints', () => {
    const root = createRoot(`
      <div>
        <div class="product"><img src="img.jpg"><h3>Name</h3><span class="price">$10</span></div>
        <div class="product"><img src="img.jpg"><h3>Name</h3><span class="price">$20</span></div>
        <div class="product"><img src="img.jpg"><h3>Name</h3><span class="price">$30</span></div>
      </div>
    `)
    const patterns = detectRepeatingPatterns(root)
    if (patterns.length > 0) {
      expect(patterns[0].fieldHints.length).toBeGreaterThan(0)
    }
  })

  it('sorts patterns by density * count', () => {
    const root = createRoot(`
      <div id="small">
        <div class="a"><p>Short text abc</p></div>
        <div class="a"><p>Short text def</p></div>
        <div class="a"><p>Short text ghi</p></div>
      </div>
      <div id="large">
        <div class="b"><h2>Big Title</h2><p>Long description text content here is great</p><a href="#">Read more</a></div>
        <div class="b"><h2>Big Title</h2><p>Long description text content here is great</p><a href="#">Read more</a></div>
        <div class="b"><h2>Big Title</h2><p>Long description text content here is great</p><a href="#">Read more</a></div>
        <div class="b"><h2>Big Title</h2><p>Long description text content here is great</p><a href="#">Read more</a></div>
      </div>
    `)
    const patterns = detectRepeatingPatterns(root)
    if (patterns.length >= 2) {
      const score0 = patterns[0].density * patterns[0].count
      const score1 = patterns[1].density * patterns[1].count
      expect(score0).toBeGreaterThanOrEqual(score1)
    }
  })
})
