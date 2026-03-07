import { create } from 'zustand'
import type { MeetingNote, MeetingTemplate, ActionItem } from '@/shared/types'
import { getAllMeetingNotes, putMeetingNote, deleteMeetingNoteFromDb } from '@/shared/lib/db'

interface MeetingNotesState {
  notes: MeetingNote[]

  hydrate: () => Promise<void>
  createNote: (title: string, template: MeetingTemplate) => Promise<void>
  deleteNote: (id: string) => Promise<void>
  updateContent: (id: string, content: string) => Promise<void>
  addActionItem: (noteId: string, item: Omit<ActionItem, 'id' | 'done'>) => Promise<void>
  toggleActionItem: (noteId: string, itemId: string) => Promise<void>
  addParticipant: (noteId: string, name: string) => Promise<void>
  removeParticipant: (noteId: string, name: string) => Promise<void>
}

export const useMeetingNotesStore = create<MeetingNotesState>()((set, get) => ({
  notes: [],

  hydrate: async () => {
    const notes = await getAllMeetingNotes()
    set({ notes })
  },

  createNote: async (title, template) => {
    const now = new Date().toISOString()
    const note: MeetingNote = {
      id: crypto.randomUUID(), title, template,
      content: '', actionItems: [], participants: [],
      createdAt: now, updatedAt: now,
    }
    await putMeetingNote(note)
    set((s) => ({ notes: [note, ...s.notes] }))
  },

  deleteNote: async (id) => {
    await deleteMeetingNoteFromDb(id)
    set((s) => ({ notes: s.notes.filter((n) => n.id !== id) }))
  },

  updateContent: async (id, content) => {
    const note = get().notes.find((n) => n.id === id)
    if (!note) return
    const updated = { ...note, content, updatedAt: new Date().toISOString() }
    await putMeetingNote(updated)
    set((s) => ({ notes: s.notes.map((n) => (n.id === id ? updated : n)) }))
  },

  addActionItem: async (noteId, item) => {
    const note = get().notes.find((n) => n.id === noteId)
    if (!note) return
    const actionItem: ActionItem = { id: crypto.randomUUID(), ...item, done: false }
    const updated = {
      ...note,
      actionItems: [...note.actionItems, actionItem],
      updatedAt: new Date().toISOString(),
    }
    await putMeetingNote(updated)
    set((s) => ({ notes: s.notes.map((n) => (n.id === noteId ? updated : n)) }))
  },

  toggleActionItem: async (noteId, itemId) => {
    const note = get().notes.find((n) => n.id === noteId)
    if (!note) return
    const updated = {
      ...note,
      actionItems: note.actionItems.map((a) =>
        a.id === itemId ? { ...a, done: !a.done } : a,
      ),
      updatedAt: new Date().toISOString(),
    }
    await putMeetingNote(updated)
    set((s) => ({ notes: s.notes.map((n) => (n.id === noteId ? updated : n)) }))
  },

  addParticipant: async (noteId, name) => {
    const note = get().notes.find((n) => n.id === noteId)
    if (!note || note.participants.includes(name)) return
    const updated = {
      ...note,
      participants: [...note.participants, name],
      updatedAt: new Date().toISOString(),
    }
    await putMeetingNote(updated)
    set((s) => ({ notes: s.notes.map((n) => (n.id === noteId ? updated : n)) }))
  },

  removeParticipant: async (noteId, name) => {
    const note = get().notes.find((n) => n.id === noteId)
    if (!note) return
    const updated = {
      ...note,
      participants: note.participants.filter((p) => p !== name),
      updatedAt: new Date().toISOString(),
    }
    await putMeetingNote(updated)
    set((s) => ({ notes: s.notes.map((n) => (n.id === noteId ? updated : n)) }))
  },
}))
