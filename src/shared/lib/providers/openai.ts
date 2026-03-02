import type { ChatStreamEvent } from '../../types'
import type { ProviderStreamParams } from './types'
import { parseProxySSE } from './proxy-sse'

const API_BASE = import.meta.env.VITE_API_BASE_URL || ''

export async function* streamOpenAI(
  params: ProviderStreamParams
): AsyncGenerator<ChatStreamEvent> {
  if (API_BASE) {
    yield* streamOpenAIViaProxy(params)
    return
  }
  yield* streamOpenAIDirect(params)
}

async function* streamOpenAIViaProxy(
  params: ProviderStreamParams
): AsyncGenerator<ChatStreamEvent> {
  const { modelId, messages, system, apiKey, signal } = params

  yield* parseProxySSE(`${API_BASE}/api/openai/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiKey, modelId, messages, system }),
    signal,
  })
}

async function* streamOpenAIDirect(
  params: ProviderStreamParams
): AsyncGenerator<ChatStreamEvent> {
  const { modelId, messages, system, apiKey, signal } = params

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelId,
        messages: system
          ? [{ role: 'system', content: system }, ...messages]
          : messages,
        stream: true,
      }),
      signal,
    })

    if (!response.ok) {
      const error = await response.text()
      yield {
        type: 'error',
        error: `OpenAI API error: ${response.status} ${error}`,
      }
      return
    }

    const reader = response.body?.getReader()
    if (!reader) {
      yield { type: 'error', error: 'No response body' }
      return
    }

    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || !trimmed.startsWith('data: ')) continue

        const data = trimmed.slice(6)
        if (data === '[DONE]') {
          yield { type: 'done' }
          return
        }

        try {
          const parsed = JSON.parse(data)
          const content = parsed.choices?.[0]?.delta?.content
          if (content) {
            yield { type: 'text', content }
          }
        } catch {
          // Skip malformed JSON lines
        }
      }
    }

    yield { type: 'done' }
  } catch (error) {
    if (error instanceof Error) {
      yield { type: 'error', error: error.message }
    } else {
      yield { type: 'error', error: 'Unknown error occurred' }
    }
  }
}
