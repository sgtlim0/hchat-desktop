import { describe, it, expect, beforeEach, vi } from 'vitest'
import { featureFlags } from '../feature-flags'

describe('FeatureFlagManager', () => {
  beforeEach(() => {
    // Clear all flags before each test
    featureFlags.clearFlags()
  })

  it('returns false for unknown flag', () => {
    const result = featureFlags.isEnabled('unknown-flag')
    expect(result).toBe(false)
  })

  it('enables a flag with setFlag', () => {
    featureFlags.setFlag('test-feature', true)
    expect(featureFlags.isEnabled('test-feature')).toBe(true)
  })

  it('disables a flag with setFlag', () => {
    featureFlags.setFlag('test-feature', true)
    featureFlags.setFlag('test-feature', false)
    expect(featureFlags.isEnabled('test-feature')).toBe(false)
  })

  it('returns all flags with getFlags', () => {
    featureFlags.setFlag('feature-1', true, { description: 'First feature' })
    featureFlags.setFlag('feature-2', false, { description: 'Second feature' })

    const flags = featureFlags.getFlags()
    expect(flags).toHaveLength(2)
    expect(flags).toContainEqual({
      id: 'feature-1',
      enabled: true,
      description: 'First feature'
    })
    expect(flags).toContainEqual({
      id: 'feature-2',
      enabled: false,
      description: 'Second feature'
    })
  })

  it('removes all flags with clearFlags', () => {
    featureFlags.setFlag('feature-1', true)
    featureFlags.setFlag('feature-2', false)

    featureFlags.clearFlags()

    expect(featureFlags.getFlags()).toHaveLength(0)
    expect(featureFlags.isEnabled('feature-1')).toBe(false)
    expect(featureFlags.isEnabled('feature-2')).toBe(false)
  })

  it('toggles flag value with toggleFlag', () => {
    featureFlags.setFlag('toggle-test', false)
    expect(featureFlags.isEnabled('toggle-test')).toBe(false)

    featureFlags.toggleFlag('toggle-test')
    expect(featureFlags.isEnabled('toggle-test')).toBe(true)

    featureFlags.toggleFlag('toggle-test')
    expect(featureFlags.isEnabled('toggle-test')).toBe(false)

    // Toggle non-existent flag should enable it
    featureFlags.toggleFlag('new-flag')
    expect(featureFlags.isEnabled('new-flag')).toBe(true)
  })

  it('bulk sets multiple flags with setFlags', () => {
    featureFlags.setFlags({
      'feature-a': true,
      'feature-b': false,
      'feature-c': true
    })

    expect(featureFlags.isEnabled('feature-a')).toBe(true)
    expect(featureFlags.isEnabled('feature-b')).toBe(false)
    expect(featureFlags.isEnabled('feature-c')).toBe(true)
  })

  it('respects percentage rollout (0% = off, 100% = on)', () => {
    // 0% should always be off
    featureFlags.setFlag('rollout-0', true, { percentage: 0 })
    expect(featureFlags.isEnabled('rollout-0')).toBe(false)

    // 100% should always be on
    featureFlags.setFlag('rollout-100', true, { percentage: 100 })
    expect(featureFlags.isEnabled('rollout-100')).toBe(true)

    // Test percentage rollout with deterministic hash
    // The flag should be consistently enabled or disabled for the same flag ID
    featureFlags.setFlag('rollout-50', true, { percentage: 50 })
    const isEnabled50 = featureFlags.isEnabled('rollout-50')
    expect(typeof isEnabled50).toBe('boolean')

    // Same flag should always return the same result
    for (let i = 0; i < 10; i++) {
      expect(featureFlags.isEnabled('rollout-50')).toBe(isEnabled50)
    }
  })

  it('returns only enabled flags with getEnabledFlags', () => {
    featureFlags.setFlag('enabled-1', true)
    featureFlags.setFlag('disabled-1', false)
    featureFlags.setFlag('enabled-2', true)
    featureFlags.setFlag('disabled-2', false)

    const enabledFlags = featureFlags.getEnabledFlags()
    expect(enabledFlags).toHaveLength(2)
    expect(enabledFlags.map(f => f.id).sort()).toEqual(['enabled-1', 'enabled-2'])
  })

  it('exports flags to JSON with exportFlags', () => {
    featureFlags.setFlag('export-1', true, { description: 'First export', percentage: 75 })
    featureFlags.setFlag('export-2', false, { description: 'Second export' })

    const exported = featureFlags.exportFlags()
    const parsed = JSON.parse(exported)

    expect(parsed).toHaveLength(2)
    expect(parsed).toContainEqual({
      id: 'export-1',
      enabled: true,
      description: 'First export',
      percentage: 75
    })
    expect(parsed).toContainEqual({
      id: 'export-2',
      enabled: false,
      description: 'Second export'
    })
  })

  it('imports flags from JSON with importFlags', () => {
    const flagsToImport = JSON.stringify([
      { id: 'import-1', enabled: true, description: 'Imported flag 1' },
      { id: 'import-2', enabled: false, percentage: 30, description: 'Imported flag 2' }
    ])

    featureFlags.importFlags(flagsToImport)

    const flags = featureFlags.getFlags()
    expect(flags).toHaveLength(2)
    expect(featureFlags.isEnabled('import-1')).toBe(true)
    expect(featureFlags.isEnabled('import-2')).toBe(false)

    const flag2 = flags.find(f => f.id === 'import-2')
    expect(flag2?.percentage).toBe(30)
    expect(flag2?.description).toBe('Imported flag 2')
  })

  it('notifies listeners on flag changes with onFlagChange', () => {
    const callback = vi.fn()
    const unsubscribe = featureFlags.onFlagChange(callback)

    // Test setFlag
    featureFlags.setFlag('notify-test', true)
    expect(callback).toHaveBeenCalledWith('notify-test', true)

    // Test toggleFlag
    featureFlags.toggleFlag('notify-test')
    expect(callback).toHaveBeenCalledWith('notify-test', false)

    // Test setFlags
    callback.mockClear()
    featureFlags.setFlags({
      'bulk-1': true,
      'bulk-2': false
    })
    expect(callback).toHaveBeenCalledTimes(2)
    expect(callback).toHaveBeenCalledWith('bulk-1', true)
    expect(callback).toHaveBeenCalledWith('bulk-2', false)

    // Test unsubscribe
    callback.mockClear()
    unsubscribe()
    featureFlags.setFlag('after-unsubscribe', true)
    expect(callback).not.toHaveBeenCalled()
  })

  it('handles edge cases gracefully', () => {
    // Empty import
    expect(() => featureFlags.importFlags('[]')).not.toThrow()
    expect(featureFlags.getFlags()).toHaveLength(0)

    // Invalid JSON import
    expect(() => featureFlags.importFlags('invalid json')).toThrow()

    // Invalid percentage values are clamped
    featureFlags.setFlag('invalid-percent-low', true, { percentage: -10 })
    const lowFlag = featureFlags.getFlags().find(f => f.id === 'invalid-percent-low')
    expect(lowFlag?.percentage).toBe(0)

    featureFlags.setFlag('invalid-percent-high', true, { percentage: 150 })
    const highFlag = featureFlags.getFlags().find(f => f.id === 'invalid-percent-high')
    expect(highFlag?.percentage).toBe(100)

    // Multiple listeners
    const callback1 = vi.fn()
    const callback2 = vi.fn()
    const unsub1 = featureFlags.onFlagChange(callback1)
    const unsub2 = featureFlags.onFlagChange(callback2)

    featureFlags.setFlag('multi-listener', true)
    expect(callback1).toHaveBeenCalledWith('multi-listener', true)
    expect(callback2).toHaveBeenCalledWith('multi-listener', true)

    unsub1()
    unsub2()
  })
})