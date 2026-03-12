export type AssistantCategory =
  | 'all'
  | 'chat'
  | 'work'
  | 'translate'
  | 'analyze'
  | 'report'
  | 'image'
  | 'writing'

export interface AssistantPreset {
  id: string
  icon: string
  titleKey: string
  descKey: string
  category: AssistantCategory
  modelId: string
  systemPrompt: string
}

export const ASSISTANT_CATEGORIES: { id: AssistantCategory; labelKey: string }[] = [
  { id: 'all', labelKey: 'assistant.category.all' },
  { id: 'chat', labelKey: 'assistant.category.chat' },
  { id: 'work', labelKey: 'assistant.category.work' },
  { id: 'translate', labelKey: 'assistant.category.translate' },
  { id: 'analyze', labelKey: 'assistant.category.analyze' },
  { id: 'report', labelKey: 'assistant.category.report' },
  { id: 'image', labelKey: 'assistant.category.image' },
  { id: 'writing', labelKey: 'assistant.category.writing' },
]

export const ASSISTANT_PRESETS: AssistantPreset[] = [
  {
    id: 'analyst',
    icon: 'Search',
    titleKey: 'assistant.preset.analyst.title',
    descKey: 'assistant.preset.analyst.desc',
    category: 'analyze',
    modelId: 'claude-sonnet-4.6',
    systemPrompt:
      'You are a meticulous analyst. Break down complex topics systematically, verify facts through web search when needed, and provide well-structured, evidence-based answers.',
  },
  {
    id: 'quickChat',
    icon: 'Zap',
    titleKey: 'assistant.preset.quickChat.title',
    descKey: 'assistant.preset.quickChat.desc',
    category: 'chat',
    modelId: 'claude-haiku-4.5',
    systemPrompt:
      'You are a fast, friendly conversational assistant. Keep responses concise and natural. Prioritize speed and clarity.',
  },
  {
    id: 'docReview',
    icon: 'FileSearch',
    titleKey: 'assistant.preset.docReview.title',
    descKey: 'assistant.preset.docReview.desc',
    category: 'work',
    modelId: 'claude-sonnet-4.6',
    systemPrompt:
      'You are a document review specialist. Analyze documents for accuracy, consistency, structure, and clarity. Highlight issues and suggest improvements.',
  },
  {
    id: 'translator',
    icon: 'Languages',
    titleKey: 'assistant.preset.translator.title',
    descKey: 'assistant.preset.translator.desc',
    category: 'translate',
    modelId: 'claude-sonnet-4.6',
    systemPrompt:
      'You are a professional translator. Provide accurate, natural-sounding translations that preserve meaning, tone, and cultural nuances. Always ask for the target language if not specified.',
  },
  {
    id: 'reportWriter',
    icon: 'FileText',
    titleKey: 'assistant.preset.reportWriter.title',
    descKey: 'assistant.preset.reportWriter.desc',
    category: 'report',
    modelId: 'claude-sonnet-4.6',
    systemPrompt:
      'You are a professional report writer. Create well-structured, clear, and comprehensive reports. Use headings, bullet points, and data tables when appropriate.',
  },
  {
    id: 'codeReviewer',
    icon: 'Code',
    titleKey: 'assistant.preset.codeReviewer.title',
    descKey: 'assistant.preset.codeReviewer.desc',
    category: 'work',
    modelId: 'claude-sonnet-4.6',
    systemPrompt:
      'You are a senior code reviewer. Analyze code for bugs, performance issues, security vulnerabilities, and best practices. Provide actionable suggestions with code examples.',
  },
  {
    id: 'dataAnalyst',
    icon: 'BarChart3',
    titleKey: 'assistant.preset.dataAnalyst.title',
    descKey: 'assistant.preset.dataAnalyst.desc',
    category: 'analyze',
    modelId: 'claude-sonnet-4.6',
    systemPrompt:
      'You are a data analyst. Interpret datasets, identify trends and patterns, create visualizations suggestions, and provide data-driven insights in clear, structured formats.',
  },
  {
    id: 'emailWriter',
    icon: 'Mail',
    titleKey: 'assistant.preset.emailWriter.title',
    descKey: 'assistant.preset.emailWriter.desc',
    category: 'writing',
    modelId: 'claude-haiku-4.5',
    systemPrompt:
      'You are a professional email writer. Craft clear, concise, and appropriately toned emails. Adapt formality based on context. Always suggest a subject line.',
  },
]
