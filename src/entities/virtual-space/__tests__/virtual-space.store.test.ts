import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useVirtualSpaceStore } from '../virtual-space.store'
vi.mock('@/shared/lib/db', () => ({ getAllVirtualSpaces: vi.fn().mockResolvedValue([]), putVirtualSpace: vi.fn(), deleteVirtualSpaceFromDb: vi.fn() }))
describe('VirtualSpaceStore', () => {
  beforeEach(() => { useVirtualSpaceStore.setState({ spaces: [], selectedId: null }) })
  it('should create space', () => { useVirtualSpaceStore.getState().createSpace('Office', 'office'); expect(useVirtualSpaceStore.getState().spaces).toHaveLength(1) })
  it('should add object', () => { useVirtualSpaceStore.getState().createSpace('T', 'cafe'); const id = useVirtualSpaceStore.getState().spaces[0].id; useVirtualSpaceStore.getState().addObject(id, { id: 'o1', type: 'furniture', x: 0, y: 0, z: 0, label: 'Desk', color: '#8B4513' }); expect(useVirtualSpaceStore.getState().spaces[0].objects).toHaveLength(1) })
  it('should remove object', () => { useVirtualSpaceStore.getState().createSpace('T', 'gallery'); const id = useVirtualSpaceStore.getState().spaces[0].id; useVirtualSpaceStore.getState().addObject(id, { id: 'o1', type: 'decor', x: 0, y: 0, z: 0, label: 'Painting', color: '#fff' }); useVirtualSpaceStore.getState().removeObject(id, 'o1'); expect(useVirtualSpaceStore.getState().spaces[0].objects).toHaveLength(0) })
  it('should delete', () => { useVirtualSpaceStore.getState().createSpace('T', 'classroom'); useVirtualSpaceStore.getState().deleteSpace(useVirtualSpaceStore.getState().spaces[0].id); expect(useVirtualSpaceStore.getState().spaces).toHaveLength(0) })
})
