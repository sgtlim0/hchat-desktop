// formatDuration is imported from number-format (consolidated utility)
import { formatDuration } from './number-format'

// Re-export for backward compatibility
export { formatDuration }

export interface SessionStats {
  messageCount: number
  userMessages: number
  assistantMessages: number
  totalTokensEstimate: number
  avgMessageLength: number
  longestMessage: number
  durationMs: number
  toolCallCount: number
}

interface MessageLike {
  role: 'user' | 'assistant'
  segments: Array<{ type: string; content?: string; toolCalls?: unknown[] }>
  createdAt?: string
}

export function calculateSessionStats(messages: MessageLike[]): SessionStats {
  if (messages.length === 0) {
    return {
      messageCount: 0, userMessages: 0, assistantMessages: 0,
      totalTokensEstimate: 0, avgMessageLength: 0, longestMessage: 0,
      durationMs: 0, toolCallCount: 0,
    }
  }

  let userMessages = 0
  let assistantMessages = 0
  let totalChars = 0
  let longestMessage = 0
  let toolCallCount = 0

  for (const msg of messages) {
    if (msg.role === 'user') userMessages++
    else assistantMessages++

    let msgLength = 0
    for (const seg of msg.segments) {
      if (seg.type === 'text' && seg.content) {
        msgLength += seg.content.length
      }
      if (seg.type === 'tool' && seg.toolCalls) {
        toolCallCount += seg.toolCalls.length
      }
    }
    totalChars += msgLength
    longestMessage = Math.max(longestMessage, msgLength)
  }

  const firstTime = messages[0]?.createdAt ? new Date(messages[0].createdAt).getTime() : 0
  const lastTime = messages[messages.length - 1]?.createdAt
    ? new Date(messages[messages.length - 1].createdAt!).getTime() : 0

  return {
    messageCount: messages.length,
    userMessages,
    assistantMessages,
    totalTokensEstimate: Math.ceil(totalChars / 4),
    avgMessageLength: messages.length > 0 ? Math.round(totalChars / messages.length) : 0,
    longestMessage,
    durationMs: lastTime > firstTime ? lastTime - firstTime : 0,
    toolCallCount,
  }
}

