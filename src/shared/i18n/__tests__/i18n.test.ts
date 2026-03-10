import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { getTranslation, useTranslation } from '../index'
import { useSettingsStore } from '@/entities/settings/settings.store'
import ko from '../ko'
import en from '../en'

// Mock settings store
vi.mock('@/entities/settings/settings.store', () => ({
  useSettingsStore: vi.fn((selector) => {
    const state = {
      language: 'ko',
    }
    return selector(state)
  }),
}))

describe('getTranslation', () => {
  it('returns Korean translation for ko language', () => {
    const t = getTranslation('ko')
    expect(t('common.confirm')).toBe(ko['common.confirm'])
  })

  it('returns English translation for en language', () => {
    const t = getTranslation('en')
    expect(t('common.confirm')).toBe(en['common.confirm'])
  })

  it('returns key for missing translation', () => {
    const t = getTranslation('ko')
    const result = t('nonexistent.key' as never)
    expect(result).toBe('nonexistent.key')
  })

  it('interpolates parameters', () => {
    const t = getTranslation('ko')
    const result = t('time.minutesAgo', { n: 5 })
    expect(result).toContain('5')
  })

  it('interpolates multiple parameters', () => {
    const t = getTranslation('ko')
    const result = t('chat.errorOccurred', { error: 'Test error' })
    expect(result).toContain('Test error')
    expect(result).toContain('오류')
  })

  it('handles parameters with special characters', () => {
    const t = getTranslation('ko')
    const result = t('tool.toolCount', { count: 5, status: 'done' })
    expect(result).toContain('5')
    expect(result).toContain('done')
  })

  it('returns template without modification when no params provided', () => {
    const t = getTranslation('ko')
    const result = t('common.confirm')
    expect(result).toBe(ko['common.confirm'])
  })

  it('handles numeric parameters correctly', () => {
    const t = getTranslation('ko')
    const result = t('time.minutesAgo', { n: 0 })
    expect(result).toContain('0')
  })

  it('converts numeric parameters to strings', () => {
    const t = getTranslation('ko')
    const result = t('time.minutesAgo', { n: 123 })
    expect(result).toContain('123')
  })

  it('handles undefined params gracefully', () => {
    const t = getTranslation('ko')
    const result = t('common.confirm', undefined)
    expect(result).toBe(ko['common.confirm'])
  })
})

describe('useTranslation', () => {
  it('returns translation function and language', () => {
    const { result } = renderHook(() => useTranslation())
    expect(result.current.t).toBeInstanceOf(Function)
    expect(result.current.language).toBe('ko')
  })

  it('uses language from settings store', () => {
    vi.mocked(useSettingsStore).mockImplementation((selector) => {
      const state = { language: 'en' as 'ko' | 'en' }
      return selector(state)
    })

    const { result } = renderHook(() => useTranslation())
    expect(result.current.language).toBe('en')
    expect(result.current.t('common.confirm')).toBe(en['common.confirm'])
  })

  it('translation function works with parameters', () => {
    const { result } = renderHook(() => useTranslation())
    const translated = result.current.t('time.minutesAgo', { n: 42 })
    expect(translated).toContain('42')
  })

  it('translation function returns key for missing translations', () => {
    const { result } = renderHook(() => useTranslation())
    const translated = result.current.t('missing.key' as never)
    expect(translated).toBe('missing.key')
  })
})

describe('translation key completeness', () => {
  const koKeys = Object.keys(ko)
  const enKeys = Object.keys(en)

  it('ko and en have the same number of keys', () => {
    expect(koKeys.length).toBe(enKeys.length)
  })

  it('every ko key exists in en', () => {
    const missingInEn = koKeys.filter((key) => !enKeys.includes(key))
    expect(missingInEn).toEqual([])
  })

  it('every en key exists in ko', () => {
    const missingInKo = enKeys.filter((key) => !koKeys.includes(key))
    expect(missingInKo).toEqual([])
  })

  it('no translation value is empty', () => {
    const emptyKo = koKeys.filter((key) => !ko[key as keyof typeof ko])
    const emptyEn = enKeys.filter((key) => !en[key as keyof typeof en])
    expect(emptyKo).toEqual([])
    expect(emptyEn).toEqual([])
  })
})
