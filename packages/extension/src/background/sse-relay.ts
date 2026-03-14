import { getSettings } from '@ext/shared/storage'
import type { ExtStreamRequest } from '@ext/shared/types'

const API_BASE = 'https://sgtlim0--hchat-api-api.modal.run'

const abortControllers = new Map<string, AbortController>()

function resolveEndpoint(modelId: string): string {
  if (modelId.startsWith('gpt-')) return `${API_BASE}/api/openai/chat`
  if (modelId.startsWith('gemini-')) return `${API_BASE}/api/gemini/chat`
  return `${API_BASE}/api/chat`
}

function resolveProvider(modelId: string): 'bedrock' | 'openai' | 'gemini' {
  if (modelId.startsWith('gpt-')) return 'openai'
  if (modelId.startsWith('gemini-')) return 'gemini'
  return 'bedrock'
}

async function buildRequestBody(
  request: ExtStreamRequest,
  settings: Awaited<ReturnType<typeof getSettings>>,
): Promise<Record<string, unknown>> {
  const provider = resolveProvider(request.modelId)

  if (provider === 'openai') {
    return {
      model: request.modelId,
      messages: request.system
        ? [{ role: 'system' as const, content: request.system }, ...request.messages]
        : [...request.messages],
      stream: true,
      api_key: settings.openaiApiKey,
    }
  }

  if (provider === 'gemini') {
    return {
      model: request.modelId,
      messages: request.system
        ? [{ role: 'system' as const, content: request.system }, ...request.messages]
        : [...request.messages],
      stream: true,
      api_key: settings.geminiApiKey,
    }
  }

  return {
    model: request.modelId,
    messages: [...request.messages],
    system: request.system,
    stream: true,
    region: settings.awsRegion,
    access_key_id: settings.awsAccessKeyId,
    secret_access_key: settings.awsSecretAccessKey,
  }
}

async function handleStream(port: chrome.runtime.Port, request: ExtStreamRequest): Promise<void> {
  const settings = await getSettings()
  const endpoint = resolveEndpoint(request.modelId)
  const body = await buildRequestBody(request, settings)

  const controller = new AbortController()
  abortControllers.set(request.sessionId, controller)

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    })

    if (!response.ok) {
      const errorText = await response.text()
      port.postMessage({
        type: 'stream-error',
        error: `API error (${response.status}): ${errorText}`,
        sessionId: request.sessionId,
      })
      return
    }

    const reader = response.body?.getReader()
    if (!reader) {
      port.postMessage({
        type: 'stream-error',
        error: 'No response body',
        sessionId: request.sessionId,
      })
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

          const data = trimmed.slice(6)
          if (data === '[DONE]') continue

          try {
            const event = JSON.parse(data) as Record<string, unknown>

            if (event.type === 'text' && typeof event.text === 'string') {
              port.postMessage({
                type: 'stream-chunk',
                text: event.text,
                sessionId: request.sessionId,
              })
            }

            if (event.type === 'usage') {
              port.postMessage({
                type: 'stream-end',
                sessionId: request.sessionId,
                usage: {
                  inputTokens: event.input_tokens as number,
                  outputTokens: event.output_tokens as number,
                },
              })
            }

            if (event.type === 'done') {
              port.postMessage({
                type: 'stream-end',
                sessionId: request.sessionId,
              })
            }

            if (event.type === 'error') {
              port.postMessage({
                type: 'stream-error',
                error: (event.message as string) ?? 'Unknown error',
                sessionId: request.sessionId,
              })
            }
          } catch {
            // skip non-JSON SSE lines
          }
        }
      }
    } finally {
      reader.releaseLock()
    }
  } catch (err) {
    if ((err as Error).name !== 'AbortError') {
      port.postMessage({
        type: 'stream-error',
        error: (err as Error).message,
        sessionId: request.sessionId,
      })
    }
  } finally {
    abortControllers.delete(request.sessionId)
  }
}

export function setupSSERelay(): void {
  chrome.runtime.onConnect.addListener((port) => {
    if (port.name !== 'chat-stream') return

    port.onMessage.addListener((message: ExtStreamRequest) => {
      if (message.type === 'stream-start') {
        handleStream(port, message)
      }
    })

    port.onDisconnect.addListener(() => {
      for (const [sessionId, controller] of abortControllers) {
        controller.abort()
        abortControllers.delete(sessionId)
      }
    })
  })

  chrome.runtime.onMessage.addListener((message: { type: string; sessionId?: string }) => {
    if (message.type === 'ABORT_STREAM' && message.sessionId) {
      const controller = abortControllers.get(message.sessionId)
      if (controller) {
        controller.abort()
        abortControllers.delete(message.sessionId)
      }
    }
  })
}
