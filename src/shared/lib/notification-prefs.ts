export interface NotificationPrefs {
  enabled: boolean
  sound: boolean
  desktop: boolean
  onComplete: boolean
  onError: boolean
  onMention: boolean
  quietHoursEnabled: boolean
  quietStart: string  // "22:00"
  quietEnd: string    // "08:00"
}

const STORAGE_KEY = 'hchat-notification-prefs'

const DEFAULTS: NotificationPrefs = {
  enabled: true,
  sound: true,
  desktop: false,
  onComplete: true,
  onError: true,
  onMention: true,
  quietHoursEnabled: false,
  quietStart: '22:00',
  quietEnd: '08:00',
}

export function getNotificationPrefs(): NotificationPrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULTS }
    return { ...DEFAULTS, ...JSON.parse(raw) }
  } catch {
    return { ...DEFAULTS }
  }
}

export function setNotificationPrefs(prefs: Partial<NotificationPrefs>): NotificationPrefs {
  const current = getNotificationPrefs()
  const updated = { ...current, ...prefs }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch { /* storage full */ }
  return updated
}

export function isQuietHours(prefs: NotificationPrefs): boolean {
  if (!prefs.quietHoursEnabled) return false
  const now = new Date()
  const hours = now.getHours()
  const minutes = now.getMinutes()
  const current = hours * 60 + minutes

  const [startH, startM] = prefs.quietStart.split(':').map(Number)
  const [endH, endM] = prefs.quietEnd.split(':').map(Number)
  const start = startH * 60 + startM
  const end = endH * 60 + endM

  if (start <= end) return current >= start && current < end
  return current >= start || current < end
}

export function shouldNotify(prefs: NotificationPrefs, type: 'complete' | 'error' | 'mention'): boolean {
  if (!prefs.enabled) return false
  if (isQuietHours(prefs)) return false
  if (type === 'complete') return prefs.onComplete
  if (type === 'error') return prefs.onError
  if (type === 'mention') return prefs.onMention
  return false
}

export function resetNotificationPrefs(): NotificationPrefs {
  try { localStorage.removeItem(STORAGE_KEY) } catch { /* */ }
  return { ...DEFAULTS }
}
