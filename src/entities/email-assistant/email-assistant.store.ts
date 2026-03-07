import { create } from 'zustand'
import type { EmailDraft, EmailTone } from '@/shared/types'
import { getAllEmailDrafts, putEmailDraft, deleteEmailDraftFromDb } from '@/shared/lib/db'

interface EmailAssistantState {
  drafts: EmailDraft[]
  selectedDraftId: string | null

  hydrate: () => void
  createDraft: (subject: string, recipient: string, tone: EmailTone, isReply?: boolean, originalThread?: string) => void
  updateBody: (id: string, body: string) => void
  deleteDraft: (id: string) => void
  selectDraft: (id: string | null) => void
}

export const useEmailAssistantStore = create<EmailAssistantState>((set) => ({
  drafts: [],
  selectedDraftId: null,

  hydrate: () => {
    getAllEmailDrafts()
      .then((drafts) => {
        set({ drafts })
      })
      .catch(console.error)
  },

  createDraft: (subject, recipient, tone, isReply = false, originalThread) => {
    const draft: EmailDraft = {
      id: crypto.randomUUID(),
      subject,
      recipient,
      tone,
      body: '',
      isReply,
      originalThread,
      createdAt: new Date().toISOString(),
    }

    set((state) => ({
      drafts: [draft, ...state.drafts],
      selectedDraftId: draft.id,
    }))

    putEmailDraft(draft).catch(console.error)
  },

  updateBody: (id, body) => {
    set((state) => ({
      drafts: state.drafts.map((d) => {
        if (d.id !== id) return d
        const updated = { ...d, body }
        putEmailDraft(updated).catch(console.error)
        return updated
      }),
    }))
  },

  deleteDraft: (id) => {
    set((state) => ({
      drafts: state.drafts.filter((d) => d.id !== id),
      selectedDraftId: state.selectedDraftId === id ? null : state.selectedDraftId,
    }))

    deleteEmailDraftFromDb(id).catch(console.error)
  },

  selectDraft: (id) => {
    set({ selectedDraftId: id })
  },
}))
