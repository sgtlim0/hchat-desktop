// Types
export * from './types'

// Constants
export { MODELS, DEFAULT_MODEL_ID, BEDROCK_MODEL_MAP, AWS_REGIONS, DEFAULT_AWS_REGION, DEFAULT_PERSONAS, QUICK_ACTIONS } from './constants'
export { ASSISTANT_PRESETS, ASSISTANT_CATEGORIES, type AssistantPreset, type AssistantCategory } from './constants/assistants'

// Providers
export { createStream } from './lib/providers/factory'
export type { StreamParams, ProviderConfig } from './lib/providers/types'

// Core libs
export { streamChat, testConnection } from './lib/bedrock-client'
export { HttpClient, createHttpClient } from './lib/http-client'
export { RateLimiter, getRateLimiter } from './lib/rate-limiter'
export { estimateTokens } from './lib/token-estimator'
export { detectSensitiveData, maskSensitiveData, getDetectionLabel } from './lib/guardrail'
export { escapeHtml, stripHtmlTags, sanitizeUrl, sanitizeFilename, preventXss, isCleanText } from './lib/sanitize-utils'
export { encrypt, decrypt, decryptWithMigration } from './lib/crypto'
export { extractVariables, fillTemplate } from './lib/prompt-template'
export { createStreamThrottle } from './lib/stream-throttle'

// String utils
export * from './lib/string-utils'

// Agent
export { parseToolCalls, stripToolCalls } from './lib/agent/parser'
export { AGENT_TOOLS, getToolDescriptions, getAgentSystemPrompt } from './lib/agent/tools'

// RAG & Embedding
export { smartChunk, splitBySentences } from './lib/smart-chunker'
export { embedText, cosineSimilarity, bm25Score, hybridScore } from './lib/embedding'
export { searchRAG, buildRAGContext, extractKeyPoints, chunkWithOverlap } from './lib/rag'

// i18n
export { useTranslation, getTranslation, setLanguageProvider } from './i18n'
export type { Language, TFunction, TranslationKey } from './i18n'
