export interface PdfChunk {
  id: string
  page: number
  content: string
  startOffset: number
}

export interface CitationMeta {
  index: number
  chunkId: string
  page: number
  snippet: string
}

const CITATION_REGEX = /\[(\d+)\]/g

export function parseCitations(responseText: string, chunks: PdfChunk[]): CitationMeta[] {
  const seen = new Set<number>()
  const citations: CitationMeta[] = []

  let match: RegExpExecArray | null = null
  while ((match = CITATION_REGEX.exec(responseText)) !== null) {
    const num = parseInt(match[1], 10)
    if (seen.has(num)) continue
    seen.add(num)

    const chunk = chunks.find((c) => c.id === `chunk-${num}`)
    if (!chunk) continue

    citations.push({
      index: num,
      chunkId: chunk.id,
      page: chunk.page,
      snippet: chunk.content.slice(0, 150) + (chunk.content.length > 150 ? '...' : ''),
    })
  }

  return citations.sort((a, b) => a.index - b.index)
}

export function getValidCitationIndices(responseText: string, chunks: PdfChunk[]): Set<number> {
  const citations = parseCitations(responseText, chunks)
  return new Set(citations.map((c) => c.index))
}

export function hasCitations(text: string): boolean {
  return CITATION_REGEX.test(text)
}
