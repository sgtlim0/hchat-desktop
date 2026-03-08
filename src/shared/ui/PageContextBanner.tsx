import { memo } from 'react'
import type { PageContext, AnalyzeMode } from '@/shared/hooks/useExtensionContext'
import { useTranslation } from '@/shared/i18n'

interface PageContextBannerProps {
  context: PageContext
  mode: AnalyzeMode
  onUse: () => void
  onDismiss: () => void
}

const MODE_LABELS: Record<AnalyzeMode, { ko: string; en: string }> = {
  summarize: { ko: '요약', en: 'Summarize' },
  explain: { ko: '설명', en: 'Explain' },
  research: { ko: '리서치', en: 'Research' },
  translate: { ko: '번역', en: 'Translate' },
}

export const PageContextBanner = memo(function PageContextBanner({
  context,
  mode,
  onUse,
  onDismiss,
}: PageContextBannerProps) {
  const { t, language } = useTranslation()
  const modeLabel = MODE_LABELS[mode]

  return (
    <div className="mx-4 mt-3 bg-primary/5 border border-primary/20 rounded-xl p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
              {t('extension.fromExtension')}
            </span>
            <span className="text-xs text-text-secondary">
              {language === 'ko' ? modeLabel.ko : modeLabel.en}
            </span>
          </div>
          <p className="text-xs text-text-primary font-medium truncate">{context.title}</p>
          <p className="text-xs text-text-secondary truncate">{context.url}</p>
          {context.selectedText && (
            <p className="text-xs text-primary mt-1 line-clamp-2">
              Selected: {context.selectedText.slice(0, 100)}
            </p>
          )}
        </div>
        <button
          onClick={onDismiss}
          className="text-text-secondary hover:text-text-primary flex-shrink-0 text-sm transition-colors"
          aria-label={t('common.close')}
        >
          ✕
        </button>
      </div>
      <button
        onClick={onUse}
        className="mt-2 w-full bg-primary text-white text-xs py-1.5 rounded-lg hover:bg-primary/90 transition-colors"
      >
        {t('extension.analyzeStart')}
      </button>
    </div>
  )
})
