import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useMindMapStore } from '../mindmap.store'
import type { MindMap } from '@/shared/types'

vi.mock('@/shared/lib/db', () => ({
  getAllMindMaps: vi.fn(() => Promise.resolve([])),
  putMindMap: vi.fn(() => Promise.resolve()),
  deleteMindMapFromDb: vi.fn(() => Promise.resolve()),
}))

describe('MindMapStore', () => {
  beforeEach(() => {
    useMindMapStore.setState({
      mindMaps: [],
      selectedMindMapId: null,
    })
  })

  it('should create a mind map with a root node', () => {
    const { createMindMap } = useMindMapStore.getState()

    createMindMap('Project Ideas')

    const maps = useMindMapStore.getState().mindMaps
    expect(maps).toHaveLength(1)
    expect(maps[0].title).toBe('Project Ideas')
    expect(maps[0].nodes).toHaveLength(1)
    expect(maps[0].nodes[0].label).toBe('Project Ideas')
    expect(maps[0].nodes[0].parentId).toBeNull()
    expect(maps[0].nodes[0].level).toBe(0)
    expect(maps[0].rootId).toBe(maps[0].nodes[0].id)
    expect(maps[0].mermaidCode).toContain('mindmap')
    expect(useMindMapStore.getState().selectedMindMapId).toBe(maps[0].id)
  })

  it('should delete a mind map', () => {
    const now = new Date().toISOString()
    useMindMapStore.setState({
      mindMaps: [
        { id: 'm-1', title: 'A', rootId: 'r-1', nodes: [], mermaidCode: '', createdAt: now, updatedAt: now },
        { id: 'm-2', title: 'B', rootId: 'r-2', nodes: [], mermaidCode: '', createdAt: now, updatedAt: now },
      ],
      selectedMindMapId: 'm-1',
    })

    const { deleteMindMap } = useMindMapStore.getState()
    deleteMindMap('m-1')

    const state = useMindMapStore.getState()
    expect(state.mindMaps).toHaveLength(1)
    expect(state.mindMaps[0].id).toBe('m-2')
    expect(state.selectedMindMapId).toBeNull()
  })

  it('should add a child node', () => {
    const now = new Date().toISOString()
    const rootId = 'root-1'
    useMindMapStore.setState({
      mindMaps: [
        {
          id: 'm-1', title: 'Map', rootId, mermaidCode: '', createdAt: now, updatedAt: now,
          nodes: [{ id: rootId, label: 'Root', parentId: null, children: [], level: 0 }],
        },
      ],
    })

    const { addNode } = useMindMapStore.getState()
    addNode('m-1', 'Child A', rootId)

    const map = useMindMapStore.getState().mindMaps[0]
    expect(map.nodes).toHaveLength(2)

    const root = map.nodes.find((n) => n.id === rootId)!
    expect(root.children).toHaveLength(1)

    const child = map.nodes.find((n) => n.id !== rootId)!
    expect(child.label).toBe('Child A')
    expect(child.parentId).toBe(rootId)
    expect(child.level).toBe(1)
    expect(map.mermaidCode).toContain('Child A')
  })

  it('should remove a node and its descendants', () => {
    const now = new Date().toISOString()
    useMindMapStore.setState({
      mindMaps: [
        {
          id: 'm-1', title: 'Map', rootId: 'r', mermaidCode: '', createdAt: now, updatedAt: now,
          nodes: [
            { id: 'r', label: 'Root', parentId: null, children: ['a'], level: 0 },
            { id: 'a', label: 'A', parentId: 'r', children: ['b'], level: 1 },
            { id: 'b', label: 'B', parentId: 'a', children: [], level: 2 },
          ],
        },
      ],
    })

    const { removeNode } = useMindMapStore.getState()
    removeNode('m-1', 'a')

    const map = useMindMapStore.getState().mindMaps[0]
    expect(map.nodes).toHaveLength(1)
    expect(map.nodes[0].id).toBe('r')
    expect(map.nodes[0].children).toHaveLength(0)
  })

  it('should update mermaid code', () => {
    const now = new Date().toISOString()
    useMindMapStore.setState({
      mindMaps: [
        {
          id: 'm-1', title: 'Map', rootId: 'r', mermaidCode: '', createdAt: now, updatedAt: now,
          nodes: [
            { id: 'r', label: 'Root', parentId: null, children: ['a'], level: 0 },
            { id: 'a', label: 'Branch', parentId: 'r', children: [], level: 1 },
          ],
        },
      ],
    })

    const { updateMermaidCode } = useMindMapStore.getState()
    updateMermaidCode('m-1')

    const map = useMindMapStore.getState().mindMaps[0]
    expect(map.mermaidCode).toContain('mindmap')
    expect(map.mermaidCode).toContain('Root')
    expect(map.mermaidCode).toContain('Branch')
  })

  it('should select and deselect a mind map', () => {
    const { selectMindMap } = useMindMapStore.getState()

    selectMindMap('m-1')
    expect(useMindMapStore.getState().selectedMindMapId).toBe('m-1')

    selectMindMap(null)
    expect(useMindMapStore.getState().selectedMindMapId).toBeNull()
  })

  it('should hydrate from DB', async () => {
    const now = new Date().toISOString()
    const mockMaps: MindMap[] = [
      { id: 'm-1', title: 'From DB', rootId: 'r', nodes: [], mermaidCode: '', createdAt: now, updatedAt: now },
    ]

    const { getAllMindMaps } = await import('@/shared/lib/db')
    vi.mocked(getAllMindMaps).mockResolvedValueOnce(mockMaps)

    const { hydrate } = useMindMapStore.getState()
    hydrate()

    await new Promise((resolve) => setTimeout(resolve, 10))

    const maps = useMindMapStore.getState().mindMaps
    expect(maps).toHaveLength(1)
    expect(maps[0].title).toBe('From DB')
  })
})
