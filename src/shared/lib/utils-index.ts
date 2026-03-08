// Barrel export for Phase 41-60 shared utilities
// Usage: import { fuzzySearch, deepClone, formatCompact } from '@/shared/lib/utils-index'

// Phase 41: Production Hardening
export { RateLimiter, getRateLimiter } from './rate-limiter'
export { errorReporter } from './error-reporter'

// Phase 42: Testing & Observability
export { initWebVitals, getMetrics, onMetric, clearMetrics, exportMetrics } from './web-vitals'

// Phase 43: UX Polish
export type { Draft } from './draft-manager'
export { saveDraft, getDraft, deleteDraft, getAllDrafts, clearAllDrafts } from './draft-manager'

// Phase 44: Smart Features
export { fuzzyScore, fuzzySearch } from './fuzzy-search'
export { checkHealth, checkAllProviders, getProviderStatus, isProviderHealthy, clearHealthCache } from './provider-health'

// Phase 45: Dev Utilities
export { registerCommand, unregisterCommand, getCommands, searchCommands, executeCommand, clearCommands } from './command-palette'
export { clipboardHistory } from './clipboard-history'
export * from './text-transform'

// Phase 46: Validation
export * from './validators'
export * from './number-format'

// Phase 47: Data & Events
export * from './array-utils'
export * from './date-utils'
export { EventEmitter, appEvents } from './event-emitter'

// Phase 48: Object & String
export * from './object-utils'
export * from './string-utils'

// Phase 49: Resilience & Color
export { retry } from './retry'
export * from './color-utils'
export { logger } from './logger'
export * from './id-generator'

// Phase 50: Platform Maturity
export { featureFlags } from './feature-flags'
export { measure, measureAsync, benchmark, getResults as getBenchmarkResults } from './benchmark'

// Phase 51: State & Middleware
export { createMachine } from './state-machine'
export { createTaskQueue } from './task-queue'
export { s, validate } from './schema'
export { pipe, compose, tap, when, memoize } from './pipe'

// Phase 52: Dev Tools
export * from './url-parser'
export * from './storage-quota'

// Phase 53: Citation
export { smartChunk, splitBySentences } from './smart-chunker'
export { buildCitationPrompt, rankChunksByQuery } from './citation-prompt'
export { parseCitations, hasCitations } from './citation-parser'

// Phase 54: Tool Integration
export { searchAtlassian, testAtlassianConnection, isCredentialsComplete, buildAtlassianContext } from './tool-connector'
export { injectToolContext, buildToolSystemPrompt } from './tool-context-injector'

// Phase 57: Keyboard & Theme
export { getPresets, getPresetById, applyPreset } from './theme-presets'
export * from './export-metadata'
export { getNotificationPrefs, setNotificationPrefs, shouldNotify } from './notification-prefs'

// Phase 58: Content & A11y
export * from './markdown-utils'
export { generateAriaId, getContrastRatio, meetsContrastAA, meetsContrastAAA } from './a11y-utils'
export { calculateSessionStats } from './session-stats'

// Phase 59: Form & Data
export * from './data-table'
export { copyToClipboard, formatCodeForCopy, formatMarkdownForCopy } from './rich-copy'
