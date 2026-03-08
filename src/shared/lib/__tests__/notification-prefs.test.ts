import { describe, it, expect, beforeEach } from 'vitest'
import { getNotificationPrefs, setNotificationPrefs, isQuietHours, shouldNotify, resetNotificationPrefs } from '../notification-prefs'

describe('notification-prefs', () => {
  beforeEach(() => localStorage.clear())

  it('returns defaults when empty', () => {
    const prefs = getNotificationPrefs()
    expect(prefs.enabled).toBe(true)
    expect(prefs.sound).toBe(true)
    expect(prefs.desktop).toBe(false)
  })

  it('sets and retrieves prefs', () => {
    setNotificationPrefs({ sound: false, desktop: true })
    const prefs = getNotificationPrefs()
    expect(prefs.sound).toBe(false)
    expect(prefs.desktop).toBe(true)
    expect(prefs.enabled).toBe(true) // unchanged
  })

  it('resets to defaults', () => {
    setNotificationPrefs({ enabled: false })
    const prefs = resetNotificationPrefs()
    expect(prefs.enabled).toBe(true)
  })

  it('handles corrupted storage', () => {
    localStorage.setItem('hchat-notification-prefs', 'invalid')
    expect(getNotificationPrefs().enabled).toBe(true)
  })

  describe('isQuietHours', () => {
    it('returns false when disabled', () => {
      expect(isQuietHours({ ...getNotificationPrefs(), quietHoursEnabled: false })).toBe(false)
    })
  })

  describe('shouldNotify', () => {
    it('returns false when disabled globally', () => {
      const prefs = { ...getNotificationPrefs(), enabled: false }
      expect(shouldNotify(prefs, 'complete')).toBe(false)
    })

    it('respects type flags', () => {
      const prefs = { ...getNotificationPrefs(), onComplete: false }
      expect(shouldNotify(prefs, 'complete')).toBe(false)
      expect(shouldNotify(prefs, 'error')).toBe(true)
    })

    it('returns true for enabled type', () => {
      expect(shouldNotify(getNotificationPrefs(), 'error')).toBe(true)
    })
  })
})
