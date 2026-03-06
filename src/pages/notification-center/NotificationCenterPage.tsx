import { useEffect } from 'react'
import { Bell, CheckCheck, Trash2, Calendar, GitBranch, Users, Settings } from 'lucide-react'
import { useNotificationStore } from '@/entities/notification/notification.store'
import { useTranslation } from '@/shared/i18n'
import type { NotificationCategory } from '@/shared/types'

const CAT_ICONS: Record<NotificationCategory, typeof Bell> = { schedule: Calendar, workflow: GitBranch, collab: Users, system: Settings }

export function NotificationCenterPage() {
  const { t } = useTranslation()
  const notifications = useNotificationStore((s) => s.notifications)
  const filterCategory = useNotificationStore((s) => s.filterCategory)
  const unreadCount = useNotificationStore((s) => s.unreadCount)
  const hydrate = useNotificationStore((s) => s.hydrate)
  const markRead = useNotificationStore((s) => s.markRead)
  const markAllRead = useNotificationStore((s) => s.markAllRead)
  const removeNotification = useNotificationStore((s) => s.removeNotification)
  const clearAll = useNotificationStore((s) => s.clearAll)
  const setFilterCategory = useNotificationStore((s) => s.setFilterCategory)

  useEffect(() => { hydrate() }, [hydrate])

  const filtered = filterCategory === 'all' ? notifications : notifications.filter((n) => n.category === filterCategory)
  const cats: Array<NotificationCategory | 'all'> = ['all', 'schedule', 'workflow', 'collab', 'system']

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <h1 className="text-lg font-bold text-text-primary flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary" />{t('notification.title')}
          {unreadCount > 0 && <span className="text-xs bg-red-500 text-white px-1.5 py-0.5 rounded-full">{unreadCount}</span>}
        </h1>
        <div className="flex gap-2">
          <button onClick={markAllRead} className="flex items-center gap-1 px-3 py-1.5 text-sm bg-surface-secondary rounded-lg hover:bg-surface-tertiary"><CheckCheck className="w-4 h-4" />{t('notification.markAllRead')}</button>
          <button onClick={clearAll} className="flex items-center gap-1 px-3 py-1.5 text-sm bg-surface-secondary rounded-lg hover:bg-surface-tertiary text-red-500"><Trash2 className="w-4 h-4" />{t('notification.clearAll')}</button>
        </div>
      </div>
      <div className="px-6 py-2 border-b border-border flex gap-2">
        {cats.map((cat) => (
          <button key={cat} onClick={() => setFilterCategory(cat)} className={`px-3 py-1 text-xs rounded-full ${filterCategory === cat ? 'bg-primary text-white' : 'bg-surface-secondary text-text-secondary'}`}>
            {cat === 'all' ? t('notification.all') : cat}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto p-6 space-y-2">
        {filtered.length === 0 && <p className="text-center text-text-tertiary text-sm py-12">{t('notification.empty')}</p>}
        {filtered.map((n) => {
          const Icon = CAT_ICONS[n.category]
          return (
            <div key={n.id} onClick={() => markRead(n.id)} className={`p-4 rounded-lg border cursor-pointer ${n.isRead ? 'border-border bg-surface' : 'border-primary/30 bg-primary/5'}`}>
              <div className="flex items-start justify-between">
                <div className="flex gap-3">
                  <Icon className="w-4 h-4 text-text-secondary mt-0.5" />
                  <div>
                    <p className={`text-sm ${n.isRead ? 'text-text-secondary' : 'text-text-primary font-medium'}`}>{n.title}</p>
                    <p className="text-xs text-text-tertiary mt-0.5">{n.message}</p>
                    <p className="text-[10px] text-text-tertiary mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                  </div>
                </div>
                <button onClick={(e) => { e.stopPropagation(); removeNotification(n.id) }} className="p-1 rounded hover:bg-red-500/10"><Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
