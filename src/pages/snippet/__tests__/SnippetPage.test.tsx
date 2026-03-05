import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SnippetPage } from '../SnippetPage'

// Mock i18n
vi.mock('@/shared/i18n', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

// Mock stores
const mockSetView = vi.fn()
vi.mock('@/entities/session/session.store', () => ({
  useSessionStore: vi.fn((selector) => {
    const state = { setView: mockSetView }
    return selector(state)
  }),
}))

const mockHydrate = vi.fn()
const mockAddSnippet = vi.fn()
const mockDeleteSnippet = vi.fn()
const mockSelectSnippet = vi.fn()
const mockSetSearchQuery = vi.fn()
const mockSetLanguage = vi.fn()
const mockIncrementUsage = vi.fn()
const mockToggleFavorite = vi.fn()

const mockSnippets = [
  {
    id: 'snippet-1',
    title: 'Array Utils',
    language: 'javascript',
    code: 'const arr = [1,2,3]',
    description: 'Utility functions',
    tags: ['array'],
    isFavorite: false,
    usageCount: 5,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
  {
    id: 'snippet-2',
    title: 'Type Helper',
    language: 'typescript',
    code: 'type Id = string',
    description: 'Type utilities',
    tags: ['type'],
    isFavorite: true,
    usageCount: 3,
    createdAt: '2024-01-02',
    updatedAt: '2024-01-02',
  },
]

vi.mock('@/entities/snippet/snippet.store', () => ({
  useSnippetStore: vi.fn((selector) => {
    const state = {
      snippets: mockSnippets,
      searchQuery: '',
      selectedLanguage: '',
      selectedSnippetId: null,
      hydrate: mockHydrate,
      addSnippet: mockAddSnippet,
      deleteSnippet: mockDeleteSnippet,
      setSearchQuery: mockSetSearchQuery,
      setLanguage: mockSetLanguage,
      selectSnippet: mockSelectSnippet,
      incrementUsage: mockIncrementUsage,
      toggleFavorite: mockToggleFavorite,
      getFilteredSnippets: () => mockSnippets,
    }
    return selector ? selector(state) : state
  }),
}))

// Mock Button
vi.mock('@/shared/ui/Button', () => ({
  Button: ({ children, onClick, className }: any) => (
    <button onClick={onClick} className={className}>
      {children}
    </button>
  ),
}))

// Mock lucide icons
vi.mock('lucide-react', () => ({
  ArrowLeft: () => null,
  Plus: () => null,
  Copy: () => null,
  Trash2: () => null,
  Code: () => null,
  Star: () => null,
  Search: () => null,
}))

describe('SnippetPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders snippet page with header', () => {
    render(<SnippetPage />)

    expect(screen.getByText('snippet.title')).toBeInTheDocument()
    expect(screen.getByText('snippet.subtitle')).toBeInTheDocument()
  })

  it('calls hydrate on mount', () => {
    render(<SnippetPage />)

    expect(mockHydrate).toHaveBeenCalled()
  })

  it('navigates to home when back button is clicked', () => {
    render(<SnippetPage />)

    const backButton = screen.getByLabelText('common.back')
    fireEvent.click(backButton)

    expect(mockSetView).toHaveBeenCalledWith('home')
  })

  it('displays snippet list', () => {
    render(<SnippetPage />)

    expect(screen.getByText('Array Utils')).toBeInTheDocument()
    expect(screen.getByText('Type Helper')).toBeInTheDocument()
  })

  it('opens new snippet modal', () => {
    render(<SnippetPage />)

    const newButton = screen.getByText('snippet.new')
    fireEvent.click(newButton)

    expect(screen.getByPlaceholderText('snippet.titlePlaceholder')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('snippet.codePlaceholder')).toBeInTheDocument()
  })

  it('selects a snippet from the list', () => {
    render(<SnippetPage />)

    fireEvent.click(screen.getByText('Array Utils'))

    expect(mockSelectSnippet).toHaveBeenCalledWith('snippet-1')
  })

  it('shows selected snippet detail', async () => {
    const { useSnippetStore } = vi.mocked(await import('@/entities/snippet/snippet.store'))

    useSnippetStore.mockImplementation((selector: any) => {
      const state = {
        snippets: mockSnippets,
        searchQuery: '',
        selectedLanguage: '',
        selectedSnippetId: 'snippet-1',
        hydrate: mockHydrate,
        addSnippet: mockAddSnippet,
        deleteSnippet: mockDeleteSnippet,
        setSearchQuery: mockSetSearchQuery,
        setLanguage: mockSetLanguage,
        selectSnippet: mockSelectSnippet,
        incrementUsage: mockIncrementUsage,
        toggleFavorite: mockToggleFavorite,
        getFilteredSnippets: () => mockSnippets,
      }
      return selector ? selector(state) : state
    })

    render(<SnippetPage />)

    expect(screen.getByText('const arr = [1,2,3]')).toBeInTheDocument()
    expect(screen.getByText('Utility functions')).toBeInTheDocument()
  })
})
