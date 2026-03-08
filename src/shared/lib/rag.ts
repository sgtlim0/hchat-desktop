/**
 * RAG (Retrieval-Augmented Generation) utilities.
 * Provides document search, citation generation, and auto-summary.
 */

import type { KnowledgeDocument, KnowledgeChunk } from '@/shared/types'
import { embedText, hybridScore } from './embedding'

export interface RAGSearchResult {
  chunk: KnowledgeChunk
  document: KnowledgeDocument
  score: number
  citation: Citation
}

export interface Citation {
  documentId: string
  documentTitle: string
  chunkIndex: number
  snippet: string
  relevance: number
}

export interface RAGContext {
  systemPrompt: string
  citations: Citation[]
  totalTokensEstimate: number
}

/** Search documents with hybrid vector + keyword search */
export function searchRAG(
  query: string,
  documents: KnowledgeDocument[],
  topK = 5,
  minScore = 0.1,
): RAGSearchResult[] {
  const queryEmbedding = embedText(query)
  const results: RAGSearchResult[] = []

  for (const doc of documents) {
    for (const chunk of doc.chunks) {
      const chunkEmbedding = chunk.embedding ?? embedText(chunk.content)
      const score = hybridScore(queryEmbedding, chunkEmbedding, query, chunk.content)

      if (score >= minScore) {
        results.push({
          chunk,
          document: doc,
          score,
          citation: {
            documentId: doc.id,
            documentTitle: doc.title,
            chunkIndex: chunk.index,
            snippet: chunk.content.slice(0, 150) + (chunk.content.length > 150 ? '...' : ''),
            relevance: score,
          },
        })
      }
    }
  }

  return results.sort((a, b) => b.score - a.score).slice(0, topK)
}

/** Build RAG context for LLM prompt injection */
export function buildRAGContext(results: RAGSearchResult[], query: string): RAGContext {
  const contextParts = results.map(
    (r, i) =>
      `[출처 ${i + 1}: ${r.document.title} - 섹션 ${r.chunk.index + 1}]\n${r.chunk.content}`,
  )

  const systemPrompt = `다음 참고 자료를 기반으로 답변하세요. 답변 시 [출처 N] 형식으로 인용을 포함하세요.

---참고 자료---
${contextParts.join('\n\n')}
---참고 자료 끝---

사용자 질문: ${query}`

  const totalTokensEstimate = Math.ceil(systemPrompt.length / 4)

  return {
    systemPrompt,
    citations: results.map((r) => r.citation),
    totalTokensEstimate,
  }
}

/** Generate auto-summary for a document using key sentences extraction */
export function extractKeyPoints(content: string, maxPoints = 5): string[] {
  const sentences = content
    .split(/[.!?。！？]\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 20 && s.length < 500)

  if (sentences.length === 0) return []

  // Score sentences by position + length + keyword density
  const scored = sentences.map((sentence, idx) => {
    const positionScore = 1 - idx / sentences.length // earlier = higher
    const lengthScore = Math.min(sentence.length / 200, 1) // optimal ~200 chars
    const words = sentence.toLowerCase().split(/\s+/)
    const uniqueRatio = new Set(words).size / words.length // vocabulary richness

    return {
      sentence,
      score: positionScore * 0.3 + lengthScore * 0.3 + uniqueRatio * 0.4,
    }
  })

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, maxPoints)
    .map((s) => s.sentence)
}

/** Chunk document with sliding window and overlap */
export function chunkWithOverlap(
  content: string,
  chunkSize = 500,
  overlap = 100,
): { content: string; startOffset: number }[] {
  const paragraphs = content.split(/\n\n+/).filter((p) => p.trim())
  const chunks: { content: string; startOffset: number }[] = []
  let buffer = ''
  let startOffset = 0
  let currentOffset = 0

  for (const para of paragraphs) {
    if (buffer.length + para.length > chunkSize && buffer.length > 0) {
      chunks.push({ content: buffer.trim(), startOffset })

      // Overlap: keep last portion of buffer
      const overlapText = buffer.slice(-overlap)
      startOffset = currentOffset - overlapText.length
      buffer = overlapText
    }

    buffer += (buffer ? '\n\n' : '') + para
    currentOffset += para.length + 2
  }

  if (buffer.trim()) {
    chunks.push({ content: buffer.trim(), startOffset })
  }

  return chunks
}
