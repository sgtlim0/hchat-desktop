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

  for (const { page, text } of pageTexts) {
    if (!text.trim()) continue

    // Split by paragraphs first
    const paragraphs = text.split(/\n\n+/).filter((p) => p.trim().length > 0)

    // If no paragraphs, treat whole text as one
    const parts = paragraphs.length > 1 ? paragraphs :
                  paragraphs.length === 1 && paragraphs[0].length > chunkSize ?
                  splitBySentences(paragraphs[0]) :
                  [text.trim()]

    let pageChunkIndex = 0
    let currentChunk = ''
    let previousOverlap = ''
    let currentOffset = 0

    for (const part of parts) {
      // If this is a long paragraph, split it into sentences
      if (part.length > chunkSize && !part.includes('.')) {
        const sentences = splitBySentences(part)
        for (const sentence of sentences) {
          const potentialChunk = previousOverlap +
            (currentChunk ? currentChunk + ' ' + sentence : sentence)

          if (potentialChunk.length > chunkSize && currentChunk) {
            // Save current chunk
            chunks.push({
              id: `chunk-${page}-${pageChunkIndex++}`,
              page,
              content: (previousOverlap + currentChunk).trim(),
              startOffset: currentOffset,
            })

            // Update offset
            currentOffset += currentChunk.length

            // Calculate overlap for next chunk
            if (overlapRatio > 0) {
              const overlapSize = Math.floor(currentChunk.length * overlapRatio)
              previousOverlap = currentChunk.slice(-overlapSize)
              if (previousOverlap) previousOverlap += ' '
            } else {
              previousOverlap = ''
            }

            currentChunk = sentence
          } else {
            currentChunk = currentChunk ? currentChunk + ' ' + sentence : sentence
          }
        }
      } else {
        // Add part to current chunk
        const separator = currentChunk && paragraphs.length > 1 ? '\n\n' :
                         currentChunk ? ' ' : ''
        const potentialChunk = previousOverlap + currentChunk + separator + part

        if (potentialChunk.length > chunkSize && currentChunk) {
          // Save current chunk
          chunks.push({
            id: `chunk-${page}-${pageChunkIndex++}`,
            page,
            content: (previousOverlap + currentChunk).trim(),
            startOffset: currentOffset,
          })

          // Update offset
          currentOffset += currentChunk.length

          // Calculate overlap for next chunk
          if (overlapRatio > 0) {
            const overlapSize = Math.floor(currentChunk.length * overlapRatio)
            previousOverlap = currentChunk.slice(-overlapSize)
            if (previousOverlap) previousOverlap += ' '
          } else {
            previousOverlap = ''
          }

          currentChunk = part
        } else {
          currentChunk = currentChunk ? currentChunk + separator + part : part
        }
      }
    }

    // Add remaining chunk
    if (currentChunk) {
      chunks.push({
        id: `chunk-${page}-${pageChunkIndex}`,
        page,
        content: (previousOverlap + currentChunk).trim(),
        startOffset: currentOffset,
      })
    }
  }

  return chunks
}

export function splitBySentences(text: string): string[] {
  // Handle both English and Korean sentence endings
  const sentences = text.match(/[^.!?。！？]+[.!?。！？]+/g) || []

  // If no sentences found but text exists, return the whole text
  if (sentences.length === 0 && text.trim()) {
    return [text.trim()]
  }

  return sentences.map((s) => s.trim()).filter((s) => s.length > 0)
}
