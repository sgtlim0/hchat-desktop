import { describe, it, expect } from 'vitest'
import { isBrowser, isServer, isMobile, isTouch, isMac, isWindows, getEnvVar, getAppVersion } from '../env-utils'

describe('env-utils', () => {
  it('isBrowser returns true in jsdom', () => {
    expect(isBrowser()).toBe(true)
  })

  it('isServer returns false in jsdom', () => {
    expect(isServer()).toBe(false)
  })

  it('isMobile returns boolean', () => {
    expect(typeof isMobile()).toBe('boolean')
  })

  it('isTouch returns boolean', () => {
    expect(typeof isTouch()).toBe('boolean')
  })

  it('isMac returns boolean', () => {
    expect(typeof isMac()).toBe('boolean')
  })

  it('isWindows returns boolean', () => {
    expect(typeof isWindows()).toBe('boolean')
  })

  it('getEnvVar returns fallback for missing', () => {
    expect(getEnvVar('NONEXISTENT', 'default')).toBe('default')
  })

  it('getAppVersion returns string', () => {
    expect(typeof getAppVersion()).toBe('string')
  })
})
