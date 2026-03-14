/**
 * Rough token estimation: ~4 characters per token.
 * This is a simple heuristic, not a precise tokenizer.
 */
export function estimateTokens(text: string): number {
  if (!text) return 0
  return Math.max(1, Math.ceil(text.length / 4))
}
