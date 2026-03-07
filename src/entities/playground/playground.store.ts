import { create } from 'zustand'
import type { CodePlayground, PlaygroundTab } from '@/shared/types'
import { getAllCodePlaygrounds, putCodePlayground, deleteCodePlaygroundFromDb } from '@/shared/lib/db'
interface PlaygroundState { playgrounds: CodePlayground[]; selectedId: string | null; hydrate: () => void; createPlayground: (title: string) => void; deletePlayground: (id: string) => void; updateTab: (pgId: string, tabId: string, code: string) => void; generatePreview: (id: string) => void; selectPlayground: (id: string | null) => void }
export const usePlaygroundStore = create<PlaygroundState>((set) => ({
  playgrounds: [], selectedId: null,
  hydrate: () => { getAllCodePlaygrounds().then((playgrounds) => set({ playgrounds })) },
  createPlayground: (title) => { const now = new Date().toISOString(); const tabs: PlaygroundTab[] = [{ id: 'html', language: 'html', code: '<h1>Hello</h1>' }, { id: 'css', language: 'css', code: 'h1 { color: blue; }' }, { id: 'js', language: 'javascript', code: '// JS here' }]; const p: CodePlayground = { id: crypto.randomUUID(), title, tabs, previewHtml: '', createdAt: now, updatedAt: now }; set((s) => ({ playgrounds: [p, ...s.playgrounds], selectedId: p.id })); putCodePlayground(p) },
  deletePlayground: (id) => { set((s) => ({ playgrounds: s.playgrounds.filter((p) => p.id !== id), selectedId: s.selectedId === id ? null : s.selectedId })); deleteCodePlaygroundFromDb(id) },
  updateTab: (pgId, tabId, code) => { set((s) => ({ playgrounds: s.playgrounds.map((p) => { if (p.id !== pgId) return p; const tabs = p.tabs.map((t) => t.id === tabId ? { ...t, code } : t); return { ...p, tabs, updatedAt: new Date().toISOString() } }) })) },
  generatePreview: (id) => { set((s) => ({ playgrounds: s.playgrounds.map((p) => { if (p.id !== id) return p; const html = p.tabs.find((t) => t.language === 'html')?.code ?? ''; const css = p.tabs.find((t) => t.language === 'css')?.code ?? ''; const js = p.tabs.find((t) => t.language === 'javascript')?.code ?? ''; return { ...p, previewHtml: '<html><head><style>' + css + '</style></head><body>' + html + '<script>' + js + '<\/script></body></html>' } }) })) },
  selectPlayground: (id) => set({ selectedId: id }),
}))
