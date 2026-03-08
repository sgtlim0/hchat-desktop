import type { ChatStreamEvent } from '../../types'
import type { ProviderStreamParams } from './types'
import { parseProxySSE } from './proxy-sse'

const API_BASE = import.meta.env.VITE_API_BASE_URL || ''

export async function* streamGemini(
  params: ProviderStreamParams
): AsyncGenerator<ChatStreamEvent> {
  if (!API_BASE) {
    yield {
      type: 'error',
      error: 'Backend proxy URL (VITE_API_BASE_URL) is not configured. Direct browser API calls are disabled for security. Please set the backend proxy URL in environment variables.',
    }
    return
  }

  const { modelId, messages, system, signal } = params

  yield* parseProxySSE(`${API_BASE}/api/gemini/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ modelId, messages, system }),
    signal,
  })
}
