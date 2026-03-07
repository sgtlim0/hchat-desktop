import { create } from 'zustand'
import type { WikiPage } from '@/shared/types'
import { getAllWikiPages, putWikiPage, deleteWikiPageFromDb } from '@/shared/lib/db'
interface WikiState { pages: WikiPage[]; selectedPageId: string | null; searchQuery: string; hydrate: () => void; createPage: (title: string, category: string) => void; deletePage: (id: string) => void; updateContent: (id: string, content: string) => void; addTag: (id: string, tag: string) => void; setSearchQuery: (q: string) => void; selectPage: (id: string | null) => void }
export const useWikiStore = create<WikiState>((set) => ({
  pages: [], selectedPageId: null, searchQuery: '',
  hydrate: () => { getAllWikiPages().then((pages) => set({ pages })) },
  createPage: (title, category) => { const now = new Date().toISOString(); const p: WikiPage = { id: crypto.randomUUID(), title, content: '', category, linkedPages: [], version: 1, tags: [], createdAt: now, updatedAt: now }; set((s) => ({ pages: [p, ...s.pages], selectedPageId: p.id })); putWikiPage(p) },
  deletePage: (id) => { set((s) => ({ pages: s.pages.filter((p) => p.id !== id), selectedPageId: s.selectedPageId === id ? null : s.selectedPageId })); deleteWikiPageFromDb(id) },
  updateContent: (id, content) => { set((s) => ({ pages: s.pages.map((p) => { if (p.id !== id) return p; const u = { ...p, content, version: p.version + 1, updatedAt: new Date().toISOString() }; putWikiPage(u); return u }) })) },
  addTag: (id, tag) => { set((s) => ({ pages: s.pages.map((p) => p.id === id && !p.tags.includes(tag) ? { ...p, tags: [...p.tags, tag] } : p) })) },
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  selectPage: (id) => set({ selectedPageId: id }),
}))
