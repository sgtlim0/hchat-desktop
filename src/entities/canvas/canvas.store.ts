import { create } from 'zustand'
import type { Canvas, CanvasNode, CanvasEdge, CanvasNodeType } from '@/shared/types'
import {
  getAllCanvases, putCanvas, deleteCanvasFromDb,
  getCanvasNodes, putCanvasNode, deleteCanvasNodeFromDb,
  getCanvasEdges, putCanvasEdge, deleteCanvasEdgeFromDb,
} from '@/shared/lib/db'

interface CanvasState {
  canvases: Canvas[]
  currentCanvasId: string | null
  nodes: CanvasNode[]
  edges: CanvasEdge[]
  selectedNodeId: string | null
  zoom: number
  panX: number
  panY: number
  isDragging: boolean
  isConnecting: boolean

  hydrate: () => Promise<void>
  createCanvas: (title: string) => Promise<string>
  deleteCanvas: (id: string) => Promise<void>
  selectCanvas: (id: string) => Promise<void>
  addNode: (type: CanvasNodeType, x: number, y: number, content?: string) => Promise<void>
  updateNode: (id: string, updates: Partial<CanvasNode>) => Promise<void>
  removeNode: (id: string) => Promise<void>
  addEdge: (source: string, target: string, label?: string) => Promise<void>
  removeEdge: (id: string) => Promise<void>
  setSelectedNodeId: (id: string | null) => void
  setZoom: (zoom: number) => void
  setPan: (x: number, y: number) => void
  setDragging: (isDragging: boolean) => void
  setConnecting: (isConnecting: boolean) => void
}

function genId(): string {
  return crypto.randomUUID()
}

export const useCanvasStore = create<CanvasState>()((set, get) => ({
  canvases: [],
  currentCanvasId: null,
  nodes: [],
  edges: [],
  selectedNodeId: null,
  zoom: 1,
  panX: 0,
  panY: 0,
  isDragging: false,
  isConnecting: false,

  hydrate: async () => {
    const canvases = await getAllCanvases()
    set({ canvases })
  },

  createCanvas: async (title) => {
    const now = new Date().toISOString()
    const canvas: Canvas = { id: genId(), title, zoom: 1, panX: 0, panY: 0, createdAt: now, updatedAt: now }
    await putCanvas(canvas)
    set((s) => ({ canvases: [canvas, ...s.canvases], currentCanvasId: canvas.id, nodes: [], edges: [], zoom: 1, panX: 0, panY: 0 }))
    return canvas.id
  },

  deleteCanvas: async (id) => {
    await deleteCanvasFromDb(id)
    set((s) => ({
      canvases: s.canvases.filter((c) => c.id !== id),
      currentCanvasId: s.currentCanvasId === id ? null : s.currentCanvasId,
      nodes: s.currentCanvasId === id ? [] : s.nodes,
      edges: s.currentCanvasId === id ? [] : s.edges,
    }))
  },

  selectCanvas: async (id) => {
    const [nodes, edges] = await Promise.all([getCanvasNodes(id), getCanvasEdges(id)])
    const canvas = get().canvases.find((c) => c.id === id)
    set({
      currentCanvasId: id,
      nodes,
      edges,
      zoom: canvas?.zoom ?? 1,
      panX: canvas?.panX ?? 0,
      panY: canvas?.panY ?? 0,
      selectedNodeId: null,
    })
  },

  addNode: async (type, x, y, content = '') => {
    const canvasId = get().currentCanvasId
    if (!canvasId) return
    const now = new Date().toISOString()
    const node: CanvasNode = {
      id: genId(), canvasId, type, x, y, width: 200, height: 120,
      content, createdAt: now, updatedAt: now,
    }
    await putCanvasNode(node)
    set((s) => ({ nodes: [...s.nodes, node] }))
  },

  updateNode: async (id, updates) => {
    const node = get().nodes.find((n) => n.id === id)
    if (!node) return
    const updated = { ...node, ...updates, updatedAt: new Date().toISOString() }
    await putCanvasNode(updated)
    set((s) => ({ nodes: s.nodes.map((n) => (n.id === id ? updated : n)) }))
  },

  removeNode: async (id) => {
    await deleteCanvasNodeFromDb(id)
    set((s) => ({
      nodes: s.nodes.filter((n) => n.id !== id),
      edges: s.edges.filter((e) => e.source !== id && e.target !== id),
      selectedNodeId: s.selectedNodeId === id ? null : s.selectedNodeId,
    }))
  },

  addEdge: async (source, target, label) => {
    const canvasId = get().currentCanvasId
    if (!canvasId) return
    const edge: CanvasEdge = { id: genId(), canvasId, source, target, label }
    await putCanvasEdge(edge)
    set((s) => ({ edges: [...s.edges, edge] }))
  },

  removeEdge: async (id) => {
    await deleteCanvasEdgeFromDb(id)
    set((s) => ({ edges: s.edges.filter((e) => e.id !== id) }))
  },

  setSelectedNodeId: (selectedNodeId) => set({ selectedNodeId }),
  setZoom: (zoom) => set({ zoom: Math.max(0.1, Math.min(3, zoom)) }),
  setPan: (panX, panY) => set({ panX, panY }),
  setDragging: (isDragging) => set({ isDragging }),
  setConnecting: (isConnecting) => set({ isConnecting }),
}))
