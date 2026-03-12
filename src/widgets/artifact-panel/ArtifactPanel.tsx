import { useCallback, useState } from 'react'
import { X, Download, Code, Eye, ChevronLeft, ChevronRight, Copy, Check, Trash2, ChevronDown } from 'lucide-react'
import { useArtifactStore } from '@/entities/artifact/artifact.store'
import { useTranslation } from '@/shared/i18n'
import { ArtifactPreview } from './ArtifactPreview'
import type { Artifact } from '@/shared/types'

interface ArtifactPanelProps {
  sessionId: string
}

export function ArtifactPanel({ sessionId }: ArtifactPanelProps) {
  const { t } = useTranslation()
  const artifact = useArtifactStore((s) => s.getActiveArtifact())
  const artifacts = useArtifactStore((s) => s.artifacts[sessionId] ?? [])
  const viewMode = useArtifactStore((s) => s.viewMode)
  const setViewMode = useArtifactStore((s) => s.setViewMode)
  const closePanel = useArtifactStore((s) => s.closePanel)
  const setCurrentVersion = useArtifactStore((s) => s.setCurrentVersion)
  const openArtifact = useArtifactStore((s) => s.openArtifact)
  const deleteArtifact = useArtifactStore((s) => s.deleteArtifact)
  const [copied, setCopied] = useState(false)
  const [showSelector, setShowSelector] = useState(false)

  const handleDownload = useCallback(() => {
    if (!artifact) return
    const currentVersion = artifact.versions[artifact.currentVersionIndex]
    if (!currentVersion) return

    const ext = getFileExtension(artifact)
    const blob = new Blob([currentVersion.content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${artifact.title}.${ext}`
    a.click()
    URL.revokeObjectURL(url)
  }, [artifact])

  const handleCopy = useCallback(async () => {
    if (!artifact) return
    const currentVersion = artifact.versions[artifact.currentVersionIndex]
    if (!currentVersion) return
    await navigator.clipboard.writeText(currentVersion.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [artifact])

  const handleDelete = useCallback(() => {
    if (!artifact) return
    deleteArtifact(artifact.id)
  }, [artifact, deleteArtifact])

  const handleVersionPrev = useCallback(() => {
    if (!artifact || artifact.currentVersionIndex <= 0) return
    setCurrentVersion(artifact.id, artifact.currentVersionIndex - 1)
  }, [artifact, setCurrentVersion])

  const handleVersionNext = useCallback(() => {
    if (!artifact || artifact.currentVersionIndex >= artifact.versions.length - 1) return
    setCurrentVersion(artifact.id, artifact.currentVersionIndex + 1)
  }, [artifact, setCurrentVersion])

  if (!artifact) {
    return (
      <div className="flex items-center justify-center h-full text-text-tertiary text-sm">
        {t('artifact.noArtifacts')}
      </div>
    )
  }

  const hasMultipleVersions = artifact.versions.length > 1
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768

  return (
    <div className={`flex flex-col h-full bg-surface border-l border-border ${
      isMobile ? 'fixed inset-0 z-50' : ''
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {/* Artifact selector dropdown */}
          {artifacts.length > 1 && (
            <div className="relative">
              <button
                onClick={() => setShowSelector(!showSelector)}
                className="flex items-center gap-1 text-sm font-medium text-text-primary hover:text-primary transition truncate max-w-[200px]"
              >
                {artifact.title}
                <ChevronDown size={14} />
              </button>
              {showSelector && (
                <ArtifactSelector
                  artifacts={artifacts}
                  activeId={artifact.id}
                  onSelect={(id) => { openArtifact(id); setShowSelector(false) }}
                  onClose={() => setShowSelector(false)}
                />
              )}
            </div>
          )}
          {artifacts.length <= 1 && (
            <span className="text-sm font-medium text-text-primary truncate">
              {artifact.title}
            </span>
          )}
          <span className="text-xs text-text-tertiary flex-shrink-0">
            {artifact.language}
          </span>
        </div>
        <button
          onClick={closePanel}
          className="p-1.5 hover:bg-hover rounded-lg transition flex-shrink-0"
          aria-label={t('artifact.close')}
        >
          <X size={16} className="text-text-secondary" />
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border">
        <div className="flex items-center gap-1">
          {/* View mode toggle */}
          <button
            onClick={() => setViewMode('preview')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition ${
              viewMode === 'preview'
                ? 'bg-primary/10 text-primary'
                : 'text-text-secondary hover:bg-hover'
            }`}
          >
            <Eye size={14} />
            {t('artifact.preview')}
          </button>
          <button
            onClick={() => setViewMode('code')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition ${
              viewMode === 'code'
                ? 'bg-primary/10 text-primary'
                : 'text-text-secondary hover:bg-hover'
            }`}
          >
            <Code size={14} />
            {t('artifact.code')}
          </button>
        </div>

        <div className="flex items-center gap-1">
          {/* Version navigation */}
          {hasMultipleVersions && (
            <div className="flex items-center gap-1 mr-2">
              <button
                onClick={handleVersionPrev}
                disabled={artifact.currentVersionIndex <= 0}
                className="p-1 hover:bg-hover rounded transition disabled:opacity-30"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="text-xs text-text-secondary min-w-[60px] text-center">
                {t('artifact.version', { n: String(artifact.currentVersionIndex + 1) })}
                {' / '}
                {artifact.versions.length}
              </span>
              <button
                onClick={handleVersionNext}
                disabled={artifact.currentVersionIndex >= artifact.versions.length - 1}
                className="p-1 hover:bg-hover rounded transition disabled:opacity-30"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          )}

          {/* Action buttons */}
          <button
            onClick={handleCopy}
            className="p-1.5 hover:bg-hover rounded-lg transition"
            aria-label={t('artifact.copyCode')}
          >
            {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} className="text-text-secondary" />}
          </button>
          <button
            onClick={handleDownload}
            className="p-1.5 hover:bg-hover rounded-lg transition"
            aria-label={t('artifact.download')}
          >
            <Download size={14} className="text-text-secondary" />
          </button>
          <button
            onClick={handleDelete}
            className="p-1.5 hover:bg-hover rounded-lg transition"
            aria-label={t('artifact.delete')}
          >
            <Trash2 size={14} className="text-text-secondary" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <ArtifactPreview artifact={artifact} viewMode={viewMode} />
      </div>
    </div>
  )
}

function ArtifactSelector({
  artifacts,
  activeId,
  onSelect,
  onClose,
}: {
  artifacts: Artifact[]
  activeId: string
  onSelect: (id: string) => void
  onClose: () => void
}) {
  return (
    <>
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
        onKeyDown={(e) => { if (e.key === 'Escape') onClose() }}
        role="button"
        tabIndex={0}
        aria-label="Close artifact selector"
      />
      <div className="absolute top-full left-0 mt-1 bg-surface border border-border rounded-lg shadow-lg py-1 z-50 min-w-[200px] max-h-[300px] overflow-y-auto">
        {artifacts.map((a) => (
          <button
            key={a.id}
            onClick={() => onSelect(a.id)}
            className={`w-full text-left px-3 py-2 text-sm hover:bg-hover transition flex items-center gap-2 ${
              a.id === activeId ? 'text-primary font-medium' : 'text-text-secondary'
            }`}
          >
            <span className="truncate">{a.title}</span>
            <span className="text-xs text-text-tertiary flex-shrink-0">{a.language}</span>
          </button>
        ))}
      </div>
    </>
  )
}

function getFileExtension(artifact: Artifact): string {
  switch (artifact.type) {
    case 'html': return 'html'
    case 'svg': return 'svg'
    case 'mermaid': return 'mmd'
    default: {
      const langMap: Record<string, string> = {
        javascript: 'js', typescript: 'ts', python: 'py', java: 'java',
        rust: 'rs', go: 'go', css: 'css', json: 'json', yaml: 'yml',
        bash: 'sh', sql: 'sql', ruby: 'rb', php: 'php', cpp: 'cpp',
        c: 'c', swift: 'swift', kotlin: 'kt',
      }
      return langMap[artifact.language] ?? 'txt'
    }
  }
}
