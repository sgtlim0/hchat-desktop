import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useKnowledgeGraphStore } from '../knowledge-graph.store'

vi.mock('@/shared/lib/db', () => ({
  getAllGraphNodes: vi.fn().mockResolvedValue([]),
  getAllGraphEdges: vi.fn().mockResolvedValue([]),
  putGraphNode: vi.fn().mockResolvedValue(undefined),
  putGraphEdge: vi.fn().mockResolvedValue(undefined),
  deleteGraphNodeFromDb: vi.fn().mockResolvedValue(undefined),
  deleteGraphEdgeFromDb: vi.fn().mockResolvedValue(undefined),
}))

const makeNode = (id: string, type: 'session' | 'topic' = 'topic') => ({
  id, label: `Node ${id}`, type, createdAt: '2026-01-01T00:00:00Z',
})

const makeEdge = (id: string, source: string, target: string) => ({
  id, source, target, label: 'related', weight: 1, createdAt: '2026-01-01T00:00:00Z',
})

describe('KnowledgeGraphStore', () => {
  beforeEach(() => {
    useKnowledgeGraphStore.setState({
      nodes: [], edges: [], selectedNodeId: null, searchQuery: '', filterType: 'all',
    })
  })

  it('should have empty initial state', () => {
    const s = useKnowledgeGraphStore.getState()
    expect(s.nodes).toEqual([])
    expect(s.edges).toEqual([])
    expect(s.selectedNodeId).toBeNull()
  })

  it('should hydrate from db', async () => {
    const { getAllGraphNodes, getAllGraphEdges } = await import('@/shared/lib/db')
    vi.mocked(getAllGraphNodes).mockResolvedValue([makeNode('1')])
    vi.mocked(getAllGraphEdges).mockResolvedValue([makeEdge('e1', '1', '2')])
    await useKnowledgeGraphStore.getState().hydrate()
    expect(useKnowledgeGraphStore.getState().nodes).toHaveLength(1)
    expect(useKnowledgeGraphStore.getState().edges).toHaveLength(1)
  })

  it('should add a node', async () => {
    await useKnowledgeGraphStore.getState().addNode(makeNode('1'))
    expect(useKnowledgeGraphStore.getState().nodes).toHaveLength(1)
    expect(useKnowledgeGraphStore.getState().nodes[0].id).toBe('1')
  })

  it('should remove a node and its edges', async () => {
    await useKnowledgeGraphStore.getState().addNode(makeNode('1'))
    await useKnowledgeGraphStore.getState().addNode(makeNode('2'))
    await useKnowledgeGraphStore.getState().addEdge(makeEdge('e1', '1', '2'))
    await useKnowledgeGraphStore.getState().removeNode('1')
    expect(useKnowledgeGraphStore.getState().nodes).toHaveLength(1)
    expect(useKnowledgeGraphStore.getState().edges).toHaveLength(0)
  })

  it('should clear selectedNodeId when removed node is selected', async () => {
    await useKnowledgeGraphStore.getState().addNode(makeNode('1'))
    useKnowledgeGraphStore.getState().setSelectedNodeId('1')
    await useKnowledgeGraphStore.getState().removeNode('1')
    expect(useKnowledgeGraphStore.getState().selectedNodeId).toBeNull()
  })

  it('should add and remove edges', async () => {
    await useKnowledgeGraphStore.getState().addEdge(makeEdge('e1', '1', '2'))
    expect(useKnowledgeGraphStore.getState().edges).toHaveLength(1)
    await useKnowledgeGraphStore.getState().removeEdge('e1')
    expect(useKnowledgeGraphStore.getState().edges).toHaveLength(0)
  })

  it('should set search query', () => {
    useKnowledgeGraphStore.getState().setSearchQuery('test')
    expect(useKnowledgeGraphStore.getState().searchQuery).toBe('test')
  })

  it('should set filter type', () => {
    useKnowledgeGraphStore.getState().setFilterType('session')
    expect(useKnowledgeGraphStore.getState().filterType).toBe('session')
  })

  it('should clear graph', async () => {
    await useKnowledgeGraphStore.getState().addNode(makeNode('1'))
    await useKnowledgeGraphStore.getState().addEdge(makeEdge('e1', '1', '2'))
    useKnowledgeGraphStore.getState().setSelectedNodeId('1')
    useKnowledgeGraphStore.getState().clearGraph()
    const s = useKnowledgeGraphStore.getState()
    expect(s.nodes).toEqual([])
    expect(s.edges).toEqual([])
    expect(s.selectedNodeId).toBeNull()
  })
})
