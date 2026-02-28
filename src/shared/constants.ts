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
