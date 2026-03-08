import { describe, it, expect, beforeEach, vi } from 'vitest'
import { errorReporter } from '../error-reporter'
import { useSessionStore } from '@/entities/session/session.store'

// Mock the session store
vi.mock('@/entities/session/session.store', () => ({
  useSessionStore: {
    getState: vi.fn(() => ({
      view: 'home',
      currentSessionId: 'test-session-123',
    })),
  },
}))

describe('ErrorReporter', () => {
  beforeEach(() => {
    // Clear reports before each test
    errorReporter.clearReports()
    vi.clearAllMocks()
  })

  it('should report a basic error', () => {
    const error = new Error('Test error')
    errorReporter.report(error)

    const reports = errorReporter.getReports()
    expect(reports).toHaveLength(1)
    expect(reports[0].message).toBe('Test error')
    expect(reports[0].stack).toBeDefined()
    expect(reports[0].view).toBe('home')
    expect(reports[0].sessionId).toBe('test-session-123')
  })

  it('should auto-capture timestamp', () => {
    const error = new Error('Test error')
    const beforeTime = new Date().toISOString()

    errorReporter.report(error)

    const afterTime = new Date().toISOString()
    const reports = errorReporter.getReports()
    expect(reports[0].timestamp).toBeDefined()
    expect(new Date(reports[0].timestamp).getTime()).toBeGreaterThanOrEqual(new Date(beforeTime).getTime())
    expect(new Date(reports[0].timestamp).getTime()).toBeLessThanOrEqual(new Date(afterTime).getTime())
  })

  it('should enforce FIFO eviction at 100 limit', () => {
    // Add 101 errors
    for (let i = 0; i < 101; i++) {
      errorReporter.report(new Error(`Error ${i}`))
    }

    const reports = errorReporter.getReports()
    expect(reports).toHaveLength(100)

    // First error should be Error 1 (Error 0 was evicted)
    expect(reports[0].message).toBe('Error 1')

    // Last error should be Error 100
    expect(reports[99].message).toBe('Error 100')
  })

  it('should auto-detect severity for TypeError as high', () => {
    const typeError = new TypeError('Type mismatch')
    errorReporter.report(typeError)

    const reports = errorReporter.getReports()
    expect(reports[0].severity).toBe('high')
  })

  it('should auto-detect severity for ReferenceError as high', () => {
    const refError = new ReferenceError('Variable not defined')
    errorReporter.report(refError)

    const reports = errorReporter.getReports()
    expect(reports[0].severity).toBe('high')
  })

  it('should default to medium severity for other errors', () => {
    const error = new Error('Generic error')
    errorReporter.report(error)

    const reports = errorReporter.getReports()
    expect(reports[0].severity).toBe('medium')
  })

  it('should allow manual severity override', () => {
    const error = new Error('Test error')
    errorReporter.report(error, 'critical')

    const reports = errorReporter.getReports()
    expect(reports[0].severity).toBe('critical')
  })

  it('should attach context metadata', () => {
    const error = new Error('Test error')
    const context = { userId: '123', action: 'save' }

    errorReporter.report(error, 'low', context)

    const reports = errorReporter.getReports()
    expect(reports[0].context).toEqual(context)
  })

  it('should export reports as JSON string', () => {
    errorReporter.report(new Error('Error 1'))
    errorReporter.report(new Error('Error 2'))

    const jsonString = errorReporter.exportReports()
    const parsed = JSON.parse(jsonString)

    expect(parsed).toHaveLength(2)
    expect(parsed[0].message).toBe('Error 1')
    expect(parsed[1].message).toBe('Error 2')
  })

  it('should clear all reports', () => {
    errorReporter.report(new Error('Error 1'))
    errorReporter.report(new Error('Error 2'))

    expect(errorReporter.getReportCount()).toBe(2)

    errorReporter.clearReports()

    expect(errorReporter.getReportCount()).toBe(0)
    expect(errorReporter.getReports()).toEqual([])
  })

  it('should return accurate report count', () => {
    expect(errorReporter.getReportCount()).toBe(0)

    errorReporter.report(new Error('Error 1'))
    expect(errorReporter.getReportCount()).toBe(1)

    errorReporter.report(new Error('Error 2'))
    expect(errorReporter.getReportCount()).toBe(2)

    errorReporter.clearReports()
    expect(errorReporter.getReportCount()).toBe(0)
  })

  it('should handle multiple concurrent reports', () => {
    const errors = [
      new Error('Error 1'),
      new TypeError('Error 2'),
      new ReferenceError('Error 3'),
    ]

    errors.forEach(error => errorReporter.report(error))

    const reports = errorReporter.getReports()
    expect(reports).toHaveLength(3)
    expect(reports[0].message).toBe('Error 1')
    expect(reports[1].message).toBe('Error 2')
    expect(reports[2].message).toBe('Error 3')
  })

  it('should generate unique IDs for each report', () => {
    errorReporter.report(new Error('Error 1'))
    errorReporter.report(new Error('Error 2'))
    errorReporter.report(new Error('Error 3'))

    const reports = errorReporter.getReports()
    const ids = reports.map(r => r.id)
    const uniqueIds = new Set(ids)

    expect(uniqueIds.size).toBe(3)
  })

  it('should capture userAgent', () => {
    const error = new Error('Test error')
    errorReporter.report(error)

    const reports = errorReporter.getReports()
    expect(reports[0].userAgent).toBeDefined()
    expect(reports[0].userAgent).toBe(navigator.userAgent)
  })

  it('should handle errors without stack traces', () => {
    const error = new Error('Test error')
    delete error.stack

    errorReporter.report(error)

    const reports = errorReporter.getReports()
    expect(reports[0].message).toBe('Test error')
    expect(reports[0].stack).toBeUndefined()
  })

  it('should preserve immutability of reports', () => {
    errorReporter.report(new Error('Error 1'))

    const reports1 = errorReporter.getReports()
    errorReporter.report(new Error('Error 2'))
    const reports2 = errorReporter.getReports()

    // Should be different array references
    expect(reports1).not.toBe(reports2)

    // Original array should be unchanged
    expect(reports1).toHaveLength(1)
    expect(reports2).toHaveLength(2)
  })
})
