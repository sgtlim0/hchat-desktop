import { AwsClient } from 'aws4fetch'
import type { Credentials } from '@/shared/types'

const MODEL_MAP: Record<string, string> = {
  'sonnet-4': 'us.anthropic.claude-sonnet-4-20250514',
  'haiku-4.5': 'us.anthropic.claude-haiku-4-5-20251001',
  'sonnet-3.5': 'us.anthropic.claude-3-5-sonnet-20241022-v2:0',
  'haiku-3.5': 'us.anthropic.claude-3-5-haiku-20241022-v1:0',
} as const

const ANTHROPIC_VERSION = '2023-06-01'
const DEFAULT_MAX_TOKENS = 4096
const DEFAULT_TEMPERATURE = 0.3

interface BedrockMessage {
  readonly role: 'user' | 'assistant'
  readonly content: string
}

interface BedrockResponse {
  readonly content: ReadonlyArray<{ readonly type: string; readonly text: string }>
  readonly usage?: { readonly input_tokens: number; readonly output_tokens: number }
}

interface StreamDelta {
  readonly type: string
  readonly text?: string
}

interface StreamEvent {
  readonly type: string
  readonly delta?: StreamDelta
  readonly message?: BedrockResponse
  readonly 'amazon-bedrock-invocationMetrics'?: {
    readonly inputTokenCount: number
    readonly outputTokenCount: number
  }
}

function resolveModelId(model: string): string {
  return MODEL_MAP[model] ?? model
}

function buildEndpoint(region: string, modelId: string, stream: boolean): string {
  const action = stream ? 'invoke-with-response-stream' : 'invoke'
  return `https://bedrock-runtime.${region}.amazonaws.com/model/${modelId}/${action}`
}

function buildBody(
  messages: readonly BedrockMessage[],
  system?: string,
): string {
  const body: Record<string, unknown> = {
    anthropic_version: ANTHROPIC_VERSION,
    max_tokens: DEFAULT_MAX_TOKENS,
    temperature: DEFAULT_TEMPERATURE,
    messages,
  }
  if (system) {
    body.system = system
  }
  return JSON.stringify(body)
}

export function createBedrockClient(credentials: Credentials) {
  const aws = new AwsClient({
    accessKeyId: credentials.accessKeyId,
    secretAccessKey: credentials.secretAccessKey,
    region: credentials.region,
    service: 'bedrock',
  })

  async function invoke(
    model: string,
    messages: readonly BedrockMessage[],
    system?: string,
  ): Promise<BedrockResponse> {
    const modelId = resolveModelId(model)
    const url = buildEndpoint(credentials.region, modelId, false)
    const body = buildBody(messages, system)

    const response = await aws.fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Bedrock API error (${response.status}): ${errorText}`)
    }

    return response.json()
  }

  async function invokeStream(
    model: string,
    messages: readonly BedrockMessage[],
    system: string | undefined,
    onChunk: (text: string) => void,
    onDone: (usage?: { input: number; output: number }) => void,
  ): Promise<void> {
    const modelId = resolveModelId(model)
    const url = buildEndpoint(credentials.region, modelId, true)
    const body = buildBody(messages, system)

    const response = await aws.fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Bedrock API error (${response.status}): ${errorText}`)
    }

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('No response body')
    }

    const decoder = new TextDecoder()
    let buffer = ''
    let usage: { input: number; output: number } | undefined

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed || !trimmed.startsWith('{')) continue

          try {
            const event: StreamEvent = JSON.parse(trimmed)

            if (event.type === 'content_block_delta' && event.delta?.text) {
              onChunk(event.delta.text)
            }

            if (event['amazon-bedrock-invocationMetrics']) {
              const metrics = event['amazon-bedrock-invocationMetrics']
              usage = {
                input: metrics.inputTokenCount,
                output: metrics.outputTokenCount,
              }
            }
          } catch {
            // skip non-JSON lines
          }
        }
      }
    } finally {
      reader.releaseLock()
    }

    onDone(usage)
  }

  async function testConnection(): Promise<boolean> {
    try {
      await invoke('haiku-4.5', [{ role: 'user', content: 'Hi' }])
      return true
    } catch {
      return false
    }
  }

  return { invoke, invokeStream, testConnection }
}
