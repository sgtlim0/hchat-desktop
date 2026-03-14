/**
 * AutoResearch Loop for web data extraction.
 *
 * Inspired by karpathy/autoresearch:
 *   while True:
 *     context = read_full_code()     → observe()
 *     suggestion = LLM(context)      → hypothesize()
 *     apply(suggestion)              → execute()
 *     result = run_experiment()      → evaluate()
 *     if improved: git_commit()      → learn() / savePattern
 *     else: git_rollback()           → discard strategy
 *
 * Applied to browser context:
 * - "code" = page DOM structure
 * - "experiment" = data extraction attempt
 * - "metric" = quality score (completeness, richness, noise ratio)
 */

import {
  generateHeuristicStrategies,
  executeStrategy,
} from './extraction-strategy'
import type { ExtractionStrategy, ExtractionResult } from './extraction-strategy'
import { evaluateQuality, isImprovement } from './quality-evaluator'
import type { QualityScore } from './quality-evaluator'
import { getConfig } from '@hchat/shared'

export interface LoopIteration {
  readonly iteration: number
  readonly strategy: ExtractionStrategy
  readonly result: ExtractionResult
  readonly score: QualityScore
  readonly isBest: boolean
  readonly status: 'improved' | 'no_change' | 'degraded'
}

export interface LoopConfig {
  readonly maxIterations: number
  readonly minScore: number
  readonly useLLM: boolean
  readonly credentials?: {
    readonly accessKeyId: string
    readonly secretAccessKey: string
    readonly region: string
  }
  readonly modelId?: string
}

const DEFAULT_CONFIG: LoopConfig = {
  maxIterations: 5,
  minScore: 0.3,
  useLLM: false,
}

/**
 * Run the extraction loop on the current page.
 * Yields progress after each iteration.
 */
export async function* runExtractionLoop(
  root: Element,
  config: Partial<LoopConfig> = {},
): AsyncGenerator<LoopIteration> {
  const opts = { ...DEFAULT_CONFIG, ...config }
  let bestScore: QualityScore = { total: 0, completeness: 0, consistency: 0, richness: 0, noiseRatio: 1, uniqueness: 0, details: '' }

  // Phase 1: Generate heuristic strategies
  const strategies = generateHeuristicStrategies(root)

  if (strategies.length === 0) {
    return // no extractable patterns found
  }

  // Phase 2: Execute and evaluate each strategy
  for (let i = 0; i < Math.min(strategies.length, opts.maxIterations); i++) {
    const strategy = strategies[i]
    const result = executeStrategy(root, strategy)
    const score = evaluateQuality(result)

    const improved = isImprovement(score, bestScore)
    if (improved) {
      bestScore = score
    }

    yield {
      iteration: i,
      strategy,
      result,
      score,
      isBest: improved,
      status: improved ? 'improved' : score.total < bestScore.total ? 'degraded' : 'no_change',
    }

    // Early stop if we found a high-quality extraction
    if (score.total >= 0.85) break
  }

  // Phase 3 (optional): LLM-refined strategies
  if (opts.useLLM && opts.credentials && opts.modelId) {
    const llmStrategies = await requestLLMStrategies(
      root,
      strategies,
      opts.credentials,
      opts.modelId,
    )

    for (let i = 0; i < llmStrategies.length; i++) {
      const strategy = llmStrategies[i]
      const result = executeStrategy(root, strategy)
      const score = evaluateQuality(result)

      const improved = isImprovement(score, bestScore)
      if (improved) {
        bestScore = score
      }

      yield {
        iteration: strategies.length + i,
        strategy,
        result,
        score,
        isBest: improved,
        status: improved ? 'improved' : 'degraded',
      }

      if (score.total >= 0.9) break
    }
  }
}

/**
 * Request LLM-refined extraction strategies from backend.
 */
async function requestLLMStrategies(
  root: Element,
  existingStrategies: ReadonlyArray<ExtractionStrategy>,
  credentials: { accessKeyId: string; secretAccessKey: string; region: string },
  modelId: string,
): Promise<ExtractionStrategy[]> {
  const apiBase = getConfig().apiBaseUrl

  // Build a compact DOM summary for the LLM
  const domSummary = buildDOMSummary(root)
  const existingSummary = existingStrategies
    .slice(0, 3)
    .map((s) => `- ${s.name}: container=${s.selectors.container}, item=${s.selectors.item}, fields=${s.selectors.fields.map((f) => f.name).join(',')}`)
    .join('\n')

  try {
    const response = await fetch(`${apiBase}/api/page-intelligence/suggest-strategy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        domSummary,
        existingStrategies: existingSummary,
        url: location?.href || '',
        credentials,
        modelId,
      }),
    })

    if (!response.ok) return []

    const data = await response.json()
    return (data.strategies || []).map((s: Record<string, unknown>, idx: number) => ({
      id: `llm-${idx}`,
      name: (s.name as string) || `LLM Strategy ${idx + 1}`,
      type: (s.type as string) || 'custom',
      selectors: {
        container: (s.container as string) || 'body',
        item: (s.item as string) || 'div',
        fields: ((s.fields as Array<Record<string, string>>) || []).map((f) => ({
          name: f.name || `field_${idx}`,
          selector: f.selector || ':scope',
          attribute: f.attribute,
          type: (f.type as 'text') || 'text',
        })),
      },
      confidence: 0.7,
      source: 'llm' as const,
    }))
  } catch {
    return []
  }
}

/**
 * Build a compact DOM summary for the LLM (keeps within context limits).
 */
function buildDOMSummary(root: Element): string {
  const parts: string[] = []
  const maxNodes = 50

  function walk(el: Element, depth: number, count: { n: number }) {
    if (count.n >= maxNodes || depth > 4) return

    const tag = el.tagName.toLowerCase()
    const skip = new Set(['script', 'style', 'noscript', 'svg', 'path'])
    if (skip.has(tag)) return

    count.n++
    const indent = '  '.repeat(depth)
    const id = el.id ? `#${el.id}` : ''
    const cls = Array.from(el.classList).slice(0, 3).join('.')
    const clsStr = cls ? `.${cls}` : ''
    const text = (el.textContent || '').trim().slice(0, 50)
    const textPreview = text ? ` "${text}"` : ''
    const childCount = el.children.length

    parts.push(`${indent}<${tag}${id}${clsStr}> [${childCount} children]${textPreview}`)

    for (const child of Array.from(el.children).slice(0, 10)) {
      walk(child, depth + 1, count)
    }
  }

  walk(root, 0, { n: 0 })
  return parts.join('\n')
}
