import { useState, useEffect, useCallback, memo } from 'react'
import { useTranslation } from '@/shared/i18n'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export const InstallBanner = memo(function InstallBanner() {
  const { t } = useTranslation()
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Don't show if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) return

    // Don't show if previously dismissed (sessionStorage)
    if (sessionStorage.getItem('pwa-install-dismissed')) return

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setDeferredPrompt(null)
    }
  }, [deferredPrompt])

  const handleDismiss = useCallback(() => {
    setDismissed(true)
    sessionStorage.setItem('pwa-install-dismissed', '1')
  }, [])

  if (!deferredPrompt || dismissed) return null

  return (
    <div className="bg-primary text-white px-4 py-2.5 flex items-center justify-between text-sm flex-shrink-0">
      <span>{t('pwa.installBanner')}</span>
      <div className="flex items-center gap-2">
        <button
          onClick={handleInstall}
          className="bg-white text-primary px-3 py-1 rounded-full text-xs font-semibold hover:bg-white/90 transition-colors"
        >
          {t('pwa.install')}
        </button>
        <button
          onClick={handleDismiss}
          className="text-white/70 hover:text-white text-xs transition-colors"
          aria-label={t('common.close')}
        >
          ✕
        </button>
      </div>
    </div>
  )
})
