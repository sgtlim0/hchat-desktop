import { create } from 'zustand'
import type { Data3DScene, Data3DPoint } from '@/shared/types'
import { getAllData3DScenes, putData3DScene, deleteData3DSceneFromDb } from '@/shared/lib/db'
interface Data3DState { scenes: Data3DScene[]; selectedId: string | null; rotateX: number; rotateY: number; hydrate: () => void; createScene: (title: string, chartType: Data3DScene['chartType']) => void; deleteScene: (id: string) => void; addPoint: (sceneId: string, point: Data3DPoint) => void; setRotation: (x: number, y: number) => void; selectScene: (id: string | null) => void }
export const useData3DStore = create<Data3DState>((set) => ({
  scenes: [], selectedId: null, rotateX: -20, rotateY: 30,
  hydrate: () => { getAllData3DScenes().then((scenes) => set({ scenes })) },
  createScene: (title, chartType) => { const s: Data3DScene = { id: crypto.randomUUID(), title, points: [], chartType, createdAt: new Date().toISOString() }; set((st) => ({ scenes: [s, ...st.scenes], selectedId: s.id })); putData3DScene(s) },
  deleteScene: (id) => { set((s) => ({ scenes: s.scenes.filter((sc) => sc.id !== id), selectedId: s.selectedId === id ? null : s.selectedId })); deleteData3DSceneFromDb(id) },
  addPoint: (sceneId, point) => { set((s) => ({ scenes: s.scenes.map((sc) => sc.id === sceneId ? { ...sc, points: [...sc.points, point] } : sc) })) },
  setRotation: (rotateX, rotateY) => set({ rotateX, rotateY }),
  selectScene: (id) => set({ selectedId: id }),
}))
