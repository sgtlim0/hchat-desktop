import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useBookmarkStore } from '../bookmark.store'

vi.mock('@/shared/lib/db', () => ({
  getAllBookmarks: vi.fn().mockResolvedValue([]),
  putBookmark: vi.fn().mockResolvedValue(undefined),
  deleteBookmarkFromDb: vi.fn().mockResolvedValue(undefined),
}))

describe('BookmarkStore', () => {
  beforeEach(() => { useBookmarkStore.setState({ bookmarks: [], searchQuery: '' }) })

  it('should have empty initial state', () => {
    const state = useBookmarkStore.getState()
    expect(state.bookmarks).toEqual([])
    expect(state.searchQuery).toBe('')
  })

  it('should add a bookmark', async () => {
    await useBookmarkStore.getState().addBookmark('s1', 'm1', 'Highlighted text', 'yellow')
    const bookmarks = useBookmarkStore.getState().bookmarks
    expect(bookmarks).toHaveLength(1)
    expect(bookmarks[0].text).toBe('Highlighted text')
    expect(bookmarks[0].color).toBe('yellow')
    expect(bookmarks[0].tags).toEqual([])
  })

  it('should remove a bookmark', async () => {
    await useBookmarkStore.getState().addBookmark('s1', 'm1', 'Text', 'green')
    const id = useBookmarkStore.getState().bookmarks[0].id
    await useBookmarkStore.getState().removeBookmark(id)
    expect(useBookmarkStore.getState().bookmarks).toHaveLength(0)
  })

  it('should update note', async () => {
    await useBookmarkStore.getState().addBookmark('s1', 'm1', 'T', 'blue')
    const id = useBookmarkStore.getState().bookmarks[0].id
    await useBookmarkStore.getState().updateNote(id, 'My note')
    expect(useBookmarkStore.getState().bookmarks[0].note).toBe('My note')
  })

  it('should add and remove tags', async () => {
    await useBookmarkStore.getState().addBookmark('s1', 'm1', 'T', 'pink')
    const id = useBookmarkStore.getState().bookmarks[0].id
    await useBookmarkStore.getState().addTag(id, 'important')
    await useBookmarkStore.getState().addTag(id, 'review')
    expect(useBookmarkStore.getState().bookmarks[0].tags).toEqual(['important', 'review'])

    await useBookmarkStore.getState().removeTag(id, 'important')
    expect(useBookmarkStore.getState().bookmarks[0].tags).toEqual(['review'])
  })

  it('should not add duplicate tag', async () => {
    await useBookmarkStore.getState().addBookmark('s1', 'm1', 'T', 'yellow')
    const id = useBookmarkStore.getState().bookmarks[0].id
    await useBookmarkStore.getState().addTag(id, 'dup')
    await useBookmarkStore.getState().addTag(id, 'dup')
    expect(useBookmarkStore.getState().bookmarks[0].tags).toEqual(['dup'])
  })

  it('should filter by tag', async () => {
    await useBookmarkStore.getState().addBookmark('s1', 'm1', 'A', 'yellow')
    await useBookmarkStore.getState().addBookmark('s2', 'm2', 'B', 'green')
    const id1 = useBookmarkStore.getState().bookmarks[0].id
    await useBookmarkStore.getState().addTag(id1, 'work')
    const filtered = useBookmarkStore.getState().filterByTag('work')
    expect(filtered).toHaveLength(1)
    expect(filtered[0].text).toBe('B')
  })

  it('should set search query', () => {
    useBookmarkStore.getState().setSearchQuery('test')
    expect(useBookmarkStore.getState().searchQuery).toBe('test')
  })
})
