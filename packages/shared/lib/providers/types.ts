import type { AwsCredentials } from '../../types'

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
