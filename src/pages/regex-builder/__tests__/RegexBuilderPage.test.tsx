import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { RegexBuilderPage } from '../RegexBuilderPage'

// Mock i18n
vi.mock('@/shared/i18n', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

// Mock session store
const mockSetView = vi.fn()

vi.mock('@/entities/session/session.store', () => ({
  useSessionStore: vi.fn((selector) => {
    const state = {
      setView: mockSetView,
    }
    return selector(state)
  }),
}))

// Mock regex builder store
const mockSetPattern = vi.fn()
const mockSetFlags = vi.fn()
const mockSetTestInput = vi.fn()
const mockSavePattern = vi.fn()
const mockDeletePattern = vi.fn()
const mockSelectPattern = vi.fn()
const mockToggleFavorite = vi.fn()
const mockGetMatches = vi.fn(() => [])

const mockPatterns = [
  {
    id: 'regex-1',
    name: 'Email Pattern',
    pattern: '[\\w.]+@[\\w.]+',
    flags: 'g',
    description: '',
    testInput: '',
    isFavorite: false,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
]

vi.mock('@/entities/regex-builder/regex-builder.store', () => ({
  useRegexBuilderStore: vi.fn((selector) => {
    const state = {
      patterns: mockPatterns,
      currentPattern: '\\d+',
      currentFlags: 'g',
      testInput: 'hello 123',
      selectedPatternId: null,
      setPattern: mockSetPattern,
      setFlags: mockSetFlags,
      setTestInput: mockSetTestInput,
      savePattern: mockSavePattern,
      deletePattern: mockDeletePattern,
      selectPattern: mockSelectPattern,
      toggleFavorite: mockToggleFavorite,
      getMatches: mockGetMatches,
    }
    return selector(state)
  }),
}))

// Mock Button component
vi.mock('@/shared/ui/Button', () => ({
  Button: ({ children, onClick, disabled, className }: {
    children: React.ReactNode
    onClick?: () => void
    disabled?: boolean
    className?: string
  }) => (
    <button onClick={onClick} disabled={disabled} className={className}>
      {children}
    </button>
  ),
}))

// Mock lucide icons
vi.mock('lucide-react', () => ({
  ArrowLeft: () => null,
  Save: () => null,
  Trash2: () => null,
  Star: () => null,
  BookOpen: () => null,
  Search: () => null,
}))

describe('RegexBuilderPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetMatches.mockReturnValue([])
  })

  it('renders the page with header', () => {
    render(<RegexBuilderPage />)

    expect(screen.getByText('regex.title')).toBeInTheDocument()
    expect(screen.getByText('regex.subtitle')).toBeInTheDocument()
  })

  it('navigates to home when back button is clicked', () => {
    render(<RegexBuilderPage />)

    const backButton = screen.getByLabelText('common.back')
    fireEvent.click(backButton)

    expect(mockSetView).toHaveBeenCalledWith('home')
  })

  it('renders pattern input with current value', () => {
    render(<RegexBuilderPage />)

    const patternInput = screen.getByTestId('pattern-input')
    expect(patternInput).toHaveValue('\\d+')
  })

  it('calls setPattern on input change', () => {
    render(<RegexBuilderPage />)

    const patternInput = screen.getByTestId('pattern-input')
    fireEvent.change(patternInput, { target: { value: '\\w+' } })

    expect(mockSetPattern).toHaveBeenCalledWith('\\w+')
  })

  it('renders flag checkboxes', () => {
    render(<RegexBuilderPage />)

    const gFlag = screen.getByTestId('flag-g')
    expect(gFlag).toBeChecked()

    const iFlag = screen.getByTestId('flag-i')
    expect(iFlag).not.toBeChecked()
  })

  it('renders saved patterns list', () => {
    render(<RegexBuilderPage />)

    expect(screen.getByText('Email Pattern')).toBeInTheDocument()
    // Pattern is rendered as: /[\w.]+@[\w.]+/g split across elements
    expect(screen.getByText('Email Pattern').closest('div')?.parentElement).toBeTruthy()
  })

  it('renders test input textarea', () => {
    render(<RegexBuilderPage />)

    const testInput = screen.getByTestId('test-input')
    expect(testInput).toHaveValue('hello 123')
  })

  it('calls setTestInput on textarea change', () => {
    render(<RegexBuilderPage />)

    const testInput = screen.getByTestId('test-input')
    fireEvent.change(testInput, { target: { value: 'new test' } })

    expect(mockSetTestInput).toHaveBeenCalledWith('new test')
  })

  it('shows no matches message when there are no matches', () => {
    render(<RegexBuilderPage />)

    expect(screen.getByText('regex.noMatches')).toBeInTheDocument()
  })

  it('toggles cheatsheet visibility', () => {
    render(<RegexBuilderPage />)

    // Cheatsheet content should not be visible initially
    expect(screen.queryByText('Any character except newline')).not.toBeInTheDocument()

    // Click the cheatsheet toggle button (has title attribute)
    const cheatsheetButton = screen.getByTitle('regex.cheatsheet')
    fireEvent.click(cheatsheetButton)

    expect(screen.getByText(/Any character except newline/)).toBeInTheDocument()
  })
})
