import { create } from 'zustand'
import type { KnowledgeDocument, KnowledgeChunk } from '@/shared/types'
import { embedText } from '@/shared/lib/embedding'
import {
  searchRAG,
  buildRAGContext,
  extractKeyPoints,
  chunkWithOverlap,
  type RAGSearchResult,
  type RAGContext,
} from '@/shared/lib/rag'

interface KnowledgeState {
  documents: KnowledgeDocument[]
  selectedDocumentId: string | null
  searchQuery: string
  searchResults: RAGSearchResult[]
  ragContext: RAGContext | null
  isProcessing: boolean
  categories: string[]

  hydrate: () => void
  addDocument: (
    title: string,
    content: string,
    fileType: string,
    fileSize: number,
    tags: string[],
    category: string,
  ) => void
  updateDocument: (
    id: string,
    updates: Partial<Omit<KnowledgeDocument, 'id' | 'createdAt' | 'updatedAt'>>,
  ) => void
  deleteDocument: (id: string) => void
  selectDocument: (id: string | null) => void
  searchDocuments: (query: string) => void
  getRAGContext: (query: string) => RAGContext | null
  getDocumentSummary: (id: string) => string[]
  clearSearch: () => void
}

export const useKnowledgeStore = create<KnowledgeState>((set, get) => ({
  documents: [],
  selectedDocumentId: null,
  searchQuery: '',
  searchResults: [],
  ragContext: null,
  isProcessing: false,
  categories: ['general', 'technical', 'business', 'reference'],

  hydrate: () => {
    // IndexedDB hydration placeholder
  },

  addDocument: (title, content, fileType, fileSize, tags, category) => {
    const now = new Date().toISOString()
    const id = `kb-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

    set({ isProcessing: true })

    // Chunk with overlap for better context
    const rawChunks = chunkWithOverlap(content, 500, 100)
    const chunks: KnowledgeChunk[] = rawChunks.map((raw, idx) => ({
      id: `chunk-${Date.now()}-${idx}`,
      documentId: id,
      content: raw.content,
      index: idx,
      embedding: embedText(raw.content),
    }))

    const newDoc: KnowledgeDocument = {
      id,
      title,
      content,
      chunks,
      tags,
      category,
      fileType,
      fileSize,
      version: 1,
      createdAt: now,
      updatedAt: now,
    }

    set((state) => ({
      documents: [newDoc, ...state.documents],
      isProcessing: false,
    }))
  },

  updateDocument: (id, updates) => {
    set((state) => {
      const updated = state.documents.map((doc) => {
        if (doc.id !== id) return doc

        const newContent = updates.content ?? doc.content
        const newChunks = updates.content
          ? chunkWithOverlap(newContent, 500, 100).map((raw, idx) => ({
              id: `chunk-${Date.now()}-${idx}`,
              documentId: id,
              content: raw.content,
              index: idx,
              embedding: embedText(raw.content),
            }))
          : doc.chunks

        return {
          ...doc,
          ...updates,
          content: newContent,
          chunks: newChunks,
          version: doc.version + 1,
          updatedAt: new Date().toISOString(),
        }
      })

      return { documents: updated }
    })
  },

  deleteDocument: (id) => {
    set((state) => ({
      documents: state.documents.filter((d) => d.id !== id),
      selectedDocumentId: state.selectedDocumentId === id ? null : state.selectedDocumentId,
    }))
  },

  selectDocument: (id) => {
    set({ selectedDocumentId: id })
  },

  searchDocuments: (query) => {
    set({ searchQuery: query })

    if (!query.trim()) {
      set({ searchResults: [], ragContext: null })
      return
    }

    const results = searchRAG(query, get().documents, 10, 0.05)
    const ragContext = results.length > 0 ? buildRAGContext(results, query) : null

    set({ searchResults: results, ragContext })
  },

  getRAGContext: (query) => {
    const results = searchRAG(query, get().documents, 5, 0.1)
    if (results.length === 0) return null
    return buildRAGContext(results, query)
  },

  getDocumentSummary: (id) => {
    const doc = get().documents.find((d) => d.id === id)
    if (!doc) return []
    return extractKeyPoints(doc.content, 5)
  },

  clearSearch: () => {
    set({ searchQuery: '', searchResults: [], ragContext: null })
  },
}))
