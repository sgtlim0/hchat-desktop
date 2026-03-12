import { BedrockRuntimeClient, InvokeModelWithResponseStreamCommand } from '@aws-sdk/client-bedrock-runtime'
import type { AwsCredentials, ChatStreamEvent } from '../types'
import { BEDROCK_MODEL_MAP } from '../constants'

interface StreamChatParams {
  credentials: AwsCredentials
  region?: string
  modelId: string
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
  system?: string
  signal?: AbortSignal
}

export async function* streamChat(params: StreamChatParams): AsyncGenerator<ChatStreamEvent> {
  const client = new BedrockRuntimeClient({
    region: params.region || 'us-east-1',
    credentials: {
      accessKeyId: params.credentials.accessKeyId,
      secretAccessKey: params.credentials.secretAccessKey,
    },
  })

  const bedrockModelId = BEDROCK_MODEL_MAP[params.modelId] ?? params.modelId

  const command = new InvokeModelWithResponseStreamCommand({
    modelId: bedrockModelId,
    contentType: 'application/json',
    body: JSON.stringify({
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: 4096,
      system: params.system,
      messages: params.messages,
    }),
  })

  try {
    const response = await client.send(command, {
      abortSignal: params.signal,
    })

    let inputTokens = 0
    let outputTokens = 0

    if (response.body) {
      for await (const event of response.body) {
        if (event.chunk?.bytes) {
          const text = new TextDecoder().decode(event.chunk.bytes)
          const data = JSON.parse(text)

          if (data.type === 'content_block_delta' && data.delta?.text) {
            yield { type: 'text', content: data.delta.text }
          } else if (data.type === 'message_delta' && data.usage) {
            outputTokens = data.usage.output_tokens || 0
          } else if (data.type === 'message_start' && data.message?.usage) {
            inputTokens = data.message.usage.input_tokens || 0
          } else if (data.type === 'message_stop') {
            if (inputTokens || outputTokens) {
              yield { type: 'usage', usage: { inputTokens, outputTokens } }
            }
            yield { type: 'done' }
            return
          }
        }
      }
    }

    yield { type: 'done' }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Bedrock API call failed'
    yield { type: 'error', error: message }
  }
}

export async function testConnection(
  credentials: AwsCredentials,
  region?: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const client = new BedrockRuntimeClient({
      region: region || 'us-east-1',
      credentials: {
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey,
      },
    })

    const command = new InvokeModelWithResponseStreamCommand({
      modelId: 'us.anthropic.claude-haiku-4-5-20251001-v1:0',
      contentType: 'application/json',
      body: JSON.stringify({
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Hi' }],
      }),
    })

    await client.send(command)
    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Connection failed'
    return { success: false, error: message }
  }
}
