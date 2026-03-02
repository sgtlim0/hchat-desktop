import type { ChatStreamEvent } from '../../types'

/**
 * Parse SSE events from a backend proxy endpoint.
 * The proxy uses our standard format: {"type": "text|usage|done|error", ...}
 */
export async function* parseProxySSE(
  url: string,
  init: RequestInit
): AsyncGenerator<ChatStreamEvent> {
  try {
    const response = await fetch(url, init)

    if (!response.ok) {
      yield { type: 'error', error: `HTTP ${response.status}: ${response.statusText}` }
      return
    }

    const reader = response.body?.getReader()
    if (!reader) {
      yield { type: 'error', error: 'No response body' }
      return
    }

    const decoder = new TextDecoder()
    let buffer = ''

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed.startsWith('data: ')) continue

          const jsonStr = trimmed.slice(6)
          try {
            const event = JSON.parse(jsonStr) as ChatStreamEvent
            yield event
            if (event.type === 'done' || event.type === 'error') return
          } catch {
            // Skip malformed JSON lines
          }
        }
      }
    } finally {
      reader.releaseLock()
    }
  } catch (error) {
    if (error instanceof Error) {
      yield { type: 'error', error: error.message }
    } else {
      yield { type: 'error', error: 'Unknown error occurred' }
    }
  }
}
