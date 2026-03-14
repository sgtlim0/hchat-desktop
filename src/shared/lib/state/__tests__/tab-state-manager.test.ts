import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { TabStateManager } from '../tab-state-manager'

describe('TabStateManager', () => {
  let manager: TabStateManager

  beforeEach(() => {
    vi.useFakeTimers()
    manager = new TabStateManager()
  })

  afterEach(() => {
    manager.destroy()
    vi.useRealTimers()
  })

  describe('getOrCreate', () => {
    it('should create new state for unknown tab', () => {
      const state = manager.getOrCreate('tab-1', 'https://example.com')
      expect(state.url).toBe('https://example.com')
      expect(state.text).toBeNull()
      expect(state.history).toEqual([])
      expect(state.pendingJobs).toBe(0)
    })

    it('should return existing state for known tab', () => {
      const first = manager.getOrCreate('tab-1', 'https://example.com')
      first.text = 'cached text'

      const second = manager.getOrCreate('tab-1', 'https://example.com')
      expect(second.text).toBe('cached text')
    })

    it('should reset state when URL changes', () => {
      const first = manager.getOrCreate('tab-1', 'https://page1.com')
      first.text = 'old text'

      const second = manager.getOrCreate('tab-1', 'https://page2.com')
      expect(second.text).toBeNull()
      expect(second.url).toBe('https://page2.com')
    })
  })

  describe('get', () => {
    it('should return undefined for unknown tab', () => {
      expect(manager.get('unknown')).toBeUndefined()
    })

    it('should return state for known tab', () => {
      manager.getOrCreate('tab-1', 'https://example.com')
      expect(manager.get('tab-1')).toBeDefined()
    })
  })

  describe('setText', () => {
    it('should set text on existing tab', () => {
      manager.getOrCreate('tab-1', 'https://example.com')
      manager.setText('tab-1', 'Hello world')
      expect(manager.get('tab-1')?.text).toBe('Hello world')
    })

    it('should do nothing for unknown tab', () => {
      manager.setText('unknown', 'text')
      expect(manager.get('unknown')).toBeUndefined()
    })
  })

  describe('addHistory', () => {
    it('should add messages to history', () => {
      manager.getOrCreate('tab-1', 'https://example.com')
      manager.addHistory('tab-1', 'user', 'Hello')
      manager.addHistory('tab-1', 'assistant', 'Hi there')

      const state = manager.get('tab-1')!
      expect(state.history).toHaveLength(2)
      expect(state.history[0]).toEqual({ role: 'user', content: 'Hello' })
    })

    it('should enforce max history limit (LRU eviction)', () => {
      manager.getOrCreate('tab-1', 'https://example.com')

      for (let i = 0; i < 60; i++) {
        manager.addHistory('tab-1', 'user', `msg-${i}`)
      }

      const state = manager.get('tab-1')!
      expect(state.history.length).toBeLessThanOrEqual(50)
      expect(state.history[state.history.length - 1].content).toBe('msg-59')
    })

    it('should do nothing for unknown tab', () => {
      manager.addHistory('unknown', 'user', 'msg')
      expect(manager.get('unknown')).toBeUndefined()
    })
  })

  describe('clear', () => {
    it('should remove tab state', () => {
      manager.getOrCreate('tab-1', 'https://example.com')
      manager.clear('tab-1')
      expect(manager.get('tab-1')).toBeUndefined()
      expect(manager.size).toBe(0)
    })
  })

  describe('gc', () => {
    it('should remove stale tabs after threshold', () => {
      manager.getOrCreate('tab-1', 'https://a.com')
      manager.getOrCreate('tab-2', 'https://b.com')

      // Advance 31 minutes
      vi.advanceTimersByTime(31 * 60 * 1000)

      const cleaned = manager.gc()
      expect(cleaned).toBe(2)
      expect(manager.size).toBe(0)
    })

    it('should keep active tabs', () => {
      manager.getOrCreate('tab-1', 'https://a.com')

      // Advance 29 minutes (under threshold)
      vi.advanceTimersByTime(29 * 60 * 1000)

      const cleaned = manager.gc()
      expect(cleaned).toBe(0)
      expect(manager.size).toBe(1)
    })

    it('should keep tabs with pending jobs', () => {
      const state = manager.getOrCreate('tab-1', 'https://a.com')
      state.pendingJobs = 1

      vi.advanceTimersByTime(31 * 60 * 1000)

      const cleaned = manager.gc()
      expect(cleaned).toBe(0)
      expect(manager.size).toBe(1)
    })

    it('should keep recently active tabs', () => {
      manager.getOrCreate('tab-old', 'https://old.com')

      vi.advanceTimersByTime(20 * 60 * 1000)
      manager.getOrCreate('tab-new', 'https://new.com')

      vi.advanceTimersByTime(15 * 60 * 1000) // total 35min for old, 15min for new

      const cleaned = manager.gc()
      expect(cleaned).toBe(1) // only old removed
      expect(manager.get('tab-new')).toBeDefined()
    })
  })

  describe('updateActivity', () => {
    it('should refresh lastActivity timestamp', () => {
      manager.getOrCreate('tab-1', 'https://a.com')

      vi.advanceTimersByTime(25 * 60 * 1000)
      manager.updateActivity('tab-1')

      vi.advanceTimersByTime(10 * 60 * 1000) // 35min total, but 10min since activity

      expect(manager.gc()).toBe(0) // should not be collected
    })
  })

  describe('size', () => {
    it('should track number of managed tabs', () => {
      expect(manager.size).toBe(0)
      manager.getOrCreate('t1', 'a')
      manager.getOrCreate('t2', 'b')
      expect(manager.size).toBe(2)
      manager.clear('t1')
      expect(manager.size).toBe(1)
    })
  })

  describe('destroy', () => {
    it('should clear all state and stop GC timer', () => {
      manager.getOrCreate('t1', 'a')
      manager.destroy()
      expect(manager.size).toBe(0)
    })
  })
})
