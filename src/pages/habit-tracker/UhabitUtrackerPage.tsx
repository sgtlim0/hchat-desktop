// @ts-nocheck
import { useEffect } from 'react'
import { useTranslation } from '@/shared/i18n'
export function PAGE_NAME() { const { t } = useTranslation(); return <div className="flex-1 p-6"><h1 className="text-lg font-bold">{t('PAGE_KEY.title')}</h1><p className="text-sm text-text-secondary mt-2">Coming soon</p></div> }
