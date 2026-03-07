import { create } from 'zustand'
import type { OkrObjective, KeyResult } from '@/shared/types'
import { getAllOkrObjectives, putOkrObjective, deleteOkrObjectiveFromDb } from '@/shared/lib/db'
interface OkrState { objectives: OkrObjective[]; selectedId: string | null; hydrate: () => void; createObjective: (title: string, quarter: string) => void; deleteObjective: (id: string) => void; addKeyResult: (objId: string, kr: KeyResult) => void; updateKeyResult: (objId: string, krId: string, current: number) => void; selectObjective: (id: string | null) => void }
export const useOkrStore = create<OkrState>((set) => ({
  objectives: [], selectedId: null,
  hydrate: () => { getAllOkrObjectives().then((objectives) => set({ objectives })) },
  createObjective: (title, quarter) => { const now = new Date().toISOString(); const o: OkrObjective = { id: crypto.randomUUID(), title, quarter, keyResults: [], progress: 0, status: 'active', createdAt: now, updatedAt: now }; set((s) => ({ objectives: [o, ...s.objectives] })); putOkrObjective(o) },
  deleteObjective: (id) => { set((s) => ({ objectives: s.objectives.filter((o) => o.id !== id), selectedId: s.selectedId === id ? null : s.selectedId })); deleteOkrObjectiveFromDb(id) },
  addKeyResult: (objId, kr) => { set((s) => ({ objectives: s.objectives.map((o) => { if (o.id !== objId) return o; const krs = [...o.keyResults, kr]; const progress = krs.length ? Math.round(krs.reduce((a, k) => a + (k.current / k.target) * 100, 0) / krs.length) : 0; const u = { ...o, keyResults: krs, progress, updatedAt: new Date().toISOString() }; putOkrObjective(u); return u }) })) },
  updateKeyResult: (objId, krId, current) => { set((s) => ({ objectives: s.objectives.map((o) => { if (o.id !== objId) return o; const krs = o.keyResults.map((k) => k.id === krId ? { ...k, current } : k); const progress = krs.length ? Math.round(krs.reduce((a, k) => a + (k.current / k.target) * 100, 0) / krs.length) : 0; const u = { ...o, keyResults: krs, progress, updatedAt: new Date().toISOString() }; putOkrObjective(u); return u }) })) },
  selectObjective: (id) => set({ selectedId: id }),
}))
