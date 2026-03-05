import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useKnowledgeStore } from '@/entities/knowledge/knowledge.store'

describe('KnowledgeStore', () => {
  beforeEach(() => {
    // Reset store state
    useKnowledgeStore.setState({
      documents: [],
      selectedDocumentId: null,
      searchQuery: '',
      searchResults: [],
      isProcessing: false,
      categories: ['general', 'technical', 'business', 'reference'],
    })
  })

  it('should add a new document with auto-generated chunks', () => {
    const { addDocument } = useKnowledgeStore.getState()

    const content = 'This is a test document.\n\nIt has multiple paragraphs.\n\nEach paragraph should be chunked appropriately.'

    addDocument('Test Document', content, 'text/plain', 1024, ['test', 'sample'], 'general')

    const { documents } = useKnowledgeStore.getState()
    expect(documents).toHaveLength(1)
    expect(documents[0].title).toBe('Test Document')
    expect(documents[0].content).toBe(content)
    expect(documents[0].fileType).toBe('text/plain')
    expect(documents[0].fileSize).toBe(1024)
    expect(documents[0].tags).toEqual(['test', 'sample'])
    expect(documents[0].category).toBe('general')
    expect(documents[0].version).toBe(1)
    expect(documents[0].chunks.length).toBeGreaterThan(0)
  })

  it('should update an existing document and regenerate chunks', () => {
    const { addDocument, updateDocument } = useKnowledgeStore.getState()

    addDocument('Original', 'Original content', 'text/plain', 512, ['tag1'], 'general')

    const docId = useKnowledgeStore.getState().documents[0].id
    const originalVersion = useKnowledgeStore.getState().documents[0].version

    updateDocument(docId, {
      title: 'Updated',
      content: 'Updated content with more text.\n\nThis will create new chunks.',
      tags: ['tag1', 'tag2']
    })

    const { documents } = useKnowledgeStore.getState()
    expect(documents[0].title).toBe('Updated')
    expect(documents[0].content).toContain('Updated content')
    expect(documents[0].tags).toEqual(['tag1', 'tag2'])
    expect(documents[0].version).toBe(originalVersion + 1)
    expect(documents[0].chunks.length).toBeGreaterThan(0)
  })

  it('should delete a document and clear selection if needed', () => {
    const { addDocument, selectDocument, deleteDocument } = useKnowledgeStore.getState()

    addDocument('Doc 1', 'Content 1', 'text/plain', 100, [], 'general')
    addDocument('Doc 2', 'Content 2', 'text/plain', 200, [], 'business')

    // addDocument prepends, so documents[0] is the most recent (Doc 2)
    const docs = useKnowledgeStore.getState().documents
    const doc1 = docs.find(d => d.title === 'Doc 1')!
    selectDocument(doc1.id)

    deleteDocument(doc1.id)

    const { documents, selectedDocumentId } = useKnowledgeStore.getState()
    expect(documents).toHaveLength(1)
    expect(documents[0].title).toBe('Doc 2')
    expect(selectedDocumentId).toBeNull()
  })

  it('should search documents by query', () => {
    const { addDocument, searchDocuments } = useKnowledgeStore.getState()

    addDocument('Doc 1', 'JavaScript is a programming language', 'text/plain', 100, [], 'technical')
    addDocument('Doc 2', 'Python is also a programming language', 'text/plain', 200, [], 'technical')
    addDocument('Doc 3', 'This document is about business processes', 'text/plain', 300, [], 'business')

    searchDocuments('programming')

    const { searchResults, searchQuery } = useKnowledgeStore.getState()
    expect(searchQuery).toBe('programming')
    expect(searchResults.length).toBeGreaterThan(0)
    expect(searchResults.every(chunk => chunk.content.toLowerCase().includes('programming'))).toBe(true)
  })

  it('should clear search results when query is empty', () => {
    const { addDocument, searchDocuments } = useKnowledgeStore.getState()

    addDocument('Doc 1', 'Test content', 'text/plain', 100, [], 'general')

    searchDocuments('test')
    expect(useKnowledgeStore.getState().searchResults.length).toBeGreaterThan(0)

    searchDocuments('')
    expect(useKnowledgeStore.getState().searchResults).toHaveLength(0)
    expect(useKnowledgeStore.getState().searchQuery).toBe('')
  })

  it('should chunk documents based on target size', () => {
    const { chunkDocument } = useKnowledgeStore.getState()

    const longContent = `First paragraph with some content.

Second paragraph with more content that should be in the same chunk if it fits.

Third paragraph with even more content.

Fourth paragraph that might be in a separate chunk depending on the size.

Fifth paragraph with additional text.

Sixth paragraph to ensure we have multiple chunks.`

    const chunks = chunkDocument(longContent)

    expect(chunks.length).toBeGreaterThan(0)
    expect(chunks[0].content.length).toBeLessThanOrEqual(600) // ~500 target + some buffer
    expect(chunks.every(chunk => chunk.id.startsWith('chunk-'))).toBe(true)
    expect(chunks[0].index).toBe(0)
    if (chunks.length > 1) {
      expect(chunks[1].index).toBe(1)
    }
  })

  it('should clear search state', () => {
    const { addDocument, searchDocuments, clearSearch } = useKnowledgeStore.getState()

    addDocument('Doc', 'Test content for search', 'text/plain', 100, [], 'general')

    searchDocuments('test')
    expect(useKnowledgeStore.getState().searchQuery).toBe('test')
    expect(useKnowledgeStore.getState().searchResults.length).toBeGreaterThan(0)

    clearSearch()

    const { searchQuery, searchResults } = useKnowledgeStore.getState()
    expect(searchQuery).toBe('')
    expect(searchResults).toHaveLength(0)
  })

  it('should maintain document selection', () => {
    const { addDocument, selectDocument } = useKnowledgeStore.getState()

    addDocument('Doc 1', 'Content 1', 'text/plain', 100, [], 'general')
    addDocument('Doc 2', 'Content 2', 'text/plain', 200, [], 'business')

    const doc2Id = useKnowledgeStore.getState().documents[1].id

    selectDocument(doc2Id)
    expect(useKnowledgeStore.getState().selectedDocumentId).toBe(doc2Id)

    selectDocument(null)
    expect(useKnowledgeStore.getState().selectedDocumentId).toBeNull()
  })
})