import { create } from 'zustand'
import type { AppNotification, NotificationCategory } from '@/shared/types'
import { getAllAppNotifications, putAppNotification, deleteAppNotificationFromDb, clearAllNotifications } from '@/shared/lib/db'

interface NotificationState {
  notifications: AppNotification[]
  filterCategory: NotificationCategory | 'all'
  unreadCount: number

  hydrate: () => Promise<void>
  addNotification: (category: NotificationCategory, title: string, message: string, actionUrl?: string) => Promise<void>
  markRead: (id: string) => Promise<void>
  markAllRead: () => Promise<void>
  removeNotification: (id: string) => Promise<void>
  clearAll: () => Promise<void>
  setFilterCategory: (cat: NotificationCategory | 'all') => void
}

function countUnread(notifications: AppNotification[]): number {
  return notifications.filter((n) => !n.isRead).length
}

export const useNotificationStore = create<NotificationState>()((set, get) => ({
  notifications: [],
  filterCategory: 'all',
  unreadCount: 0,

  hydrate: async () => {
    const notifications = await getAllAppNotifications()
    set({ notifications, unreadCount: countUnread(notifications) })
  },

  addNotification: async (category, title, message, actionUrl) => {
    const n: AppNotification = {
      id: crypto.randomUUID(), category, title, message,
      isRead: false, actionUrl, createdAt: new Date().toISOString(),
    }
    await putAppNotification(n)
    set((s) => {
      const notifications = [n, ...s.notifications]
      return { notifications, unreadCount: countUnread(notifications) }
    })
  },

  markRead: async (id) => {
    const n = get().notifications.find((x) => x.id === id)
    if (!n || n.isRead) return
    const updated = { ...n, isRead: true }
    await putAppNotification(updated)
    set((s) => {
      const notifications = s.notifications.map((x) => (x.id === id ? updated : x))
      return { notifications, unreadCount: countUnread(notifications) }
    })
  },

  markAllRead: async () => {
    const unread = get().notifications.filter((n) => !n.isRead)
    for (const n of unread) {
      await putAppNotification({ ...n, isRead: true })
    }
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    }))
  },

  removeNotification: async (id) => {
    await deleteAppNotificationFromDb(id)
    set((s) => {
      const notifications = s.notifications.filter((n) => n.id !== id)
      return { notifications, unreadCount: countUnread(notifications) }
    })
  },

  clearAll: async () => {
    await clearAllNotifications()
    set({ notifications: [], unreadCount: 0 })
  },

  setFilterCategory: (filterCategory) => set({ filterCategory }),
}))
