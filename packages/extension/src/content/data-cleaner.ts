export type CellType = 'number' | 'percentage' | 'currency' | 'date' | 'url' | 'email' | 'string'

export interface CleanedCell {
  readonly raw: string
  readonly type: CellType
  readonly value: string | number
}

export interface CleanedTable {
  readonly headers: ReadonlyArray<string>
  readonly rows: ReadonlyArray<ReadonlyArray<CleanedCell>>
  readonly columnTypes: ReadonlyArray<CellType>
  readonly caption?: string
}

const NUMBER_RE = /^-?[\d,]+\.?\d*$/
const PERCENTAGE_RE = /^-?\d+\.?\d*\s*%$/
const CURRENCY_RE = /^[$€£¥₩]\s*[\d,]+\.?\d*$|^[\d,]+\.?\d*\s*(?:원|달러|엔)$/
const DATE_RE = /^\d{4}[-/.]\d{1,2}[-/.]\d{1,2}$|^\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}$/
const URL_RE = /^https?:\/\//i
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function inferType(value: string): CellType {
  const trimmed = value.trim()
  if (!trimmed || trimmed === '-' || trimmed === 'N/A' || trimmed === 'n/a') return 'string'
  if (CURRENCY_RE.test(trimmed)) return 'currency'
  if (PERCENTAGE_RE.test(trimmed)) return 'percentage'
  if (NUMBER_RE.test(trimmed.replace(/,/g, ''))) return 'number'
  if (DATE_RE.test(trimmed)) return 'date'
  if (URL_RE.test(trimmed)) return 'url'
  if (EMAIL_RE.test(trimmed)) return 'email'
  return 'string'
}

function parseNumeric(raw: string): number {
  const cleaned = raw.replace(/[$€£¥₩,%\s원달러엔]/g, '').replace(/,/g, '')
  const num = parseFloat(cleaned)
  return isNaN(num) ? 0 : num
}

function cleanCell(raw: string): CleanedCell {
  const trimmed = raw.trim()
  const type = inferType(trimmed)

  switch (type) {
    case 'number':
    case 'currency':
      return { raw: trimmed, type, value: parseNumeric(trimmed) }
    case 'percentage':
      return { raw: trimmed, type, value: parseNumeric(trimmed) }
    default:
      return { raw: trimmed, type, value: trimmed }
  }
}

/**
 * Infer column type by majority vote across all rows.
 */
function inferColumnType(rows: ReadonlyArray<ReadonlyArray<CleanedCell>>, colIdx: number): CellType {
  const typeCounts = new Map<CellType, number>()

  for (const row of rows) {
    if (colIdx >= row.length) continue
    const cell = row[colIdx]
    if (cell.raw === '' || cell.raw === '-' || cell.raw === 'N/A') continue
    typeCounts.set(cell.type, (typeCounts.get(cell.type) || 0) + 1)
  }

  let bestType: CellType = 'string'
  let bestCount = 0
  for (const [type, count] of typeCounts) {
    if (count > bestCount) {
      bestCount = count
      bestType = type
    }
  }

  return bestType
}

/**
 * Clean and type-infer a raw extracted table.
 */
export function cleanTable(
  headers: ReadonlyArray<string>,
  rows: ReadonlyArray<ReadonlyArray<string>>,
  caption?: string,
): CleanedTable {
  const cleanedRows = rows.map((row) => row.map(cleanCell))
  const columnTypes = headers.map((_, idx) => inferColumnType(cleanedRows, idx))

  return {
    headers: headers.map((h) => h.trim()),
    rows: cleanedRows,
    columnTypes,
    caption,
  }
}

/**
 * Convert a CleanedTable to JSON records for backend analysis.
 */
export function tableToRecords(table: CleanedTable): ReadonlyArray<Record<string, string | number>> {
  return table.rows.map((row) => {
    const record: Record<string, string | number> = {}
    for (let i = 0; i < table.headers.length; i++) {
      const header = table.headers[i] || `col_${i}`
      record[header] = i < row.length ? row[i].value : ''
    }
    return record
  })
}

/**
 * Generate basic statistics for numeric columns (no backend needed).
 */
export interface ColumnStats {
  readonly column: string
  readonly type: CellType
  readonly count: number
  readonly nullCount: number
  readonly min?: number
  readonly max?: number
  readonly sum?: number
  readonly mean?: number
}

export function computeColumnStats(table: CleanedTable): ReadonlyArray<ColumnStats> {
  return table.headers.map((header, colIdx) => {
    const type = table.columnTypes[colIdx]
    const values: number[] = []
    let nullCount = 0

    for (const row of table.rows) {
      if (colIdx >= row.length || row[colIdx].raw === '' || row[colIdx].raw === '-') {
        nullCount++
        continue
      }
      if (type === 'number' || type === 'currency' || type === 'percentage') {
        values.push(row[colIdx].value as number)
      }
    }

    const isNumeric = type === 'number' || type === 'currency' || type === 'percentage'
    const count = table.rows.length

    if (!isNumeric || values.length === 0) {
      return { column: header, type, count, nullCount }
    }

    const min = Math.min(...values)
    const max = Math.max(...values)
    const sum = values.reduce((a, b) => a + b, 0)
    const mean = Math.round((sum / values.length) * 100) / 100

    return { column: header, type, count, nullCount, min, max, sum, mean }
  })
}
