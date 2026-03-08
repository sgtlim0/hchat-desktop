import { describe, it, expect } from 'vitest'
import { smartChunk, splitBySentences } from '../smart-chunker'

describe('smart-chunker', () => {
  it('splits by paragraphs', () => {
    const chunks = smartChunk([{ page: 1, text: 'Para one.\n\nPara two.\n\nPara three.' }])
    expect(chunks.length).toBeGreaterThanOrEqual(1)
    expect(chunks[0].content).toContain('Para one')
  })

  it('preserves page numbers', () => {
    const chunks = smartChunk([
      { page: 1, text: 'Page one content.' },
      { page: 2, text: 'Page two content.' },
    ])
    expect(chunks[0].page).toBe(1)
  })

  it('generates unique chunk IDs', () => {
    const chunks = smartChunk([{ page: 1, text: 'A.\n\nB.\n\nC.' }])
    const ids = chunks.map((c) => c.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('handles empty pages', () => {
    const chunks = smartChunk([{ page: 1, text: '' }, { page: 2, text: 'Content.' }])
    expect(chunks.length).toBeGreaterThanOrEqual(1)
    expect(chunks[0].page).toBe(2)
  })

  it('handles single page', () => {
    const chunks = smartChunk([{ page: 1, text: 'Short text.' }])
    expect(chunks).toHaveLength(1)
  })

  it('handles Korean text', () => {
    const chunks = smartChunk([{ page: 1, text: '매출이 증가했습니다.\n\n영업이익률은 22%.' }])
    expect(chunks[0].content).toContain('매출')
  })

  it('returns PdfChunk fields', () => {
    const chunks = smartChunk([{ page: 5, text: 'Content here.' }])
    expect(chunks[0]).toHaveProperty('id')
    expect(chunks[0]).toHaveProperty('page')
    expect(chunks[0]).toHaveProperty('content')
    expect(chunks[0]).toHaveProperty('startOffset')
    expect(chunks[0].id).toMatch(/^chunk-\d+-\d+$/)
  })
})

describe('splitBySentences', () => {
  it('splits English', () => {
    expect(splitBySentences('A. B! C?')).toHaveLength(3)
  })
  it('empty string', () => {
    expect(splitBySentences('')).toHaveLength(0)
  })
})
