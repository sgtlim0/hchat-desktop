import { create } from 'zustand'
import type { GraphNode, GraphEdge } from '@/shared/types'
import {
  getAllGraphNodes, getAllGraphEdges, putGraphNode, putGraphEdge,
  deleteGraphNodeFromDb, deleteGraphEdgeFromDb,
} from '@/shared/lib/db'

interface KnowledgeGraphState {
  nodes: GraphNode[]
  edges: GraphEdge[]
  selectedNodeId: string | null
  searchQuery: string
  filterType: GraphNode['type'] | 'all'

  hydrate: () => Promise<void>
  addNode: (node: GraphNode) => Promise<void>
  removeNode: (id: string) => Promise<void>
  addEdge: (edge: GraphEdge) => Promise<void>
  removeEdge: (id: string) => Promise<void>
  setSelectedNodeId: (id: string | null) => void
  setSearchQuery: (query: string) => void
  setFilterType: (type: GraphNode['type'] | 'all') => void
  clearGraph: () => void
}

export const useKnowledgeGraphStore = create<KnowledgeGraphState>()((set) => ({
  nodes: [],
  edges: [],
  selectedNodeId: null,
  searchQuery: '',
  filterType: 'all',

  hydrate: async () => {
    const [nodes, edges] = await Promise.all([getAllGraphNodes(), getAllGraphEdges()])
    set({ nodes, edges })
  },

  addNode: async (node) => {
    await putGraphNode(node)
    set((s) => ({ nodes: [...s.nodes, node] }))
  },

  removeNode: async (id) => {
    await deleteGraphNodeFromDb(id)
    set((s) => ({
      nodes: s.nodes.filter((n) => n.id !== id),
      edges: s.edges.filter((e) => e.source !== id && e.target !== id),
      selectedNodeId: s.selectedNodeId === id ? null : s.selectedNodeId,
    }))
  },

  addEdge: async (edge) => {
    await putGraphEdge(edge)
    set((s) => ({ edges: [...s.edges, edge] }))
  },

  removeEdge: async (id) => {
    await deleteGraphEdgeFromDb(id)
    set((s) => ({ edges: s.edges.filter((e) => e.id !== id) }))
  },

  setSelectedNodeId: (selectedNodeId) => set({ selectedNodeId }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setFilterType: (filterType) => set({ filterType }),

  clearGraph: () => set({ nodes: [], edges: [], selectedNodeId: null }),
}))
