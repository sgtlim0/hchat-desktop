import { describe, it, expect } from 'vitest'
import { buildCitationPrompt, rankChunksByQuery } from '../citation-prompt'
import type { PdfChunkedAttachment } from '../citation-prompt'

const mockAttachment: PdfChunkedAttachment = {
  fileName: 'report.pdf',
  pageCount: 5,
  chunks: [
    { id: 'chunk-1', page: 1, content: 'Revenue was $100M.', startOffset: 0 },
    { id: 'chunk-2', page: 2, content: 'Operating margin 22%.', startOffset: 0 },
    { id: 'chunk-3', page: 3, content: 'Net income grew 15%.', startOffset: 0 },
  ],
  totalTextLength: 100,
}

describe('buildCitationPrompt', () => {
  it('includes chunk references', () => {
    const prompt = buildCitationPrompt(mockAttachment)
    expect(prompt).toContain('[chunk-1, Page 1]')
  })

  it('includes citation rules', () => {
    const prompt = buildCitationPrompt(mockAttachment)
    expect(prompt).toContain('[N] 형식')
  })

  it('includes file name', () => {
    const prompt = buildCitationPrompt(mockAttachment)
    expect(prompt).toContain('report.pdf')
  })

  it('preserves base prompt', () => {
    const prompt = buildCitationPrompt(mockAttachment, 'Be helpful.')
    expect(prompt).toContain('Be helpful.')
  })

  it('handles empty chunks', () => {
    const empty = { ...mockAttachment, chunks: [] }
    expect(buildCitationPrompt(empty)).toContain('report.pdf')
  })
})

describe('rankChunksByQuery', () => {
  it('ranks by keyword match', () => {
    const ranked = rankChunksByQuery(mockAttachment.chunks, 'revenue')
    expect(ranked[0].content).toContain('Revenue')
  })

  it('returns all for empty query', () => {
    expect(rankChunksByQuery(mockAttachment.chunks, '')).toHaveLength(3)
  })

  it('returns all chunks reordered', () => {
    const ranked = rankChunksByQuery(mockAttachment.chunks, 'margin')
    expect(ranked).toHaveLength(3)
  })
})
