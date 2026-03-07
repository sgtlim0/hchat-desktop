import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useReadingStore } from '../reading.store'
vi.mock('@/shared/lib/db', () => ({ getAllBookNotes: vi.fn().mockResolvedValue([]), putBookNote: vi.fn().mockResolvedValue(undefined), deleteBookNoteFromDb: vi.fn().mockResolvedValue(undefined) }))
describe('ReadingStore', () => {
  beforeEach(() => { useReadingStore.setState({ books: [], selectedBookId: null }) })
  it('should add book', () => { useReadingStore.getState().addBook('Clean Code', 'Robert Martin', 'Programming'); expect(useReadingStore.getState().books).toHaveLength(1); expect(useReadingStore.getState().books[0].status).toBe('wishlist') })
  it('should add quote', () => { useReadingStore.getState().addBook('B', 'A', 'G'); useReadingStore.getState().addQuote(useReadingStore.getState().books[0].id, 'Great quote'); expect(useReadingStore.getState().books[0].quotes).toHaveLength(1) })
  it('should update book', () => { useReadingStore.getState().addBook('B', 'A', 'G'); useReadingStore.getState().updateBook(useReadingStore.getState().books[0].id, { status: 'reading', rating: 4 }); expect(useReadingStore.getState().books[0].status).toBe('reading') })
  it('should delete book', () => { useReadingStore.getState().addBook('B', 'A', 'G'); useReadingStore.getState().deleteBook(useReadingStore.getState().books[0].id); expect(useReadingStore.getState().books).toHaveLength(0) })
})
