import type { Persona, ProviderModelDef } from '../types'

export const MODELS: ProviderModelDef[] = [
  {
    id: 'claude-opus-4.6',
    label: 'Claude Opus 4.6',
    shortLabel: 'Opus 4.6',
    cost: { input: 15, output: 75 },
  },
  {
    id: 'claude-sonnet-4.6',
    label: 'Claude Sonnet 4.6',
    shortLabel: 'Sonnet 4.6',
    cost: { input: 3, output: 15 },
  },
  {
    id: 'claude-haiku-4.5',
    label: 'Claude Haiku 4.5',
    shortLabel: 'Haiku 4.5',
    cost: { input: 0.8, output: 4 },
  },
]

export const DEFAULT_MODEL_ID = 'claude-sonnet-4.6'

export const QUICK_ACTIONS = [
  { id: 'write', icon: 'pencil', labelKey: 'quickAction.write' },
  { id: 'summarize', icon: 'file-text', labelKey: 'quickAction.summarize' },
  { id: 'translate', icon: 'languages', labelKey: 'quickAction.translate' },
  { id: 'brainstorm', icon: 'lightbulb', labelKey: 'quickAction.brainstorm' },
  { id: 'review', icon: 'search-code', labelKey: 'quickAction.review' },
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

const now = new Date().toISOString()

export const DEFAULT_PERSONAS: Persona[] = [
  {
    id: 'persona-general',
    name: 'General Assistant',
    description: 'A helpful, balanced AI assistant',
    systemPrompt: 'You are a helpful AI assistant. Be concise, accurate, and friendly.',
    icon: 'bot',
    isDefault: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'persona-developer',
    name: 'Senior Developer',
    description: 'Expert software engineer',
    systemPrompt: 'You are a senior software engineer. Provide clean, efficient code with best practices. Explain technical concepts clearly. Always consider edge cases and error handling.',
    icon: 'code',
    isDefault: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'persona-writer',
    name: 'Creative Writer',
    description: 'Professional content writer',
    systemPrompt: 'You are a professional writer. Craft clear, engaging, and well-structured content. Adapt tone and style to the context.',
    icon: 'pencil',
    isDefault: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'persona-analyst',
    name: 'Data Analyst',
    description: 'Analytical problem solver',
    systemPrompt: 'You are a data analyst. Break down complex problems, provide data-driven insights, and present findings in clear, structured formats.',
    icon: 'bar-chart',
    isDefault: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'persona-translator',
    name: 'Translator',
    description: 'Multilingual translation expert',
    systemPrompt: 'You are a professional translator. Provide accurate, natural-sounding translations that preserve meaning, tone, and cultural nuances.',
    icon: 'languages',
    isDefault: true,
    createdAt: now,
    updatedAt: now,
  },
]
