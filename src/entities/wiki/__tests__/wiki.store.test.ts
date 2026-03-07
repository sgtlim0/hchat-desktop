import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useWikiStore } from '../wiki.store'
vi.mock('@/shared/lib/db', () => ({ getAllWikiPages: vi.fn().mockResolvedValue([]), putWikiPage: vi.fn(), deleteWikiPageFromDb: vi.fn() }))
describe('WikiStore', () => {
  beforeEach(() => { useWikiStore.setState({ pages: [], selectedPageId: null, searchQuery: '' }) })
  it('should create page', () => { useWikiStore.getState().createPage('Home', 'general'); expect(useWikiStore.getState().pages).toHaveLength(1); expect(useWikiStore.getState().pages[0].version).toBe(1) })
  it('should update content and increment version', () => { useWikiStore.getState().createPage('T', 'g'); const id = useWikiStore.getState().pages[0].id; useWikiStore.getState().updateContent(id, 'New content'); expect(useWikiStore.getState().pages[0].version).toBe(2) })
  it('should add tag', () => { useWikiStore.getState().createPage('T', 'g'); useWikiStore.getState().addTag(useWikiStore.getState().pages[0].id, 'important'); expect(useWikiStore.getState().pages[0].tags).toContain('important') })
  it('should delete', () => { useWikiStore.getState().createPage('T', 'g'); useWikiStore.getState().deletePage(useWikiStore.getState().pages[0].id); expect(useWikiStore.getState().pages).toHaveLength(0) })
})
