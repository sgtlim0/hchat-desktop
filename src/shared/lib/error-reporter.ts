import type { ViewState } from '@/shared/types'
import { useSessionStore } from '@/entities/session/session.store'

export interface ErrorReport {
  id: string
  message: string
  stack?: string
  view: ViewState          // current ViewState
  sessionId?: string        // current session
  timestamp: string         // ISO string
  userAgent: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  context?: Record<string, unknown>  // arbitrary metadata
}

function detectSeverity(error: Error): ErrorReport['severity'] {
  if (error instanceof TypeError || error instanceof ReferenceError) return 'high'
  if (error instanceof RangeError || error instanceof SyntaxError) return 'medium'
  return 'medium'
}

class ErrorReporter {
  private reports: ErrorReport[] = []
  private maxReports = 100  // FIFO

  report(
    error: Error,
    severity?: ErrorReport['severity'],
    context?: Record<string, unknown>,
  ): void {
    // Auto-capture view and sessionId from Zustand stores
    const state = useSessionStore.getState()
    const view = state.view
    const sessionId = state.currentSessionId || undefined

    const report: ErrorReport = {
      id: `err-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      message: error.message,
      stack: error.stack,
      view,
      sessionId,
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      severity: severity ?? detectSeverity(error),
      context,
    }

    // Immutable update with FIFO eviction
    this.reports = [...this.reports, report].slice(-this.maxReports)
  }

  getReports(): ErrorReport[] {
    // Return a copy to preserve immutability
    return [...this.reports]
  }

  getReportCount(): number {
    return this.reports.length
  }

  exportReports(): string {
    // JSON string for download
    return JSON.stringify(this.reports, null, 2)
  }

  clearReports(): void {
    this.reports = []
  }
}

export const errorReporter = new ErrorReporter()
