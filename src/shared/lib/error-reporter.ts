export interface ErrorReport {
  id: string
  message: string
  stack?: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  timestamp: string
  userAgent: string
  context?: Record<string, unknown>
}

const MAX_REPORTS = 100

function detectSeverity(error: Error): ErrorReport['severity'] {
  if (error instanceof TypeError || error instanceof ReferenceError) return 'high'
  if (error instanceof RangeError || error instanceof SyntaxError) return 'medium'
  return 'medium'
}

class ErrorReporter {
  private reports: ErrorReport[] = []

  report(
    error: Error,
    severity?: ErrorReport['severity'],
    context?: Record<string, unknown>,
  ): ErrorReport {
    const report: ErrorReport = {
      id: `err-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      message: error.message,
      stack: error.stack,
      severity: severity ?? detectSeverity(error),
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      context,
    }

    this.reports = [report, ...this.reports].slice(0, MAX_REPORTS)
    return report
  }

  getReports(): readonly ErrorReport[] {
    return this.reports
  }

  getReportCount(): number {
    return this.reports.length
  }

  getReportsBySeverity(severity: ErrorReport['severity']): readonly ErrorReport[] {
    return this.reports.filter((r) => r.severity === severity)
  }

  exportReports(): string {
    return JSON.stringify(this.reports, null, 2)
  }

  clearReports(): void {
    this.reports = []
  }
}

export const errorReporter = new ErrorReporter()
