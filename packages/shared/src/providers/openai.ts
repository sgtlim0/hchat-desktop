import type { ChatStreamEvent } from '../types'
import type { ProviderStreamParams } from './types'
import { parseProxySSE } from './proxy-sse'
import { getConfig } from '../config'

export async function* streamOpenAI(
  params: ProviderStreamParams
): AsyncGenerator<ChatStreamEvent> {
  const { apiBaseUrl } = getConfig()

  if (!apiBaseUrl) {
    yield {
      type: 'error',
      error: 'Backend proxy URL is not configured. Direct browser API calls are disabled for security. Please set the backend proxy URL.',
    }
    return
  }

  const { modelId, messages, system, signal } = params

  yield* parseProxySSE(`${apiBaseUrl}/api/openai/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ modelId, messages, system }),
    signal,
  })
}
