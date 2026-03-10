import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { WorkflowBuilderPage } from '../WorkflowBuilderPage'

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
    const state = {
      setView: mockSetView,
    }
    return selector(state)
  }),
}))

vi.mock('@/entities/settings/settings.store', () => ({
  useSettingsStore: vi.fn((selector) => {
    const state = {
      darkMode: false,
    }
    return selector(state)
  }),
}))

const mockWorkflows = [
  {
    id: 'workflow-1',
    name: 'Test Workflow',
    description: 'Test description',
    trigger: 'manual' as const,
    status: 'idle' as const,
    blocks: [
      {
        id: 'block-1',
        type: 'prompt' as const,
        label: 'Input',
        config: { content: 'Test prompt' },
        x: 0,
        y: 0,
      },
    ],
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
]

const mockCreateWorkflow = vi.fn(() => 'new-workflow-id')
const mockDeleteWorkflow = vi.fn()
const mockSelectWorkflow = vi.fn()
const mockAddBlock = vi.fn()
const mockRemoveBlock = vi.fn()
const mockUpdateBlock = vi.fn()
const mockRunWorkflow = vi.fn()
const mockStopWorkflow = vi.fn()

vi.mock('@/entities/workflow/workflow.store', () => ({
  useWorkflowStore: vi.fn((selector) => {
    const state = {
      workflows: mockWorkflows,
      currentWorkflowId: 'workflow-1',
      isRunning: false,
      blockResults: {},
      createWorkflow: mockCreateWorkflow,
      deleteWorkflow: mockDeleteWorkflow,
      selectWorkflow: mockSelectWorkflow,
      addBlock: mockAddBlock,
      removeBlock: mockRemoveBlock,
      updateBlock: mockUpdateBlock,
      runWorkflow: mockRunWorkflow,
      stopWorkflow: mockStopWorkflow,
    }
    return selector ? selector(state) : state
  }),
}))

// Mock Button component
vi.mock('@/shared/ui/Button', () => ({
  Button: ({ children, onClick, disabled }: {
    children: React.ReactNode
    onClick?: () => void
    disabled?: boolean
  }) => (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
}))

// Mock lucide icons
vi.mock('lucide-react', () => ({
  Workflow: () => null,
  Play: () => null,
  Square: () => null,
  Plus: () => null,
  Trash2: () => null,
  Settings: () => null,
  ArrowDown: () => null,
  FileText: () => null,
  Languages: () => null,
  Filter: () => null,
  Zap: () => null,
  ArrowLeft: () => null,
}))

describe('WorkflowBuilderPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders workflow builder page with header', () => {
    render(<WorkflowBuilderPage />)

    expect(screen.getByText('workflow.title')).toBeInTheDocument()
    expect(screen.getByText('workflow.subtitle')).toBeInTheDocument()
  })

  it('navigates back when back button is clicked', () => {
    render(<WorkflowBuilderPage />)

    const backButton = screen.getByLabelText('common.back')
    fireEvent.click(backButton)

    expect(mockSetView).toHaveBeenCalledWith('home')
  })

  it('creates new workflow when form is submitted', () => {
    render(<WorkflowBuilderPage />)

    fireEvent.click(screen.getByText('workflow.newWorkflow'))

    const nameInput = screen.getByPlaceholderText('workflow.name')
    const createButton = screen.getByText('common.create')

    fireEvent.change(nameInput, { target: { value: 'New Workflow' } })
    fireEvent.click(createButton)

    expect(mockCreateWorkflow).toHaveBeenCalledWith('New Workflow', '', 'manual')
    expect(mockSelectWorkflow).toHaveBeenCalledWith('new-workflow-id')
  })
})