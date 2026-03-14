import { describe, it, expect } from 'vitest'
import { evaluateQuality, isImprovement } from '../lib/quality-evaluator'
import type { ExtractionResult, ExtractionStrategy } from '../lib/extraction-strategy'

function makeStrategy(id: string = 'test'): ExtractionStrategy {
  return {
    id,
    name: 'Test',
    type: 'table',
    selectors: { container: 'table', item: 'tr', fields: [] },
    confidence: 0.8,
    source: 'heuristic',
  }
}

function makeResult(
  records: Record<string, string>[],
  fieldCount: number = 3,
): ExtractionResult {
  return {
    strategy: makeStrategy(),
    records,
    itemCount: records.length,
    fieldCount,
    executionMs: 5,
  }
}

describe('evaluateQuality', () => {
  it('returns 0 for empty records', () => {
    const result = makeResult([])
    const score = evaluateQuality(result)
    expect(score.total).toBe(0)
    expect(score.completeness).toBe(0)
  })

  it('scores high for rich, complete data', () => {
    const records = Array.from({ length: 15 }, (_, i) => ({
      name: `Product ${i}`,
      price: `$${(i + 1) * 10}`,
      description: `Description for product ${i}`,
    }))
    const score = evaluateQuality(makeResult(records))
    expect(score.total).toBeGreaterThan(0.7)
    expect(score.completeness).toBe(1.0)
    expect(score.richness).toBeGreaterThan(0.9)
  })

  it('penalizes high noise ratio', () => {
    const records = [
      { name: 'A', price: '', description: '' },
      { name: 'B', price: '', description: '' },
      { name: 'C', price: '', description: '' },
    ]
    const score = evaluateQuality(makeResult(records))
    expect(score.noiseRatio).toBeGreaterThan(0.5)
    expect(score.richness).toBeLessThan(0.5)
  })

  it('penalizes duplicate records', () => {
    const records = [
      { name: 'Same', price: '$10' },
      { name: 'Same', price: '$10' },
      { name: 'Same', price: '$10' },
    ]
    const score = evaluateQuality(makeResult(records, 2))
    expect(score.uniqueness).toBeLessThan(0.5)
  })

  it('scores consistency for uniform records', () => {
    const records = [
      { name: 'A', price: '$10' },
      { name: 'B', price: '$20' },
      { name: 'C', price: '$30' },
    ]
    const score = evaluateQuality(makeResult(records, 2))
    expect(score.consistency).toBe(1.0)
  })

  it('reduces consistency for uneven records', () => {
    const records = [
      { name: 'A', price: '$10' },
      { name: '', price: '$20' },
      { name: 'C', price: '' },
    ]
    const score = evaluateQuality(makeResult(records, 2))
    expect(score.consistency).toBeLessThan(1.0)
  })

  it('includes details string', () => {
    const records = [{ name: 'A', price: '$10' }]
    const score = evaluateQuality(makeResult(records, 2))
    expect(score.details).toContain('1 records')
    expect(score.details).toContain('ms')
  })
})

describe('isImprovement', () => {
  it('returns true when total is higher', () => {
    const current = { total: 0.7, completeness: 0, consistency: 0, richness: 0, noiseRatio: 0, uniqueness: 0, details: '' }
    const previous = { total: 0.5, completeness: 0, consistency: 0, richness: 0, noiseRatio: 0, uniqueness: 0, details: '' }
    expect(isImprovement(current, previous)).toBe(true)
  })

  it('returns false for marginal change', () => {
    const current = { total: 0.501, completeness: 0, consistency: 0, richness: 0, noiseRatio: 0, uniqueness: 0, details: '' }
    const previous = { total: 0.5, completeness: 0, consistency: 0, richness: 0, noiseRatio: 0, uniqueness: 0, details: '' }
    expect(isImprovement(current, previous)).toBe(false)
  })

  it('returns false when degraded', () => {
    const current = { total: 0.3, completeness: 0, consistency: 0, richness: 0, noiseRatio: 0, uniqueness: 0, details: '' }
    const previous = { total: 0.5, completeness: 0, consistency: 0, richness: 0, noiseRatio: 0, uniqueness: 0, details: '' }
    expect(isImprovement(current, previous)).toBe(false)
  })
})
