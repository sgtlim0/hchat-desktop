/**
 * Collaborative AI Canvas Engine — Infinite canvas with AI blocks,
 * multi-cursor collaboration, mind map generation, version timeline.
 */

export interface CanvasNode {
  id: string
  type: 'text' | 'ai-prompt' | 'image' | 'code' | 'diagram' | 'sticky'
  x: number
  y: number
  width: number
  height: number
  content: string
  style?: {
    color?: string
    fontSize?: number
    bgColor?: string
    borderColor?: string
  }
  locked: boolean
  createdBy: string
  createdAt: string
}

export interface CanvasConnection {
  id: string
  fromNodeId: string
  toNodeId: string
  label?: string
  style: 'solid' | 'dashed' | 'arrow'
}

export interface CanvasCursor {
  userId: string
  userName: string
  x: number
  y: number
  color: string
  lastUpdate: number
}

export interface CanvasVersion {
  id: string
  timestamp: string
  description: string
  nodeCount: number
  connectionCount: number
  snapshot: string // JSON serialized state
}

export interface MindMapNode {
  id: string
  text: string
  children: MindMapNode[]
  depth: number
  color: string
}

const CURSOR_COLORS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B',
  '#8B5CF6', '#EC4899', '#06B6D4', '#F97316',
]

/** Assign a consistent color to a user */
export function getUserColor(userId: string): string {
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    hash = (hash << 5) - hash + userId.charCodeAt(i)
    hash |= 0
  }
  return CURSOR_COLORS[Math.abs(hash) % CURSOR_COLORS.length]
}

/** Generate mind map from a topic (hierarchical structure) */
export function generateMindMap(topic: string, depth = 3): MindMapNode {
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']

  function createNode(text: string, d: number): MindMapNode {
    const children: MindMapNode[] = []
    if (d < depth) {
      const childCount = Math.max(2, 4 - d)
      for (let i = 0; i < childCount; i++) {
        children.push(
          createNode(`${text} - 하위 ${i + 1}`, d + 1),
        )
      }
    }
    return {
      id: `mm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      text,
      children,
      depth: d,
      color: colors[d % colors.length],
    }
  }

  return createNode(topic, 0)
}

/** Calculate mind map node positions (radial layout) */
export function layoutMindMap(
  root: MindMapNode,
  centerX = 400,
  centerY = 300,
  radiusStep = 150,
): { nodeId: string; x: number; y: number; text: string; color: string }[] {
  const positions: { nodeId: string; x: number; y: number; text: string; color: string }[] = []

  function traverse(node: MindMapNode, angle: number, spread: number, radius: number) {
    const x = centerX + Math.cos(angle) * radius
    const y = centerY + Math.sin(angle) * radius
    positions.push({ nodeId: node.id, x, y, text: node.text, color: node.color })

    if (node.children.length > 0) {
      const childSpread = spread / node.children.length
      const startAngle = angle - spread / 2 + childSpread / 2

      node.children.forEach((child, i) => {
        traverse(child, startAngle + i * childSpread, childSpread * 0.8, radius + radiusStep)
      })
    }
  }

  positions.push({ nodeId: root.id, x: centerX, y: centerY, text: root.text, color: root.color })
  if (root.children.length > 0) {
    const childSpread = (2 * Math.PI) / root.children.length
    root.children.forEach((child, i) => {
      traverse(child, i * childSpread - Math.PI / 2, childSpread * 0.8, radiusStep)
    })
  }

  return positions
}

/** Create a canvas version snapshot */
export function createSnapshot(
  nodes: CanvasNode[],
  connections: CanvasConnection[],
  description: string,
): CanvasVersion {
  return {
    id: `ver-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toISOString(),
    description,
    nodeCount: nodes.length,
    connectionCount: connections.length,
    snapshot: JSON.stringify({ nodes, connections }),
  }
}

/** Restore canvas state from a version snapshot */
export function restoreSnapshot(version: CanvasVersion): {
  nodes: CanvasNode[]
  connections: CanvasConnection[]
} | null {
  try {
    const data = JSON.parse(version.snapshot)
    return {
      nodes: data.nodes ?? [],
      connections: data.connections ?? [],
    }
  } catch {
    return null
  }
}

/** Check if two nodes overlap */
export function nodesOverlap(a: CanvasNode, b: CanvasNode): boolean {
  return !(
    a.x + a.width < b.x ||
    b.x + b.width < a.x ||
    a.y + a.height < b.y ||
    b.y + b.height < a.y
  )
}

/** Auto-arrange nodes to avoid overlap */
export function autoArrange(nodes: CanvasNode[], padding = 20): CanvasNode[] {
  if (nodes.length === 0) return []

  const sorted = [...nodes].sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  const arranged: CanvasNode[] = [sorted[0]]

  for (let i = 1; i < sorted.length; i++) {
    let node = { ...sorted[i] }
    let attempts = 0
    while (attempts < 50 && arranged.some((a) => nodesOverlap(a, node))) {
      node = { ...node, x: node.x + node.width + padding, y: node.y }
      if (node.x > 1600) {
        node = { ...node, x: 0, y: node.y + node.height + padding }
      }
      attempts++
    }
    arranged.push(node)
  }

  return arranged
}
