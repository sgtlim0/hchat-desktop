import React, { useEffect, useState } from 'react'
import { Network, Plus, Trash2, ChevronLeft, ChevronRight, Code, Copy } from 'lucide-react'
import { useMindMapStore } from '@/entities/mindmap/mindmap.store'
import { useTranslation } from '@/shared/i18n'
import type { MindMapNode } from '@/shared/types'

export function MindMapPage() {
  const { t } = useTranslation()
  const mindMaps = useMindMapStore((s) => s.mindMaps)
  const selectedMindMapId = useMindMapStore((s) => s.selectedMindMapId)
  const hydrate = useMindMapStore((s) => s.hydrate)
  const createMindMap = useMindMapStore((s) => s.createMindMap)
  const deleteMindMap = useMindMapStore((s) => s.deleteMindMap)
  const addNode = useMindMapStore((s) => s.addNode)
  const removeNode = useMindMapStore((s) => s.removeNode)
  const selectMindMap = useMindMapStore((s) => s.selectMindMap)

  const [showCreate, setShowCreate] = useState(false)
  const [title, setTitle] = useState('')
  const [newNodeLabel, setNewNodeLabel] = useState('')
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null)
  const [showMermaid, setShowMermaid] = useState(false)

  useEffect(() => { hydrate() }, [hydrate])

  const selected = mindMaps.find((m) => m.id === selectedMindMapId)

  const handleCreate = () => {
    if (!title.trim()) return
    createMindMap(title.trim())
    setTitle('')
    setShowCreate(false)
  }

  const handleAddNode = () => {
    if (!selected || !newNodeLabel.trim()) return
    const parentId = selectedParentId ?? selected.rootId
    addNode(selected.id, newNodeLabel.trim(), parentId)
    setNewNodeLabel('')
  }

  const handleCopyMermaid = () => {
    if (!selected?.mermaidCode) return
    navigator.clipboard.writeText(selected.mermaidCode)
  }

  const LEVEL_COLORS = [
    'text-primary', 'text-blue-500', 'text-purple-500',
    'text-green-500', 'text-amber-500', 'text-pink-500',
  ]

  const renderTree = (nodes: MindMapNode[], nodeId: string, depth: number): React.ReactNode => {
    const node = nodes.find((n) => n.id === nodeId)
    if (!node) return null

    const isSelected = selectedParentId === node.id
    const colorClass = LEVEL_COLORS[depth % LEVEL_COLORS.length]

    return (
      <div key={node.id} className="ml-4">
        <div className={`flex items-center gap-2 py-1 px-2 rounded-lg group ${isSelected ? 'bg-primary/10' : 'hover:bg-surface-secondary'}`}>
          {node.children.length > 0 && <ChevronRight className="w-3 h-3 text-text-tertiary" />}
          {node.children.length === 0 && <span className="w-3" />}
          <button
            onClick={() => setSelectedParentId(isSelected ? null : node.id)}
            className={`text-sm font-medium ${colorClass} hover:underline`}
          >
            {node.label}
          </button>
          {node.parentId !== null && (
            <button
              onClick={() => removeNode(selected!.id, node.id)}
              className="p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-red-500/10 transition-opacity"
            >
              <Trash2 className="w-3 h-3 text-red-500" />
            </button>
          )}
        </div>
        {node.children.map((childId) => renderTree(nodes, childId, depth + 1))}
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <h1 className="text-lg font-bold text-text-primary flex items-center gap-2">
          <Network className="w-5 h-5 text-primary" />{t('mindMap.title')}
        </h1>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-sm">
          <Plus className="w-4 h-4" />{t('mindMap.create')}
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Mind Map List */}
        {!selected && (
          <div className="flex-1 overflow-y-auto p-6">
            {mindMaps.length === 0 && <p className="text-center text-text-tertiary text-sm py-12">{t('mindMap.empty')}</p>}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {mindMaps.map((mm) => (
                <div key={mm.id} className="p-4 rounded-xl border border-border bg-surface hover:border-primary/40 transition-colors cursor-pointer"
                  onClick={() => { selectMindMap(mm.id); setSelectedParentId(null) }}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-text-primary text-sm truncate">{mm.title}</h3>
                    <button onClick={(e) => { e.stopPropagation(); deleteMindMap(mm.id) }} className="p-1 rounded hover:bg-red-500/10">
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-text-secondary">
                    <span>{mm.nodes.length} {t('mindMap.nodes')}</span>
                  </div>
                  <p className="text-xs text-text-tertiary mt-1">{new Date(mm.updatedAt).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Node Tree + Mermaid */}
        {selected && (
          <>
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <button onClick={() => { selectMindMap(null); setSelectedParentId(null) }}
                    className="p-1 rounded hover:bg-surface-secondary">
                    <ChevronLeft className="w-4 h-4 text-text-secondary" />
                  </button>
                  <h2 className="font-bold text-text-primary text-sm">{selected.title}</h2>
                  <span className="text-xs text-text-tertiary">{selected.nodes.length} {t('mindMap.nodes')}</span>
                </div>
                <button onClick={() => setShowMermaid(!showMermaid)}
                  className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded-lg ${showMermaid ? 'bg-primary/10 text-primary' : 'bg-surface-secondary text-text-secondary'}`}>
                  <Code className="w-3.5 h-3.5" />{t('mindMap.mermaid')}
                </button>
              </div>

              <div className="flex-1 flex overflow-hidden">
                {/* Tree View */}
                <div className="flex-1 overflow-y-auto p-4">
                  {selected.rootId && renderTree(selected.nodes, selected.rootId, 0)}

                  {/* Add Node */}
                  <div className="mt-4 ml-4 p-3 rounded-lg border border-dashed border-border">
                    <p className="text-xs text-text-tertiary mb-2">
                      {selectedParentId
                        ? `${t('mindMap.addTo')}: ${selected.nodes.find((n) => n.id === selectedParentId)?.label}`
                        : t('mindMap.addToRoot')}
                    </p>
                    <div className="flex gap-2">
                      <input value={newNodeLabel} onChange={(e) => setNewNodeLabel(e.target.value)}
                        placeholder={t('mindMap.nodeLabel')} className="flex-1 px-3 py-1.5 text-sm rounded-lg bg-surface-secondary border border-border"
                        onKeyDown={(e) => e.key === 'Enter' && handleAddNode()} />
                      <button onClick={handleAddNode} className="px-3 py-1.5 text-sm bg-primary/10 text-primary rounded-lg">
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Mermaid Preview */}
                {showMermaid && (
                  <div className="w-80 border-l border-border flex flex-col">
                    <div className="flex items-center justify-between px-3 py-2 border-b border-border">
                      <span className="text-xs font-semibold text-text-secondary">{t('mindMap.mermaidCode')}</span>
                      <button onClick={handleCopyMermaid} className="p-1 rounded hover:bg-surface-secondary" title={t('common.copy')}>
                        <Copy className="w-3.5 h-3.5 text-text-tertiary" />
                      </button>
                    </div>
                    <pre className="flex-1 overflow-auto p-3 text-xs font-mono text-text-secondary bg-surface-secondary/50 leading-relaxed">
                      {selected.mermaidCode || t('mindMap.noCode')}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setShowCreate(false)}
          onKeyDown={(e) => { if (e.key === 'Escape') setShowCreate(false) }}
          role="button"
          tabIndex={0}
          aria-label="Close modal"
        >
          <div className="bg-surface rounded-xl p-6 w-80 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold text-text-primary">{t('mindMap.create')}</h3>
            <input value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder={t('mindMap.titlePlaceholder')} className="w-full px-3 py-2 text-sm rounded-lg bg-surface-secondary border border-border"
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()} />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowCreate(false)} className="px-3 py-1.5 text-sm rounded-lg bg-surface-secondary">{t('common.cancel')}</button>
              <button onClick={handleCreate} className="px-3 py-1.5 text-sm rounded-lg bg-primary text-white">{t('common.create')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
