import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { HomeScreen } from '../HomeScreen'

// Mock i18n
vi.mock('@/shared/i18n', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'home.heading': 'Welcome to H Chat',
        'home.placeholder': 'Ask me anything...',
        'home.credentialsMissing': 'API credentials missing',
        'home.credentialsHint': 'Configure your credentials',
        'home.configure': 'Configure',
        'assistant.tab.official': 'Official',
        'assistant.tab.custom': 'My Assistants',
        'assistant.category.all': 'All',
        'assistant.category.chat': 'Chat',
        'assistant.category.work': 'Work',
        'assistant.category.translate': 'Translate',
        'assistant.category.analyze': 'Analyze',
        'assistant.category.report': 'Report',
        'assistant.category.image': 'Image',
        'assistant.category.writing': 'Writing',
        'assistant.preset.analyst.title': 'Careful Analyst',
        'assistant.preset.analyst.desc': 'Analyzes complex topics',
        'assistant.preset.quickChat.title': 'Quick Chat',
        'assistant.preset.quickChat.desc': 'Fast conversations',
        'assistant.preset.docReview.title': 'Doc Review',
        'assistant.preset.docReview.desc': 'Reviews documents',
        'assistant.preset.translator.title': 'Translator',
        'assistant.preset.translator.desc': 'Translates documents',
        'assistant.preset.reportWriter.title': 'Report Writer',
        'assistant.preset.reportWriter.desc': 'Writes reports',
        'assistant.preset.codeReviewer.title': 'Code Reviewer',
        'assistant.preset.codeReviewer.desc': 'Reviews code',
        'assistant.preset.dataAnalyst.title': 'Data Analyst',
        'assistant.preset.dataAnalyst.desc': 'Analyzes data',
        'assistant.preset.emailWriter.title': 'Email Writer',
        'assistant.preset.emailWriter.desc': 'Writes emails',
        'assistant.empty': 'No custom assistants yet',
        'assistant.createHint': 'Create your own assistant',
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
    Settings: Icon,
    Search: Icon,
    Zap: Icon,
    FileSearch: Icon,
    Languages: Icon,
    FileText: Icon,
    Code: Icon,
    BarChart3: Icon,
    Mail: Icon,
    Bot: Icon,
  }
})

// Mock PromptInput
vi.mock('@/widgets/prompt-input/PromptInput', () => ({
  PromptInput: ({ placeholder }: { onSend: (msg: string) => void; placeholder: string }) => (
    <div data-testid="prompt-input">
      <input placeholder={placeholder} />
    </div>
  ),
}))

// Mock settings store
const mockCredentials = {
  accessKeyId: '',
  secretAccessKey: '',
  region: 'us-east-1',
}
const mockSetSettingsOpen = vi.fn()
const mockSetSettingsTab = vi.fn()
const mockSetSelectedModel = vi.fn()

vi.mock('@/entities/settings/settings.store', () => ({
  useSettingsStore: Object.assign(
    vi.fn((selector) => {
      const state = {
        credentials: mockCredentials,
        setSettingsOpen: mockSetSettingsOpen,
        setSettingsTab: mockSetSettingsTab,
        setSelectedModel: mockSetSelectedModel,
      }
      return selector(state)
    }),
    {
      getState: vi.fn(() => ({
        setSelectedModel: mockSetSelectedModel,
      })),
    }
  ),
}))

// Mock session store
const mockCreateSession = vi.fn()
const mockSetPendingPrompt = vi.fn()

vi.mock('@/entities/session/session.store', () => ({
  useSessionStore: Object.assign(
    vi.fn((selector) => {
      const state = {
        createSession: mockCreateSession,
        setPendingPrompt: mockSetPendingPrompt,
      }
      return selector(state)
    }),
    {
      getState: vi.fn(() => ({
        createSession: mockCreateSession,
        setPendingPrompt: mockSetPendingPrompt,
      })),
    }
  ),
}))

// Mock persona store
vi.mock('@/entities/persona/persona.store', () => ({
  usePersonaStore: Object.assign(
    vi.fn((selector) => {
      const state = { personas: [] }
      return selector(state)
    }),
    {
      getState: vi.fn(() => ({
        setActivePersona: vi.fn(),
      })),
    }
  ),
}))

describe('HomeScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCredentials.accessKeyId = ''
    mockCredentials.secretAccessKey = ''
  })

  it('renders heading', () => {
    render(<HomeScreen />)
    expect(screen.getByText('Welcome to H Chat')).toBeInTheDocument()
  })

  it('renders prompt input', () => {
    render(<HomeScreen />)
    expect(screen.getByTestId('prompt-input')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Ask me anything...')).toBeInTheDocument()
  })

  it('renders assistant cards in official tab', () => {
    render(<HomeScreen />)
    expect(screen.getByText('Careful Analyst')).toBeInTheDocument()
    expect(screen.getByText('Quick Chat')).toBeInTheDocument()
    expect(screen.getByText('Doc Review')).toBeInTheDocument()
    expect(screen.getByText('Translator')).toBeInTheDocument()
    expect(screen.getByText('Report Writer')).toBeInTheDocument()
    expect(screen.getByText('Code Reviewer')).toBeInTheDocument()
    expect(screen.getByText('Data Analyst')).toBeInTheDocument()
    expect(screen.getByText('Email Writer')).toBeInTheDocument()
  })

  it('shows credentials missing banner when no credentials', () => {
    render(<HomeScreen />)
    expect(screen.getByText('API credentials missing')).toBeInTheDocument()
    expect(screen.getByText('Configure your credentials')).toBeInTheDocument()
  })

  it('hides credentials banner when credentials are set', () => {
    mockCredentials.accessKeyId = 'test-key'
    mockCredentials.secretAccessKey = 'test-secret'

    render(<HomeScreen />)
    expect(screen.queryByText('API credentials missing')).not.toBeInTheDocument()
  })

  it('opens settings when configure button is clicked', () => {
    render(<HomeScreen />)
    const configureButton = screen.getByText('Configure')
    fireEvent.click(configureButton)

    expect(mockSetSettingsTab).toHaveBeenCalledWith('api-keys')
    expect(mockSetSettingsOpen).toHaveBeenCalledWith(true)
  })

  it('filters by category', () => {
    render(<HomeScreen />)

    fireEvent.click(screen.getByText('Translate'))
    expect(screen.getByText('Translator')).toBeInTheDocument()
    expect(screen.queryByText('Careful Analyst')).not.toBeInTheDocument()
  })

  it('creates session when assistant card is clicked', () => {
    render(<HomeScreen />)

    fireEvent.click(screen.getByText('Careful Analyst'))
    expect(mockSetSelectedModel).toHaveBeenCalledWith('claude-sonnet-4.6')
    expect(mockCreateSession).toHaveBeenCalled()
  })

  it('shows empty state for custom tab', () => {
    render(<HomeScreen />)

    fireEvent.click(screen.getByText('My Assistants'))
    expect(screen.getByText('No custom assistants yet')).toBeInTheDocument()
    expect(screen.getByText('Create your own assistant')).toBeInTheDocument()
  })

  it('renders H Chat icon', () => {
    const { container } = render(<HomeScreen />)
    const icon = container.querySelector('.bg-primary\\/10')
    expect(icon).toBeInTheDocument()
  })
})
