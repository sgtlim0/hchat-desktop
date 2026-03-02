import type { ModelInfo } from './types'

export const MODELS: ModelInfo[] = [
  {
    id: 'claude-opus-4.6',
    name: 'Claude Opus 4.6',
    provider: 'anthropic',
    description: '최고 성능 모델',
    maxTokens: 200000,
  },
  {
    id: 'claude-sonnet-4.6',
    name: 'Claude Sonnet 4.6',
    provider: 'anthropic',
    description: '기본 권장 모델',
    maxTokens: 200000,
  },
  {
    id: 'claude-haiku-4.5',
    name: 'Claude Haiku 4.5',
    provider: 'anthropic',
    description: '빠른 응답 경량 모델',
    maxTokens: 200000,
  },
]

export const DEFAULT_MODEL_ID = 'claude-sonnet-4.6'

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

// Bedrock model ID mapping (cross-region inference profile)
export const BEDROCK_MODEL_MAP: Record<string, string> = {
  'claude-opus-4.6': 'us.anthropic.claude-opus-4-6-v1',
  'claude-sonnet-4.6': 'us.anthropic.claude-sonnet-4-6',
  'claude-haiku-4.5': 'us.anthropic.claude-haiku-4-5-20251001-v1:0',
}

export const AWS_REGIONS = [
  { id: 'us-east-1', name: 'US East (N. Virginia)' },
  { id: 'us-west-2', name: 'US West (Oregon)' },
  { id: 'eu-west-1', name: 'EU (Ireland)' },
  { id: 'ap-northeast-1', name: 'Asia Pacific (Tokyo)' },
  { id: 'ap-southeast-1', name: 'Asia Pacific (Singapore)' },
] as const

export const DEFAULT_AWS_REGION = 'us-east-1'
