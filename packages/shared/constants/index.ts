import type { Persona, ProviderModelDef, ProviderType } from '../types'

export const MODELS: ProviderModelDef[] = [
  // Bedrock (Claude)
  {
    id: 'claude-opus-4.6',
    provider: 'bedrock',
    label: 'Claude Opus 4.6',
    shortLabel: 'Opus 4.6',
    capabilities: ['chat', 'code', 'vision', 'reasoning'],
    cost: { input: 15, output: 75 },
  },
  {
    id: 'claude-sonnet-4.6',
    provider: 'bedrock',
    label: 'Claude Sonnet 4.6',
    shortLabel: 'Sonnet 4.6',
    capabilities: ['chat', 'code', 'vision', 'reasoning'],
    cost: { input: 3, output: 15 },
  },
  {
    id: 'claude-haiku-4.5',
    provider: 'bedrock',
    label: 'Claude Haiku 4.5',
    shortLabel: 'Haiku 4.5',
    capabilities: ['chat', 'code', 'fast'],
    cost: { input: 0.8, output: 4 },
  },
  // OpenAI
  {
    id: 'gpt-4o',
    provider: 'openai',
    label: 'GPT-4o',
    shortLabel: 'GPT-4o',
    capabilities: ['chat', 'code', 'vision', 'reasoning'],
    cost: { input: 2.5, output: 10 },
  },
  {
    id: 'gpt-4o-mini',
    provider: 'openai',
    label: 'GPT-4o mini',
    shortLabel: '4o mini',
    capabilities: ['chat', 'code', 'fast'],
    cost: { input: 0.15, output: 0.6 },
  },
  // Gemini
  {
    id: 'gemini-2.0-flash',
    provider: 'gemini',
    label: 'Gemini 2.0 Flash',
    shortLabel: 'Gemini Flash',
    capabilities: ['chat', 'code', 'vision', 'fast'],
    cost: { input: 0.1, output: 0.4 },
  },
  {
    id: 'gemini-1.5-pro',
    provider: 'gemini',
    label: 'Gemini 1.5 Pro',
    shortLabel: 'Gemini Pro',
    capabilities: ['chat', 'code', 'vision', 'reasoning'],
    cost: { input: 1.25, output: 5 },
  },
]

export const DEFAULT_MODEL_ID = 'claude-sonnet-4.6'

export const PROVIDER_COLORS: Record<ProviderType, string> = {
  bedrock: '#ff9900',
  openai: '#10a37f',
  gemini: '#4285f4',
}

export const PROVIDER_LABELS: Record<ProviderType, string> = {
  bedrock: 'AWS Bedrock',
  openai: 'OpenAI',
  gemini: 'Google Gemini',
}

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
