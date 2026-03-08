/**
 * Phase 37: Shannon Entropy-based token compression.
 * Pure TypeScript — no numpy dependency.
 */

export interface EntropyResult {
  compressed: string
  original: string
  ratio: number
  savedTokens: number
  originalTokens: number
  compressedTokens: number
  entropyScore: number
}

export interface TokenEntropy {
  token: string
  frequency: number
  probability: number
  entropy: number
}

export class EntropyEncoder {
  private threshold: number

  constructor(threshold = 0.3) {
    this.threshold = threshold
  }

  setThreshold(threshold: number): void {
    this.threshold = Math.max(0.1, Math.min(0.9, threshold))
  }

  getThreshold(): number {
    return this.threshold
  }

  encode(text: string): EntropyResult {
    const words = this.tokenize(text)

    if (words.length < 5) {
      return this.buildResult(text, text, words.length, words.length, 0)
    }

    const info = this.computeSelfInformation(words)
    const filtered = words.filter((w) => {
      const i = info.get(w.toLowerCase()) ?? Infinity
      return i >= this.threshold
    })

    // If we'd lose more than 60%, return original to preserve meaning
    if (filtered.length < words.length * 0.4) {
      const entropies = this.computeEntropy(words)
      return this.buildResult(text, text, words.length, words.length, this.averageEntropy(entropies))
    }

    const entropies = this.computeEntropy(words)
    const compressed = filtered.join(' ')
    return this.buildResult(
      text,
      compressed,
      words.length,
      filtered.length,
      this.averageEntropy(entropies),
    )
  }

  analyzeTokens(text: string): TokenEntropy[] {
    const words = this.tokenize(text)
    if (words.length === 0) return []

    const freq = new Map<string, number>()
    for (const w of words) {
      const key = w.toLowerCase()
      freq.set(key, (freq.get(key) ?? 0) + 1)
    }

    const total = words.length
    const result: TokenEntropy[] = []
    const seen = new Set<string>()

    for (const [token, count] of freq) {
      if (seen.has(token)) continue
      seen.add(token)
      const p = count / total
      const entropy = -p * Math.log2(p + 1e-10)
      result.push({ token, frequency: count, probability: p, entropy })
    }

    return result.sort((a, b) => b.entropy - a.entropy)
  }

  computeEntropy(words: string[]): Map<string, number> {
    const freq = new Map<string, number>()
    for (const w of words) {
      const key = w.toLowerCase()
      freq.set(key, (freq.get(key) ?? 0) + 1)
    }

    const total = words.length
    const result = new Map<string, number>()
    for (const [token, count] of freq) {
      const p = count / total
      result.set(token, -p * Math.log2(p + 1e-10))
    }
    return result
  }

  /**
   * Self-information: I(w) = -log2(p(w))
   * High value = rare/unique word (important to keep)
   * Low value = frequent word (safe to remove)
   */
  computeSelfInformation(words: string[]): Map<string, number> {
    const freq = new Map<string, number>()
    for (const w of words) {
      const key = w.toLowerCase()
      freq.set(key, (freq.get(key) ?? 0) + 1)
    }

    const total = words.length
    const result = new Map<string, number>()
    for (const [token, count] of freq) {
      const p = count / total
      result.set(token, -Math.log2(p + 1e-10))
    }
    return result
  }

  private tokenize(text: string): string[] {
    return text.split(/\s+/).filter((w) => w.length > 0)
  }

  private averageEntropy(entropies: Map<string, number>): number {
    if (entropies.size === 0) return 0
    let sum = 0
    for (const v of entropies.values()) sum += v
    return sum / entropies.size
  }

  private buildResult(
    original: string,
    compressed: string,
    origTokens: number,
    compTokens: number,
    entropyScore: number,
  ): EntropyResult {
    return {
      original,
      compressed,
      ratio: origTokens > 0 ? 1 - compTokens / origTokens : 0,
      savedTokens: origTokens - compTokens,
      originalTokens: origTokens,
      compressedTokens: compTokens,
      entropyScore,
    }
  }
}
