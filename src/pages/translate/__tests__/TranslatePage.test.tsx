import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TranslatePage } from '../TranslatePage'

// Mock i18n
vi.mock('@/shared/i18n', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'translate.title': 'Document Translation',
        'translate.description': 'Upload files and AI will translate them automatically.',
        'translate.engine': 'Translation Engine',
        'translate.engineLLM': 'LLM Translation',
        'translate.engineDirect': 'Direct Input',
        'translate.sourceLang': 'Source Language',
        'translate.targetLang': 'Target Language',
        'translate.langAuto': 'Auto Detect',
        'translate.langKo': 'Korean',
        'translate.langEn': 'English',
        'translate.langJa': 'Japanese',
        'translate.langZh': 'Chinese',
        'translate.langEs': 'Spanish',
        'translate.langFr': 'French',
        'translate.langDe': 'German',
        'translate.dropzone': 'Drag & drop files or click to upload',
        'translate.dropzoneHint': 'Supports PDF, TXT, MD files',
        'translate.start': 'Start Translation',
        'translate.stop': 'Stop Translation',
        'translate.clearAll': 'Clear All',
        'translate.noFiles': 'Upload files to translate',
        'translate.fileCount': '1 files',
        'translate.status.pending': 'Pending',
        'translate.status.done': 'Done',
        'translate.download': 'Download TXT',
        'translate.copyResult': 'Copy Result',
      }
      return translations[key] || key
    },
    language: 'en',
  }),
}))

// Mock lucide-react icons
vi.mock('lucide-react', () => {
  const Icon = () => null
  return {
    ArrowLeft: Icon,
    Upload: Icon,
    X: Icon,
    Download: Icon,
    Copy: Icon,
    Loader2: Icon,
    RotateCcw: Icon,
    FileText: Icon,
    StopCircle: Icon,
  }
})

// Mock session store
const mockSetView = vi.fn()
vi.mock('@/entities/session/session.store', () => ({
  useSessionStore: (selector: (s: any) => any) =>
    selector({
      setView: mockSetView,
    }),
}))

// Mock settings store
vi.mock('@/entities/settings/settings.store', () => ({
  useSettingsStore: (selector: (s: any) => any) =>
    selector({
      selectedModel: 'claude-sonnet-4.6',
      credentials: null,
      openaiApiKey: null,
      geminiApiKey: null,
    }),
}))

// Mock translate store
const mockTranslateState = {
  engine: 'llm' as const,
  sourceLang: 'auto',
  targetLang: 'ko',
  files: [] as any[],
  isProcessing: false,
  setEngine: vi.fn(),
  setSourceLang: vi.fn(),
  setTargetLang: vi.fn(),
  addFiles: vi.fn(),
  removeFile: vi.fn(),
  updateFile: vi.fn(),
  setProcessing: vi.fn(),
  clearAll: vi.fn(),
}

vi.mock('@/entities/translate/translate.store', () => ({
  useTranslateStore: Object.assign(
    (selector?: (s: any) => any) => selector ? selector(mockTranslateState) : mockTranslateState,
    {
      getState: () => mockTranslateState,
      setState: vi.fn(),
    }
  ),
}))

// Mock translate utils
vi.mock('@/shared/lib/translate', () => ({
  extractFileText: vi.fn(),
  splitIntoChunks: vi.fn(() => ['chunk1']),
  translateChunk: vi.fn(() => Promise.resolve('translated')),
  buildTranslateSystemPrompt: vi.fn(() => 'You are a translator'),
}))

// Mock factory
vi.mock('@/shared/lib/providers/factory', () => ({
  getProviderConfig: vi.fn(() => ({ provider: 'bedrock' })),
}))

// Mock Button
vi.mock('@/shared/ui/Button', () => ({
  Button: ({ children, onClick, disabled, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} {...props}>
      {children}
    </button>
  ),
}))

describe('TranslatePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockTranslateState.files = []
    mockTranslateState.isProcessing = false
  })

  it('renders title and description', () => {
    render(<TranslatePage />)

    expect(screen.getByText('Document Translation')).toBeInTheDocument()
    expect(screen.getByText('Upload files and AI will translate them automatically.')).toBeInTheDocument()
  })

  it('renders dropzone', () => {
    render(<TranslatePage />)

    expect(screen.getByText('Drag & drop files or click to upload')).toBeInTheDocument()
    expect(screen.getByText('Supports PDF, TXT, MD files')).toBeInTheDocument()
  })

  it('renders language selectors', () => {
    render(<TranslatePage />)

    expect(screen.getByText('Source Language')).toBeInTheDocument()
    expect(screen.getByText('Target Language')).toBeInTheDocument()
    expect(screen.getByText('Translation Engine')).toBeInTheDocument()
  })

  it('navigates back to home on arrow click', () => {
    render(<TranslatePage />)

    // The back button is the first button in the header
    const buttons = screen.getAllByRole('button')
    const backButton = buttons[0]
    fireEvent.click(backButton)

    expect(mockSetView).toHaveBeenCalledWith('home')
  })

  it('shows start button when files exist', () => {
    mockTranslateState.files = [
      {
        id: 'tf-1',
        name: 'test.txt',
        size: 100,
        type: 'text/plain',
        status: 'pending',
        progress: 0,
        originalText: '',
        translatedText: '',
      },
    ]

    render(<TranslatePage />)

    expect(screen.getByText('Start Translation')).toBeInTheDocument()
  })

  it('shows stop button when processing', () => {
    mockTranslateState.files = [
      {
        id: 'tf-1',
        name: 'test.txt',
        size: 100,
        type: 'text/plain',
        status: 'translating',
        progress: 50,
        originalText: 'Hello',
        translatedText: '',
      },
    ]
    mockTranslateState.isProcessing = true

    render(<TranslatePage />)

    expect(screen.getByText('Stop Translation')).toBeInTheDocument()
  })

  it('shows clear all button when files exist', () => {
    mockTranslateState.files = [
      {
        id: 'tf-1',
        name: 'test.txt',
        size: 100,
        type: 'text/plain',
        status: 'pending',
        progress: 0,
        originalText: '',
        translatedText: '',
      },
    ]

    render(<TranslatePage />)

    expect(screen.getByText('Clear All')).toBeInTheDocument()
  })

  it('renders file list when files are present', () => {
    mockTranslateState.files = [
      {
        id: 'tf-1',
        name: 'document.pdf',
        size: 2048,
        type: 'application/pdf',
        status: 'pending',
        progress: 0,
        originalText: '',
        translatedText: '',
      },
    ]

    render(<TranslatePage />)

    expect(screen.getByText('document.pdf')).toBeInTheDocument()
    expect(screen.getByText('Pending')).toBeInTheDocument()
  })
})
