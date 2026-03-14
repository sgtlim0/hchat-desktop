import type ko from './ko'

export type Language = 'ko' | 'en'

export type TranslationKey = keyof typeof ko

export type TFunction = (key: TranslationKey, params?: Record<string, string | number>) => string
