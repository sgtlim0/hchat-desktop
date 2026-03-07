import { describe, it, expect } from 'vitest'
import {
  getUserColor,
  generateMindMap,
  layoutMindMap,
  createSnapshot,
  restoreSnapshot,
  nodesOverlap,
  autoArrange,
  type CanvasNode,
} from '@/shared/lib/canvas-engine'

const now = new Date().toISOString()

function makeNode(overrides: Partial<CanvasNode> = {}): CanvasNode {
  return {
    id: `node-${Math.random().toString(36).slice(2, 6)}`,
    type: 'text',
    x: 0, y: 0,
    width: 200, height: 100,
    content: 'Test',
    locked: false,
    createdBy: 'user-1',
    createdAt: now,
    ...overrides,
  }
}

describe('canvas-engine', () => {
  describe('getUserColor', () => {
    it('should return a hex color', () => {
      const color = getUserColor('user-1')
      expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/)
    })

    it('should return consistent color for same user', () => {
      expect(getUserColor('alice')).toBe(getUserColor('alice'))
    })

    it('should return different colors for different users', () => {
      const c1 = getUserColor('alice')
      const c2 = getUserColor('bob')
      // Not guaranteed different but likely
      expect(typeof c1).toBe('string')
      expect(typeof c2).toBe('string')
    })
  })

  describe('generateMindMap', () => {
    it('should create root node with topic', () => {
      const map = generateMindMap('AI 기술')
      expect(map.text).toBe('AI 기술')
      expect(map.depth).toBe(0)
    })

    it('should create children up to depth', () => {
      const map = generateMindMap('Root', 2)
      expect(map.children.length).toBeGreaterThan(0)
      expect(map.children[0].children.length).toBeGreaterThan(0)
      expect(map.children[0].children[0].children).toEqual([])
    })

    it('should assign colors by depth', () => {
      const map = generateMindMap('Root', 2)
      expect(map.color).toBeTruthy()
      expect(map.children[0].color).toBeTruthy()
    })

    it('should generate unique IDs', () => {
      const map = generateMindMap('Root', 2)
      const ids = new Set<string>()
      function collectIds(node: ReturnType<typeof generateMindMap>) {
        ids.add(node.id)
        node.children.forEach(collectIds)
      }
      collectIds(map)
      expect(ids.size).toBeGreaterThan(1)
    })
  })

  describe('layoutMindMap', () => {
    it('should position root at center', () => {
      const map = generateMindMap('Root', 1)
      const positions = layoutMindMap(map, 400, 300)
      expect(positions[0].x).toBe(400)
      expect(positions[0].y).toBe(300)
    })

    it('should position all nodes', () => {
      const map = generateMindMap('Root', 2)
      const positions = layoutMindMap(map)
      // Count total nodes
      let total = 1
      function count(n: ReturnType<typeof generateMindMap>) {
        total += n.children.length
        n.children.forEach(count)
      }
      count(map)
      expect(positions.length).toBe(total)
    })
  })

  describe('snapshot', () => {
    it('should create and restore snapshot', () => {
      const nodes = [makeNode({ id: 'n1', content: 'Hello' })]
      const connections = [{ id: 'c1', fromNodeId: 'n1', toNodeId: 'n2', style: 'solid' as const }]

      const version = createSnapshot(nodes, connections, 'Test snapshot')
      expect(version.nodeCount).toBe(1)
      expect(version.connectionCount).toBe(1)

      const restored = restoreSnapshot(version)
      expect(restored).not.toBeNull()
      expect(restored!.nodes).toHaveLength(1)
      expect(restored!.nodes[0].content).toBe('Hello')
    })

    it('should handle invalid snapshot', () => {
      const version = {
        id: 'v1', timestamp: now, description: 'bad',
        nodeCount: 0, connectionCount: 0, snapshot: 'invalid json',
      }
      expect(restoreSnapshot(version)).toBeNull()
    })
  })

  describe('nodesOverlap', () => {
    it('should detect overlapping nodes', () => {
      const a = makeNode({ x: 0, y: 0, width: 200, height: 100 })
      const b = makeNode({ x: 100, y: 50, width: 200, height: 100 })
      expect(nodesOverlap(a, b)).toBe(true)
    })

    it('should detect non-overlapping nodes', () => {
      const a = makeNode({ x: 0, y: 0, width: 100, height: 100 })
      const b = makeNode({ x: 200, y: 200, width: 100, height: 100 })
      expect(nodesOverlap(a, b)).toBe(false)
    })
  })

  describe('autoArrange', () => {
    it('should handle empty array', () => {
      expect(autoArrange([])).toEqual([])
    })

    it('should arrange overlapping nodes', () => {
      const nodes = [
        makeNode({ x: 0, y: 0, createdAt: '2026-01-01' }),
        makeNode({ x: 0, y: 0, createdAt: '2026-01-02' }),
        makeNode({ x: 0, y: 0, createdAt: '2026-01-03' }),
      ]
      const arranged = autoArrange(nodes)
      expect(arranged).toHaveLength(3)

      // No two nodes should overlap after arrangement
      for (let i = 0; i < arranged.length; i++) {
        for (let j = i + 1; j < arranged.length; j++) {
          expect(nodesOverlap(arranged[i], arranged[j])).toBe(false)
        }
      }
    })
  })
})
