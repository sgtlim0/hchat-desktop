import { useState, useCallback } from 'react'
import type { PageIntelligence, TableData } from '@ext/shared/types'
import { cleanTable, computeColumnStats, tableToRecords } from '@ext/content/data-cleaner'
import type { CleanedTable, ColumnStats } from '@ext/content/data-cleaner'

export interface ExtractedData {
  readonly tables: ReadonlyArray<{
    readonly cleaned: CleanedTable
    readonly stats: ReadonlyArray<ColumnStats>
    readonly records: ReadonlyArray<Record<string, string | number>>
  }>
  readonly intelligence: PageIntelligence
}

export function useDataExtraction() {
  const [data, setData] = useState<ExtractedData | null>(null)
  const [isExtracting, setIsExtracting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const extract = useCallback(async () => {
    setIsExtracting(true)
    setError(null)
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      if (!tab?.id) throw new Error('No active tab')

      const response = await chrome.tabs.sendMessage(tab.id, {
        type: 'EXTRACT_PAGE_INTELLIGENCE',
      })

      if (response?.error) throw new Error(response.error)

      const intelligence = response.data as PageIntelligence
      const tables = intelligence.tables.map((t: TableData) => {
        const cleaned = cleanTable(t.headers, t.rows, t.caption)
        const stats = computeColumnStats(cleaned)
        const records = tableToRecords(cleaned)
        return { cleaned, stats, records }
      })

      setData({ tables, intelligence })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Extraction failed'
      setError(message)
    } finally {
      setIsExtracting(false)
    }
  }, [])

  const exportCsv = useCallback(
    (tableIdx: number) => {
      if (!data || tableIdx >= data.tables.length) return
      const { cleaned } = data.tables[tableIdx]

      const csvRows = [
        cleaned.headers.join(','),
        ...cleaned.rows.map((row) =>
          row.map((cell) => {
            const val = String(cell.raw)
            return val.includes(',') || val.includes('"')
              ? `"${val.replace(/"/g, '""')}"`
              : val
          }).join(','),
        ),
      ]

      const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `table-${tableIdx + 1}.csv`
      a.click()
      URL.revokeObjectURL(url)
    },
    [data],
  )

  const clear = useCallback(() => {
    setData(null)
    setError(null)
  }, [])

  return { data, isExtracting, error, extract, exportCsv, clear }
}
