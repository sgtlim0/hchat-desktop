import { create } from 'zustand'
import type { KnowledgeDocument, KnowledgeChunk } from '@/shared/types'

interface KnowledgeState {
  documents: KnowledgeDocument[]
  selectedDocumentId: string | null
  searchQuery: string
  searchResults: KnowledgeChunk[]
  isProcessing: boolean
  categories: string[]

  hydrate: () => void
  addDocument: (
    title: string,
    content: string,
    fileType: string,
    fileSize: number,
    tags: string[],
    category: string
  ) => void
  updateDocument: (id: string, updates: Partial<Omit<KnowledgeDocument, 'id' | 'createdAt' | 'updatedAt'>>) => void
  deleteDocument: (id: string) => void
  selectDocument: (id: string | null) => void
  searchDocuments: (query: string) => void
  chunkDocument: (content: string) => KnowledgeChunk[]
  clearSearch: () => void
}

export const useKnowledgeStore = create<KnowledgeState>((set, get) => ({
  documents: [],
  selectedDocumentId: null,
  searchQuery: '',
  searchResults: [],
  isProcessing: false,
  categories: ['general', 'technical', 'business', 'reference'],

  hydrate: () => {
    // IndexedDB hydration placeholder
  },

  addDocument: (title, content, fileType, fileSize, tags, category) => {
    const now = new Date().toISOString()
    const id = `kb-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

    const chunks = get().chunkDocument(content).map((chunk, idx) => ({
      ...chunk,
      documentId: id,
      index: idx,
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
    }))
  },

  updateDocument: (id, updates) => {
    set((state) => {
      const updated = state.documents.map((doc) => {
        if (doc.id !== id) return doc

        const newContent = updates.content ?? doc.content
        const newChunks = updates.content
          ? get().chunkDocument(newContent).map((chunk, idx) => ({
              ...chunk,
              documentId: id,
              index: idx,
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
      set({ searchResults: [] })
      return
    }

    const lowerQuery = query.toLowerCase()
    const results: KnowledgeChunk[] = []

    for (const doc of get().documents) {
      for (const chunk of doc.chunks) {
        if (chunk.content.toLowerCase().includes(lowerQuery)) {
          results.push(chunk)
        }
      }
    }

    set({ searchResults: results })
  },

  chunkDocument: (content) => {
    const targetSize = 500
    const paragraphs = content.split(/\n\n+/).filter((p) => p.trim())
    const chunks: KnowledgeChunk[] = []

    let buffer = ''
    let chunkIndex = 0

    for (const para of paragraphs) {
      if (buffer.length + para.length > targetSize && buffer.length > 0) {
        chunks.push({
          id: `chunk-${Date.now()}-${chunkIndex}`,
          documentId: '', // filled by caller
          content: buffer.trim(),
          index: chunkIndex,
        })
        chunkIndex++
        buffer = ''
      }

      buffer += (buffer ? '\n\n' : '') + para
    }

    if (buffer.trim()) {
      chunks.push({
        id: `chunk-${Date.now()}-${chunkIndex}`,
        documentId: '',
        content: buffer.trim(),
        index: chunkIndex,
      })
    }

    return chunks
  },

  clearSearch: () => {
    set({ searchQuery: '', searchResults: [] })
  },
}))
