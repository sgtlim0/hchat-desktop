import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DataConverterPage } from '../DataConverterPage'

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
    const state = { setView: mockSetView }
    return selector(state)
  }),
}))

// Mock data converter store
const mockConvert = vi.fn()
const mockSwapFormats = vi.fn()
const mockSetSourceContent = vi.fn()
const mockSetSourceFormat = vi.fn()
const mockSetTargetFormat = vi.fn()
const mockFormatSource = vi.fn()
const mockMinifySource = vi.fn()
const mockClearAll = vi.fn()
const mockHydrate = vi.fn()

vi.mock('@/entities/data-converter/data-converter.store', () => ({
  useDataConverterStore: vi.fn((selector) => {
    const state = {
      sourceContent: '',
      targetContent: '',
      sourceFormat: 'json',
      targetFormat: 'yaml',
      history: [],
      error: null,
      setSourceContent: mockSetSourceContent,
      setTargetContent: vi.fn(),
      setSourceFormat: mockSetSourceFormat,
      setTargetFormat: mockSetTargetFormat,
      convert: mockConvert,
      swapFormats: mockSwapFormats,
      formatSource: mockFormatSource,
      minifySource: mockMinifySource,
      clearAll: mockClearAll,
      hydrate: mockHydrate,
    }
    return selector ? selector(state) : state
  }),
}))

// Mock Button component
vi.mock('@/shared/ui/Button', () => ({
  Button: ({ children, onClick, className, disabled, ...rest }: {
    children: React.ReactNode
    onClick?: () => void
    className?: string
    disabled?: boolean
    [key: string]: unknown
  }) => (
    <button onClick={onClick} className={className} disabled={disabled} {...rest}>
      {children}
    </button>
  ),
}))

// Mock lucide icons
vi.mock('lucide-react', () => ({
  ArrowLeft: () => null,
  ArrowRightLeft: () => null,
  Copy: () => null,
  Trash2: () => null,
  Check: () => null,
  X: () => null,
  RotateCcw: () => null,
}))

describe('DataConverterPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders page with header and title', () => {
    render(<DataConverterPage />)

    expect(screen.getByText('dataConverter.title')).toBeInTheDocument()
    expect(screen.getByText('dataConverter.subtitle')).toBeInTheDocument()
  })

  it('navigates to home when back button is clicked', () => {
    render(<DataConverterPage />)

    const backButton = screen.getByLabelText('common.back')
    fireEvent.click(backButton)

    expect(mockSetView).toHaveBeenCalledWith('home')
  })

  it('calls hydrate on mount', () => {
    render(<DataConverterPage />)

    expect(mockHydrate).toHaveBeenCalled()
  })

  it('renders source and target textareas', () => {
    render(<DataConverterPage />)

    expect(screen.getByLabelText('source input')).toBeInTheDocument()
    expect(screen.getByLabelText('target output')).toBeInTheDocument()
  })

  it('renders format selector dropdowns', () => {
    render(<DataConverterPage />)

    const sourceSelect = screen.getByLabelText('source format')
    const targetSelect = screen.getByLabelText('target format')

    expect(sourceSelect).toBeInTheDocument()
    expect(targetSelect).toBeInTheDocument()
  })

  it('calls convert when convert button is clicked', () => {
    render(<DataConverterPage />)

    const convertButton = screen.getByText('dataConverter.convert')
    fireEvent.click(convertButton)

    expect(mockConvert).toHaveBeenCalled()
  })

  it('calls clearAll when clear button is clicked', () => {
    render(<DataConverterPage />)

    const clearButton = screen.getByText('dataConverter.clear')
    fireEvent.click(clearButton)

    expect(mockClearAll).toHaveBeenCalled()
  })

  it('shows no history message when history is empty', () => {
    render(<DataConverterPage />)

    expect(screen.getByText('dataConverter.noHistory')).toBeInTheDocument()
  })

  it('displays history when entries exist', async () => {
    const { useDataConverterStore } = vi.mocked(
      await import('@/entities/data-converter/data-converter.store')
    )

    useDataConverterStore.mockImplementation((selector: ((s: Record<string, unknown>) => unknown) | undefined) => {
      const state = {
        sourceContent: '',
        targetContent: '',
        sourceFormat: 'json',
        targetFormat: 'yaml',
        history: [
          {
            id: 'conv-1',
            sourceFormat: 'json',
            targetFormat: 'yaml',
            sourceContent: '{}',
            targetContent: '',
            createdAt: '2026-01-01T00:00:00Z',
          },
        ],
        error: null,
        setSourceContent: mockSetSourceContent,
        setTargetContent: vi.fn(),
        setSourceFormat: mockSetSourceFormat,
        setTargetFormat: mockSetTargetFormat,
        convert: mockConvert,
        swapFormats: mockSwapFormats,
        formatSource: mockFormatSource,
        minifySource: mockMinifySource,
        clearAll: mockClearAll,
        hydrate: mockHydrate,
      }
      return selector ? selector(state) : state
    })

    render(<DataConverterPage />)

    expect(screen.queryByText('dataConverter.noHistory')).not.toBeInTheDocument()
  })
})
