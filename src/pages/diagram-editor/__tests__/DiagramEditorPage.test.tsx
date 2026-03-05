import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DiagramEditorPage } from '../DiagramEditorPage'

// Mock mermaid
vi.mock('mermaid', () => ({
  default: {
    initialize: vi.fn(),
    render: vi.fn().mockResolvedValue({ svg: '<svg></svg>' }),
  },
}))

// Mock i18n
vi.mock('@/shared/i18n', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

// Mock lucide-react
vi.mock('lucide-react', () => ({
  ArrowLeft: () => <span data-testid="icon-arrow-left" />,
  Plus: () => <span data-testid="icon-plus" />,
  Trash2: () => <span data-testid="icon-trash" />,
  Star: () => <span data-testid="icon-star" />,
  Download: () => <span data-testid="icon-download" />,
  Search: () => <span data-testid="icon-search" />,
  GitBranch: () => <span data-testid="icon-git-branch" />,
}))

// Mock Button
vi.mock('@/shared/ui/Button', () => ({
  Button: ({ children, onClick, disabled, size, className }: any) => (
    <button onClick={onClick} disabled={disabled} data-size={size} className={className}>
      {children}
    </button>
  ),
}))

// Mock session store
const mockSetView = vi.fn()

vi.mock('@/entities/session/session.store', () => ({
  useSessionStore: vi.fn((selector: any) => {
    const state = { setView: mockSetView }
    return selector(state)
  }),
}))

// Mock diagram editor store
const mockDiagrams = [
  {
    id: 'diagram-1',
    title: 'Flow Test',
    type: 'flowchart',
    code: 'graph TD\n  A-->B',
    isFavorite: false,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
  {
    id: 'diagram-2',
    title: 'Sequence Test',
    type: 'sequence',
    code: 'sequenceDiagram\n  A->>B: hi',
    isFavorite: true,
    createdAt: '2026-01-02',
    updatedAt: '2026-01-02',
  },
]

const mockHydrate = vi.fn()
const mockAddDiagram = vi.fn()
const mockUpdateDiagram = vi.fn()
const mockDeleteDiagram = vi.fn()
const mockSelectDiagram = vi.fn()
const mockToggleFavorite = vi.fn()
const mockSetSearchQuery = vi.fn()

const createMockState = (overrides: Record<string, unknown> = {}) => ({
  diagrams: mockDiagrams,
  selectedDiagramId: null,
  searchQuery: '',
  hydrate: mockHydrate,
  addDiagram: mockAddDiagram,
  updateDiagram: mockUpdateDiagram,
  deleteDiagram: mockDeleteDiagram,
  selectDiagram: mockSelectDiagram,
  toggleFavorite: mockToggleFavorite,
  setSearchQuery: mockSetSearchQuery,
  getFilteredDiagrams: () => mockDiagrams,
  getSelectedDiagram: () => null,
  ...overrides,
})

vi.mock('@/entities/diagram-editor/diagram-editor.store', () => ({
  useDiagramEditorStore: vi.fn((selector: any) => {
    const state = createMockState()
    return selector(state)
  }),
}))

async function setMockState(overrides: Record<string, unknown> = {}) {
  const mod = await import('@/entities/diagram-editor/diagram-editor.store')
  const { useDiagramEditorStore } = vi.mocked(mod)
  useDiagramEditorStore.mockImplementation((selector: any) => {
    const state = createMockState(overrides)
    return selector(state)
  })
}

describe('DiagramEditorPage', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    await setMockState()
  })

  it('renders the page with header and title', () => {
    render(<DiagramEditorPage />)

    expect(screen.getByText('diagram.title')).toBeInTheDocument()
    expect(screen.getByText('diagram.subtitle')).toBeInTheDocument()
    expect(screen.getByText('diagram.new')).toBeInTheDocument()
  })

  it('displays diagram list in sidebar', () => {
    render(<DiagramEditorPage />)

    expect(screen.getByText('Flow Test')).toBeInTheDocument()
    expect(screen.getByText('Sequence Test')).toBeInTheDocument()
  })

  it('navigates back when back button is clicked', () => {
    render(<DiagramEditorPage />)

    const backButton = screen.getByLabelText('back')
    fireEvent.click(backButton)

    expect(mockSetView).toHaveBeenCalledWith('home')
  })

  it('calls addDiagram when new diagram button is clicked', () => {
    render(<DiagramEditorPage />)

    const newButton = screen.getByText('diagram.new')
    fireEvent.click(newButton)

    expect(mockAddDiagram).toHaveBeenCalledWith(
      'diagram.new',
      'flowchart',
      expect.stringContaining('graph TD')
    )
  })

  it('selects diagram when clicked in sidebar', () => {
    render(<DiagramEditorPage />)

    const diagramItem = screen.getByText('Flow Test')
    fireEvent.click(diagramItem)

    expect(mockSelectDiagram).toHaveBeenCalledWith('diagram-1')
  })

  it('shows empty state when no diagram is selected', () => {
    render(<DiagramEditorPage />)

    expect(screen.getAllByText('diagram.empty').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('diagram.emptyHint').length).toBeGreaterThanOrEqual(1)
  })

  it('shows editor when a diagram is selected', async () => {
    const selected = mockDiagrams[0]
    await setMockState({
      selectedDiagramId: selected.id,
      getSelectedDiagram: () => selected,
    })

    render(<DiagramEditorPage />)

    expect(screen.getByText('diagram.code')).toBeInTheDocument()
    expect(screen.getByText('diagram.preview')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Flow Test')).toBeInTheDocument()
  })

  it('calls hydrate on mount', () => {
    render(<DiagramEditorPage />)
    expect(mockHydrate).toHaveBeenCalled()
  })

  it('renders template buttons for all diagram types', () => {
    render(<DiagramEditorPage />)

    expect(screen.getByText(/diagram\.type\.flowchart/)).toBeInTheDocument()
    expect(screen.getByText(/diagram\.type\.sequence/)).toBeInTheDocument()
    expect(screen.getByText(/diagram\.type\.mindmap/)).toBeInTheDocument()
  })

  it('updates search query when search input changes', () => {
    render(<DiagramEditorPage />)

    const searchInput = screen.getByPlaceholderText('diagram.titlePlaceholder')
    fireEvent.change(searchInput, { target: { value: 'flow' } })

    expect(mockSetSearchQuery).toHaveBeenCalledWith('flow')
  })
})
