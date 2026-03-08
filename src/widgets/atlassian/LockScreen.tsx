import { Lock, Settings } from 'lucide-react'
import { useSessionStore } from '@/entities/session/session.store'
import { useTranslation } from '@/shared/i18n'

export function LockScreen() {
  const setView = useSessionStore((s) => s.setView)
  const { t } = useTranslation()

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
      <Lock size={48} className="text-[var(--text-secondary)] opacity-40" />
      <h2 className="text-lg font-bold text-[var(--text-primary)]">
        {t('atlassian.lockScreen.title')}
      </h2>
      <p className="text-sm text-[var(--text-secondary)] max-w-sm">
        {t('atlassian.lockScreen.desc')}
      </p>
      <button
        onClick={() => setView('settings')}
        className="mt-2 flex items-center gap-2 px-5 py-2.5 bg-[var(--primary)] text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
      >
        <Settings size={16} />
        {t('atlassian.lockScreen.goSettings')}
      </button>
    </div>
  )
}
