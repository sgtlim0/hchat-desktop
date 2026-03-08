import { describe, it, expect, beforeEach, vi } from 'vitest'
import { checkHealth, getProviderStatus, isProviderHealthy, clearHealthCache, checkAllProviders } from '../provider-health'

describe('provider-health', () => {
  beforeEach(() => {
    clearHealthCache()
    vi.restoreAllMocks()
  })

  it('returns healthy when fetch succeeds', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('ok', { status: 200 }))
    const status = await checkHealth('bedrock')
    expect(status.healthy).toBe(true)
    expect(status.provider).toBe('bedrock')
  })

  it('returns unhealthy when fetch returns error', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('', { status: 500 }))
    const status = await checkHealth('openai')
    expect(status.healthy).toBe(false)
    expect(status.healthy).toBe(false)
  })

  it('returns unhealthy on network error', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network error'))
    const status = await checkHealth('gemini')
    expect(status.healthy).toBe(false)
    expect(status.error).toBe('Network error')
  })

  it('caches result', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('ok', { status: 200 }))
    await checkHealth('bedrock')
    expect(getProviderStatus('bedrock')).not.toBeNull()
  })

  it('returns null for unchecked provider', () => {
    expect(getProviderStatus('unchecked')).toBeNull()
  })

  it('isProviderHealthy returns true for healthy', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('ok', { status: 200 }))
    await checkHealth('bedrock')
    expect(isProviderHealthy('bedrock')).toBe(true)
  })

  it('isProviderHealthy defaults false for unknown', () => {
    expect(isProviderHealthy('unknown')).toBe(false)
  })

  it('clearHealthCache empties cache', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('ok', { status: 200 }))
    await checkHealth('bedrock')
    clearHealthCache()
    expect(getProviderStatus('bedrock')).toBeNull()
  })

  it('checkAllProviders checks all three', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('ok', { status: 200 }))
    const results = await checkAllProviders()
    expect(Object.keys(results)).toEqual(['bedrock', 'openai', 'gemini'])
  })

  it('records latency', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('ok', { status: 200 }))
    const status = await checkHealth('bedrock')
    expect(status.latencyMs).toBeGreaterThanOrEqual(0)
  })

  it('records lastChecked', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('ok', { status: 200 }))
    const status = await checkHealth('bedrock')
    expect(new Date(status.lastChecked).getTime()).toBeGreaterThan(0)
  })
})
