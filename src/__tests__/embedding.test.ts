import { describe, it, expect } from 'vitest'
import { embedText, cosineSimilarity, bm25Score, hybridScore, EMBEDDING_DIM } from '@/shared/lib/embedding'

describe('embedding', () => {
  describe('embedText', () => {
    it('should return a vector of EMBEDDING_DIM length', () => {
      const vec = embedText('hello world')
      expect(vec).toHaveLength(EMBEDDING_DIM)
    })

    it('should return normalized vector (L2 norm ~1)', () => {
      const vec = embedText('test document about machine learning')
      const norm = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0))
      expect(norm).toBeCloseTo(1, 1)
    })

    it('should produce consistent embeddings for same text', () => {
      const vec1 = embedText('hello world')
      const vec2 = embedText('hello world')
      expect(vec1).toEqual(vec2)
    })

    it('should produce different embeddings for different text', () => {
      const vec1 = embedText('machine learning is great')
      const vec2 = embedText('cooking recipes for dinner')
      expect(vec1).not.toEqual(vec2)
    })
  })

  describe('cosineSimilarity', () => {
    it('should return 1 for identical vectors', () => {
      const vec = embedText('test')
      expect(cosineSimilarity(vec, vec)).toBeCloseTo(1, 5)
    })

    it('should return higher score for similar texts', () => {
      const vec1 = embedText('machine learning algorithms')
      const vec2 = embedText('deep learning neural networks')
      const vec3 = embedText('cooking pasta recipes')

      const sim12 = cosineSimilarity(vec1, vec2)
      const sim13 = cosineSimilarity(vec1, vec3)
      expect(sim12).toBeGreaterThan(sim13)
    })

    it('should return 0 for empty vectors', () => {
      expect(cosineSimilarity([], [])).toBe(0)
    })

    it('should handle different length vectors', () => {
      expect(cosineSimilarity([1, 2], [1])).toBe(0)
    })
  })

  describe('bm25Score', () => {
    it('should return positive score for matching terms', () => {
      const score = bm25Score('machine learning', 'machine learning is a branch of AI')
      expect(score).toBeGreaterThan(0)
    })

    it('should return 0 for no matching terms', () => {
      const score = bm25Score('quantum physics', 'cooking pasta for dinner')
      expect(score).toBe(0)
    })

    it('should score higher for more term matches', () => {
      const score1 = bm25Score('machine learning AI', 'machine learning algorithms')
      const score2 = bm25Score('machine learning AI', 'machine learning AI deep neural networks')
      expect(score2).toBeGreaterThan(score1)
    })
  })

  describe('hybridScore', () => {
    it('should combine vector and keyword scores', () => {
      const query = 'machine learning'
      const queryEmb = embedText(query)
      const chunkEmb = embedText('machine learning algorithms and models')
      const score = hybridScore(queryEmb, chunkEmb, query, 'machine learning algorithms and models')
      expect(score).toBeGreaterThan(0)
      expect(score).toBeLessThanOrEqual(1)
    })
  })
})
