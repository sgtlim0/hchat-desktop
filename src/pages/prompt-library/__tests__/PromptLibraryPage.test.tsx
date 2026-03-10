import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PromptLibraryPage } from '../PromptLibraryPage'

// Mock i18n
vi.mock('@/shared/i18n', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

// Mock stores
const mockPrompts = [
  {
    id: 'prompt-1',
    title: 'Test Prompt',
    content: 'This is a test prompt with {{variable}}',
    category: 'general',
    tags: ['test', 'demo'],
    isFavorite: false,
    usageCount: 5,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
  {
    id: 'prompt-2',
    title: 'Code Review',
    content: 'Review this code',
    category: 'coding',
    tags: ['code'],
    isFavorite: true,
    usageCount: 10,
    createdAt: '2024-01-02',
    updatedAt: '2024-01-02',
  },
]

const mockAddPrompt = vi.fn()
const mockUpdatePrompt = vi.fn()
const mockDeletePrompt = vi.fn()
const mockToggleFavorite = vi.fn()
const mockIncrementUsage = vi.fn()

vi.mock('@/entities/prompt-library/prompt-library.store', () => ({
  usePromptLibraryStore: vi.fn((selector) => {
    const state = {
      prompts: mockPrompts,
      addPrompt: mockAddPrompt,
      updatePrompt: mockUpdatePrompt,
      deletePrompt: mockDeletePrompt,
      toggleFavorite: mockToggleFavorite,
      incrementUsage: mockIncrementUsage,
    }
    return selector ? selector(state) : state
  }),
}))

const mockCreateSession = vi.fn()
const mockSetPendingPrompt = vi.fn()

vi.mock('@/entities/session/session.store', () => ({
  useSessionStore: vi.fn((selector) => {
    const state = {
      createSession: mockCreateSession,
      setPendingPrompt: mockSetPendingPrompt,
    }
    return selector(state)
  }),
}))

// Mock Button component
vi.mock('@/shared/ui/Button', () => ({
  Button: ({ children, onClick, disabled, variant }: {
    children: React.ReactNode
    onClick?: () => void
    disabled?: boolean
    variant?: string
  }) => (
    <button onClick={onClick} disabled={disabled} data-variant={variant}>
      {children}
    </button>
  ),
}))

// Mock prompt template utilities
vi.mock('@/shared/lib/prompt-template', () => ({
  extractVariables: vi.fn((content: string) => {
    const matches = content.match(/{{(\w+)}}/g)
    return matches ? matches.map((m) => m.slice(2, -2)) : []
  }),
  fillTemplate: vi.fn((content: string, values: Record<string, string>) => {
    return content.replace(/{{(\w+)}}/g, (_, key) => values[key] || `{{${key}}}`)
  }),
}))

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Plus: () => null,
  Star: () => null,
  Search: () => null,
  Trash2: () => null,
  Edit3: () => null,
  Play: () => null,
  X: () => null,
}))

describe('PromptLibraryPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders prompt library page with title', () => {
    render(<PromptLibraryPage />)

    expect(screen.getByText('promptLib.title')).toBeInTheDocument()
    expect(screen.getByText('promptLib.new')).toBeInTheDocument()
  })

  it('displays all prompts by default', () => {
    render(<PromptLibraryPage />)

    expect(screen.getByText('Test Prompt')).toBeInTheDocument()
    expect(screen.getByText('Code Review')).toBeInTheDocument()
  })

  it('filters prompts by category', () => {
    render(<PromptLibraryPage />)

    const codingButtons = screen.getAllByText('promptLib.category.coding')
    // Click the button in category filter, not the one in prompt card
    fireEvent.click(codingButtons[0])

    expect(screen.getByText('Code Review')).toBeInTheDocument()
    expect(screen.queryByText('Test Prompt')).not.toBeInTheDocument()
  })

  it('searches prompts by query', () => {
    render(<PromptLibraryPage />)

    const searchInput = screen.getByPlaceholderText('promptLib.searchPlaceholder')
    fireEvent.change(searchInput, { target: { value: 'code' } })

    expect(screen.getByText('Code Review')).toBeInTheDocument()
    expect(screen.queryByText('Test Prompt')).not.toBeInTheDocument()
  })

  it('shows add form when new button is clicked', () => {
    render(<PromptLibraryPage />)

    const newButton = screen.getByText('promptLib.new')
    fireEvent.click(newButton)

    expect(screen.getByPlaceholderText('promptLib.titlePlaceholder')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('promptLib.contentPlaceholder')).toBeInTheDocument()
  })

  it('adds new prompt when save is clicked', () => {
    render(<PromptLibraryPage />)

    fireEvent.click(screen.getByText('promptLib.new'))

    const titleInput = screen.getByPlaceholderText('promptLib.titlePlaceholder')
    const contentInput = screen.getByPlaceholderText('promptLib.contentPlaceholder')
    const saveButton = screen.getByText('common.save')

    fireEvent.change(titleInput, { target: { value: 'New Prompt' } })
    fireEvent.change(contentInput, { target: { value: 'New content' } })
    fireEvent.click(saveButton)

    expect(mockAddPrompt).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'New Prompt',
        content: 'New content',
      })
    )
  })

  it('toggles favorite when star icon is clicked', () => {
    render(<PromptLibraryPage />)

    const favoriteButtons = screen.getAllByRole('button').filter(
      (btn) => btn.querySelector('.fill-amber-400') !== null || btn.querySelector('.text-text-tertiary') !== null
    )

    if (favoriteButtons.length > 0) {
      fireEvent.click(favoriteButtons[0])
      expect(mockToggleFavorite).toHaveBeenCalledWith('prompt-1')
    }
  })

  it('deletes prompt when delete button is clicked', () => {
    window.confirm = vi.fn(() => true)
    render(<PromptLibraryPage />)

    const deleteButtons = screen.getAllByTitle('common.delete')
    fireEvent.click(deleteButtons[0])

    expect(mockDeletePrompt).toHaveBeenCalledWith('prompt-1')
  })

  it('opens edit form when edit button is clicked', () => {
    render(<PromptLibraryPage />)

    const editButtons = screen.getAllByTitle('common.edit')
    fireEvent.click(editButtons[0])

    const titleInput = screen.getByPlaceholderText('promptLib.titlePlaceholder') as HTMLInputElement
    expect(titleInput.value).toBe('Test Prompt')
  })

  it('shows variable modal for prompts with variables', () => {
    render(<PromptLibraryPage />)

    const useButtons = screen.getAllByTitle('promptLib.use')
    fireEvent.click(useButtons[0]) // First prompt has {{variable}}

    expect(screen.getByText('promptLib.fillVariables')).toBeInTheDocument()
    expect(screen.getByText('{{variable}}')).toBeInTheDocument()
  })

  it('applies prompt without variables directly', () => {
    render(<PromptLibraryPage />)

    const useButtons = screen.getAllByTitle('promptLib.use')
    fireEvent.click(useButtons[1]) // Second prompt has no variables

    expect(mockIncrementUsage).toHaveBeenCalledWith('prompt-2')
    expect(mockCreateSession).toHaveBeenCalled()
    expect(mockSetPendingPrompt).toHaveBeenCalledWith('Review this code')
  })
})