export interface PageText {
  page: number
  text: string
}

export interface PdfChunk {
  id: string
  page: number
  content: string
  startOffset: number
}

interface ChunkOptions {
  chunkSize?: number
  overlapRatio?: number
}

export function smartChunk(
  pageTexts: PageText[],
  options?: ChunkOptions,
): PdfChunk[] {
  const chunkSize = options?.chunkSize ?? 600
  const overlapRatio = options?.overlapRatio ?? 0.15
  const chunks: PdfChunk[] = []
  let chunkIndex = 0
  let buffer = ''
  let bufferPage = 1

  for (const { page, text } of pageTexts) {
    if (!text.trim()) continue

    const paragraphs = text.split(/\n\n+/).filter((p) => p.trim().length > 0)
    const parts = paragraphs.length > 0 ? paragraphs : splitBySentences(text)

    for (const part of parts) {
      if (buffer.length + part.length > chunkSize && buffer.length > 0) {
        chunks.push({
          id: `chunk-${++chunkIndex}`,
          page: bufferPage,
          content: buffer.trim(),
          startOffset: 0,
        })
        const overlapSize = Math.floor(buffer.length * overlapRatio)
        buffer = buffer.slice(-overlapSize)
        bufferPage = page
      }

      if (buffer.length === 0) bufferPage = page
      buffer += (buffer ? '\n\n' : '') + part
    }
  }

  if (buffer.trim().length > 0) {
    chunks.push({
      id: `chunk-${++chunkIndex}`,
      page: bufferPage,
      content: buffer.trim(),
      startOffset: 0,
    })
  }

  return chunks
}

export function splitBySentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
}
