import type { ModelInfo } from './types'

export const MODELS: ModelInfo[] = [
  {
    id: 'claude-opus-4',
    name: 'Claude 4 Opus',
    provider: 'anthropic',
    description: '가장 강력한 추론 모델',
    maxTokens: 200000,
  },
  {
    id: 'claude-sonnet-4',
    name: 'Claude 4 Sonnet',
    provider: 'anthropic',
    description: '빠르고 균형 잡힌 모델',
    maxTokens: 200000,
  },
  {
    id: 'claude-haiku-3.5',
    name: 'Claude 3.5 Haiku',
    provider: 'anthropic',
    description: '가장 빠른 경량 모델',
    maxTokens: 200000,
  },
]

export const DEFAULT_MODEL_ID = 'claude-sonnet-4'

export const SIDEBAR_WIDTH = 264
export const MAX_RECENT_SESSIONS = 30
export const MESSAGE_MAX_WIDTH = 768

export const QUICK_ACTIONS = [
  { id: 'write', icon: 'pencil', label: '코드 작성' },
  { id: 'summarize', icon: 'file-text', label: '문서 요약' },
  { id: 'translate', icon: 'languages', label: '번역하기' },
  { id: 'brainstorm', icon: 'lightbulb', label: '아이디어 브레인스토밍' },
  { id: 'review', icon: 'search-code', label: '코드 리뷰' },
] as const

// Bedrock model ID mapping (cross-region inference prefix)
export const BEDROCK_MODEL_MAP: Record<string, string> = {
  'claude-opus-4': 'us.anthropic.claude-opus-4-0-20250514',
  'claude-sonnet-4': 'us.anthropic.claude-sonnet-4-20250514',
  'claude-haiku-3.5': 'us.anthropic.claude-3-5-haiku-20241022',
}

export const AWS_REGIONS = [
  { id: 'us-east-1', name: 'US East (N. Virginia)' },
  { id: 'us-west-2', name: 'US West (Oregon)' },
  { id: 'eu-west-1', name: 'EU (Ireland)' },
  { id: 'ap-northeast-1', name: 'Asia Pacific (Tokyo)' },
  { id: 'ap-southeast-1', name: 'Asia Pacific (Singapore)' },
] as const

export const DEFAULT_AWS_REGION = 'us-east-1'
