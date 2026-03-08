import { describe, it, expect, beforeEach } from 'vitest'
import { errorReporter } from '../error-reporter'

describe('errorReporter', () => {
  beforeEach(() => {
    errorReporter.clearReports()
  })

  it('reports a basic error', () => {
    const error = new Error('test error')
    const report = errorReporter.report(error)
    expect(report.message).toBe('test error')
    expect(report.id).toMatch(/^err-/)
  })

  it('auto-captures timestamp', () => {
    const report = errorReporter.report(new Error('test'))
    expect(report.timestamp).toBeTruthy()
    expect(new Date(report.timestamp).getTime()).toBeGreaterThan(0)
  })

  it('stores reports newest first', () => {
    errorReporter.report(new Error('first'))
    errorReporter.report(new Error('second'))
    const reports = errorReporter.getReports()
    expect(reports[0].message).toBe('second')
    expect(reports[1].message).toBe('first')
  })

  it('enforces FIFO at 100 limit', () => {
    for (let i = 0; i < 110; i++) {
      errorReporter.report(new Error(`error-${i}`))
    }
    expect(errorReporter.getReportCount()).toBe(100)
    expect(errorReporter.getReports()[0].message).toBe('error-109')
  })

  it('detects TypeError as high severity', () => {
    const report = errorReporter.report(new TypeError('type error'))
    expect(report.severity).toBe('high')
  })

  it('detects ReferenceError as high severity', () => {
    const report = errorReporter.report(new ReferenceError('ref error'))
    expect(report.severity).toBe('high')
  })

  it('detects generic Error as medium severity', () => {
    const report = errorReporter.report(new Error('generic'))
    expect(report.severity).toBe('medium')
  })

  it('allows manual severity override', () => {
    const report = errorReporter.report(new Error('critical issue'), 'critical')
    expect(report.severity).toBe('critical')
  })

  it('attaches context metadata', () => {
    const ctx = { view: 'chat', sessionId: 'sess-1' }
    const report = errorReporter.report(new Error('test'), undefined, ctx)
    expect(report.context).toEqual(ctx)
  })

  it('exports as JSON string', () => {
    errorReporter.report(new Error('test'))
    const json = errorReporter.exportReports()
    const parsed = JSON.parse(json)
    expect(parsed).toHaveLength(1)
    expect(parsed[0].message).toBe('test')
  })

  it('clears all reports', () => {
    errorReporter.report(new Error('test'))
    errorReporter.clearReports()
    expect(errorReporter.getReportCount()).toBe(0)
    expect(errorReporter.getReports()).toHaveLength(0)
  })

  it('filters reports by severity', () => {
    errorReporter.report(new TypeError('high'))
    errorReporter.report(new Error('medium'))
    errorReporter.report(new Error('low'), 'low')
    expect(errorReporter.getReportsBySeverity('high')).toHaveLength(1)
    expect(errorReporter.getReportsBySeverity('medium')).toHaveLength(1)
    expect(errorReporter.getReportsBySeverity('low')).toHaveLength(1)
  })

  it('captures stack trace', () => {
    const report = errorReporter.report(new Error('with stack'))
    expect(report.stack).toBeTruthy()
    expect(report.stack).toContain('Error: with stack')
  })

  it('captures userAgent', () => {
    const report = errorReporter.report(new Error('test'))
    expect(report.userAgent).toBeTruthy()
  })
})
