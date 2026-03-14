/**
 * Multi-dimensional quality evaluator for extraction results.
 * Inspired by AutoResearch: the "val_bpb" metric that determines commit vs rollback.
 *
 * Quality dimensions:
 * 1. Completeness — how many items were extracted vs expected
 * 2. Consistency — are records structurally uniform
 * 3. Richness — how many fields have non-empty values
 * 4. Noise ratio — how much junk/empty data exists
 * 5. Uniqueness — are records distinct or duplicated
 */

import type { ExtractionResult } from './extraction-strategy'

export interface QualityScore {
  readonly total: number
  readonly completeness: number
  readonly consistency: number
  readonly richness: number
  readonly noiseRatio: number
  readonly uniqueness: number
  readonly details: string
}

/**
 * Evaluate extraction result quality. Returns score 0-1.
 */
export function evaluateQuality(result: ExtractionResult): QualityScore {
  if (result.records.length === 0) {
    return {
      total: 0,
      completeness: 0,
      consistency: 0,
      richness: 0,
      noiseRatio: 1,
      uniqueness: 0,
      details: 'No records extracted',
    }
  }

  const completeness = scoreCompleteness(result)
  const consistency = scoreConsistency(result)
  const richness = scoreRichness(result)
  const noiseRatio = scoreNoise(result)
  const uniqueness = scoreUniqueness(result)

  // Weighted total (completeness and richness matter most)
  const total = Math.min(
    1,
    completeness * 0.25 +
      consistency * 0.15 +
      richness * 0.30 +
      (1 - noiseRatio) * 0.15 +
      uniqueness * 0.15,
  )

  const details = [
    `${result.records.length} records`,
    `${result.fieldCount} fields`,
    `completeness: ${(completeness * 100).toFixed(0)}%`,
    `richness: ${(richness * 100).toFixed(0)}%`,
    `noise: ${(noiseRatio * 100).toFixed(0)}%`,
    `${result.executionMs}ms`,
  ].join(', ')

  return { total, completeness, consistency, richness, noiseRatio, uniqueness, details }
}

/**
 * Completeness: ratio of extracted items to expected (3+ is good, 10+ is great).
 */
function scoreCompleteness(result: ExtractionResult): number {
  const count = result.records.length
  if (count >= 10) return 1.0
  if (count >= 5) return 0.8
  if (count >= 3) return 0.6
  if (count >= 1) return 0.3
  return 0
}

/**
 * Consistency: do all records have the same fields with values?
 */
function scoreConsistency(result: ExtractionResult): number {
  if (result.records.length < 2) return 1.0

  const fieldKeys = Object.keys(result.records[0])
  let totalMatch = 0
  let totalChecks = 0

  for (let i = 1; i < result.records.length; i++) {
    for (const key of fieldKeys) {
      totalChecks++
      const hasValue = Boolean(result.records[i][key])
      const firstHasValue = Boolean(result.records[0][key])
      if (hasValue === firstHasValue) totalMatch++
    }
  }

  return totalChecks === 0 ? 0 : totalMatch / totalChecks
}

/**
 * Richness: ratio of non-empty field values across all records.
 */
function scoreRichness(result: ExtractionResult): number {
  let filled = 0
  let total = 0

  for (const record of result.records) {
    for (const value of Object.values(record)) {
      total++
      if (value && value.trim().length > 0) filled++
    }
  }

  return total === 0 ? 0 : filled / total
}

/**
 * Noise: ratio of very short or empty values.
 */
function scoreNoise(result: ExtractionResult): number {
  let noisy = 0
  let total = 0

  for (const record of result.records) {
    for (const value of Object.values(record)) {
      total++
      const trimmed = (value || '').trim()
      if (trimmed.length === 0 || trimmed === '-' || trimmed === 'N/A') noisy++
    }
  }

  return total === 0 ? 1 : noisy / total
}

/**
 * Uniqueness: ratio of distinct records (by concatenated text).
 */
function scoreUniqueness(result: ExtractionResult): number {
  if (result.records.length <= 1) return 1.0

  const fingerprints = new Set(
    result.records.map((r) => Object.values(r).join('|').toLowerCase()),
  )

  return fingerprints.size / result.records.length
}

/**
 * Compare two quality scores and determine if the new one is an improvement.
 */
export function isImprovement(current: QualityScore, previous: QualityScore): boolean {
  return current.total > previous.total + 0.01 // small threshold to avoid noise
}
