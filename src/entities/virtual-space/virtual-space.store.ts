import { create } from 'zustand'
import type { VirtualSpace, SpaceObject } from '@/shared/types'
import { getAllVirtualSpaces, putVirtualSpace, deleteVirtualSpaceFromDb } from '@/shared/lib/db'
interface VirtualSpaceState { spaces: VirtualSpace[]; selectedId: string | null; hydrate: () => void; createSpace: (title: string, template: VirtualSpace['template']) => void; deleteSpace: (id: string) => void; addObject: (spaceId: string, obj: SpaceObject) => void; removeObject: (spaceId: string, objId: string) => void; selectSpace: (id: string | null) => void }
export const useVirtualSpaceStore = create<VirtualSpaceState>((set) => ({
  spaces: [], selectedId: null,
  hydrate: () => { getAllVirtualSpaces().then((spaces) => set({ spaces })) },
  createSpace: (title, template) => { const now = new Date().toISOString(); const s: VirtualSpace = { id: crypto.randomUUID(), title, template, objects: [], createdAt: now, updatedAt: now }; set((st) => ({ spaces: [s, ...st.spaces], selectedId: s.id })); putVirtualSpace(s) },
  deleteSpace: (id) => { set((s) => ({ spaces: s.spaces.filter((sp) => sp.id !== id), selectedId: s.selectedId === id ? null : s.selectedId })); deleteVirtualSpaceFromDb(id) },
  addObject: (spaceId, obj) => { set((s) => ({ spaces: s.spaces.map((sp) => sp.id === spaceId ? { ...sp, objects: [...sp.objects, obj], updatedAt: new Date().toISOString() } : sp) })) },
  removeObject: (spaceId, objId) => { set((s) => ({ spaces: s.spaces.map((sp) => sp.id === spaceId ? { ...sp, objects: sp.objects.filter((o) => o.id !== objId) } : sp) })) },
  selectSpace: (id) => set({ selectedId: id }),
}))
