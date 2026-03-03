import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DocWriterPage } from '../DocWriterPage'

// Mock i18n
vi.mock('@/shared/i18n', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    language: 'en',
  }),
}))

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  ArrowLeft: () => <div>ArrowLeft</div>,
  Loader2: () => <div>Loader2</div>,
  Plus: () => <div>Plus</div>,
  Trash2: () => <div>Trash2</div>,
  Download: () => <div>Download</div>,
  RefreshCw: () => <div>RefreshCw</div>,
  ChevronRight: () => <div>ChevronRight</div>,
  ChevronLeft: () => <div>ChevronLeft</div>,
  FileText: () => <div>FileText</div>,
}))

// Mock Button component
vi.mock('@/shared/ui/Button', () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}))

// Mock constants
vi.mock('@/shared/constants', () => ({
  MODELS: [
    { id: 'test-model-1', label: 'Test Model 1' },
    { id: 'test-model-2', label: 'Test Model 2' },
  ],
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

// Mock settings store
const mockSelectedModel = 'test-model-1'
const mockCredentials = { accessKeyId: 'test-key', secretAccessKey: 'test-secret' }
const mockOpenaiApiKey = 'test-openai-key'
const mockGeminiApiKey = 'test-gemini-key'

vi.mock('@/entities/settings/settings.store', () => ({
  useSettingsStore: vi.fn((selector) => {
    const state = {
      selectedModel: mockSelectedModel,
      credentials: mockCredentials,
      openaiApiKey: mockOpenaiApiKey,
      geminiApiKey: mockGeminiApiKey,
    }
    return selector(state)
  }),
}))

// Mock doc-writer store
const mockCreateProject = vi.fn()
const mockSetContext = vi.fn()
const mockGenerateOutline = vi.fn()
const mockUpdateOutlineSection = vi.fn()
const mockAddOutlineSection = vi.fn()
const mockRemoveOutlineSection = vi.fn()
const mockGenerateSectionContent = vi.fn()
const mockUpdateSectionContent = vi.fn()
const mockExportMarkdown = vi.fn(() => '# Test Document\n\nTest content')
const mockExportText = vi.fn(() => 'Test Document\n\nTest content')
const mockSetStep = vi.fn()
const mockReset = vi.fn()

let mockCurrentProject: any = null
let mockStep = 1
let mockIsGenerating = false

vi.mock('@/entities/doc-writer/doc-writer.store', () => ({
  useDocWriterStore: vi.fn((selector) => {
    const state = {
      currentProject: mockCurrentProject,
      step: mockStep,
      isGenerating: mockIsGenerating,
      createProject: mockCreateProject,
      setContext: mockSetContext,
      generateOutline: mockGenerateOutline,
      updateOutlineSection: mockUpdateOutlineSection,
      addOutlineSection: mockAddOutlineSection,
      removeOutlineSection: mockRemoveOutlineSection,
      generateSectionContent: mockGenerateSectionContent,
      updateSectionContent: mockUpdateSectionContent,
      exportMarkdown: mockExportMarkdown,
      exportText: mockExportText,
      setStep: mockSetStep,
      reset: mockReset,
    }
    return selector ? selector(state) : state
  }),
}))

describe('DocWriterPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCurrentProject = null
    mockStep = 1
    mockIsGenerating = false
  })

  it('renders title and description', () => {
    render(<DocWriterPage />)
    expect(screen.getByText('docWriter.title')).toBeInTheDocument()
    expect(screen.getByText('docWriter.desc')).toBeInTheDocument()
  })

  it('renders step indicator with 5 steps', () => {
    render(<DocWriterPage />)
    expect(screen.getByText('docWriter.step1')).toBeInTheDocument()
    expect(screen.getByText('docWriter.step2')).toBeInTheDocument()
    expect(screen.getByText('docWriter.step3')).toBeInTheDocument()
    expect(screen.getByText('docWriter.step4')).toBeInTheDocument()
    expect(screen.getByText('docWriter.step5')).toBeInTheDocument()
  })

  it('step 1: shows project name input and doc type selection', () => {
    render(<DocWriterPage />)

    // Project name input
    expect(screen.getByPlaceholderText('docWriter.projectName')).toBeInTheDocument()

    // Doc type buttons
    expect(screen.getByText('docWriter.docType.report')).toBeInTheDocument()
    expect(screen.getByText('docWriter.docType.proposal')).toBeInTheDocument()
    expect(screen.getByText('docWriter.docType.presentation')).toBeInTheDocument()
    expect(screen.getByText('docWriter.docType.manual')).toBeInTheDocument()

    // Model selector
    expect(screen.getByText('Test Model 1')).toBeInTheDocument()
    expect(screen.getByText('Test Model 2')).toBeInTheDocument()
  })

  it('step 2: shows textarea for context', () => {
    mockStep = 2
    mockCurrentProject = {
      id: 'project-1',
      name: 'Test Project',
      docType: 'report',
      modelId: 'test-model-1',
      context: 'Test context',
      outline: [],
      createdAt: new Date().toISOString(),
    }

    render(<DocWriterPage />)

    expect(screen.getByPlaceholderText('docWriter.context')).toBeInTheDocument()
    expect(screen.getByText('docWriter.context.fileHint')).toBeInTheDocument()
  })

  it('step 3: shows generate outline button', () => {
    mockStep = 3
    mockCurrentProject = {
      id: 'project-1',
      name: 'Test Project',
      docType: 'report',
      modelId: 'test-model-1',
      context: 'Test context',
      outline: [
        { id: 'section-1', title: 'Introduction', level: 1, content: '' },
        { id: 'section-2', title: 'Conclusion', level: 1, content: '' },
      ],
      createdAt: new Date().toISOString(),
    }

    render(<DocWriterPage />)

    const generateButton = screen.getByText('docWriter.regenerateOutline')
    expect(generateButton).toBeInTheDocument()

    // Section list
    expect(screen.getByDisplayValue('Introduction')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Conclusion')).toBeInTheDocument()

    // Add section input
    expect(screen.getByPlaceholderText('docWriter.addSection')).toBeInTheDocument()
  })

  it('back button calls reset and setView', () => {
    render(<DocWriterPage />)

    const backButton = screen.getByText('ArrowLeft').closest('button')
    fireEvent.click(backButton!)

    expect(mockReset).toHaveBeenCalled()
    expect(mockSetView).toHaveBeenCalledWith('home')
  })

  it('next button works when conditions are met', () => {
    render(<DocWriterPage />)

    // Fill project name
    const projectNameInput = screen.getByPlaceholderText('docWriter.projectName')
    fireEvent.change(projectNameInput, { target: { value: 'My Project' } })

    // Click next button
    const nextButton = screen.getByText('docWriter.next')
    fireEvent.click(nextButton)

    expect(mockCreateProject).toHaveBeenCalledWith('My Project', 'report', 'test-model-1')
    expect(mockSetStep).toHaveBeenCalledWith(2)
  })

  it('doc type selection works', () => {
    render(<DocWriterPage />)

    const proposalButton = screen.getByText('docWriter.docType.proposal')
    fireEvent.click(proposalButton)

    // Verify button is highlighted (has primary color classes)
    expect(proposalButton.className).toContain('border-primary')
  })

  it('prev button goes to previous step', () => {
    mockStep = 2
    mockCurrentProject = {
      id: 'project-1',
      name: 'Test Project',
      docType: 'report',
      modelId: 'test-model-1',
      context: '',
      outline: [],
      createdAt: new Date().toISOString(),
    }

    render(<DocWriterPage />)

    const prevButton = screen.getByText('docWriter.prev')
    fireEvent.click(prevButton)

    expect(mockSetStep).toHaveBeenCalledWith(1)
  })

  it('prev button on step 1 calls handleBack', () => {
    mockStep = 1

    render(<DocWriterPage />)

    const prevButton = screen.getByText('docWriter.prev')
    fireEvent.click(prevButton)

    expect(mockReset).toHaveBeenCalled()
    expect(mockSetView).toHaveBeenCalledWith('home')
  })

  it('step 5: shows export buttons', () => {
    mockStep = 5
    mockCurrentProject = {
      id: 'project-1',
      name: 'Test Project',
      docType: 'report',
      modelId: 'test-model-1',
      context: 'Test context',
      outline: [
        { id: 'section-1', title: 'Introduction', level: 1, content: 'Intro content' },
      ],
      createdAt: new Date().toISOString(),
    }

    render(<DocWriterPage />)

    expect(screen.getByText('docWriter.preview')).toBeInTheDocument()
    expect(screen.getByText('docWriter.downloadMd')).toBeInTheDocument()
    expect(screen.getByText('docWriter.downloadTxt')).toBeInTheDocument()
  })

  it('add section button works', () => {
    mockStep = 3
    mockCurrentProject = {
      id: 'project-1',
      name: 'Test Project',
      docType: 'report',
      modelId: 'test-model-1',
      context: 'Test context',
      outline: [],
      createdAt: new Date().toISOString(),
    }

    render(<DocWriterPage />)

    const addSectionInput = screen.getByPlaceholderText('docWriter.addSection')
    fireEvent.change(addSectionInput, { target: { value: 'New Section' } })

    const addButton = addSectionInput.nextElementSibling as HTMLButtonElement
    fireEvent.click(addButton)

    expect(mockAddOutlineSection).toHaveBeenCalledWith('New Section', 1)
  })

  it('context textarea updates project context', () => {
    mockStep = 2
    mockCurrentProject = {
      id: 'project-1',
      name: 'Test Project',
      docType: 'report',
      modelId: 'test-model-1',
      context: '',
      outline: [],
      createdAt: new Date().toISOString(),
    }

    render(<DocWriterPage />)

    const contextTextarea = screen.getByPlaceholderText('docWriter.context')
    fireEvent.change(contextTextarea, { target: { value: 'New context' } })

    expect(mockSetContext).toHaveBeenCalledWith('New context')
  })
})
