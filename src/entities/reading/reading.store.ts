import { create } from 'zustand'
import type { BookNote } from '@/shared/types'
import { getAllBookNotes, putBookNote, deleteBookNoteFromDb } from '@/shared/lib/db'
interface ReadingState { books: BookNote[]; selectedBookId: string | null; hydrate: () => void; addBook: (title: string, author: string, genre: string) => void; deleteBook: (id: string) => void; updateBook: (id: string, updates: Partial<BookNote>) => void; addQuote: (id: string, quote: string) => void; selectBook: (id: string | null) => void }
export const useReadingStore = create<ReadingState>((set) => ({
  books: [], selectedBookId: null,
  hydrate: () => { getAllBookNotes().then((books) => set({ books })) },
  addBook: (title, author, genre) => { const now = new Date().toISOString(); const b: BookNote = { id: crypto.randomUUID(), title, author, genre, summary: '', quotes: [], rating: 0, status: 'wishlist', createdAt: now, updatedAt: now }; set((s) => ({ books: [b, ...s.books] })); putBookNote(b) },
  deleteBook: (id) => { set((s) => ({ books: s.books.filter((b) => b.id !== id), selectedBookId: s.selectedBookId === id ? null : s.selectedBookId })); deleteBookNoteFromDb(id) },
  updateBook: (id, updates) => { set((s) => ({ books: s.books.map((b) => { if (b.id !== id) return b; const u = { ...b, ...updates, updatedAt: new Date().toISOString() }; putBookNote(u); return u }) })) },
  addQuote: (id, quote) => { set((s) => ({ books: s.books.map((b) => { if (b.id !== id) return b; const u = { ...b, quotes: [...b.quotes, quote], updatedAt: new Date().toISOString() }; putBookNote(u); return u }) })) },
  selectBook: (id) => set({ selectedBookId: id }),
}))
