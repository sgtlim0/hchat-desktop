import type { AtlassianCreds, BedrockCreds } from '@/shared/types/atlassian'

interface AtlassianConfig {
  baseUrl: string
  email: string
  apiToken: string
}

export function mapToAtlassianCreds(config: AtlassianConfig): AtlassianCreds {
  return {
    domain: config.baseUrl.replace(/\/+$/, ''),
    email: config.email,
    api_token: config.apiToken,
  }
}

export function createDefaultBedrockCreds(): BedrockCreds {
  return {
    aws_access_key_id: '',
    aws_secret_access_key: '',
    aws_region: 'us-east-1',
    model_id: 'us.anthropic.claude-haiku-4-5-20251001-v1:0',
  }
}
