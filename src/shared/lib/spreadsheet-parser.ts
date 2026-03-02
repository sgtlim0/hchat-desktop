export interface SpreadsheetData {
  fileName: string
  sheets: {
    name: string
    headers: string[]
    rows: Record<string, unknown>[]
    rowCount: number
    colCount: number
  }[]
  summary: string
}

const MAX_ROWS_PER_SHEET = 500

export async function parseSpreadsheet(file: File): Promise<SpreadsheetData> {
  const XLSX = await import('xlsx')

  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const data = e.target?.result
        if (!data) {
          throw new Error('Failed to read file')
        }

        const workbook = XLSX.read(data, { type: 'binary' })
        const sheets: SpreadsheetData['sheets'] = []

        for (const sheetName of workbook.SheetNames) {
          const worksheet = workbook.Sheets[sheetName]
          const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: '' })

          // Limit rows to avoid context overflow
          const limitedData = jsonData.slice(0, MAX_ROWS_PER_SHEET)

          // Extract headers from first row or use column keys
          const headers = limitedData.length > 0 ? Object.keys(limitedData[0]) : []

          sheets.push({
            name: sheetName,
            headers,
            rows: limitedData,
            rowCount: jsonData.length,
            colCount: headers.length,
          })
        }

        // Generate human-readable summary
        const summary = generateSummary(file.name, sheets)

        resolve({
          fileName: file.name,
          sheets,
          summary,
        })
      } catch (error) {
        reject(error instanceof Error ? error : new Error('Unknown parsing error'))
      }
    }

    reader.onerror = () => {
      reject(new Error('FileReader error'))
    }

    reader.readAsBinaryString(file)
  })
}

function generateSummary(fileName: string, sheets: SpreadsheetData['sheets']): string {
  let summary = `[Spreadsheet: ${fileName}]\n\n`

  for (const sheet of sheets) {
    summary += `Sheet "${sheet.name}" (${sheet.rowCount} rows × ${sheet.colCount} cols)\n`
    summary += `Columns: ${sheet.headers.join(', ')}\n`

    // Include first 3 rows as sample data
    if (sheet.rows.length > 0) {
      summary += '\nSample data:\n'
      const sampleRows = sheet.rows.slice(0, 3)
      for (const row of sampleRows) {
        const values = sheet.headers.map((h) => row[h])
        summary += `  ${values.join(' | ')}\n`
      }
    }

    if (sheet.rowCount > MAX_ROWS_PER_SHEET) {
      summary += `\n(Note: Only first ${MAX_ROWS_PER_SHEET} rows loaded)\n`
    }

    summary += '\n'
  }

  return summary
}
