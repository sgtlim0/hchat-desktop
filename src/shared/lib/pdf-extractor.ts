const MAX_TEXT_LENGTH = 10_000

async function loadPdfjs() {
  const pdfjsLib = await import('pdfjs-dist')
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`
  return pdfjsLib
}

interface PdfResult {
  text: string
  pageCount: number
}

export async function extractPdfText(file: File): Promise<PdfResult> {
  const pdfjsLib = await loadPdfjs()
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  const pageCount = pdf.numPages

  const pages: string[] = []
  let totalLength = 0

  for (let i = 1; i <= pageCount; i++) {
    if (totalLength >= MAX_TEXT_LENGTH) break

    const page = await pdf.getPage(i)
    const textContent = await page.getTextContent()
    const pageText = textContent.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ')

    pages.push(pageText)
    totalLength += pageText.length
  }

  let text = pages.join('\n\n')
  if (text.length > MAX_TEXT_LENGTH) {
    text = text.slice(0, MAX_TEXT_LENGTH) + '...'
  }

  return { text, pageCount }
}
