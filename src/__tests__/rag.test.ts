import { describe, it, expect } from 'vitest'
import {
  searchRAG,
  buildRAGContext,
  extractKeyPoints,
  chunkWithOverlap,
} from '@/shared/lib/rag'
import { embedText } from '@/shared/lib/embedding'
import type { KnowledgeDocument } from '@/shared/types'

function createDoc(id: string, title: string, content: string): KnowledgeDocument {
  const chunks = chunkWithOverlap(content, 200, 50).map((raw, idx) => ({
    id: `chunk-${id}-${idx}`,
    documentId: id,
    content: raw.content,
    index: idx,
    embedding: embedText(raw.content),
  }))

  return {
    id,
    title,
    content,
    chunks,
    tags: [],
    category: 'general',
    fileType: 'txt',
    fileSize: content.length,
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

describe('rag', () => {
  const docs = [
    createDoc('doc-1', 'Machine Learning Guide', 'Machine learning is a subset of artificial intelligence that enables systems to learn from data. Neural networks are inspired by biological neurons. Deep learning uses multiple layers to extract features from raw input.'),
    createDoc('doc-2', 'Cooking Recipes', 'Italian pasta is made with semolina flour and eggs. Tomato sauce requires fresh basil and garlic. Cooking pasta al dente means firm to the bite.'),
    createDoc('doc-3', 'TypeScript Handbook', 'TypeScript adds static types to JavaScript. Interfaces define the shape of objects. Generics allow type-safe reusable components.'),
  ]

  describe('searchRAG', () => {
    it('should return relevant results for ML query', () => {
      const results = searchRAG('neural networks deep learning', docs)
      expect(results.length).toBeGreaterThan(0)
      expect(results[0].document.id).toBe('doc-1')
    })

    it('should return cooking results for food query', () => {
      const results = searchRAG('pasta tomato sauce', docs)
      expect(results.length).toBeGreaterThan(0)
      expect(results[0].document.id).toBe('doc-2')
    })

    it('should return empty for unrelated query', () => {
      const results = searchRAG('quantum entanglement superposition', docs, 5, 0.5)
      expect(results.length).toBe(0)
    })

    it('should respect topK limit', () => {
      const results = searchRAG('learning', docs, 2)
      expect(results.length).toBeLessThanOrEqual(2)
    })

    it('should include citations', () => {
      const results = searchRAG('TypeScript interfaces', docs)
      expect(results.length).toBeGreaterThan(0)
      expect(results[0].citation.documentTitle).toBe('TypeScript Handbook')
      expect(results[0].citation.snippet).toBeTruthy()
    })
  })

  describe('buildRAGContext', () => {
    it('should build system prompt with citations', () => {
      const results = searchRAG('machine learning', docs, 3)
      const context = buildRAGContext(results, 'machine learning')

      expect(context.systemPrompt).toContain('[출처 1:')
      expect(context.systemPrompt).toContain('machine learning')
      expect(context.citations.length).toBeGreaterThan(0)
      expect(context.totalTokensEstimate).toBeGreaterThan(0)
    })
  })

  describe('extractKeyPoints', () => {
    it('should extract key sentences', () => {
      const text = 'Machine learning is transforming industries worldwide. Neural networks process information in layers. Deep learning achieves superhuman performance on many tasks. AI research continues to advance rapidly. Applications include healthcare and autonomous driving.'
      const points = extractKeyPoints(text, 3)
      expect(points.length).toBeLessThanOrEqual(3)
      expect(points.length).toBeGreaterThan(0)
    })

    it('should return empty for very short content', () => {
      const points = extractKeyPoints('Short text.', 3)
      expect(points).toEqual([])
    })
  })

  describe('chunkWithOverlap', () => {
    it('should create chunks with proper overlap', () => {
      const content = Array(10)
        .fill(null)
        .map((_, i) => `Paragraph ${i}: ${'Lorem ipsum dolor sit amet. '.repeat(5)}`)
        .join('\n\n')

      const chunks = chunkWithOverlap(content, 300, 50)
      expect(chunks.length).toBeGreaterThan(1)

      // Each chunk should have startOffset
      for (const chunk of chunks) {
        expect(chunk.startOffset).toBeDefined()
        expect(chunk.content.length).toBeGreaterThan(0)
      }
    })

    it('should handle single paragraph', () => {
      const chunks = chunkWithOverlap('Single short paragraph.')
      expect(chunks).toHaveLength(1)
    })
  })
})
