import type { PdfChunk } from './smart-chunker'

export interface PdfChunkedAttachment {
  fileName: string
  pageCount: number
  chunks: PdfChunk[]
  totalTextLength: number
}

const MAX_CONTEXT_CHARS = 8000

export function buildCitationPrompt(
  attachment: PdfChunkedAttachment,
  baseSystemPrompt?: string,
): string {
  const selected = selectChunks(attachment.chunks, MAX_CONTEXT_CHARS)

  const contextParts = selected.map(
    (chunk) => `[${chunk.id}, Page ${chunk.page}]\n${chunk.content}`,
  )

  const rules = `다음은 "${attachment.fileName}" (${attachment.pageCount}페이지) 문서에서 추출한 내용입니다.

---문서 내용---
${contextParts.join('\n\n')}
---문서 내용 끝---

답변 규칙:
1. 위 문서 내용을 근거로 답변하세요.
2. 핵심 정보나 수치를 인용할 때 반드시 해당 청크 번호를 [N] 형식으로 표기하세요.
3. 문서에 없는 내용은 추측이라고 명시하세요.
4. 인용 번호는 chunk ID의 숫자를 사용하세요.`

  return baseSystemPrompt ? `${baseSystemPrompt}\n\n${rules}` : rules
}

function selectChunks(chunks: PdfChunk[], maxChars: number): PdfChunk[] {
  const selected: PdfChunk[] = []
  let total = 0
  for (const chunk of chunks) {
    if (total + chunk.content.length > maxChars) break
    selected.push(chunk)
    total += chunk.content.length
  }
  return selected
}

export function rankChunksByQuery(chunks: PdfChunk[], query: string): PdfChunk[] {
  if (!query.trim()) return chunks

  const tokens = query.toLowerCase().split(/\s+/).filter((t) => t.length > 1)

  return [...chunks]
    .map((chunk) => {
      const lower = chunk.content.toLowerCase()
      const score = tokens.filter((t) => lower.includes(t)).length / Math.max(tokens.length, 1)
      return { chunk, score }
    })
    .sort((a, b) => b.score - a.score)
    .map((s) => s.chunk)
}
