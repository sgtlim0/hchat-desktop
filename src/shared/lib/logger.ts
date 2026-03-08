export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  context?: Record<string, unknown>
}

class Logger {
  private minLevel: LogLevel = 'info'
  private entries: LogEntry[] = []
  private maxEntries = 500

  setLevel(level: LogLevel): void {
    this.minLevel = level
  }

  getLevel(): LogLevel {
    return this.minLevel
  }

  private shouldLog(level: LogLevel): boolean {
    return LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[this.minLevel]
  }

  private log(level: LogLevel, message: string, context?: Record<string, unknown>): void {
    if (!this.shouldLog(level)) return

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
    }

    this.entries = [...this.entries, entry].slice(-this.maxEntries)
  }

  debug(message: string, context?: Record<string, unknown>): void {
    this.log('debug', message, context)
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.log('info', message, context)
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.log('warn', message, context)
  }

  error(message: string, context?: Record<string, unknown>): void {
    this.log('error', message, context)
  }

  getEntries(level?: LogLevel): readonly LogEntry[] {
    if (level) return this.entries.filter((e) => e.level === level)
    return [...this.entries]
  }

  getEntryCount(): number {
    return this.entries.length
  }

  clear(): void {
    this.entries = []
  }

  export(): string {
    return JSON.stringify(this.entries, null, 2)
  }
}

export const logger = new Logger()
export type { LogEntry }
