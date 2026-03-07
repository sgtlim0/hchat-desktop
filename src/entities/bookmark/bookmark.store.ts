import { create } from 'zustand'
import type { Bookmark, HighlightColor } from '@/shared/types'
import { getAllBookmarks, putBookmark, deleteBookmarkFromDb } from '@/shared/lib/db'

interface BookmarkState {
  bookmarks: Bookmark[]
  searchQuery: string

  hydrate: () => Promise<void>
  addBookmark: (sessionId: string, messageId: string, text: string, color: HighlightColor) => Promise<void>
  removeBookmark: (id: string) => Promise<void>
  updateNote: (id: string, note: string) => Promise<void>
  addTag: (id: string, tag: string) => Promise<void>
  removeTag: (id: string, tag: string) => Promise<void>
  filterByTag: (tag: string) => Bookmark[]
  setSearchQuery: (query: string) => void
}

export const useBookmarkStore = create<BookmarkState>()((set, get) => ({
  bookmarks: [],
  searchQuery: '',

  hydrate: async () => {
    const bookmarks = await getAllBookmarks()
    set({ bookmarks })
  },

  addBookmark: async (sessionId, messageId, text, color) => {
    const bookmark: Bookmark = {
      id: crypto.randomUUID(), sessionId, messageId,
      text, color, tags: [],
      createdAt: new Date().toISOString(),
    }
    await putBookmark(bookmark)
    set((s) => ({ bookmarks: [bookmark, ...s.bookmarks] }))
  },

  removeBookmark: async (id) => {
    await deleteBookmarkFromDb(id)
    set((s) => ({ bookmarks: s.bookmarks.filter((b) => b.id !== id) }))
  },

  updateNote: async (id, note) => {
    const bookmark = get().bookmarks.find((b) => b.id === id)
    if (!bookmark) return
    const updated = { ...bookmark, note }
    await putBookmark(updated)
    set((s) => ({ bookmarks: s.bookmarks.map((b) => (b.id === id ? updated : b)) }))
  },

  addTag: async (id, tag) => {
    const bookmark = get().bookmarks.find((b) => b.id === id)
    if (!bookmark || bookmark.tags.includes(tag)) return
    const updated = { ...bookmark, tags: [...bookmark.tags, tag] }
    await putBookmark(updated)
    set((s) => ({ bookmarks: s.bookmarks.map((b) => (b.id === id ? updated : b)) }))
  },

  removeTag: async (id, tag) => {
    const bookmark = get().bookmarks.find((b) => b.id === id)
    if (!bookmark) return
    const updated = { ...bookmark, tags: bookmark.tags.filter((t) => t !== tag) }
    await putBookmark(updated)
    set((s) => ({ bookmarks: s.bookmarks.map((b) => (b.id === id ? updated : b)) }))
  },

  filterByTag: (tag) => {
    return get().bookmarks.filter((b) => b.tags.includes(tag))
  },

  setSearchQuery: (searchQuery) => set({ searchQuery }),
}))
