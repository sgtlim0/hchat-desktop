import { describe, it, expect } from 'vitest'
import { getTranslation } from '../index'
import ko from '../ko'
import en from '../en'

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
