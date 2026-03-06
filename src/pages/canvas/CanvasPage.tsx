import { useState, useRef, useCallback, useEffect, type MouseEvent, type WheelEvent } from 'react'
import { Plus, Trash2, Type, Code, Image, GitBranch, MessageSquare, Link, ZoomIn, ZoomOut, Hand, MousePointer } from 'lucide-react'
import { useCanvasStore } from '@/entities/canvas/canvas.store'
import { useTranslation } from '@/shared/i18n'
import type { CanvasNodeType } from '@/shared/types'

const NODE_ICONS: Record<CanvasNodeType, typeof Type> = {
  text: Type, code: Code, image: Image, diagram: GitBranch, chat: MessageSquare, link: Link,
}

const NODE_COLORS: Record<CanvasNodeType, string> = {
  text: 'border-blue-400', code: 'border-purple-400', image: 'border-green-400',
  diagram: 'border-amber-400', chat: 'border-pink-400', link: 'border-cyan-400',
}

export function CanvasPage() {
  const { t } = useTranslation()
  const canvases = useCanvasStore((s) => s.canvases)
  const currentCanvasId = useCanvasStore((s) => s.currentCanvasId)
  const nodes = useCanvasStore((s) => s.nodes)
  const edges = useCanvasStore((s) => s.edges)
  const selectedNodeId = useCanvasStore((s) => s.selectedNodeId)
  const zoom = useCanvasStore((s) => s.zoom)
  const panX = useCanvasStore((s) => s.panX)
  const panY = useCanvasStore((s) => s.panY)
  const hydrate = useCanvasStore((s) => s.hydrate)
  const createCanvas = useCanvasStore((s) => s.createCanvas)
  const selectCanvas = useCanvasStore((s) => s.selectCanvas)
  const deleteCanvas = useCanvasStore((s) => s.deleteCanvas)
  const addNode = useCanvasStore((s) => s.addNode)
  const updateNode = useCanvasStore((s) => s.updateNode)
  const removeNode = useCanvasStore((s) => s.removeNode)
  const setSelectedNodeId = useCanvasStore((s) => s.setSelectedNodeId)
  const setZoom = useCanvasStore((s) => s.setZoom)
  const setPan = useCanvasStore((s) => s.setPan)
  const [tool, setTool] = useState<'select' | 'pan'>('select')
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const [dragNodeId, setDragNodeId] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const canvasRef = useRef<HTMLDivElement>(null)

  useEffect(() => { hydrate() }, [hydrate])

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.1 : 0.1
    setZoom(zoom + delta)
  }, [zoom, setZoom])

  const handleCanvasMouseDown = useCallback((e: MouseEvent) => {
    if (tool === 'pan' || e.button === 1) {
      setIsPanning(true)
      setPanStart({ x: e.clientX - panX, y: e.clientY - panY })
    } else if (tool === 'select') {
      setSelectedNodeId(null)
    }
  }, [tool, panX, panY, setSelectedNodeId])

  const handleCanvasMouseMove = useCallback((e: MouseEvent) => {
    if (isPanning) {
      setPan(e.clientX - panStart.x, e.clientY - panStart.y)
    }
    if (dragNodeId) {
      const rect = canvasRef.current?.getBoundingClientRect()
      if (!rect) return
      const x = (e.clientX - rect.left - panX) / zoom - dragOffset.x
      const y = (e.clientY - rect.top - panY) / zoom - dragOffset.y
      updateNode(dragNodeId, { x: Math.round(x), y: Math.round(y) })
    }
  }, [isPanning, panStart, dragNodeId, dragOffset, zoom, panX, panY, setPan, updateNode])

  const handleCanvasMouseUp = useCallback(() => {
    setIsPanning(false)
    setDragNodeId(null)
  }, [])

  const handleNodeMouseDown = useCallback((e: MouseEvent, nodeId: string) => {
    e.stopPropagation()
    setSelectedNodeId(nodeId)
    if (tool === 'select') {
      const node = nodes.find((n) => n.id === nodeId)
      if (!node) return
      const rect = canvasRef.current?.getBoundingClientRect()
      if (!rect) return
      const mouseX = (e.clientX - rect.left - panX) / zoom
      const mouseY = (e.clientY - rect.top - panY) / zoom
      setDragNodeId(nodeId)
      setDragOffset({ x: mouseX - node.x, y: mouseY - node.y })
    }
  }, [tool, nodes, zoom, panX, panY, setSelectedNodeId])

  const handleAddNode = useCallback((type: CanvasNodeType) => {
    const centerX = (-panX + 400) / zoom
    const centerY = (-panY + 300) / zoom
    addNode(type, Math.round(centerX), Math.round(centerY))
  }, [addNode, zoom, panX, panY])

  // Empty state — canvas list
  if (!currentCanvasId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-6 p-6">
        <h1 className="text-2xl font-bold text-text-primary">{t('canvas.title')}</h1>
        <p className="text-text-secondary text-sm">{t('canvas.description')}</p>
        <button onClick={() => createCanvas(t('canvas.untitled'))} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 flex items-center gap-2">
          <Plus className="w-4 h-4" />{t('canvas.create')}
        </button>
        {canvases.length > 0 && (
          <div className="w-full max-w-sm space-y-2 mt-4">
            {canvases.map((c) => (
              <div key={c.id} className="flex items-center justify-between p-3 rounded-lg bg-surface-secondary hover:bg-surface-tertiary cursor-pointer" onClick={() => selectCanvas(c.id)}>
                <span className="text-sm text-text-primary">{c.title}</span>
                <button onClick={(e) => { e.stopPropagation(); deleteCanvas(c.id) }} className="p-1 hover:bg-red-500/10 rounded" aria-label={t('common.delete')}>
                  <Trash2 className="w-3.5 h-3.5 text-red-500" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  const selectedNode = nodes.find((n) => n.id === selectedNodeId)
  const nodeTypes: CanvasNodeType[] = ['text', 'code', 'image', 'diagram', 'chat', 'link']

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-surface-secondary/50">
        <button onClick={() => setTool('select')} className={`p-1.5 rounded ${tool === 'select' ? 'bg-primary/20 text-primary' : 'text-text-secondary hover:bg-surface-tertiary'}`} aria-label="Select">
          <MousePointer className="w-4 h-4" />
        </button>
        <button onClick={() => setTool('pan')} className={`p-1.5 rounded ${tool === 'pan' ? 'bg-primary/20 text-primary' : 'text-text-secondary hover:bg-surface-tertiary'}`} aria-label="Pan">
          <Hand className="w-4 h-4" />
        </button>
        <div className="w-px h-5 bg-border mx-1" />
        {nodeTypes.map((type) => {
          const Icon = NODE_ICONS[type]
          return (
            <button key={type} onClick={() => handleAddNode(type)} className="p-1.5 rounded text-text-secondary hover:bg-surface-tertiary" aria-label={`Add ${type}`}>
              <Icon className="w-4 h-4" />
            </button>
          )
        })}
        <div className="w-px h-5 bg-border mx-1" />
        <button onClick={() => setZoom(zoom + 0.1)} className="p-1.5 rounded text-text-secondary hover:bg-surface-tertiary" aria-label="Zoom in"><ZoomIn className="w-4 h-4" /></button>
        <span className="text-xs text-text-tertiary min-w-[40px] text-center">{Math.round(zoom * 100)}%</span>
        <button onClick={() => setZoom(zoom - 0.1)} className="p-1.5 rounded text-text-secondary hover:bg-surface-tertiary" aria-label="Zoom out"><ZoomOut className="w-4 h-4" /></button>
        {selectedNode && (
          <>
            <div className="w-px h-5 bg-border mx-1" />
            <button onClick={() => removeNode(selectedNode.id)} className="p-1.5 rounded text-red-500 hover:bg-red-500/10" aria-label={t('common.delete')}>
              <Trash2 className="w-4 h-4" />
            </button>
          </>
        )}
      </div>

      {/* Canvas area */}
      <div
        ref={canvasRef}
        className="flex-1 overflow-hidden relative bg-[#f8f9fa] dark:bg-[#1a1b1e] cursor-crosshair"
        style={{ cursor: tool === 'pan' || isPanning ? 'grab' : 'default' }}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onMouseLeave={handleCanvasMouseUp}
        onWheel={handleWheel}
      >
        {/* Grid pattern */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30" style={{ transform: `translate(${panX % (20 * zoom)}px, ${panY % (20 * zoom)}px)` }}>
          <defs><pattern id="grid" width={20 * zoom} height={20 * zoom} patternUnits="userSpaceOnUse"><path d={`M ${20 * zoom} 0 L 0 0 0 ${20 * zoom}`} fill="none" stroke="currentColor" strokeWidth="0.5" className="text-text-tertiary" /></pattern></defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        {/* Transform container */}
        <div style={{ transform: `translate(${panX}px, ${panY}px) scale(${zoom})`, transformOrigin: '0 0' }}>
          {/* Edges */}
          <svg className="absolute top-0 left-0 w-[10000px] h-[10000px] pointer-events-none">
            {edges.map((edge) => {
              const src = nodes.find((n) => n.id === edge.source)
              const tgt = nodes.find((n) => n.id === edge.target)
              if (!src || !tgt) return null
              return (
                <line key={edge.id} x1={src.x + src.width / 2} y1={src.y + src.height / 2} x2={tgt.x + tgt.width / 2} y2={tgt.y + tgt.height / 2} stroke="#94a3b8" strokeWidth={2} />
              )
            })}
          </svg>

          {/* Nodes */}
          {nodes.map((node) => {
            const Icon = NODE_ICONS[node.type]
            const isSelected = node.id === selectedNodeId
            return (
              <div
                key={node.id}
                className={`absolute rounded-lg border-2 bg-surface shadow-md p-3 ${NODE_COLORS[node.type]} ${isSelected ? 'ring-2 ring-primary' : ''}`}
                style={{ left: node.x, top: node.y, width: node.width, minHeight: node.height }}
                onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
              >
                <div className="flex items-center gap-1.5 mb-2">
                  <Icon className="w-3.5 h-3.5 text-text-secondary" />
                  <span className="text-xs font-medium text-text-secondary">{node.type}</span>
                </div>
                <p className="text-xs text-text-primary whitespace-pre-wrap break-words">{node.content || t('canvas.emptyNode')}</p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
