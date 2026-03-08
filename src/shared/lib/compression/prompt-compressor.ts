/**
 * Phase 37: 3-stage prompt compression pipeline.
 * Stage 1: Stopword removal (~25% reduction)
 * Stage 2: Entropy filtering (~50% reduction)
 * Stage 3: Sentence ranking (~65% reduction)
 */

import { removeStopwords, getStopwordRatio } from './stopwords'
import { EntropyEncoder } from './entropy-encoder'

export interface CompressedPrompt {
  original: string
  compressed: string
  ratio: number
  savedTokens: number
  stages: StageResult[]
}

interface StageResult {
  name: string
  inputTokens: number
  outputTokens: number
  reduction: number
}

export interface CompressorOptions {
  entropyThreshold?: number
  maxSentences?: number
  minTokensToCompress?: number
}

const DEFAULT_OPTIONS: Required<CompressorOptions> = {
  entropyThreshold: 0.3,
  maxSentences: 0,
  minTokensToCompress: 20,
}

export class PromptCompressor {
  private encoder: EntropyEncoder
  private options: Required<CompressorOptions>

  constructor(options?: CompressorOptions) {
    this.options = { ...DEFAULT_OPTIONS, ...options }
    this.encoder = new EntropyEncoder(this.options.entropyThreshold)
  }

  setEntropyThreshold(threshold: number): void {
    this.options.entropyThreshold = threshold
    this.encoder.setThreshold(threshold)
  }

  compress(prompt: string): CompressedPrompt {
    const originalTokens = this.countTokens(prompt)
    const stages: StageResult[] = []

    if (originalTokens < this.options.minTokensToCompress) {
      return {
        original: prompt,
        compressed: prompt,
        ratio: 0,
        savedTokens: 0,
        stages: [],
      }
    }

    // Stage 1: Stopword removal
    const stage1 = removeStopwords(prompt)
    const stage1Tokens = this.countTokens(stage1)
    stages.push({
      name: 'stopword-removal',
      inputTokens: originalTokens,
      outputTokens: stage1Tokens,
      reduction: originalTokens > 0 ? 1 - stage1Tokens / originalTokens : 0,
    })

    // Stage 2: Entropy filtering
    const entropyResult = this.encoder.encode(stage1)
    const stage2 = entropyResult.compressed
    const stage2Tokens = this.countTokens(stage2)
    stages.push({
      name: 'entropy-filter',
      inputTokens: stage1Tokens,
      outputTokens: stage2Tokens,
      reduction: stage1Tokens > 0 ? 1 - stage2Tokens / stage1Tokens : 0,
    })

    // Stage 3: Sentence ranking (optional, for long texts)
    let final = stage2
    if (this.options.maxSentences > 0) {
      final = this.rankSentences(stage2, this.options.maxSentences)
      const stage3Tokens = this.countTokens(final)
      stages.push({
        name: 'sentence-ranking',
        inputTokens: stage2Tokens,
        outputTokens: stage3Tokens,
        reduction: stage2Tokens > 0 ? 1 - stage3Tokens / stage2Tokens : 0,
      })
    }

    const compressedTokens = this.countTokens(final)
    return {
      original: prompt,
      compressed: final,
      ratio: originalTokens > 0 ? 1 - compressedTokens / originalTokens : 0,
      savedTokens: originalTokens - compressedTokens,
      stages,
    }
  }

  compressMessages(
    messages: Array<{ role: string; content: string }>,
  ): Array<{ role: string; content: string }> {
    return messages.map((msg) => {
      if (msg.content.length === 0) return msg
      const { compressed } = this.compress(msg.content)
      return { ...msg, content: compressed }
    })
  }

  getStopwordRatio(text: string): number {
    return getStopwordRatio(text)
  }

  private rankSentences(text: string, maxSentences: number): string {
    const sentences = text.match(/[^.!?。]+[.!?。]?/g) ?? [text]
    if (sentences.length <= maxSentences) return text

    const scored = sentences.map((s, i) => ({
      text: s.trim(),
      score: this.scoreSentence(s, i, sentences.length),
      index: i,
    }))

    scored.sort((a, b) => b.score - a.score)
    const top = scored.slice(0, maxSentences)
    top.sort((a, b) => a.index - b.index)

    return top.map((s) => s.text).join(' ')
  }

  private scoreSentence(
    sentence: string,
    position: number,
    total: number,
  ): number {
    const words = sentence.split(/\s+/)
    const lengthScore = Math.min(words.length / 15, 1)

    // First and last sentences get higher priority
    let positionScore = 0.5
    if (position === 0) positionScore = 1.0
    else if (position === total - 1) positionScore = 0.8
    else if (position < total * 0.3) positionScore = 0.7

    // Unique word ratio = vocabulary richness
    const unique = new Set(words.map((w) => w.toLowerCase()))
    const richnessScore = unique.size / Math.max(words.length, 1)

    return lengthScore * 0.3 + positionScore * 0.4 + richnessScore * 0.3
  }

  private countTokens(text: string): number {
    if (!text) return 0
    const koreanChars = (text.match(/[가-힣]/g) ?? []).length
    const otherChars = text.length - koreanChars
    return Math.max(1, Math.ceil(koreanChars / 2 + otherChars / 4))
  }
}
