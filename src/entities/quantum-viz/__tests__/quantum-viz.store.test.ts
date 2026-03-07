import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useQuantumVizStore } from '../quantum-viz.store'
vi.mock('@/shared/lib/db', () => new Proxy({}, { get: () => vi.fn().mockResolvedValue([]) }))
describe('QuantumVizStore', () => {
  beforeEach(() => { useQuantumVizStore.setState({ datasets: [], selectedId: null, rotateX: -20, rotateY: 30 }) })
  it('should create', () => { useQuantumVizStore.getState().createDataset('Data', 3); expect(useQuantumVizStore.getState().datasets).toHaveLength(1) })
  it('should add points', () => { useQuantumVizStore.getState().createDataset('D', 2); const id = useQuantumVizStore.getState().datasets[0].id; useQuantumVizStore.getState().addPoints(id, [[1,2],[3,4]]); expect(useQuantumVizStore.getState().datasets[0].points).toHaveLength(2) })
  it('should delete', () => { useQuantumVizStore.getState().createDataset('D', 2); useQuantumVizStore.getState().deleteDataset(useQuantumVizStore.getState().datasets[0].id); expect(useQuantumVizStore.getState().datasets).toHaveLength(0) })
})
