import { useEffect, useRef, useState } from 'react'
import { Plus, Trash2, Search } from 'lucide-react'
import { useKnowledgeGraphStore } from '@/entities/knowledge-graph/knowledge-graph.store'
import { useTranslation } from '@/shared/i18n'
import type { GraphNode } from '@/shared/types'

const NODE_COLORS: Record<GraphNode['type'], string> = {
  session: '#3b82f6',
  document: '#10b981',
  knowledge: '#f59e0b',
  snippet: '#8b5cf6',
  topic: '#ef4444',
}

export function KnowledgeGraphPage() {
  const { t } = useTranslation()
  const nodes = useKnowledgeGraphStore((s) => s.nodes)
  const edges = useKnowledgeGraphStore((s) => s.edges)
  const selectedNodeId = useKnowledgeGraphStore((s) => s.selectedNodeId)
  const searchQuery = useKnowledgeGraphStore((s) => s.searchQuery)
  const filterType = useKnowledgeGraphStore((s) => s.filterType)
  const hydrate = useKnowledgeGraphStore((s) => s.hydrate)
  const addNode = useKnowledgeGraphStore((s) => s.addNode)
  const removeNode = useKnowledgeGraphStore((s) => s.removeNode)
  const setSelectedNodeId = useKnowledgeGraphStore((s) => s.setSelectedNodeId)
  const setSearchQuery = useKnowledgeGraphStore((s) => s.setSearchQuery)
  const setFilterType = useKnowledgeGraphStore((s) => s.setFilterType)
  const cyRef = useRef<HTMLDivElement>(null)
  const cyInstanceRef = useRef<any>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newLabel, setNewLabel] = useState('')
  const [newType, setNewType] = useState<GraphNode['type']>('topic')

  useEffect(() => { hydrate() }, [hydrate])

  // Initialize Cytoscape
  useEffect(() => {
    if (!cyRef.current) return
    let mounted = true

    import('cytoscape').then((mod) => {
      if (!mounted || !cyRef.current) return
      const cy = mod.default({
        container: cyRef.current,
        style: [
          { selector: 'node', style: { label: 'data(label)', 'background-color': 'data(color)', color: '#fff', 'text-valign': 'center', 'font-size': '11px', width: 40, height: 40, 'text-outline-width': 2, 'text-outline-color': 'data(color)' } },
          { selector: 'edge', style: { label: 'data(label)', 'line-color': '#94a3b8', 'target-arrow-color': '#94a3b8', 'target-arrow-shape': 'triangle', 'curve-style': 'bezier', 'font-size': '9px', color: '#94a3b8' } },
          { selector: 'node:selected', style: { 'border-width': 3, 'border-color': '#fff' } },
        ],
        layout: { name: 'cose', animate: false },
      })
      cy.on('tap', 'node', (e: any) => setSelectedNodeId(e.target.id()))
      cy.on('tap', (e: any) => { if (e.target === cy) setSelectedNodeId(null) })
      cyInstanceRef.current = cy
    })

    return () => { mounted = false; cyInstanceRef.current?.destroy() }
  }, [setSelectedNodeId])

  // Update Cytoscape data
  useEffect(() => {
    const cy = cyInstanceRef.current
    if (!cy) return
    const filteredNodes = nodes.filter((n) => {
      if (filterType !== 'all' && n.type !== filterType) return false
      if (searchQuery && !n.label.toLowerCase().includes(searchQuery.toLowerCase())) return false
      return true
    })
    const nodeIds = new Set(filteredNodes.map((n) => n.id))
    const filteredEdges = edges.filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target))

    cy.elements().remove()
    cy.add(filteredNodes.map((n) => ({
      data: { id: n.id, label: n.label, color: NODE_COLORS[n.type] },
    })))
    cy.add(filteredEdges.map((e) => ({
      data: { id: e.id, source: e.source, target: e.target, label: e.label },
    })))
    cy.layout({ name: 'cose', animate: false }).run()
  }, [nodes, edges, filterType, searchQuery])

  const handleAdd = async () => {
    if (!newLabel.trim()) return
    await addNode({
      id: crypto.randomUUID(), label: newLabel.trim(), type: newType, createdAt: new Date().toISOString(),
    })
    setNewLabel('')
    setShowAddModal(false)
  }

  const selectedNode = nodes.find((n) => n.id === selectedNodeId)
  const types: Array<GraphNode['type'] | 'all'> = ['all', 'session', 'document', 'knowledge', 'snippet', 'topic']

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h1 className="text-lg font-bold text-text-primary">{t('knowledgeGraph.title')}</h1>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
            <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t('common.search')} className="pl-8 pr-3 py-1.5 text-sm rounded-lg bg-surface-secondary border border-border focus:outline-none focus:ring-1 focus:ring-primary w-48" />
          </div>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value as any)} className="text-sm rounded-lg bg-surface-secondary border border-border px-2 py-1.5">
            {types.map((t) => <option key={t} value={t}>{t === 'all' ? '전체' : t}</option>)}
          </select>
          <button onClick={() => setShowAddModal(true)} className="p-1.5 rounded-lg bg-primary text-white hover:bg-primary/90" aria-label={t('common.add')}>
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Graph + Detail panel */}
      <div className="flex-1 flex overflow-hidden">
        <div ref={cyRef} className="flex-1 bg-surface" />
        {selectedNode && (
          <div className="w-64 border-l border-border p-4 space-y-3 overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-text-primary text-sm">{selectedNode.label}</h3>
              <button onClick={() => removeNode(selectedNode.id)} className="p-1 hover:bg-red-500/10 rounded" aria-label={t('common.delete')}>
                <Trash2 className="w-4 h-4 text-red-500" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: NODE_COLORS[selectedNode.type] }} />
              <span className="text-xs text-text-secondary">{selectedNode.type}</span>
            </div>
            <p className="text-xs text-text-tertiary">{new Date(selectedNode.createdAt).toLocaleDateString()}</p>
            <div className="text-xs text-text-secondary">
              <p>{t('knowledgeGraph.connections')}: {edges.filter((e) => e.source === selectedNode.id || e.target === selectedNode.id).length}</p>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="px-4 py-2 border-t border-border flex gap-4 text-xs text-text-secondary">
        {Object.entries(NODE_COLORS).map(([type, color]) => (
          <span key={type} className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
            {type}
          </span>
        ))}
        <span className="ml-auto">{t('knowledgeGraph.nodeCount')}: {nodes.length}</span>
      </div>

      {/* Add modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setShowAddModal(false)}
          onKeyDown={(e) => { if (e.key === 'Escape') setShowAddModal(false) }}
          role="button"
          tabIndex={0}
          aria-label="Close modal"
        >
          <div className="bg-surface rounded-xl p-6 w-80 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold text-text-primary">{t('knowledgeGraph.addNode')}</h3>
            <input value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder={t('knowledgeGraph.nodeName')} className="w-full px-3 py-2 text-sm rounded-lg bg-surface-secondary border border-border focus:outline-none focus:ring-1 focus:ring-primary"
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus onKeyDown={(e) => e.key === 'Enter' && handleAdd()} />
            <select value={newType} onChange={(e) => setNewType(e.target.value as GraphNode['type'])} className="w-full text-sm rounded-lg bg-surface-secondary border border-border px-3 py-2">
              {(['topic', 'session', 'document', 'knowledge', 'snippet'] as const).map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowAddModal(false)} className="px-3 py-1.5 text-sm rounded-lg bg-surface-secondary hover:bg-surface-tertiary">{t('common.cancel')}</button>
              <button onClick={handleAdd} className="px-3 py-1.5 text-sm rounded-lg bg-primary text-white hover:bg-primary/90">{t('common.add')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
