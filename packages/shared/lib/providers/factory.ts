import type { ChatStreamEvent, AwsCredentials } from '../../types'
import { streamChat } from '../bedrock-client'
import { getRateLimiter } from '../rate-limiter'

export interface StreamParams {
  modelId: string
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
  system?: string
  signal?: AbortSignal
}

export interface ProviderConfig {
  credentials: AwsCredentials
  region?: string
}

export async function* createStream(
  config: ProviderConfig,
  params: StreamParams
): AsyncGenerator<ChatStreamEvent> {
  try {
    const rateLimiter = getRateLimiter('bedrock')
    const canProceed = await rateLimiter.acquire()

    if (!canProceed) {
      const waitTime = rateLimiter.getWaitTime()
      yield {
        type: 'error',
        error: `Rate limit exceeded. Please wait ${Math.ceil(waitTime / 1000)} seconds.`,
      }
      return
    }

    if (!config.credentials.accessKeyId || !config.credentials.secretAccessKey) {
      yield { type: 'error', error: 'AWS credentials not configured' }
      return
    }

    yield* streamChat({
      ...params,
      credentials: config.credentials,
      region: config.region,
    })
  } catch (error) {
    yield {
      type: 'error',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}
