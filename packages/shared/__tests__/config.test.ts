import { describe, it, expect } from 'vitest'
import { initConfig, getConfig } from '../src/config'

describe('AppConfig', () => {
  it('returns default config', () => {
    const config = getConfig()
    expect(config.apiBaseUrl).toBe('')
    expect(config.isDev).toBe(false)
  })

  it('updates config via initConfig', () => {
    initConfig({ apiBaseUrl: 'https://api.example.com', isDev: true })
    const config = getConfig()
    expect(config.apiBaseUrl).toBe('https://api.example.com')
    expect(config.isDev).toBe(true)
  })

  it('creates a copy on init (immutable)', () => {
    const original = { apiBaseUrl: 'https://test.com', isDev: false }
    initConfig(original)
    const config = getConfig()
    expect(config).not.toBe(original)
    expect(config.apiBaseUrl).toBe('https://test.com')
  })
})
