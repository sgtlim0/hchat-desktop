import { create } from 'zustand'
import type { MindMap, MindMapNode } from '@/shared/types'
import { getAllMindMaps, putMindMap, deleteMindMapFromDb } from '@/shared/lib/db'

function generateMermaidCode(nodes: MindMapNode[]): string {
  if (nodes.length === 0) return ''

  const lines = ['mindmap']
  const nodeMap = new Map(nodes.map((n) => [n.id, n]))

  function renderNode(nodeId: string, depth: number): void {
    const node = nodeMap.get(nodeId)
    if (!node) return
    const indent = '  '.repeat(depth + 1)
    lines.push(`${indent}${node.label}`)
    for (const childId of node.children) {
      renderNode(childId, depth + 1)
    }
  }

  const root = nodes.find((n) => n.parentId === null)
  if (root) {
    renderNode(root.id, 0)
  }

  return lines.join('\n')
}

interface MindMapState {
  mindMaps: MindMap[]
  selectedMindMapId: string | null

  hydrate: () => void
  createMindMap: (title: string) => void
  deleteMindMap: (id: string) => void
  addNode: (mapId: string, label: string, parentId: string | null) => void
  removeNode: (mapId: string, nodeId: string) => void
  updateMermaidCode: (mapId: string) => void
  selectMindMap: (id: string | null) => void
}

export const useMindMapStore = create<MindMapState>((set) => ({
  mindMaps: [],
  selectedMindMapId: null,

  hydrate: () => {
    getAllMindMaps()
      .then((mindMaps) => {
        set({ mindMaps })
      })
      .catch(console.error)
  },

  createMindMap: (title) => {
    const now = new Date().toISOString()
    const rootId = crypto.randomUUID()
    const rootNode: MindMapNode = {
      id: rootId,
      label: title,
      parentId: null,
      children: [],
      level: 0,
    }
    const mindMap: MindMap = {
      id: crypto.randomUUID(),
      title,
      rootId,
      nodes: [rootNode],
      mermaidCode: generateMermaidCode([rootNode]),
      createdAt: now,
      updatedAt: now,
    }

    set((state) => ({
      mindMaps: [mindMap, ...state.mindMaps],
      selectedMindMapId: mindMap.id,
    }))

    putMindMap(mindMap).catch(console.error)
  },

  deleteMindMap: (id) => {
    set((state) => ({
      mindMaps: state.mindMaps.filter((m) => m.id !== id),
      selectedMindMapId: state.selectedMindMapId === id ? null : state.selectedMindMapId,
    }))

    deleteMindMapFromDb(id).catch(console.error)
  },

  addNode: (mapId, label, parentId) => {
    set((state) => ({
      mindMaps: state.mindMaps.map((m) => {
        if (m.id !== mapId) return m

        const nodeId = crypto.randomUUID()
        const parentNode = parentId ? m.nodes.find((n) => n.id === parentId) : null
        const level = parentNode ? parentNode.level + 1 : 0

        const newNode: MindMapNode = {
          id: nodeId,
          label,
          parentId,
          children: [],
          level,
        }

        const updatedNodes = m.nodes.map((n) => {
          if (n.id === parentId) {
            return { ...n, children: [...n.children, nodeId] }
          }
          return n
        })

        const nodes = [...updatedNodes, newNode]
        const updated: MindMap = {
          ...m,
          nodes,
          mermaidCode: generateMermaidCode(nodes),
          updatedAt: new Date().toISOString(),
        }
        putMindMap(updated).catch(console.error)
        return updated
      }),
    }))
  },

  removeNode: (mapId, nodeId) => {
    set((state) => ({
      mindMaps: state.mindMaps.map((m) => {
        if (m.id !== mapId) return m

        const collectDescendants = (id: string): string[] => {
          const node = m.nodes.find((n) => n.id === id)
          if (!node) return [id]
          const desc = node.children.flatMap(collectDescendants)
          return [id, ...desc]
        }

        const toRemove = new Set(collectDescendants(nodeId))
        const targetNode = m.nodes.find((n) => n.id === nodeId)

        const nodes = m.nodes
          .filter((n) => !toRemove.has(n.id))
          .map((n) => {
            if (targetNode && n.id === targetNode.parentId) {
              return { ...n, children: n.children.filter((c) => c !== nodeId) }
            }
            return n
          })

        const updated: MindMap = {
          ...m,
          nodes,
          mermaidCode: generateMermaidCode(nodes),
          updatedAt: new Date().toISOString(),
        }
        putMindMap(updated).catch(console.error)
        return updated
      }),
    }))
  },

  updateMermaidCode: (mapId) => {
    set((state) => ({
      mindMaps: state.mindMaps.map((m) => {
        if (m.id !== mapId) return m
        const updated: MindMap = {
          ...m,
          mermaidCode: generateMermaidCode(m.nodes),
          updatedAt: new Date().toISOString(),
        }
        putMindMap(updated).catch(console.error)
        return updated
      }),
    }))
  },

  selectMindMap: (id) => {
    set({ selectedMindMapId: id })
  },
}))
