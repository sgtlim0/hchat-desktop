import { describe, it, expect } from 'vitest'
import { getPresets, getPresetById, applyPreset } from '../theme-presets'

describe('theme-presets', () => {
  it('returns array of presets', () => {
    expect(getPresets().length).toBeGreaterThanOrEqual(5)
  })

  it('each preset has required fields', () => {
    for (const p of getPresets()) {
      expect(p.id).toBeTruthy()
      expect(p.name).toBeTruthy()
      expect(p.colors.primary).toBeTruthy()
      expect(p.colors.background).toBeTruthy()
    }
  })

  it('default preset exists', () => {
    expect(getPresetById('default')).not.toBeNull()
  })

  it('finds preset by id', () => {
    expect(getPresetById('forest')?.name).toContain('Forest')
  })

  it('returns null for unknown', () => {
    expect(getPresetById('nope')).toBeNull()
  })

  it('applyPreset returns CSS vars', () => {
    const vars = applyPreset(getPresetById('default')!)
    expect(vars['--primary']).toBe('#3478FE')
    expect(vars['--bg-primary']).toBeTruthy()
  })

  it('has 6+ presets', () => {
    expect(getPresets().length).toBeGreaterThanOrEqual(6)
  })
})
