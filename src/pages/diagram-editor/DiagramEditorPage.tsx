import { useState, useEffect, useCallback, useRef } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useSessionStore } from '@/entities/session/session.store'
import { useDiagramEditorStore } from '@/entities/diagram-editor/diagram-editor.store'
import { useTranslation } from '@/shared/i18n'
import { Button } from '@/shared/ui/Button'
import type { DiagramType } from '@/shared/types'
import { ArrowLeft, Plus, Trash2, Star, Download, Search, GitBranch } from 'lucide-react'

const DIAGRAM_TEMPLATES: Record<DiagramType, string> = {
  flowchart: `graph TD\n  A[시작] --> B{조건}\n  B -->|Yes| C[처리]\n  B -->|No| D[종료]`,
  sequence: `sequenceDiagram\n  Alice->>Bob: 요청\n  Bob-->>Alice: 응답`,
  class: `classDiagram\n  class Animal {\n    +String name\n    +makeSound()\n  }`,
  er: `erDiagram\n  USER ||--o{ ORDER : places\n  ORDER ||--|{ LINE-ITEM : contains`,
  gantt: `gantt\n  title 프로젝트 일정\n  section 기획\n  요구사항 분석 :a1, 2026-01-01, 5d`,
  pie: `pie title 사용 비율\n  "ChatGPT" : 40\n  "Claude" : 35\n  "Gemini" : 25`,
  mindmap: `mindmap\n  root((AI))\n    NLP\n    Vision\n    Robotics`,
}

const DIAGRAM_TYPES: DiagramType[] = ['flowchart', 'sequence', 'class', 'er', 'gantt', 'pie', 'mindmap']

const TYPE_ICONS: Record<DiagramType, string> = {
  flowchart: '⬛',
  sequence: '↔',
  class: '📦',
  er: '🔗',
  gantt: '📊',
  pie: '🥧',
  mindmap: '🧠',
}

export function DiagramEditorPage() {
  const { t } = useTranslation()
  const setView = useSessionStore(useShallow((s) => s.setView))

  const {
    selectedDiagramId,
    searchQuery,
    hydrate,
    addDiagram,
    updateDiagram,
    deleteDiagram,
    selectDiagram,
    toggleFavorite,
    setSearchQuery,
    getFilteredDiagrams,
    getSelectedDiagram,
  } = useDiagramEditorStore(
    useShallow((s) => ({
      selectedDiagramId: s.selectedDiagramId,
      searchQuery: s.searchQuery,
      hydrate: s.hydrate,
      addDiagram: s.addDiagram,
      updateDiagram: s.updateDiagram,
      deleteDiagram: s.deleteDiagram,
      selectDiagram: s.selectDiagram,
      toggleFavorite: s.toggleFavorite,
      setSearchQuery: s.setSearchQuery,
      getFilteredDiagrams: s.getFilteredDiagrams,
      getSelectedDiagram: s.getSelectedDiagram,
    }))
  )

  const [code, setCode] = useState('')
  const [diagramType, setDiagramType] = useState<DiagramType>('flowchart')
  const [previewHtml, setPreviewHtml] = useState('')
  const [renderError, setRenderError] = useState('')
  const previewRef = useRef<HTMLDivElement>(null)
  const renderIdRef = useRef(0)

  const diagrams = getFilteredDiagrams()
  const selectedDiagram = getSelectedDiagram()

  useEffect(() => {
    hydrate()
  }, [hydrate])

  useEffect(() => {
    if (selectedDiagram) {
      setCode(selectedDiagram.code)
      setDiagramType(selectedDiagram.type)
    }
  }, [selectedDiagram])

  const renderPreview = useCallback(async (mermaidCode: string) => {
    if (!mermaidCode.trim()) {
      setPreviewHtml('')
      setRenderError('')
      return
    }

    const currentId = ++renderIdRef.current

    try {
      const mermaid = (await import('mermaid')).default
      mermaid.initialize({ startOnLoad: false, theme: 'default' })

      const { svg } = await mermaid.render(`preview-${currentId}`, mermaidCode)

      if (currentId === renderIdRef.current) {
        setPreviewHtml(svg)
        setRenderError('')
      }
    } catch (error) {
      if (currentId === renderIdRef.current) {
        setPreviewHtml('')
        setRenderError(t('diagram.renderError'))
      }
    }
  }, [t])

  useEffect(() => {
    const timer = setTimeout(() => {
      renderPreview(code)
    }, 500)
    return () => clearTimeout(timer)
  }, [code, renderPreview])

  const handleNewDiagram = () => {
    const template = DIAGRAM_TEMPLATES[diagramType]
    addDiagram(t('diagram.new'), diagramType, template)
  }

  const handleCodeChange = (newCode: string) => {
    setCode(newCode)
    if (selectedDiagramId) {
      updateDiagram(selectedDiagramId, { code: newCode })
    }
  }

  const handleTypeChange = (newType: DiagramType) => {
    setDiagramType(newType)
    if (selectedDiagramId) {
      updateDiagram(selectedDiagramId, { type: newType })
    }
  }

  const handleDeleteDiagram = (id: string) => {
    if (window.confirm(t('diagram.deleteConfirm'))) {
      deleteDiagram(id)
    }
  }

  const handleTemplateClick = (type: DiagramType) => {
    const template = DIAGRAM_TEMPLATES[type]
    setCode(template)
    setDiagramType(type)
    if (selectedDiagramId) {
      updateDiagram(selectedDiagramId, { code: template, type })
    }
  }

  const handleExportSvg = () => {
    if (!previewHtml) return

    const blob = new Blob([previewHtml], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${selectedDiagram?.title ?? 'diagram'}.svg`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex h-full flex-col bg-bg-primary">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border-primary px-4 py-3">
        <button
          onClick={() => setView('home')}
          className="rounded-lg p-1.5 text-text-secondary hover:bg-bg-tertiary"
          aria-label="back"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-text-primary">{t('diagram.title')}</h1>
          <p className="text-xs text-text-tertiary">{t('diagram.subtitle')}</p>
        </div>
        <Button onClick={handleNewDiagram} size="sm">
          <Plus size={16} className="mr-1" />
          {t('diagram.new')}
        </Button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar - diagram list */}
        <div className="flex w-64 flex-col border-r border-border-primary bg-bg-secondary">
          {/* Search */}
          <div className="p-3">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('diagram.titlePlaceholder')}
                className="w-full rounded-lg border border-border-primary bg-bg-primary py-1.5 pl-8 pr-3 text-sm text-text-primary placeholder:text-text-tertiary"
              />
            </div>
          </div>

          {/* Diagram list */}
          <div className="flex-1 overflow-y-auto px-2">
            {diagrams.length === 0 ? (
              <div className="p-4 text-center text-sm text-text-tertiary">
                <p>{t('diagram.empty')}</p>
                <p className="mt-1 text-xs">{t('diagram.emptyHint')}</p>
              </div>
            ) : (
              diagrams.map((diagram) => (
                <div
                  key={diagram.id}
                  role="button"
                  onClick={() => selectDiagram(diagram.id)}
                  className={`mb-1 flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                    selectedDiagramId === diagram.id
                      ? 'bg-accent-primary/10 text-accent-primary'
                      : 'text-text-secondary hover:bg-bg-tertiary'
                  }`}
                >
                  <span className="shrink-0">{TYPE_ICONS[diagram.type]}</span>
                  <span className="flex-1 truncate">{diagram.title}</span>
                  {diagram.isFavorite && (
                    <Star size={12} className="shrink-0 fill-yellow-400 text-yellow-400" />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Template list */}
          <div className="border-t border-border-primary p-3">
            <p className="mb-2 text-xs font-medium text-text-tertiary">{t('diagram.template')}</p>
            <div className="grid grid-cols-2 gap-1">
              {DIAGRAM_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => handleTemplateClick(type)}
                  className="rounded-md px-2 py-1 text-xs text-text-secondary hover:bg-bg-tertiary"
                >
                  {TYPE_ICONS[type]} {t(`diagram.type.${type}`)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main area - editor + preview */}
        {selectedDiagram ? (
          <div className="flex flex-1 flex-col overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center gap-2 border-b border-border-primary px-4 py-2">
              <input
                type="text"
                value={selectedDiagram.title}
                onChange={(e) => updateDiagram(selectedDiagram.id, { title: e.target.value })}
                className="flex-1 bg-transparent text-sm font-medium text-text-primary outline-none"
                placeholder={t('diagram.titlePlaceholder')}
              />
              <select
                value={diagramType}
                onChange={(e) => handleTypeChange(e.target.value as DiagramType)}
                className="rounded-md border border-border-primary bg-bg-secondary px-2 py-1 text-xs text-text-primary"
                aria-label={t('diagram.type')}
              >
                {DIAGRAM_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {t(`diagram.type.${type}`)}
                  </option>
                ))}
              </select>
              <button
                onClick={() => toggleFavorite(selectedDiagram.id)}
                className="rounded-md p-1.5 text-text-secondary hover:bg-bg-tertiary"
                aria-label="favorite"
              >
                <Star
                  size={16}
                  className={selectedDiagram.isFavorite ? 'fill-yellow-400 text-yellow-400' : ''}
                />
              </button>
              <button
                onClick={handleExportSvg}
                disabled={!previewHtml}
                className="rounded-md p-1.5 text-text-secondary hover:bg-bg-tertiary disabled:opacity-50"
                aria-label={t('diagram.exportSvg')}
              >
                <Download size={16} />
              </button>
              <button
                onClick={() => handleDeleteDiagram(selectedDiagram.id)}
                className="rounded-md p-1.5 text-text-secondary hover:text-danger"
                aria-label="delete"
              >
                <Trash2 size={16} />
              </button>
            </div>

            {/* Editor + Preview split */}
            <div className="flex flex-1 overflow-hidden">
              {/* Code editor */}
              <div className="flex flex-1 flex-col border-r border-border-primary">
                <div className="flex items-center gap-2 bg-bg-secondary px-3 py-1.5">
                  <GitBranch size={14} className="text-text-tertiary" />
                  <span className="text-xs font-medium text-text-tertiary">{t('diagram.code')}</span>
                </div>
                <textarea
                  value={code}
                  onChange={(e) => handleCodeChange(e.target.value)}
                  placeholder={t('diagram.codePlaceholder')}
                  className="flex-1 resize-none bg-bg-primary p-4 font-mono text-sm text-text-primary outline-none placeholder:text-text-tertiary"
                  spellCheck={false}
                />
              </div>

              {/* Preview */}
              <div className="flex flex-1 flex-col">
                <div className="flex items-center gap-2 bg-bg-secondary px-3 py-1.5">
                  <span className="text-xs font-medium text-text-tertiary">{t('diagram.preview')}</span>
                </div>
                <div
                  ref={previewRef}
                  className="flex flex-1 items-center justify-center overflow-auto p-4"
                  data-testid="preview-area"
                >
                  {renderError ? (
                    <p className="text-sm text-danger">{renderError}</p>
                  ) : previewHtml ? (
                    <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
                  ) : (
                    <p className="text-sm text-text-tertiary">{t('diagram.codePlaceholder')}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center">
              <GitBranch size={48} className="mx-auto mb-4 text-text-tertiary" />
              <p className="text-text-secondary">{t('diagram.empty')}</p>
              <p className="mt-1 text-sm text-text-tertiary">{t('diagram.emptyHint')}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
