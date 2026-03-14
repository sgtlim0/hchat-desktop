/**
 * Tab/session state manager with LRU cleanup.
 *
 * Provides isolated state per browser tab or session,
 * with automatic garbage collection of stale entries.
 */

export interface TabState {
  url: string
  text: string | null
  history: Array<{ role: 'user' | 'assistant'; content: string }>
  pendingJobs: number
  lastActivity: number
}

const MAX_HISTORY = 50
const GC_INTERVAL = 30 * 60 * 1000 // 30 minutes
const STALE_THRESHOLD = 30 * 60 * 1000 // 30 minutes

export class TabStateManager {
  private states = new Map<string, TabState>()
  private gcTimer: ReturnType<typeof setInterval> | null = null

  constructor() {
    this.gcTimer = setInterval(() => this.gc(), GC_INTERVAL)
  }

  get(tabId: string): TabState | undefined {
    return this.states.get(tabId)
  }

  getOrCreate(tabId: string, url: string): TabState {
    const existing = this.states.get(tabId)

    // URL changed → reset state
    if (existing && existing.url !== url) {
      this.clear(tabId)
    }

    if (!this.states.has(tabId)) {
      this.states.set(tabId, {
        url,
        text: null,
        history: [],
        pendingJobs: 0,
        lastActivity: Date.now(),
      })
    }

    return this.states.get(tabId)!
  }

  updateActivity(tabId: string): void {
    const state = this.states.get(tabId)
    if (state) {
      state.lastActivity = Date.now()
    }
  }

  setText(tabId: string, text: string): void {
    const state = this.states.get(tabId)
    if (state) {
      state.text = text
      state.lastActivity = Date.now()
    }
  }

  addHistory(tabId: string, role: 'user' | 'assistant', content: string): void {
    const state = this.states.get(tabId)
    if (!state) return

    state.history.push({ role, content })
    state.lastActivity = Date.now()

    // LRU eviction — keep only last MAX_HISTORY entries
    if (state.history.length > MAX_HISTORY) {
      state.history = state.history.slice(-MAX_HISTORY)
    }
  }

  clear(tabId: string): void {
    this.states.delete(tabId)
  }

  gc(): number {
    const cutoff = Date.now() - STALE_THRESHOLD
    let cleaned = 0

    for (const [id, state] of this.states) {
      if (state.lastActivity < cutoff && state.pendingJobs === 0) {
        this.states.delete(id)
        cleaned++
      }
    }

    return cleaned
  }

  get size(): number {
    return this.states.size
  }

  destroy(): void {
    if (this.gcTimer) {
      clearInterval(this.gcTimer)
      this.gcTimer = null
    }
    this.states.clear()
  }
}
