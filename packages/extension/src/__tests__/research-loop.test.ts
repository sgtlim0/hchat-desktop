/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest'
import { runExtractionLoop } from '../lib/research-loop'

function createRoot(html: string): Element {
  const div = document.createElement('div')
  div.innerHTML = html
  return div
}

describe('runExtractionLoop', () => {
  it('yields iterations for a page with tables', async () => {
    const root = createRoot(`
      <table id="data">
        <thead><tr><th>Name</th><th>Price</th><th>Stock</th></tr></thead>
        <tbody>
          <tr><td>Widget</td><td>$10.00</td><td>150</td></tr>
          <tr><td>Gadget</td><td>$25.50</td><td>75</td></tr>
          <tr><td>Tool</td><td>$5.99</td><td>300</td></tr>
          <tr><td>Part</td><td>$12.00</td><td>42</td></tr>
        </tbody>
      </table>
    `)

    const iterations = []
    for await (const iter of runExtractionLoop(root, { maxIterations: 3, useLLM: false })) {
      iterations.push(iter)
    }

    expect(iterations.length).toBeGreaterThan(0)
    const first = iterations[0]
    expect(first.iteration).toBe(0)
    expect(first.strategy).toBeDefined()
    expect(first.result.records.length).toBeGreaterThan(0)
    expect(first.score.total).toBeGreaterThan(0)
    expect(first.status).toBeDefined()
  })

  it('marks best iteration as improved', async () => {
    const root = createRoot(`
      <table>
        <thead><tr><th>A</th><th>B</th></tr></thead>
        <tbody>
          <tr><td>One</td><td>1</td></tr>
          <tr><td>Two</td><td>2</td></tr>
          <tr><td>Three</td><td>3</td></tr>
        </tbody>
      </table>
    `)

    const iterations = []
    for await (const iter of runExtractionLoop(root, { maxIterations: 5, useLLM: false })) {
      iterations.push(iter)
    }

    // First iteration should be "improved" (from 0)
    if (iterations.length > 0) {
      expect(iterations[0].isBest).toBe(true)
      expect(iterations[0].status).toBe('improved')
    }
  })

  it('yields nothing for empty pages', async () => {
    const root = createRoot('<p>Just plain text with no structure at all.</p>')

    const iterations = []
    for await (const iter of runExtractionLoop(root, { maxIterations: 3, useLLM: false })) {
      iterations.push(iter)
    }

    expect(iterations).toHaveLength(0)
  })

  it('respects maxIterations config', async () => {
    const root = createRoot(`
      <table><thead><tr><th>X</th></tr></thead><tbody>
        <tr><td>a</td></tr><tr><td>b</td></tr><tr><td>c</td></tr>
      </tbody></table>
      <div class="items">
        <div class="item"><p>Item one text content</p></div>
        <div class="item"><p>Item two text content</p></div>
        <div class="item"><p>Item three text content</p></div>
      </div>
    `)

    const iterations = []
    for await (const iter of runExtractionLoop(root, { maxIterations: 1, useLLM: false })) {
      iterations.push(iter)
    }

    expect(iterations.length).toBeLessThanOrEqual(1)
  })

  it('scores include all quality dimensions', async () => {
    const root = createRoot(`
      <table>
        <thead><tr><th>Name</th><th>Value</th></tr></thead>
        <tbody>
          <tr><td>Alpha</td><td>100</td></tr>
          <tr><td>Beta</td><td>200</td></tr>
          <tr><td>Gamma</td><td>300</td></tr>
        </tbody>
      </table>
    `)

    for await (const iter of runExtractionLoop(root, { maxIterations: 1, useLLM: false })) {
      expect(iter.score.total).toBeGreaterThanOrEqual(0)
      expect(iter.score.total).toBeLessThanOrEqual(1)
      expect(iter.score.completeness).toBeDefined()
      expect(iter.score.consistency).toBeDefined()
      expect(iter.score.richness).toBeDefined()
      expect(iter.score.noiseRatio).toBeDefined()
      expect(iter.score.uniqueness).toBeDefined()
      expect(iter.score.details).toBeTruthy()
      break
    }
  })

  it('handles multiple strategy types in single page', async () => {
    const root = createRoot(`
      <table id="t1">
        <thead><tr><th>ID</th><th>Name</th></tr></thead>
        <tbody>
          <tr><td>1</td><td>Alice</td></tr>
          <tr><td>2</td><td>Bob</td></tr>
        </tbody>
      </table>
      <div class="card-grid">
        <div class="card"><h3>Card Title A</h3><p>Card content here for testing</p></div>
        <div class="card"><h3>Card Title B</h3><p>Card content here for testing</p></div>
        <div class="card"><h3>Card Title C</h3><p>Card content here for testing</p></div>
      </div>
    `)

    const strategies = new Set<string>()
    for await (const iter of runExtractionLoop(root, { maxIterations: 5, useLLM: false })) {
      strategies.add(iter.strategy.type)
    }

    // Should find at least table strategy
    expect(strategies.has('table')).toBe(true)
  })
})
