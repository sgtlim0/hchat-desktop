// @ts-nocheck
import { useState, useEffect } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { ArrowLeft, FileSearch, Plus, Trash2, Eye, Upload, Table } from 'lucide-react'
import { useSessionStore } from '@/entities/session/session.store'
import { useDocAnalyzerStore } from '@/entities/doc-analyzer/doc-analyzer.store'
import { useTranslation } from '@/shared/i18n'
import { Button } from '@/shared/ui/Button'

const DOC_TYPES = ['receipt', 'contract', 'businessCard', 'table', 'general'] as const
type DocType = (typeof DOC_TYPES)[number]

const DOC_TYPE_ICONS: Record<DocType, string> = {
  receipt: '🧾',
  contract: '📄',
  businessCard: '💳',
  table: '📊',
  general: '📋',
}

export function DocAnalyzerPage() {
  const { t } = useTranslation()
  const setView = useSessionStore((s) => s.setView)

  const {
    analyses,
    selectedAnalysisId,
    hydrate,
    createAnalysis,
    deleteAnalysis,
    selectAnalysis,
    setDocType,
    runAnalysis,
  } = useDocAnalyzerStore(
    useShallow((s) => ({
      analyses: s.analyses,
      selectedAnalysisId: s.selectedAnalysisId,
      hydrate: s.hydrate,
      createAnalysis: s.createAnalysis,
      deleteAnalysis: s.deleteAnalysis,
      selectAnalysis: s.selectAnalysis,
      setDocType: s.setDocType,
      runAnalysis: s.runAnalysis,
    }))
  )

  const [showUpload, setShowUpload] = useState(false)
  const [uploadName, setUploadName] = useState('')
  const [uploadType, setUploadType] = useState<DocType>('general')
  const [uploadContent, setUploadContent] = useState('')

  useEffect(() => {
    hydrate()
  }, [hydrate])

  const selected = analyses.find((a) => a.id === selectedAnalysisId) ?? null

  function handleCreate() {
    if (!uploadName.trim() || !uploadContent.trim()) return
    createAnalysis(uploadName.trim(), uploadType, uploadContent.trim())
    setShowUpload(false)
    setUploadName('')
    setUploadType('general')
    setUploadContent('')
  }

  function handleDelete(id: string) {
    if (confirm((t as any)('docAnalyzer.deleteConfirm'))) {
      deleteAnalysis(id)
    }
  }

  return (
    <div className="flex flex-col h-full bg-[var(--color-bg-primary)]">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--color-border)]">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setView('home')}
          aria-label={t('common.back')}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <FileSearch className="w-5 h-5 text-[var(--color-accent)]" />
        <div className="flex-1">
          <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">
            {(t as any)('docAnalyzer.title')}
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)]">
            {(t as any)('docAnalyzer.subtitle')}
          </p>
        </div>
        <Button onClick={() => setShowUpload(true)} className="flex items-center gap-1">
          <Plus className="w-4 h-4" />
          {(t as any)('docAnalyzer.new')}
        </Button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel: Analysis List */}
        <div className="w-80 border-r border-[var(--color-border)] flex flex-col overflow-hidden">
          <div className="flex-1 overflow-auto">
            {analyses.length === 0 ? (
              <div className="flex items-center justify-center h-full text-center p-4">
                <div>
                  <FileSearch className="w-10 h-10 mx-auto mb-2 text-zinc-400" />
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    {(t as any)('docAnalyzer.empty')}
                  </p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-[var(--color-border)]">
                {analyses.map((analysis) => (
                  <button
                    key={analysis.id}
                    onClick={() => selectAnalysis(analysis.id)}
                    className={`w-full text-left p-3 hover:bg-[var(--color-bg-secondary)] ${
                      selectedAnalysisId === analysis.id ? 'bg-[var(--color-bg-secondary)]' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span>{DOC_TYPE_ICONS[analysis.docType as DocType] ?? '📋'}</span>
                      <span className="text-sm font-medium truncate flex-1">{analysis.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
                      <span className="px-1.5 py-0.5 rounded bg-[var(--color-bg-secondary)] capitalize">
                        {analysis.docType}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded ${
                        analysis.status === 'done'
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                          : analysis.status === 'analyzing'
                            ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                            : 'bg-zinc-100 dark:bg-zinc-800'
                      }`}>
                        {analysis.status}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Detail */}
        <div className="flex-1 overflow-auto">
          {selected ? (
            <div className="p-6 space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
                    {selected.name}
                  </h2>
                  <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                    {new Date(selected.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={selected.docType}
                    onChange={(e) => setDocType(selected.id, e.target.value as DocType)}
                    className="px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-sm"
                    aria-label="document type"
                  >
                    {DOC_TYPES.map((dt) => (
                      <option key={dt} value={dt}>{dt}</option>
                    ))}
                  </select>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => runAnalysis(selected.id)}
                    disabled={selected.status === 'analyzing'}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    {(t as any)('docAnalyzer.analyze')}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(selected.id)}
                    className="text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Source Content */}
              <div>
                <h3 className="text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                  {(t as any)('docAnalyzer.sourceContent')}
                </h3>
                <pre className="p-4 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-sm whitespace-pre-wrap max-h-48 overflow-auto">
                  {selected.content}
                </pre>
              </div>

              {/* Extracted Fields Table */}
              {selected.extractedFields && selected.extractedFields.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Table className="w-4 h-4 text-[var(--color-accent)]" />
                    <h3 className="text-sm font-medium text-[var(--color-text-secondary)]">
                      {(t as any)('docAnalyzer.extractedFields')}
                    </h3>
                  </div>
                  <div className="rounded-lg border border-[var(--color-border)] overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-[var(--color-bg-secondary)]">
                          <th className="text-left px-4 py-2 font-medium text-[var(--color-text-secondary)]">
                            {(t as any)('docAnalyzer.fieldName')}
                          </th>
                          <th className="text-left px-4 py-2 font-medium text-[var(--color-text-secondary)]">
                            {(t as any)('docAnalyzer.fieldValue')}
                          </th>
                          <th className="text-left px-4 py-2 font-medium text-[var(--color-text-secondary)]">
                            {(t as any)('docAnalyzer.confidence')}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--color-border)]">
                        {selected.extractedFields.map((field, idx) => (
                          <tr key={idx}>
                            <td className="px-4 py-2 font-medium text-[var(--color-text-primary)]">
                              {field.name}
                            </td>
                            <td className="px-4 py-2 text-[var(--color-text-primary)]">
                              {field.value}
                            </td>
                            <td className="px-4 py-2">
                              <span className={`px-2 py-0.5 rounded text-xs ${
                                field.confidence >= 0.8
                                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                  : field.confidence >= 0.5
                                    ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                                    : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                              }`}>
                                {Math.round(field.confidence * 100)}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Summary */}
              {selected.summary && (
                <div className="p-4 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border)]">
                  <h3 className="text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                    {(t as any)('docAnalyzer.summary')}
                  </h3>
                  <p className="text-sm text-[var(--color-text-primary)]">{selected.summary}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-center">
              <div>
                <FileSearch className="w-12 h-12 mx-auto mb-3 text-zinc-300 dark:text-zinc-600" />
                <p className="text-[var(--color-text-secondary)]">
                  {(t as any)('docAnalyzer.selectAnalysis')}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-[var(--color-bg-primary)] rounded-lg shadow-xl w-full max-w-lg p-6 m-4">
            <h2 className="text-lg font-semibold mb-4 text-[var(--color-text-primary)]">
              {(t as any)('docAnalyzer.uploadTitle')}
            </h2>
            <div className="space-y-3">
              <input
                type="text"
                value={uploadName}
                onChange={(e) => setUploadName(e.target.value)}
                placeholder={(t as any)('docAnalyzer.namePlaceholder')}
                className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg bg-[var(--color-bg-secondary)]"
              />
              <select
                value={uploadType}
                onChange={(e) => setUploadType(e.target.value as DocType)}
                className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg bg-[var(--color-bg-secondary)]"
              >
                {DOC_TYPES.map((dt) => (
                  <option key={dt} value={dt}>{dt}</option>
                ))}
              </select>
              <textarea
                value={uploadContent}
                onChange={(e) => setUploadContent(e.target.value)}
                placeholder={(t as any)('docAnalyzer.contentPlaceholder')}
                rows={8}
                className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg bg-[var(--color-bg-secondary)] text-sm"
              />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button
                variant="ghost"
                onClick={() => setShowUpload(false)}
              >
                {t('common.cancel')}
              </Button>
              <Button onClick={handleCreate}>
                <Upload className="w-4 h-4 mr-1" />
                {(t as any)('docAnalyzer.upload')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
