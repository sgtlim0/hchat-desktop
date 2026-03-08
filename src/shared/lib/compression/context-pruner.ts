/**
 * Phase 37: Context window management.
 * Prunes old messages to fit within token budget while preserving critical context.
 */

export interface PruneOptions {
  maxTokens: number
  minMessagesToKeep?: number
  preserveSystemPrompt?: boolean
}

export interface PruneResult {
  messages: Array<{ role: string; content: string }>
  prunedCount: number
  totalTokens: number
  originalTokens: number
}

export function pruneContext(
  messages: Array<{ role: string; content: string }>,
  options: PruneOptions,
): PruneResult {
  const { maxTokens, minMessagesToKeep = 4, preserveSystemPrompt = true } = options

  const originalTokens = messages.reduce((sum, m) => sum + estimateTokens(m.content), 0)

  if (originalTokens <= maxTokens) {
    return {
      messages,
      prunedCount: 0,
      totalTokens: originalTokens,
      originalTokens,
    }
  }

  // Always keep the latest N messages
  const keep = Math.max(minMessagesToKeep, 2)
  const tail = messages.slice(-keep)
  const tailTokens = tail.reduce((sum, m) => sum + estimateTokens(m.content), 0)

  if (tailTokens >= maxTokens) {
    // Even recent messages exceed budget — truncate content of oldest kept messages
    return {
      messages: tail,
      prunedCount: messages.length - keep,
      totalTokens: tailTokens,
      originalTokens,
    }
  }

  // Fill remaining budget from older messages (newest first)
  const remaining = maxTokens - tailTokens
  const head = messages.slice(0, -keep)
  const selected: Array<{ role: string; content: string }> = []
  let usedTokens = 0

  // Add from most recent to oldest
  for (let i = head.length - 1; i >= 0; i--) {
    const msg = head[i]
    const tokens = estimateTokens(msg.content)

    // Always include system-like messages if preserving
    if (preserveSystemPrompt && i === 0 && msg.role === 'user') {
      if (usedTokens + tokens <= remaining) {
        selected.unshift(msg)
        usedTokens += tokens
      }
      continue
    }

    if (usedTokens + tokens <= remaining) {
      selected.unshift(msg)
      usedTokens += tokens
    }
  }

  const result = [...selected, ...tail]
  const totalTokens = result.reduce((sum, m) => sum + estimateTokens(m.content), 0)

  return {
    messages: result,
    prunedCount: messages.length - result.length,
    totalTokens,
    originalTokens,
  }
}

export function summarizeOldMessages(
  messages: Array<{ role: string; content: string }>,
  keepRecent: number,
): { summary: string; kept: Array<{ role: string; content: string }> } {
  if (messages.length <= keepRecent) {
    return { summary: '', kept: messages }
  }

  const old = messages.slice(0, -keepRecent)
  const kept = messages.slice(-keepRecent)

  const summaryParts = old.map((m) => {
    const preview = m.content.slice(0, 100)
    return `[${m.role}]: ${preview}${m.content.length > 100 ? '...' : ''}`
  })

  return {
    summary: `[Previous context summary (${old.length} messages)]\n${summaryParts.join('\n')}`,
    kept,
  }
}

function estimateTokens(text: string): number {
  if (!text) return 0
  const koreanChars = (text.match(/[가-힣]/g) ?? []).length
  const otherChars = text.length - koreanChars
  return Math.max(1, Math.ceil(koreanChars / 2 + otherChars / 4))
}
