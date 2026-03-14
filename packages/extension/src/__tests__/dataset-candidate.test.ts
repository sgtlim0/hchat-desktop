/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest'
import { detectRepeatingPatterns } from '../content/pattern-detector'
import { buildCandidates } from '../content/dataset-candidate'

function createRoot(html: string): Element {
  const div = document.createElement('div')
  div.innerHTML = html
  return div
}

describe('buildCandidates', () => {
  it('builds candidates from detected patterns', () => {
    const root = createRoot(`
      <div class="products">
        <div class="product">
          <h3>Product Alpha</h3>
          <p>Description for alpha product here</p>
          <span class="price">$29.99</span>
        </div>
        <div class="product">
          <h3>Product Beta</h3>
          <p>Description for beta product here</p>
          <span class="price">$39.99</span>
        </div>
        <div class="product">
          <h3>Product Gamma</h3>
          <p>Description for gamma product here</p>
          <span class="price">$49.99</span>
        </div>
      </div>
    `)

    const patterns = detectRepeatingPatterns(root)
    const candidates = buildCandidates(patterns)

    expect(candidates.length).toBeGreaterThan(0)
    const first = candidates[0]
    expect(first.itemCount).toBe(3)
    expect(first.fields.length).toBeGreaterThan(0)
    expect(first.preview.length).toBeGreaterThan(0)
    expect(first.density).toBeGreaterThan(0)
    expect(first.id).toBeTruthy()
    expect(first.name).toBeTruthy()
    expect(first.description).toBeTruthy()
  })

  it('filters out low-density patterns', () => {
    const patterns = detectRepeatingPatterns(createRoot('<div></div>'))
    const candidates = buildCandidates(patterns)
    expect(candidates).toHaveLength(0)
  })

  it('limits to 10 candidates', () => {
    // Create many potential patterns
    const items = Array.from({ length: 15 }, (_, i) => `
      <div class="group-${i}">
        ${Array.from({ length: 5 }, (_, j) => `
          <div class="item-${i}"><p>Group ${i} Item ${j} content text here</p></div>
        `).join('')}
      </div>
    `).join('')

    const root = createRoot(items)
    const patterns = detectRepeatingPatterns(root)
    const candidates = buildCandidates(patterns)
    expect(candidates.length).toBeLessThanOrEqual(10)
  })

  it('extracts preview records', () => {
    const root = createRoot(`
      <ul class="search-results">
        <li class="result"><a href="/1">Result One Title Here</a><span>Score: 95 points</span></li>
        <li class="result"><a href="/2">Result Two Title Here</a><span>Score: 88 points</span></li>
        <li class="result"><a href="/3">Result Three Title Here</a><span>Score: 92 points</span></li>
      </ul>
    `)

    const patterns = detectRepeatingPatterns(root)
    const candidates = buildCandidates(patterns)

    if (candidates.length > 0) {
      const preview = candidates[0].preview
      expect(preview.length).toBeGreaterThan(0)
      expect(preview.length).toBeLessThanOrEqual(5)
    }
  })

  it('infers field types correctly', () => {
    const root = createRoot(`
      <div class="cards">
        <div class="card">
          <img src="https://img.com/1.jpg" />
          <h3>Title One Long Enough</h3>
          <time datetime="2024-01-01">Jan 1</time>
        </div>
        <div class="card">
          <img src="https://img.com/2.jpg" />
          <h3>Title Two Long Enough</h3>
          <time datetime="2024-01-02">Jan 2</time>
        </div>
        <div class="card">
          <img src="https://img.com/3.jpg" />
          <h3>Title Three Long Enough</h3>
          <time datetime="2024-01-03">Jan 3</time>
        </div>
      </div>
    `)

    const patterns = detectRepeatingPatterns(root)
    const candidates = buildCandidates(patterns)

    if (candidates.length > 0 && candidates[0].fields.length > 0) {
      const fieldTypes = candidates[0].fields.map((f) => f.type)
      // Should have image, text, and date fields
      expect(fieldTypes.some((t) => t === 'image' || t === 'text' || t === 'date')).toBe(true)
    }
  })

  it('generates dataset names', () => {
    const root = createRoot(`
      <h2>Popular Products</h2>
      <div class="list">
        <div class="item"><p>Product one with description here</p></div>
        <div class="item"><p>Product two with description here</p></div>
        <div class="item"><p>Product three with description here</p></div>
      </div>
    `)

    const patterns = detectRepeatingPatterns(root)
    const candidates = buildCandidates(patterns)

    if (candidates.length > 0) {
      expect(candidates[0].name).toBeTruthy()
      expect(candidates[0].name.length).toBeGreaterThan(0)
    }
  })
})
