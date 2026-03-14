import type { Persona } from '../types'

export const QUICK_ACTIONS = [
  { id: 'write', icon: 'pencil', labelKey: 'quickAction.write' },
  { id: 'summarize', icon: 'file-text', labelKey: 'quickAction.summarize' },
  { id: 'translate', icon: 'languages', labelKey: 'quickAction.translate' },
  { id: 'brainstorm', icon: 'lightbulb', labelKey: 'quickAction.brainstorm' },
  { id: 'review', icon: 'search-code', labelKey: 'quickAction.review' },
] as const

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
