import { memo, useCallback, useEffect, useState } from 'react'
import { useTranslation } from '@/shared/i18n'

const SHORTCUTS = [
  { keys: ['⌘', 'K'], action: 'shortcuts.search' },
  { keys: ['⌘', 'B'], action: 'shortcuts.sidebar' },
  { keys: ['⌘', ','], action: 'shortcuts.settings' },
  { keys: ['⌘', 'J'], action: 'shortcuts.copilot' },
  { keys: ['Esc'], action: 'shortcuts.close' },
] as const

export const KeyboardShortcutsHelp = memo(function KeyboardShortcutsHelp({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const { t } = useTranslation()

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    },
    [onClose],
  )

  useEffect(() => {
    if (!open) return
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, handleKeyDown])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={t('shortcuts.title')}
    >
      <div
        className="bg-surface rounded-xl shadow-xl w-full max-w-sm mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-text-primary">{t('shortcuts.title')}</h2>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary transition-colors text-lg leading-none"
            aria-label={t('common.close')}
          >
            &times;
          </button>
        </div>
        <ul className="px-5 py-3 space-y-2">
          {SHORTCUTS.map((s) => (
            <li key={s.action} className="flex items-center justify-between py-1.5">
              <span className="text-sm text-text-secondary">{t(s.action)}</span>
              <span className="flex gap-1">
                {s.keys.map((k) => (
                  <kbd
                    key={k}
                    className="inline-block min-w-[24px] px-1.5 py-0.5 text-xs font-mono text-text-primary bg-card border border-border rounded text-center"
                  >
                    {k}
                  </kbd>
                ))}
              </span>
            </li>
          ))}
        </ul>
        <div className="px-5 py-3 border-t border-border">
          <p className="text-xs text-text-secondary text-center">
            {t('shortcuts.hint')}
          </p>
        </div>
      </div>
    </div>
  )
})
