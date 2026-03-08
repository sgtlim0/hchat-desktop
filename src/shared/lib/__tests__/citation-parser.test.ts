import { describe, it, expect } from 'vitest'
import { parseCitations, getValidCitationIndices, hasCitations } from '../citation-parser'
import type { PdfChunk } from '../citation-parser'

const mockChunks: PdfChunk[] = [
  { id: 'chunk-1', page: 1, content: 'Revenue increased by 15% in Q3.', startOffset: 0 },
  { id: 'chunk-2', page: 2, content: 'Operating margin was 22%.', startOffset: 0 },
  { id: 'chunk-3', page: 3, content: 'Net income reached $1.2B.', startOffset: 0 },
]

describe('citation-parser', () => {
  describe('parseCitations', () => {
    it('parses [N] citations', () => {
      const text = 'Revenue grew 15%[1] and margin was 22%[2].'
      const citations = parseCitations(text, mockChunks)
      expect(citations).toHaveLength(2)
      expect(citations[0].index).toBe(1)
      expect(citations[0].page).toBe(1)
      expect(citations[1].index).toBe(2)
    })

    it('deduplicates repeated citations', () => {
      const text = 'Data shows[1] and confirms[1] the trend.'
      const citations = parseCitations(text, mockChunks)
      expect(citations).toHaveLength(1)
    })

    it('filters hallucinated citations', () => {
      const text = 'As stated[99], this is false.'
      const citations = parseCitations(text, mockChunks)
      expect(citations).toHaveLength(0)
    })

    it('handles consecutive citations [1][2]', () => {
      const text = 'Data[1][2][3] supports this.'
      const citations = parseCitations(text, mockChunks)
      expect(citations).toHaveLength(3)
    })

    it('returns empty for no citations', () => {
      const citations = parseCitations('No citations here.', mockChunks)
      expect(citations).toHaveLength(0)
    })

    it('includes snippet from chunk', () => {
      const text = 'Revenue[1] was strong.'
      const citations = parseCitations(text, mockChunks)
      expect(citations[0].snippet).toContain('Revenue increased')
    })

    it('sorts by index', () => {
      const text = 'Second[2] then first[1].'
      const citations = parseCitations(text, mockChunks)
      expect(citations[0].index).toBe(1)
      expect(citations[1].index).toBe(2)
    })

    it('handles empty text', () => {
      expect(parseCitations('', mockChunks)).toHaveLength(0)
    })

    it('handles empty chunks', () => {
      expect(parseCitations('test[1]', [])).toHaveLength(0)
    })
  })

  describe('getValidCitationIndices', () => {
    it('returns set of valid indices', () => {
      const indices = getValidCitationIndices('data[1][2][99]', mockChunks)
      expect(indices.has(1)).toBe(true)
      expect(indices.has(2)).toBe(true)
      expect(indices.has(99)).toBe(false)
    })
  })

  describe('hasCitations', () => {
    it('detects citations', () => {
      expect(hasCitations('text[1] more')).toBe(true)
    })
    it('no citations', () => {
      expect(hasCitations('plain text')).toBe(false)
    })
  })
})
