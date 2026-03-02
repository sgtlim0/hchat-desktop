import type { ProviderType, AwsCredentials } from '../../types'

export interface StreamParams {
  modelId: string
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
  system?: string
  signal?: AbortSignal
}

export interface ProviderStreamParams extends StreamParams {
  apiKey: string
}

export interface BedrockStreamParams extends StreamParams {
  credentials: AwsCredentials
}

export interface ProviderConfig {
  provider: ProviderType
  apiKey?: string
  credentials?: AwsCredentials
}
