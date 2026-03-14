/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest'
import { generateHeuristicStrategies, executeStrategy } from '../lib/extraction-strategy'

function createRoot(html: string): Element {
  const div = document.createElement('div')
  div.innerHTML = html
  return div
}

describe('generateHeuristicStrategies', () => {
  it('detects HTML table strategies', () => {
    const root = createRoot(`
      <table id="data">
        <thead><tr><th>Name</th><th>Price</th></tr></thead>
        <tbody>
          <tr><td>Widget</td><td>$10</td></tr>
          <tr><td>Gadget</td><td>$20</td></tr>
          <tr><td>Tool</td><td>$30</td></tr>
        </tbody>
      </table>
    `)
    const strategies = generateHeuristicStrategies(root)
    const tableStrategy = strategies.find((s) => s.type === 'table')
    expect(tableStrategy).toBeDefined()
    expect(tableStrategy!.confidence).toBeGreaterThanOrEqual(0.8)
    expect(tableStrategy!.selectors.fields.length).toBe(2)
  })

  it('detects card-based strategies', () => {
    const root = createRoot(`
      <div class="product-list">
        <div class="product"><h3>A</h3><span>$10</span></div>
        <div class="product"><h3>B</h3><span>$20</span></div>
        <div class="product"><h3>C</h3><span>$30</span></div>
      </div>
    `)
    const strategies = generateHeuristicStrategies(root)
    const cardStrategy = strategies.find((s) => s.type === 'card')
    expect(cardStrategy).toBeDefined()
  })

  it('returns empty for unstructured content', () => {
    const root = createRoot('<p>Just a paragraph of text.</p>')
    const strategies = generateHeuristicStrategies(root)
    expect(strategies).toHaveLength(0)
  })

  it('sorts strategies by confidence', () => {
    const root = createRoot(`
      <table><thead><tr><th>A</th></tr></thead><tbody><tr><td>1</td></tr><tr><td>2</td></tr></tbody></table>
      <ul class="items"><li class="item"><a href="#">Link</a><span>text</span></li><li class="item"><a href="#">Link</a><span>text</span></li><li class="item"><a href="#">Link</a><span>text</span></li></ul>
    `)
    const strategies = generateHeuristicStrategies(root)
    if (strategies.length >= 2) {
      expect(strategies[0].confidence).toBeGreaterThanOrEqual(strategies[1].confidence)
    }
  })
})

describe('executeStrategy', () => {
  it('extracts records from table strategy', () => {
    const root = createRoot(`
      <table id="data">
        <thead><tr><th>Name</th><th>Price</th></tr></thead>
        <tbody>
          <tr><td>Widget</td><td>$10</td></tr>
          <tr><td>Gadget</td><td>$20</td></tr>
        </tbody>
      </table>
    `)
    const strategies = generateHeuristicStrategies(root)
    const tableStrategy = strategies.find((s) => s.type === 'table')!
    const result = executeStrategy(root, tableStrategy)

    expect(result.records.length).toBeGreaterThanOrEqual(2)
    expect(result.executionMs).toBeGreaterThanOrEqual(0)
  })

  it('returns empty for missing container', () => {
    const root = createRoot('<p>Nothing here</p>')
    const result = executeStrategy(root, {
      id: 'test',
      name: 'test',
      type: 'table',
      selectors: { container: '#nonexistent', item: 'tr', fields: [] },
      confidence: 0.5,
      source: 'heuristic',
    })
    expect(result.records).toHaveLength(0)
    expect(result.itemCount).toBe(0)
  })

  it('measures execution time', () => {
    const root = createRoot(`
      <table><thead><tr><th>A</th></tr></thead><tbody><tr><td>1</td></tr><tr><td>2</td></tr></tbody></table>
    `)
    const strategies = generateHeuristicStrategies(root)
    if (strategies.length > 0) {
      const result = executeStrategy(root, strategies[0])
      expect(result.executionMs).toBeGreaterThanOrEqual(0)
    }
  })
})
