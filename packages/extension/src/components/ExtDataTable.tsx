import { useState } from 'react'
import { ArrowUpDown, Download, Copy, BarChart3 } from 'lucide-react'
import { useTranslation } from '@hchat/shared'
import type { CleanedTable, ColumnStats } from '@ext/content/data-cleaner'

interface ExtDataTableProps {
  readonly table: CleanedTable
  readonly stats?: ReadonlyArray<ColumnStats>
  readonly onExport?: () => void
  readonly onAnalyze?: () => void
}

type SortDir = 'asc' | 'desc' | null

export function ExtDataTable({ table, stats, onExport, onAnalyze }: ExtDataTableProps) {
  const { t } = useTranslation()
  const [sortCol, setSortCol] = useState<number | null>(null)
  const [sortDir, setSortDir] = useState<SortDir>(null)
  const [showStats, setShowStats] = useState(false)

  function handleSort(colIdx: number) {
    if (sortCol === colIdx) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : prev === 'desc' ? null : 'asc'))
      if (sortDir === 'desc') setSortCol(null)
    } else {
      setSortCol(colIdx)
      setSortDir('asc')
    }
  }

  const sortedRows = (() => {
    if (sortCol === null || sortDir === null) return table.rows
    const rows = [...table.rows]
    rows.sort((a, b) => {
      const aVal = sortCol < a.length ? a[sortCol].value : ''
      const bVal = sortCol < b.length ? b[sortCol].value : ''
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal
      }
      const cmp = String(aVal).localeCompare(String(bVal))
      return sortDir === 'asc' ? cmp : -cmp
    })
    return rows
  })()

  function handleCopy() {
    const tsv = [
      table.headers.join('\t'),
      ...table.rows.map((row) => row.map((c) => c.raw).join('\t')),
    ].join('\n')
    navigator.clipboard.writeText(tsv)
  }

  return (
    <div className="border border-[var(--border)] rounded-lg overflow-hidden">
      {/* Header toolbar */}
      <div className="flex items-center justify-between px-2.5 py-1.5 bg-[var(--bg-card)] border-b border-[var(--border)]">
        <div className="flex items-center gap-1.5">
          {table.caption && (
            <span className="text-[10px] font-medium text-[var(--text-primary)]">
              {table.caption}
            </span>
          )}
          <span className="text-[9px] text-[var(--text-tertiary)]">
            {table.rows.length} rows x {table.headers.length} cols
          </span>
        </div>
        <div className="flex items-center gap-1">
          {stats && (
            <button
              onClick={() => setShowStats((p) => !p)}
              className={`p-1 rounded transition-colors ${showStats ? 'text-[var(--primary)] bg-[var(--primary)]/10' : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'}`}
              title="Stats"
            >
              <BarChart3 size={12} />
            </button>
          )}
          <button
            onClick={handleCopy}
            className="p-1 rounded text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
            title={t('common.copy')}
          >
            <Copy size={12} />
          </button>
          {onExport && (
            <button
              onClick={onExport}
              className="p-1 rounded text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
              title="CSV"
            >
              <Download size={12} />
            </button>
          )}
          {onAnalyze && (
            <button
              onClick={onAnalyze}
              className="px-2 py-0.5 text-[9px] bg-[var(--primary)] text-white rounded hover:bg-[var(--primary-hover)] transition-colors"
            >
              Analyze
            </button>
          )}
        </div>
      </div>

      {/* Stats bar */}
      {showStats && stats && (
        <div className="px-2.5 py-2 bg-[var(--bg-card)]/50 border-b border-[var(--border)] space-y-1">
          {stats
            .filter((s) => s.min !== undefined)
            .map((s) => (
              <div key={s.column} className="flex items-center gap-2 text-[9px]">
                <span className="font-medium text-[var(--text-primary)] w-20 truncate">{s.column}</span>
                <span className="text-[var(--text-tertiary)]">
                  min: {s.min} / max: {s.max} / avg: {s.mean} / sum: {s.sum}
                </span>
              </div>
            ))}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
        <table className="w-full text-[10px]">
          <thead className="sticky top-0 bg-[var(--bg-card)]">
            <tr>
              <th className="px-2 py-1.5 text-left text-[var(--text-tertiary)] font-normal border-b border-[var(--border)] w-8">
                #
              </th>
              {table.headers.map((header, idx) => (
                <th
                  key={idx}
                  className="px-2 py-1.5 text-left font-medium text-[var(--text-primary)] border-b border-[var(--border)] cursor-pointer hover:bg-[var(--bg-hover)] transition-colors whitespace-nowrap"
                  onClick={() => handleSort(idx)}
                >
                  <span className="flex items-center gap-0.5">
                    {header}
                    <ArrowUpDown
                      size={9}
                      className={sortCol === idx ? 'text-[var(--primary)]' : 'text-[var(--text-tertiary)]'}
                    />
                  </span>
                  <span className="block text-[8px] text-[var(--text-tertiary)] font-normal">
                    {table.columnTypes[idx]}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((row, rowIdx) => (
              <tr key={rowIdx} className="hover:bg-[var(--bg-hover)] transition-colors">
                <td className="px-2 py-1 text-[var(--text-tertiary)] border-b border-[var(--border)]/50">
                  {rowIdx + 1}
                </td>
                {row.map((cell, cellIdx) => (
                  <td
                    key={cellIdx}
                    className={`px-2 py-1 border-b border-[var(--border)]/50 whitespace-nowrap ${
                      typeof cell.value === 'number'
                        ? 'text-right tabular-nums text-[var(--text-primary)]'
                        : 'text-[var(--text-primary)]'
                    }`}
                  >
                    {cell.raw || '-'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
