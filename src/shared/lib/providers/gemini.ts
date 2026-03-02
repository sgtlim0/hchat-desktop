import type { ChatStreamEvent } from '../../types'
import type { ProviderStreamParams } from './types'

export async function* streamGemini(
  params: ProviderStreamParams
): AsyncGenerator<ChatStreamEvent> {
  const { modelId, messages, system, apiKey, signal } = params

  try {
    const contents = messages.map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }))

    const body: Record<string, unknown> = { contents }
    if (system) {
      body.systemInstruction = { parts: [{ text: system }] }
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:streamGenerateContent?alt=sse&key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal,
      }
    )

    if (!response.ok) {
      const error = await response.text()
      yield {
        type: 'error',
        error: `Gemini API error: ${response.status} ${error}`,
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

        try {
          const parsed = JSON.parse(data)
          const content = parsed.candidates?.[0]?.content?.parts?.[0]?.text
          if (content) {
            yield { type: 'text', content }
          }
        } catch (e) {
          console.error('Failed to parse SSE data:', e)
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
