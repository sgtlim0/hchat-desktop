import { create } from 'zustand'
import type { DigitalTwin, TwinPersonality } from '@/shared/types'
import { getAllDigitalTwins, putDigitalTwin, deleteDigitalTwinFromDb } from '@/shared/lib/db'
interface DigitalTwinState { twins: DigitalTwin[]; selectedId: string | null; hydrate: () => void; createTwin: (name: string) => void; deleteTwin: (id: string) => void; setPersonality: (id: string, p: TwinPersonality) => void; addPattern: (id: string, pattern: string) => void; toggleActive: (id: string) => void; selectTwin: (id: string | null) => void }
export const useDigitalTwinStore = create<DigitalTwinState>((set) => ({
  twins: [], selectedId: null,
  hydrate: () => { getAllDigitalTwins().then((twins) => set({ twins })) },
  createTwin: (name) => { const t: DigitalTwin = { id: crypto.randomUUID(), name, personality: { creativity: 50, accuracy: 80, humor: 30 }, learnedPatterns: [], autoResponses: [], isActive: false, createdAt: new Date().toISOString() }; set((s) => ({ twins: [t, ...s.twins], selectedId: t.id })); putDigitalTwin(t) },
  deleteTwin: (id) => { set((s) => ({ twins: s.twins.filter((t) => t.id !== id), selectedId: s.selectedId === id ? null : s.selectedId })); deleteDigitalTwinFromDb(id) },
  setPersonality: (id, p) => { set((s) => ({ twins: s.twins.map((t) => t.id === id ? { ...t, personality: p } : t) })) },
  addPattern: (id, pattern) => { set((s) => ({ twins: s.twins.map((t) => t.id === id ? { ...t, learnedPatterns: [...t.learnedPatterns, pattern] } : t) })) },
  toggleActive: (id) => { set((s) => ({ twins: s.twins.map((t) => t.id === id ? { ...t, isActive: !t.isActive } : t) })) },
  selectTwin: (id) => set({ selectedId: id }),
}))
