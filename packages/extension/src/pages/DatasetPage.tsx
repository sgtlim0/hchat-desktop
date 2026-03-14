import { useState, useCallback } from 'react'
import { Search, RefreshCw, Eye, EyeOff, Download, Table2, ChevronRight } from 'lucide-react'
import { useTranslation } from '@hchat/shared'
import type { DatasetCandidate } from '@ext/content/dataset-candidate'
import { useExtSessionStore } from '@ext/stores/session.store'

interface DatasetPageProps {
  readonly candidates: ReadonlyArray<DatasetCandidate>
  readonly isScanning: boolean
  readonly onScan: () => void
  readonly onHighlight: (index: number) => void
  readonly onClearHighlight: () => void
  readonly onExtract: (candidate: DatasetCandidate) => void
}

export function DatasetPage({
  candidates,
  isScanning,
  onScan,
  onHighlight,
  onClearHighlight,
  onExtract,
}: DatasetPageProps) {
  const { t } = useTranslation()
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [highlightedIdx, setHighlightedIdx] = useState<number | null>(null)
  const setPage = useExtSessionStore((s) => s.setPage)

  const handleToggleHighlight = useCallback(
    (idx: number) => {
      if (highlightedIdx === idx) {
        onClearHighlight()
        setHighlightedIdx(null)
      } else {
        onHighlight(idx)
        setHighlightedIdx(idx)
      }
    },
    [highlightedIdx, onHighlight, onClearHighlight],
  )

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="px-3 py-2.5 border-b border-[var(--border)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Search size={14} className="text-[var(--primary)]" />
            <h1 className="text-sm font-bold text-[var(--text-primary)]">Datasets</h1>
            {candidates.length > 0 && (
              <span className="px-1.5 py-0.5 text-[9px] bg-[var(--primary)]/10 text-[var(--primary)] rounded-full">
                {candidates.length}
              </span>
            )}
          </div>
          <button
            onClick={onScan}
            disabled={isScanning}
            className="flex items-center gap-1 px-2.5 py-1 text-[10px] bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-40"
          >
            <RefreshCw size={11} className={isScanning ? 'animate-spin' : ''} />
            {isScanning ? 'Scanning...' : 'Scan Page'}
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-3 py-3">
        {candidates.length === 0 && !isScanning && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Search size={32} className="text-[var(--text-tertiary)] mb-3" />
            <p className="text-xs text-[var(--text-secondary)] mb-1">
              Discover datasets in the current page
            </p>
            <p className="text-[10px] text-[var(--text-tertiary)] mb-4">
              Detects repeating patterns like product lists, tables, and card grids
            </p>
            <button
              onClick={onScan}
              className="px-4 py-2 text-xs bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors"
            >
              Scan Page
            </button>
          </div>
        )}

        {candidates.length > 0 && (
          <div className="space-y-2">
            {candidates.map((candidate, idx) => {
              const isExpanded = expandedId === candidate.id
              const color = COLORS[idx % COLORS.length]
              const isHighlighted = highlightedIdx === idx

              return (
                <div
                  key={candidate.id}
                  className="border border-[var(--border)] rounded-lg overflow-hidden"
                  style={{ borderLeftColor: color, borderLeftWidth: 3 }}
                >
                  {/* Card header */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : candidate.id)}
                    className="w-full flex items-center gap-2 px-2.5 py-2 text-left hover:bg-[var(--bg-hover)] transition-colors"
                  >
                    <ChevronRight
                      size={12}
                      className={`transition-transform ${isExpanded ? 'rotate-90' : ''} text-[var(--text-tertiary)]`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-medium text-[var(--text-primary)] truncate">
                        {candidate.name}
                      </p>
                      <p className="text-[9px] text-[var(--text-tertiary)]">
                        {candidate.itemCount} items · {candidate.fields.length} fields · Density: {(candidate.density * 100).toFixed(0)}%
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleToggleHighlight(idx)
                        }}
                        className={`p-1 rounded transition-colors ${
                          isHighlighted
                            ? 'text-[var(--primary)] bg-[var(--primary)]/10'
                            : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
                        }`}
                        title={isHighlighted ? 'Hide highlight' : 'Highlight on page'}
                      >
                        {isHighlighted ? <EyeOff size={12} /> : <Eye size={12} />}
                      </button>
                    </div>
                  </button>

                  {/* Expanded content */}
                  {isExpanded && (
                    <div className="px-2.5 pb-2.5 space-y-2">
                      {/* Fields */}
                      <div className="flex flex-wrap gap-1">
                        {candidate.fields.map((field, fIdx) => (
                          <span
                            key={fIdx}
                            className="px-1.5 py-0.5 text-[9px] bg-[var(--bg-card)] border border-[var(--border)] rounded"
                          >
                            {field.name}
                            <span className="text-[var(--text-tertiary)] ml-0.5">{field.type}</span>
                          </span>
                        ))}
                      </div>

                      {/* Preview table */}
                      {candidate.preview.length > 0 && (
                        <div className="overflow-x-auto">
                          <table className="w-full text-[9px]">
                            <thead>
                              <tr>
                                {candidate.fields.map((f, i) => (
                                  <th
                                    key={i}
                                    className="px-1.5 py-1 text-left font-medium text-[var(--text-secondary)] border-b border-[var(--border)]"
                                  >
                                    {f.name}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {candidate.preview.slice(0, 3).map((row, rIdx) => (
                                <tr key={rIdx}>
                                  {candidate.fields.map((f, fIdx) => (
                                    <td
                                      key={fIdx}
                                      className="px-1.5 py-1 text-[var(--text-primary)] border-b border-[var(--border)]/50 max-w-[120px] truncate"
                                    >
                                      {f.type === 'image' ? (
                                        row[f.name] ? (
                                          <img
                                            src={row[f.name]}
                                            alt=""
                                            className="w-6 h-6 rounded object-cover"
                                          />
                                        ) : '-'
                                      ) : (
                                        row[f.name] || '-'
                                      )}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => onExtract(candidate)}
                          className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-[10px] bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors"
                        >
                          <Table2 size={11} />
                          Extract to Data
                        </button>
                        <button
                          onClick={() => {
                            const csv = [
                              candidate.fields.map((f) => f.name).join(','),
                              ...candidate.preview.map((row) =>
                                candidate.fields.map((f) => `"${(row[f.name] || '').replace(/"/g, '""')}"`).join(','),
                              ),
                            ].join('\n')
                            const blob = new Blob([csv], { type: 'text/csv' })
                            const url = URL.createObjectURL(blob)
                            const a = document.createElement('a')
                            a.href = url
                            a.download = `${candidate.name}.csv`
                            a.click()
                            URL.revokeObjectURL(url)
                          }}
                          className="p-1.5 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] border border-[var(--border)] rounded-lg transition-colors"
                          title="Export CSV"
                        >
                          <Download size={11} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
