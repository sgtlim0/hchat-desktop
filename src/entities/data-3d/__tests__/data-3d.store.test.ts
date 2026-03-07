import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useData3DStore } from '../data-3d.store'
vi.mock('@/shared/lib/db', () => ({ getAllData3DScenes: vi.fn().mockResolvedValue([]), putData3DScene: vi.fn(), deleteData3DSceneFromDb: vi.fn() }))
describe('Data3DStore', () => {
  beforeEach(() => { useData3DStore.setState({ scenes: [], selectedId: null, rotateX: -20, rotateY: 30 }) })
  it('should create scene', () => { useData3DStore.getState().createScene('Sales', '3d-bar'); expect(useData3DStore.getState().scenes).toHaveLength(1) })
  it('should add point', () => { useData3DStore.getState().createScene('T', '3d-scatter'); const id = useData3DStore.getState().scenes[0].id; useData3DStore.getState().addPoint(id, { x: 1, y: 2, z: 3, label: 'A' }); expect(useData3DStore.getState().scenes[0].points).toHaveLength(1) })
  it('should set rotation', () => { useData3DStore.getState().setRotation(45, 60); expect(useData3DStore.getState().rotateX).toBe(45) })
  it('should delete', () => { useData3DStore.getState().createScene('T', '3d-pie'); useData3DStore.getState().deleteScene(useData3DStore.getState().scenes[0].id); expect(useData3DStore.getState().scenes).toHaveLength(0) })
})
