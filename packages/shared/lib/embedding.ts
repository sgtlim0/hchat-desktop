/**
 * Client-side text embedding for RAG vector search.
 * Uses a simple TF-IDF approach for local embedding without API calls.
 * Future: replace with Web Worker + ONNX model for real embeddings.
 */

const EMBEDDING_DIM = 128

/** Simple hash-based token to dimension mapping */
function hashToken(token: string): number {
  let hash = 0
  for (let i = 0; i < token.length; i++) {
    hash = (hash << 5) - hash + token.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

/** Tokenize text into normalized words */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\sㄱ-ㅎㅏ-ㅣ가-힣]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1)
}

/** Generate a fixed-dimension embedding vector from text using TF-IDF-like hashing */
export function embedText(text: string): number[] {
  const tokens = tokenize(text)
  const vector = new Float32Array(EMBEDDING_DIM)

  // Term frequency hashing
  const tf = new Map<string, number>()
  for (const token of tokens) {
    tf.set(token, (tf.get(token) ?? 0) + 1)
  }

  for (const [token, freq] of tf) {
    const dim = hashToken(token) % EMBEDDING_DIM
    const weight = Math.log(1 + freq) // log TF
    vector[dim] += weight

    // Also hash bigrams for better semantic capture
    const dim2 = (hashToken(token) * 31) % EMBEDDING_DIM
    vector[dim2] += weight * 0.5
  }

  // L2 normalize
  let norm = 0
  for (let i = 0; i < EMBEDDING_DIM; i++) {
    norm += vector[i] * vector[i]
  }
  norm = Math.sqrt(norm) || 1

  const result: number[] = []
  for (let i = 0; i < EMBEDDING_DIM; i++) {
    result.push(vector[i] / norm)
  }

  return result
}

/** Cosine similarity between two embedding vectors */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0

  let dot = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }

  const denom = Math.sqrt(normA) * Math.sqrt(normB)
  return denom === 0 ? 0 : dot / denom
}

/** BM25 keyword score for hybrid search */
export function bm25Score(query: string, document: string, k1 = 1.5, b = 0.75): number {
  const queryTokens = tokenize(query)
  const docTokens = tokenize(document)
  const avgDocLen = 200 // approximate average

  const docTf = new Map<string, number>()
  for (const token of docTokens) {
    docTf.set(token, (docTf.get(token) ?? 0) + 1)
  }

  let score = 0
  for (const qt of queryTokens) {
    const tf = docTf.get(qt) ?? 0
    if (tf === 0) continue

    const idf = Math.log(1 + 1 / (tf + 0.5)) // simplified IDF
    const tfNorm = (tf * (k1 + 1)) / (tf + k1 * (1 - b + b * (docTokens.length / avgDocLen)))
    score += idf * tfNorm
  }

  return score
}

/** Hybrid search: combine vector similarity and BM25 keyword score */
export function hybridScore(
  queryEmbedding: number[],
  chunkEmbedding: number[],
  query: string,
  chunkText: string,
  vectorWeight = 0.6,
): number {
  const vecScore = cosineSimilarity(queryEmbedding, chunkEmbedding)
  const keywordScore = bm25Score(query, chunkText)

  // Normalize BM25 to 0-1 range (approximate)
  const normalizedBM25 = Math.min(keywordScore / 5, 1)

  return vectorWeight * vecScore + (1 - vectorWeight) * normalizedBM25
}

export { EMBEDDING_DIM }
