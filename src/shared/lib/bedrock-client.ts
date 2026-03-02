import type { AwsCredentials, ChatStreamEvent } from '@/shared/types'
import { BEDROCK_MODEL_MAP } from '@/shared/constants'

interface StreamChatParams {
  credentials: AwsCredentials
  modelId: string
  messages: Array<{
    role: 'user' | 'assistant'
    content: string
  }>
  system?: string
  signal?: AbortSignal
}

export async function* streamChat(params: StreamChatParams): AsyncGenerator<ChatStreamEvent> {
  const bedrockModelId = BEDROCK_MODEL_MAP[params.modelId] ?? params.modelId

  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      credentials: params.credentials,
      modelId: bedrockModelId,
      messages: params.messages,
      system: params.system,
    }),
    signal: params.signal,
  })

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
}

export async function testConnection(credentials: AwsCredentials, modelId: string): Promise<{ success: boolean; error?: string }> {
  const bedrockModelId = BEDROCK_MODEL_MAP[modelId] ?? modelId

  try {
    const response = await fetch('/api/chat/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        credentials,
        modelId: bedrockModelId,
      }),
    })

    return await response.json()
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Connection failed'
    return { success: false, error: message }
  }
}
