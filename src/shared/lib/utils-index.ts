// Barrel export for Phase 41-50 shared utilities
// Usage: import { fuzzySearch, deepClone, formatCompact } from '@/shared/lib/utils-index'

// Phase 41: Production Hardening
export { RateLimiter, getRateLimiter, resetAllLimiters } from './rate-limiter'
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
