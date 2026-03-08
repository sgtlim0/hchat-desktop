import { describe, it, expect, beforeEach } from 'vitest'
import { logger } from '../logger'

describe('logger', () => {
  beforeEach(() => {
    logger.clear()
    logger.setLevel('debug')
  })

  it('logs at info level', () => {
    logger.info('test message')
    expect(logger.getEntryCount()).toBe(1)
    expect(logger.getEntries()[0].message).toBe('test message')
    expect(logger.getEntries()[0].level).toBe('info')
  })

  it('logs with context', () => {
    logger.error('fail', { code: 500 })
    expect(logger.getEntries()[0].context).toEqual({ code: 500 })
  })

  it('respects log level filter', () => {
    logger.setLevel('warn')
    logger.debug('ignored')
    logger.info('ignored')
    logger.warn('kept')
    logger.error('kept')
    expect(logger.getEntryCount()).toBe(2)
  })

  it('debug logs when level is debug', () => {
    logger.setLevel('debug')
    logger.debug('detail')
    expect(logger.getEntryCount()).toBe(1)
  })

  it('filters entries by level', () => {
    logger.info('a')
    logger.warn('b')
    logger.error('c')
    expect(logger.getEntries('warn')).toHaveLength(1)
    expect(logger.getEntries('error')).toHaveLength(1)
  })

  it('records timestamp', () => {
    logger.info('test')
    expect(logger.getEntries()[0].timestamp).toBeTruthy()
  })

  it('clears all entries', () => {
    logger.info('a')
    logger.warn('b')
    logger.clear()
    expect(logger.getEntryCount()).toBe(0)
  })

  it('exports as JSON', () => {
    logger.info('test')
    const json = logger.export()
    const parsed = JSON.parse(json)
    expect(parsed).toHaveLength(1)
  })

  it('limits to 500 entries', () => {
    logger.setLevel('debug')
    for (let i = 0; i < 600; i++) {
      logger.debug(`msg-${i}`)
    }
    expect(logger.getEntryCount()).toBeLessThanOrEqual(500)
  })

  it('getLevel returns current level', () => {
    logger.setLevel('error')
    expect(logger.getLevel()).toBe('error')
  })

  it('all log levels work', () => {
    logger.debug('d')
    logger.info('i')
    logger.warn('w')
    logger.error('e')
    expect(logger.getEntryCount()).toBe(4)
  })
})
