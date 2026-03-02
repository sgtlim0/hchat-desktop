import type { ChatStreamEvent, AwsCredentials } from '../../types'
import type { ProviderConfig, StreamParams } from './types'
import { MODELS } from '../../constants'
import { streamChat } from '../bedrock-client'
import { streamOpenAI } from './openai'
import { streamGemini } from './gemini'

export async function* createStream(
  config: ProviderConfig,
  params: StreamParams
): AsyncGenerator<ChatStreamEvent> {
  try {
    switch (config.provider) {
      case 'bedrock': {
        if (!config.credentials) {
          yield {
            type: 'error',
            error: 'AWS credentials not configured',
          }
          return
        }
        yield* streamChat({
          ...params,
          credentials: config.credentials,
        })
        break
      }

      case 'openai': {
        if (!config.apiKey) {
          yield {
            type: 'error',
            error: 'OpenAI API key not configured',
          }
          return
        }
        yield* streamOpenAI({
          ...params,
          apiKey: config.apiKey,
        })
        break
      }

      case 'gemini': {
        if (!config.apiKey) {
          yield {
            type: 'error',
            error: 'Gemini API key not configured',
          }
          return
        }
        yield* streamGemini({
          ...params,
          apiKey: config.apiKey,
        })
        break
      }

      default:
        yield {
          type: 'error',
          error: `Unknown provider: ${config.provider}`,
        }
    }
  } catch (error) {
    if (error instanceof Error) {
      yield { type: 'error', error: error.message }
    } else {
      yield { type: 'error', error: 'Unknown error occurred' }
    }
  }
}

export function getProviderConfig(
  modelId: string,
  settings: {
    credentials?: AwsCredentials | null
    openaiApiKey?: string | null
    geminiApiKey?: string | null
  }
): ProviderConfig {
  const model = MODELS.find((m) => m.id === modelId)
  const provider = model?.provider ?? 'bedrock'

  switch (provider) {
    case 'openai':
      return {
        provider: 'openai',
        apiKey: settings.openaiApiKey ?? undefined,
      }
    case 'gemini':
      return {
        provider: 'gemini',
        apiKey: settings.geminiApiKey ?? undefined,
      }
    case 'bedrock':
    default:
      return {
        provider: 'bedrock',
        credentials: settings.credentials ?? undefined,
      }
  }
}
