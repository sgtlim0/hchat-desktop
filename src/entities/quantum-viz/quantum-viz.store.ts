import { create } from 'zustand'
import type { QuantumDataset, QuantumCluster } from '@/shared/types'
import { getAllQuantumDatasets, putQuantumDataset, deleteQuantumDatasetFromDb } from '@/shared/lib/db'
interface QuantumVizState { datasets: QuantumDataset[]; selectedId: string | null; hydrate: () => void; createDataset: (title: string, dimensions: number) => void; deleteDataset: (id: string) => void; addPoints: (datasetId: string, points: number[][]) => void; addCluster: (datasetId: string, cluster: QuantumCluster) => void; selectDataset: (id: string | null) => void }
export const useQuantumVizStore = create<QuantumVizState>((set) => ({
  datasets: [], selectedId: null,
  hydrate: () => { getAllQuantumDatasets().then((datasets) => set({ datasets })) },
  createDataset: (title, dimensions) => { const d: QuantumDataset = { id: crypto.randomUUID(), title, dimensions, points: [], clusters: [], createdAt: new Date().toISOString() }; set((s) => ({ datasets: [d, ...s.datasets], selectedId: d.id })); putQuantumDataset(d) },
  deleteDataset: (id) => { set((s) => ({ datasets: s.datasets.filter((d) => d.id !== id), selectedId: s.selectedId === id ? null : s.selectedId })); deleteQuantumDatasetFromDb(id) },
  addPoints: (datasetId, points) => { set((s) => ({ datasets: s.datasets.map((d) => d.id === datasetId ? { ...d, points: [...d.points, ...points] } : d) })) },
  addCluster: (datasetId, cluster) => { set((s) => ({ datasets: s.datasets.map((d) => d.id === datasetId ? { ...d, clusters: [...d.clusters, cluster] } : d) })) },
  selectDataset: (id) => set({ selectedId: id }),
}))
