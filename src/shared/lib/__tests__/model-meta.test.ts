import { describe, it, expect } from 'vitest'
import { getModelName, getModelShortName, getModelProvider, getModelDescription } from '../model-meta'

describe('getModelName', () => {
  it('returns full name for known model', () => {
    expect(getModelName('claude-sonnet-4.6')).toBe('Claude Sonnet 4.6')
  })

  it('returns modelId for unknown model', () => {
    expect(getModelName('unknown-model')).toBe('unknown-model')
  })

  it('returns correct name for each provider', () => {
    expect(getModelName('gpt-4o')).toBe('GPT-4o')
    expect(getModelName('gemini-2.0-flash')).toBe('Gemini 2.0 Flash')
  })
})

describe('getModelShortName', () => {
  it('returns short name for known model', () => {
    expect(getModelShortName('claude-sonnet-4.6')).toBe('Sonnet 4.6')
  })

  it('returns modelId for unknown model', () => {
    expect(getModelShortName('unknown-model')).toBe('unknown-model')
  })
})

describe('getModelProvider', () => {
  it('returns bedrock for Claude models', () => {
    expect(getModelProvider('claude-opus-4.6')).toBe('bedrock')
    expect(getModelProvider('claude-sonnet-4.6')).toBe('bedrock')
    expect(getModelProvider('claude-haiku-4.5')).toBe('bedrock')
  })

  it('returns openai for GPT models', () => {
    expect(getModelProvider('gpt-4o')).toBe('openai')
    expect(getModelProvider('gpt-4o-mini')).toBe('openai')
  })

  it('returns gemini for Gemini models', () => {
    expect(getModelProvider('gemini-2.0-flash')).toBe('gemini')
    expect(getModelProvider('gemini-1.5-pro')).toBe('gemini')
  })

  it('returns unknown for unrecognized models', () => {
    expect(getModelProvider('unknown-model')).toBe('unknown')
  })
})

describe('getModelDescription', () => {
  it('returns capabilities joined by comma', () => {
    expect(getModelDescription('claude-sonnet-4.6')).toBe('chat, code, vision, reasoning')
  })

  it('returns empty string for unknown model', () => {
    expect(getModelDescription('unknown-model')).toBe('')
  })

  it('includes fast capability for budget models', () => {
    expect(getModelDescription('claude-haiku-4.5')).toContain('fast')
  })
})
