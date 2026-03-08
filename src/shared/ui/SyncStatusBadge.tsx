import { memo } from 'react'
import { useOnlineStatus } from '@/shared/hooks/useOnlineStatus'
import { useTranslation } from '@/shared/i18n'

export const SyncStatusBadge = memo(function SyncStatusBadge() {
  const isOnline = useOnlineStatus()
  const { t } = useTranslation()

  if (isOnline) {
    return (
      <span
        className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400 px-2 py-0.5"
        title={t('sync.lastSync') + ': ' + new Date().toLocaleTimeString()}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
        {t('sync.synced')}
      </span>
    )
  }

  return (
    <span
      className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 px-2 py-0.5"
      title={t('sync.offlineTooltip')}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
      {t('sync.pending')}
    </span>
  )
})
