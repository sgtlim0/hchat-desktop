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
        'quickAction.write': 'Write',
        'quickAction.summarize': 'Summarize',
        'quickAction.translate': 'Translate',
        'quickAction.brainstorm': 'Brainstorm',
        'quickAction.review': 'Review',
        'quickAction.prompt.write': 'Help me write something',
        'quickAction.prompt.summarize': 'Summarize this text',
        'quickAction.prompt.translate': 'Translate this',
        'quickAction.prompt.brainstorm': 'Let\'s brainstorm ideas',
        'quickAction.prompt.review': 'Review this code',
      }
      return translations[key] || key
    },
    language: 'en',
  }),
}))

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Settings: () => <div>Settings</div>,
  Pencil: () => <div>Pencil</div>,
  FileText: () => <div>FileText</div>,
  Languages: () => <div>Languages</div>,
  Lightbulb: () => <div>Lightbulb</div>,
  SearchCode: () => <div>SearchCode</div>,
}))

// Mock PromptInput
vi.mock('@/widgets/prompt-input/PromptInput', () => ({
  PromptInput: ({ onSend, placeholder }: { onSend: (msg: string) => void; placeholder: string }) => (
    <div data-testid="prompt-input">
      <input placeholder={placeholder} onChange={(e) => e.target.value && onSend(e.target.value)} />
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

vi.mock('@/entities/settings/settings.store', () => ({
  useSettingsStore: vi.fn((selector) => {
    const state = {
      credentials: mockCredentials,
      setSettingsOpen: mockSetSettingsOpen,
      setSettingsTab: mockSetSettingsTab,
    }
    return selector(state)
  }),
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

  it('renders quick action chips', () => {
    render(<HomeScreen />)
    expect(screen.getByText('Write')).toBeInTheDocument()
    expect(screen.getByText('Summarize')).toBeInTheDocument()
    expect(screen.getByText('Translate')).toBeInTheDocument()
    expect(screen.getByText('Brainstorm')).toBeInTheDocument()
    expect(screen.getByText('Review')).toBeInTheDocument()
  })

  it('shows credentials missing banner when no credentials', () => {
    mockCredentials.accessKeyId = ''
    mockCredentials.secretAccessKey = ''

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
    mockCredentials.accessKeyId = ''
    mockCredentials.secretAccessKey = ''

    render(<HomeScreen />)
    const configureButton = screen.getByText('Configure')
    fireEvent.click(configureButton)

    expect(mockSetSettingsTab).toHaveBeenCalledWith('api-keys')
    expect(mockSetSettingsOpen).toHaveBeenCalledWith(true)
  })

  it('creates session with pending prompt when quick action is clicked', () => {
    render(<HomeScreen />)

    const writeButton = screen.getByText('Write')
    fireEvent.click(writeButton)

    expect(mockSetPendingPrompt).toHaveBeenCalledWith('Help me write something')
    expect(mockCreateSession).toHaveBeenCalled()
  })

  it('handles different quick actions correctly', () => {
    render(<HomeScreen />)

    const summarizeButton = screen.getByText('Summarize')
    fireEvent.click(summarizeButton)

    expect(mockSetPendingPrompt).toHaveBeenCalledWith('Summarize this text')
    expect(mockCreateSession).toHaveBeenCalled()
  })

  it('renders all quick action icons', () => {
    render(<HomeScreen />)

    // Icons are rendered but we just check the actions exist
    expect(screen.getByText('Write')).toBeInTheDocument()
    expect(screen.getByText('Summarize')).toBeInTheDocument()
    expect(screen.getByText('Translate')).toBeInTheDocument()
    expect(screen.getByText('Brainstorm')).toBeInTheDocument()
    expect(screen.getByText('Review')).toBeInTheDocument()
  })

  it('renders H Chat icon', () => {
    const { container } = render(<HomeScreen />)
    const icon = container.querySelector('.bg-primary\\/10')
    expect(icon).toBeInTheDocument()
  })
})
