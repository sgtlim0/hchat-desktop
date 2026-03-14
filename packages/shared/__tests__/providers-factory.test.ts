import { describe, it, expect } from 'vitest'
import { getProviderConfig } from '../src/providers/factory'

describe('getProviderConfig', () => {
  it('returns bedrock config for Claude models', () => {
    const config = getProviderConfig('claude-sonnet-4.6', {
      credentials: { accessKeyId: 'ak', secretAccessKey: 'sk', region: 'us-east-1' },
    })
    expect(config.provider).toBe('bedrock')
    expect(config.credentials).toEqual({ accessKeyId: 'ak', secretAccessKey: 'sk', region: 'us-east-1' })
  })

  it('returns openai config for GPT models', () => {
    const config = getProviderConfig('gpt-4o', {
      openaiApiKey: 'sk-test',
    })
    expect(config.provider).toBe('openai')
    expect(config.apiKey).toBe('sk-test')
  })

  it('returns gemini config for Gemini models', () => {
    const config = getProviderConfig('gemini-2.0-flash', {
      geminiApiKey: 'AIza-test',
    })
    expect(config.provider).toBe('gemini')
    expect(config.apiKey).toBe('AIza-test')
  })

  it('defaults to bedrock for unknown models', () => {
    const config = getProviderConfig('unknown-model', {})
    expect(config.provider).toBe('bedrock')
  })

  it('handles null credentials', () => {
    const config = getProviderConfig('claude-sonnet-4.6', {
      credentials: null,
    })
    expect(config.provider).toBe('bedrock')
    expect(config.credentials).toBeUndefined()
  })

  it('handles null api keys', () => {
    const config = getProviderConfig('gpt-4o', {
      openaiApiKey: null,
    })
    expect(config.provider).toBe('openai')
    expect(config.apiKey).toBeUndefined()
  })
})
