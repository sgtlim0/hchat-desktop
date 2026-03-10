import ko from './ko'
import en from './en'
import type { Language, TFunction } from './types'

export type { Language, TFunction, TranslationKey } from './types'

const translations: Record<Language, Record<keyof typeof ko, string>> = { ko, en }

function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template
  return Object.entries(params).reduce(
    (result, [key, value]) => result.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value)),
    template,
  )
}

// Module-level language getter to be injected from app layer
let getLanguage: () => Language = () => 'ko'

export function setLanguageProvider(getter: () => Language): void {
  getLanguage = getter
}

export function useTranslation(): { t: TFunction; language: Language } {
  const language = getLanguage()
  const dict = translations[language]

  const t: TFunction = (key, params) => {
    const template = dict[key]
    if (!template) return key
    return interpolate(template, params)
  }

  return { t, language }
}

export function getTranslation(language: Language): TFunction {
  const dict = translations[language]
  return (key, params) => {
    const template = dict[key]
    if (!template) return key
    return interpolate(template, params)
  }
}
