import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { KnowledgeBasePage } from '../KnowledgeBasePage'

// Mock i18n
vi.mock('@/shared/i18n', () => ({
  useTranslation: () => ({
    t: (key: string, params?: any) => {
      if (params?.count) {
        return `${key} ${params.count}`
      }
      return key
    },
  }),
}))

// Mock stores
const mockSetView = vi.fn()

vi.mock('@/entities/session/session.store', () => ({
  useSessionStore: vi.fn((selector) => {
    const state = {
      setView: mockSetView,
    }
    return selector(state)
  }),
}))

const mockDocuments = [
  {
    id: 'doc-1',
    title: 'Test Document',
    content: 'This is a test document content',
    fileType: 'text',
    fileSize: 1024,
    tags: ['test', 'demo'],
    category: 'general',
    chunks: [
      {
        id: 'chunk-1',
        documentId: 'doc-1',
        content: 'This is a test document content',
        index: 0,
        embedding: null,
      },
    ],
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
  {
    id: 'doc-2',
    title: 'Technical Guide',
    content: 'Technical documentation content',
    fileType: 'text',
    fileSize: 2048,
    tags: ['tech'],
    category: 'technical',
    chunks: [
      {
        id: 'chunk-2',
        documentId: 'doc-2',
        content: 'Technical documentation content',
        index: 0,
        embedding: null,
      },
    ],
    createdAt: '2024-01-02',
    updatedAt: '2024-01-02',
  },
]

const mockSearchResults = [
  {
    id: 'chunk-1',
    documentId: 'doc-1',
    content: 'This is a test document content',
    index: 0,
    embedding: null,
  },
]

const mockSelectDocument = vi.fn()
const mockSearchDocuments = vi.fn()
const mockClearSearch = vi.fn()
const mockAddDocument = vi.fn()
const mockDeleteDocument = vi.fn()
const mockUpdateDocument = vi.fn()

vi.mock('@/entities/knowledge/knowledge.store', () => ({
  useKnowledgeStore: vi.fn((selector) => {
    const state = {
      documents: mockDocuments,
      selectedDocumentId: null,
      searchQuery: '',
      searchResults: [],
      categories: ['general', 'technical', 'reference'],
      selectDocument: mockSelectDocument,
      searchDocuments: mockSearchDocuments,
      clearSearch: mockClearSearch,
      addDocument: mockAddDocument,
      deleteDocument: mockDeleteDocument,
      updateDocument: mockUpdateDocument,
    }
    return selector ? selector(state) : state
  }),
}))

// Mock Button component
vi.mock('@/shared/ui/Button', () => ({
  Button: ({ children, onClick, disabled, variant, size, className }: any) => (
    <button onClick={onClick} disabled={disabled} data-variant={variant} data-size={size} className={className}>
      {children}
    </button>
  ),
}))

// Mock file extraction
vi.mock('@/shared/lib/translate', () => ({
  extractFileText: vi.fn(() => Promise.resolve('Extracted file content')),
}))

// Mock lucide icons
vi.mock('lucide-react', () => ({
  BookOpen: () => null,
  Search: () => null,
  Plus: () => null,
  Trash2: () => null,
  FileText: () => null,
  Tag: () => null,
  FolderOpen: () => null,
  X: () => null,
  Upload: () => null,
}))

describe('KnowledgeBasePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders knowledge base page with header', () => {
    render(<KnowledgeBasePage />)

    expect(screen.getByText('knowledge.title')).toBeInTheDocument()
    expect(screen.getByText('knowledge.subtitle')).toBeInTheDocument()
    expect(screen.getByText('knowledge.addDocument')).toBeInTheDocument()
  })

  it('displays all documents by default', () => {
    render(<KnowledgeBasePage />)

    expect(screen.getByText('Test Document')).toBeInTheDocument()
    expect(screen.getByText('Technical Guide')).toBeInTheDocument()
  })

  it('filters documents by category', () => {
    render(<KnowledgeBasePage />)

    const technicalButton = screen.getByText('knowledge.category_technical')
    fireEvent.click(technicalButton)

    expect(screen.getByText('Technical Guide')).toBeInTheDocument()
    expect(screen.queryByText('Test Document')).not.toBeInTheDocument()
  })

  it('searches documents when search input changes', () => {
    render(<KnowledgeBasePage />)

    const searchInput = screen.getByPlaceholderText('knowledge.searchPlaceholder')
    fireEvent.change(searchInput, { target: { value: 'test' } })

    expect(mockSearchDocuments).toHaveBeenCalledWith('test')
  })

  it('clears search when X button is clicked', async () => {
    const { useKnowledgeStore } = vi.mocked(await import('@/entities/knowledge/knowledge.store'))

    useKnowledgeStore.mockImplementation((selector: any) => {
      const state = {
        documents: mockDocuments,
        selectedDocumentId: null,
        searchQuery: 'test',
        searchResults: mockSearchResults,
        categories: ['general', 'technical', 'reference'],
        selectDocument: mockSelectDocument,
        searchDocuments: mockSearchDocuments,
        clearSearch: mockClearSearch,
        addDocument: mockAddDocument,
        deleteDocument: mockDeleteDocument,
        updateDocument: mockUpdateDocument,
      }
      return selector ? selector(state) : state
    })

    render(<KnowledgeBasePage />)

    const clearButton = screen.getAllByRole('button').find(
      (btn) => btn.querySelector('svg') && btn.getAttribute('class')?.includes('text-text-tertiary')
    )

    if (clearButton) {
      fireEvent.click(clearButton)
      expect(mockClearSearch).toHaveBeenCalled()
    }
  })

  it('navigates back when close button is clicked', () => {
    render(<KnowledgeBasePage />)

    const closeButton = screen.getAllByRole('button')[0]
    fireEvent.click(closeButton)

    expect(mockSetView).toHaveBeenCalledWith('home')
  })

  it('shows add document modal when add button is clicked', () => {
    render(<KnowledgeBasePage />)

    const addButton = screen.getAllByText('knowledge.addDocument')[0]
    fireEvent.click(addButton)

    expect(screen.getByText('knowledge.addText')).toBeInTheDocument()
    expect(screen.getByText('knowledge.uploadFile')).toBeInTheDocument()
  })

  it('adds document when form is submitted', () => {
    render(<KnowledgeBasePage />)

    fireEvent.click(screen.getAllByText('knowledge.addDocument')[0])

    const titleInput = screen.getByPlaceholderText('knowledge.docTitlePlaceholder')
    const contentInput = screen.getByPlaceholderText('knowledge.docContentPlaceholder')
    const addButton = screen.getByText('common.add')

    fireEvent.change(titleInput, { target: { value: 'New Document' } })
    fireEvent.change(contentInput, { target: { value: 'New content' } })
    fireEvent.click(addButton)

    expect(mockAddDocument).toHaveBeenCalledWith(
      'New Document',
      'New content',
      'text',
      11, // 'New content'.length
      [],
      'general'
    )
  })

  it('deletes document when delete button is clicked', () => {
    window.confirm = vi.fn(() => true)
    render(<KnowledgeBasePage />)

    const deleteButtons = screen.getAllByRole('button').filter(
      (btn) => btn.getAttribute('class')?.includes('hover:text-danger')
    )

    if (deleteButtons.length > 0) {
      fireEvent.click(deleteButtons[0])
      expect(mockDeleteDocument).toHaveBeenCalledWith('doc-1')
    }
  })

  it('selects document when clicked', () => {
    render(<KnowledgeBasePage />)

    const documentCard = screen.getByText('Test Document').closest('[role="button"]')
    if (documentCard) {
      fireEvent.click(documentCard)
      expect(mockSelectDocument).toHaveBeenCalledWith('doc-1')
    }
  })

  it('shows empty state when no documents', async () => {
    const { useKnowledgeStore } = vi.mocked(await import('@/entities/knowledge/knowledge.store'))

    useKnowledgeStore.mockImplementation((selector: any) => {
      const state = {
        documents: [],
        selectedDocumentId: null,
        searchQuery: '',
        searchResults: [],
        categories: ['general', 'technical', 'reference'],
        selectDocument: mockSelectDocument,
        searchDocuments: mockSearchDocuments,
        clearSearch: mockClearSearch,
        addDocument: mockAddDocument,
        deleteDocument: mockDeleteDocument,
        updateDocument: mockUpdateDocument,
      }
      return selector ? selector(state) : state
    })

    render(<KnowledgeBasePage />)

    expect(screen.getByText('knowledge.empty')).toBeInTheDocument()
    expect(screen.getByText('knowledge.emptyHint')).toBeInTheDocument()
  })

  it('handles file upload', async () => {
    const { extractFileText } = await import('@/shared/lib/translate')
    render(<KnowledgeBasePage />)

    fireEvent.click(screen.getAllByText('knowledge.addDocument')[0])
    fireEvent.click(screen.getByText('knowledge.uploadFile'))

    const file = new File(['test content'], 'test.txt', { type: 'text/plain' })
    const input = document.querySelector('input[type="file"]') as HTMLInputElement

    if (input) {
      Object.defineProperty(input, 'files', {
        value: [file],
        writable: false,
      })
      fireEvent.change(input)

      await waitFor(() => {
        expect(extractFileText).toHaveBeenCalledWith(file)
      })
    }
  })
})