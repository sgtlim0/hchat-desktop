import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useNotificationStore } from '../notification.store'

vi.mock('@/shared/lib/db', () => ({
  getAllAppNotifications: vi.fn().mockResolvedValue([]),
  putAppNotification: vi.fn().mockResolvedValue(undefined),
  deleteAppNotificationFromDb: vi.fn().mockResolvedValue(undefined),
  clearAllNotifications: vi.fn().mockResolvedValue(undefined),
}))

describe('NotificationStore', () => {
  beforeEach(() => { useNotificationStore.setState({ notifications: [], filterCategory: 'all', unreadCount: 0 }) })

  it('should have empty initial state', () => {
    expect(useNotificationStore.getState().notifications).toEqual([])
    expect(useNotificationStore.getState().unreadCount).toBe(0)
  })

  it('should add a notification', async () => {
    await useNotificationStore.getState().addNotification('system', 'Welcome', 'Hello!')
    expect(useNotificationStore.getState().notifications).toHaveLength(1)
    expect(useNotificationStore.getState().unreadCount).toBe(1)
    expect(useNotificationStore.getState().notifications[0].isRead).toBe(false)
  })

  it('should mark as read', async () => {
    await useNotificationStore.getState().addNotification('system', 'Test', 'msg')
    const id = useNotificationStore.getState().notifications[0].id
    await useNotificationStore.getState().markRead(id)
    expect(useNotificationStore.getState().notifications[0].isRead).toBe(true)
    expect(useNotificationStore.getState().unreadCount).toBe(0)
  })

  it('should not re-mark already read', async () => {
    await useNotificationStore.getState().addNotification('system', 'Test', 'msg')
    const id = useNotificationStore.getState().notifications[0].id
    await useNotificationStore.getState().markRead(id)
    await useNotificationStore.getState().markRead(id)
    expect(useNotificationStore.getState().unreadCount).toBe(0)
  })

  it('should mark all read', async () => {
    await useNotificationStore.getState().addNotification('system', 'A', '1')
    await useNotificationStore.getState().addNotification('collab', 'B', '2')
    expect(useNotificationStore.getState().unreadCount).toBe(2)
    await useNotificationStore.getState().markAllRead()
    expect(useNotificationStore.getState().unreadCount).toBe(0)
  })

  it('should remove a notification', async () => {
    await useNotificationStore.getState().addNotification('system', 'Test', 'msg')
    const id = useNotificationStore.getState().notifications[0].id
    await useNotificationStore.getState().removeNotification(id)
    expect(useNotificationStore.getState().notifications).toHaveLength(0)
  })

  it('should clear all', async () => {
    await useNotificationStore.getState().addNotification('system', 'A', '1')
    await useNotificationStore.getState().addNotification('collab', 'B', '2')
    await useNotificationStore.getState().clearAll()
    expect(useNotificationStore.getState().notifications).toHaveLength(0)
    expect(useNotificationStore.getState().unreadCount).toBe(0)
  })

  it('should set filter category', () => {
    useNotificationStore.getState().setFilterCategory('collab')
    expect(useNotificationStore.getState().filterCategory).toBe('collab')
  })
})
