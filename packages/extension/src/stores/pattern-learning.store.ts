/**
 * Pattern learning store — persists successful extraction strategies per domain.
 * The "git commit" of AutoResearch: strategies that score well are saved for reuse.
 */

import { create } from 'zustand'
import type { ExtractionStrategy } from '@ext/lib/extraction-strategy'
import type { QualityScore } from '@ext/lib/quality-evaluator'

export interface LearnedPattern {
  readonly domain: string
  readonly strategy: ExtractionStrategy
  readonly score: QualityScore
  readonly usageCount: number
  readonly lastUsed: string
  readonly createdAt: string
}

interface PatternLearningState {
  patterns: ReadonlyArray<LearnedPattern>

  // Actions
  savePattern: (domain: string, strategy: ExtractionStrategy, score: QualityScore) => void
  getPatterns: (domain: string) => ReadonlyArray<LearnedPattern>
  getBestPattern: (domain: string) => LearnedPattern | null
  recordUsage: (domain: string, strategyId: string) => void
  removePattern: (domain: string, strategyId: string) => void
  clearDomain: (domain: string) => void
  clearAll: () => void
}

function loadPatterns(): LearnedPattern[] {
  try {
    const raw = localStorage.getItem('hchat-learned-patterns')
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function persistPatterns(patterns: ReadonlyArray<LearnedPattern>): void {
  try {
    localStorage.setItem('hchat-learned-patterns', JSON.stringify(patterns))
  } catch {
    // storage full — evict oldest patterns
    const sorted = [...patterns].sort(
      (a, b) => new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime(),
    )
    localStorage.setItem('hchat-learned-patterns', JSON.stringify(sorted.slice(0, 50)))
  }
}

export const usePatternLearningStore = create<PatternLearningState>((set, get) => ({
  patterns: loadPatterns(),

  savePattern: (domain, strategy, score) => {
    const existing = get().patterns
    const now = new Date().toISOString()

    // Check if a pattern for this domain+strategy already exists
    const existingIdx = existing.findIndex(
      (p) => p.domain === domain && p.strategy.id === strategy.id,
    )

    let updated: LearnedPattern[]
    if (existingIdx >= 0) {
      // Update existing if score improved
      const prev = existing[existingIdx]
      if (score.total > prev.score.total) {
        updated = existing.map((p, i) =>
          i === existingIdx
            ? { ...p, strategy, score, lastUsed: now, usageCount: p.usageCount + 1 }
            : p,
        )
      } else {
        // Just record usage
        updated = existing.map((p, i) =>
          i === existingIdx ? { ...p, lastUsed: now, usageCount: p.usageCount + 1 } : p,
        )
      }
    } else {
      updated = [
        ...existing,
        { domain, strategy, score, usageCount: 1, lastUsed: now, createdAt: now },
      ]
    }

    persistPatterns(updated)
    set({ patterns: updated })
  },

  getPatterns: (domain) => get().patterns.filter((p) => p.domain === domain),

  getBestPattern: (domain) => {
    const domainPatterns = get().patterns.filter((p) => p.domain === domain)
    if (domainPatterns.length === 0) return null
    return domainPatterns.reduce((best, p) =>
      p.score.total > best.score.total ? p : best,
    )
  },

  recordUsage: (domain, strategyId) => {
    const now = new Date().toISOString()
    const updated = get().patterns.map((p) =>
      p.domain === domain && p.strategy.id === strategyId
        ? { ...p, usageCount: p.usageCount + 1, lastUsed: now }
        : p,
    )
    persistPatterns(updated)
    set({ patterns: updated })
  },

  removePattern: (domain, strategyId) => {
    const updated = get().patterns.filter(
      (p) => !(p.domain === domain && p.strategy.id === strategyId),
    )
    persistPatterns(updated)
    set({ patterns: updated })
  },

  clearDomain: (domain) => {
    const updated = get().patterns.filter((p) => p.domain !== domain)
    persistPatterns(updated)
    set({ patterns: updated })
  },

  clearAll: () => {
    localStorage.removeItem('hchat-learned-patterns')
    set({ patterns: [] })
  },
}))
