import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useCanvasStore } from '../canvas.store'

vi.mock('@/shared/lib/db', () => ({
  getAllCanvases: vi.fn().mockResolvedValue([]),
  putCanvas: vi.fn().mockResolvedValue(undefined),
  deleteCanvasFromDb: vi.fn().mockResolvedValue(undefined),
  getCanvasNodes: vi.fn().mockResolvedValue([]),
  putCanvasNode: vi.fn().mockResolvedValue(undefined),
  deleteCanvasNodeFromDb: vi.fn().mockResolvedValue(undefined),
  getCanvasEdges: vi.fn().mockResolvedValue([]),
  putCanvasEdge: vi.fn().mockResolvedValue(undefined),
  deleteCanvasEdgeFromDb: vi.fn().mockResolvedValue(undefined),
}))

describe('CanvasStore', () => {
  beforeEach(() => {
    useCanvasStore.setState({
      canvases: [], currentCanvasId: null, nodes: [], edges: [],
      selectedNodeId: null, zoom: 1, panX: 0, panY: 0, isDragging: false, isConnecting: false,
    })
  })

  it('should have empty initial state', () => {
    const s = useCanvasStore.getState()
    expect(s.canvases).toEqual([])
    expect(s.currentCanvasId).toBeNull()
    expect(s.nodes).toEqual([])
    expect(s.zoom).toBe(1)
  })

  it('should create a canvas', async () => {
    const id = await useCanvasStore.getState().createCanvas('My Canvas')
    expect(id).toBeTruthy()
    expect(useCanvasStore.getState().canvases).toHaveLength(1)
    expect(useCanvasStore.getState().canvases[0].title).toBe('My Canvas')
    expect(useCanvasStore.getState().currentCanvasId).toBe(id)
  })

  it('should delete a canvas', async () => {
    const id = await useCanvasStore.getState().createCanvas('Test')
    await useCanvasStore.getState().deleteCanvas(id)
    expect(useCanvasStore.getState().canvases).toHaveLength(0)
    expect(useCanvasStore.getState().currentCanvasId).toBeNull()
  })

  it('should add a node to current canvas', async () => {
    await useCanvasStore.getState().createCanvas('Test')
    await useCanvasStore.getState().addNode('text', 100, 200, 'Hello')
    expect(useCanvasStore.getState().nodes).toHaveLength(1)
    expect(useCanvasStore.getState().nodes[0].type).toBe('text')
    expect(useCanvasStore.getState().nodes[0].x).toBe(100)
    expect(useCanvasStore.getState().nodes[0].content).toBe('Hello')
  })

  it('should not add node when no canvas selected', async () => {
    await useCanvasStore.getState().addNode('text', 0, 0)
    expect(useCanvasStore.getState().nodes).toHaveLength(0)
  })

  it('should update a node', async () => {
    await useCanvasStore.getState().createCanvas('Test')
    await useCanvasStore.getState().addNode('text', 0, 0, 'Old')
    const nodeId = useCanvasStore.getState().nodes[0].id
    await useCanvasStore.getState().updateNode(nodeId, { content: 'New', x: 50 })
    const updated = useCanvasStore.getState().nodes[0]
    expect(updated.content).toBe('New')
    expect(updated.x).toBe(50)
  })

  it('should remove a node and its edges', async () => {
    await useCanvasStore.getState().createCanvas('Test')
    await useCanvasStore.getState().addNode('text', 0, 0)
    await useCanvasStore.getState().addNode('code', 100, 100)
    const [n1, n2] = useCanvasStore.getState().nodes
    await useCanvasStore.getState().addEdge(n1.id, n2.id)
    await useCanvasStore.getState().removeNode(n1.id)
    expect(useCanvasStore.getState().nodes).toHaveLength(1)
    expect(useCanvasStore.getState().edges).toHaveLength(0)
  })

  it('should add and remove edges', async () => {
    await useCanvasStore.getState().createCanvas('Test')
    await useCanvasStore.getState().addNode('text', 0, 0)
    await useCanvasStore.getState().addNode('text', 100, 0)
    const [n1, n2] = useCanvasStore.getState().nodes
    await useCanvasStore.getState().addEdge(n1.id, n2.id, 'connects')
    expect(useCanvasStore.getState().edges).toHaveLength(1)
    expect(useCanvasStore.getState().edges[0].label).toBe('connects')
    await useCanvasStore.getState().removeEdge(useCanvasStore.getState().edges[0].id)
    expect(useCanvasStore.getState().edges).toHaveLength(0)
  })

  it('should set zoom with min/max clamping', () => {
    useCanvasStore.getState().setZoom(2.5)
    expect(useCanvasStore.getState().zoom).toBe(2.5)
    useCanvasStore.getState().setZoom(0.05)
    expect(useCanvasStore.getState().zoom).toBe(0.1)
    useCanvasStore.getState().setZoom(5)
    expect(useCanvasStore.getState().zoom).toBe(3)
  })

  it('should set pan', () => {
    useCanvasStore.getState().setPan(100, -50)
    expect(useCanvasStore.getState().panX).toBe(100)
    expect(useCanvasStore.getState().panY).toBe(-50)
  })

  it('should set dragging and connecting state', () => {
    useCanvasStore.getState().setDragging(true)
    expect(useCanvasStore.getState().isDragging).toBe(true)
    useCanvasStore.getState().setConnecting(true)
    expect(useCanvasStore.getState().isConnecting).toBe(true)
  })

  it('should clear selectedNodeId when removed', async () => {
    await useCanvasStore.getState().createCanvas('Test')
    await useCanvasStore.getState().addNode('text', 0, 0)
    const nodeId = useCanvasStore.getState().nodes[0].id
    useCanvasStore.getState().setSelectedNodeId(nodeId)
    await useCanvasStore.getState().removeNode(nodeId)
    expect(useCanvasStore.getState().selectedNodeId).toBeNull()
  })
})
