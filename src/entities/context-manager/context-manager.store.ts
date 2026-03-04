import { create } from 'zustand'
import type { PinnedMessage, ContextTemplate } from '@/shared/types'
import { putPinnedMessage, deletePinnedMessageFromDb } from '@/shared/lib/db'

interface ContextManagerState {
  pinnedMessages: PinnedMessage[]
  selectedTemplate: ContextTemplate | null
  autoCompression: boolean
  tokenUsage: { used: number; max: number }

  hydrate: () => void
  pinMessage: (sessionId: string, messageId: string, label: string) => void
  unpinMessage: (id: string) => void
  setTemplate: (template: ContextTemplate | null) => void
  toggleAutoCompression: () => void
  updateTokenUsage: (used: number, max: number) => void
  getPinnedForSession: (sessionId: string) => PinnedMessage[]
}

export const useContextManagerStore = create<ContextManagerState>((set, get) => ({
  pinnedMessages: [],
  selectedTemplate: null,
  autoCompression: false,
  tokenUsage: { used: 0, max: 200000 },

  hydrate: () => {
    // IndexedDB hydration placeholder
  },

  pinMessage: (sessionId, messageId, label) => {
    const now = new Date().toISOString()
    const id = `pin-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

    const newPin: PinnedMessage = {
      id,
      sessionId,
      messageId,
      label,
      createdAt: now,
    }

    set((state) => ({
      pinnedMessages: [...state.pinnedMessages, newPin],
    }))

    putPinnedMessage(newPin).catch(console.error)
  },

  unpinMessage: (id) => {
    set((state) => ({
      pinnedMessages: state.pinnedMessages.filter((p) => p.id !== id),
    }))

    deletePinnedMessageFromDb(id).catch(console.error)
  },

  setTemplate: (template) => {
    set({ selectedTemplate: template })
  },

  toggleAutoCompression: () => {
    set((state) => ({ autoCompression: !state.autoCompression }))
  },

  updateTokenUsage: (used, max) => {
    set({ tokenUsage: { used, max } })
  },

  getPinnedForSession: (sessionId) => {
    return get().pinnedMessages.filter((p) => p.sessionId === sessionId)
  },
}))
