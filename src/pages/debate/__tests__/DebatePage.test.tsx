import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DebatePage } from '../DebatePage'

// Mock i18n
vi.mock('@/shared/i18n', () => ({
  useTranslation: () => ({
    t: (key: string, params?: any) => {
      if (params) {
        return `${key} ${JSON.stringify(params)}`
      }
      return key
    },
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
      credentials: {
        accessKeyId: 'test-key',
        secretAccessKey: 'test-secret',
        region: 'us-east-1',
      },
      openaiApiKey: '',
      geminiApiKey: '',
    }
    return selector(state)
  }),
}))

const mockDebateSession = {
  topic: 'Test Topic',
  status: 'setup' as const,
  models: [],
  rounds: [],
  summary: null,
}

const mockStartDebate = vi.fn()
const mockAddRound = vi.fn()
const mockUpdateRoundResponse = vi.fn()
const mockSetStatus = vi.fn()
const mockSetSummary = vi.fn()
const mockReset = vi.fn()

vi.mock('@/entities/debate/debate.store', () => ({
  useDebateStore: vi.fn((selector) => {
    const state = {
      session: mockDebateSession,
      isRunning: false,
      startDebate: mockStartDebate,
      addRound: mockAddRound,
      updateRoundResponse: mockUpdateRoundResponse,
      setStatus: mockSetStatus,
      setSummary: mockSetSummary,
      reset: mockReset,
    }
    return selector ? selector(state) : state
  }),
}))

// Mock constants
vi.mock('@/shared/constants', () => ({
  MODELS: [
    { id: 'claude-sonnet-4.6', provider: 'bedrock', shortLabel: 'Claude' },
    { id: 'gpt-4o', provider: 'openai', shortLabel: 'GPT-4' },
    { id: 'gemini-2.0', provider: 'gemini', shortLabel: 'Gemini' },
  ],
  PROVIDER_COLORS: {
    bedrock: '#FF6B00',
    openai: '#10A37F',
    gemini: '#4285F4',
  },
}))

// Mock provider factory
vi.mock('@/shared/lib/providers/factory', () => ({
  createStream: vi.fn(() => ({
    [Symbol.asyncIterator]: async function* () {
      yield { type: 'text', content: 'Test response' }
      yield { type: 'done' }
    },
  })),
  getProviderConfig: vi.fn(() => ({
    provider: 'bedrock',
  })),
}))

// Mock Button component
vi.mock('@/shared/ui/Button', () => ({
  Button: ({ children, onClick, disabled, variant, size, className }: any) => (
    <button onClick={onClick} disabled={disabled} data-variant={variant} data-size={size} className={className}>
      {children}
    </button>
  ),
}))

// Mock lucide icons
vi.mock('lucide-react', () => ({
  ArrowLeft: () => null,
  Play: () => null,
  RotateCcw: () => null,
  Check: () => null,
  Loader2: () => null,
}))

describe('DebatePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockDebateSession.status = 'setup'
    mockDebateSession.rounds = []
    mockDebateSession.summary = null
  })

  it('renders debate page with header', () => {
    render(<DebatePage />)

    expect(screen.getByText('debate.title')).toBeInTheDocument()
    expect(screen.getByText('debate.setup')).toBeInTheDocument()
  })

  it('shows setup section initially', () => {
    render(<DebatePage />)

    expect(screen.getByText('debate.setupDesc')).toBeInTheDocument()
    expect(screen.getByText('debate.selectModels')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('debate.topicPlaceholder')).toBeInTheDocument()
  })

  it('navigates back when back button is clicked', () => {
    render(<DebatePage />)

    // The back button is the first button in the header (before the title)
    const header = screen.getByText('debate.title').closest('div')!
    const backButton = header.querySelector('button')!
    fireEvent.click(backButton)

    expect(mockSetView).toHaveBeenCalledWith('home')
  })

  it('allows selecting up to 3 models', () => {
    render(<DebatePage />)

    const claudeButton = screen.getByText('Claude')
    const gptButton = screen.getByText('GPT-4')
    const geminiButton = screen.getByText('Gemini')

    fireEvent.click(claudeButton)
    fireEvent.click(gptButton)
    fireEvent.click(geminiButton)

    expect(screen.getByText(/debate.modelsSelected.*3/)).toBeInTheDocument()
  })

  it('enables start button when topic and models are selected', () => {
    render(<DebatePage />)

    const startButton = screen.getByText('debate.start')
    const topicInput = screen.getByPlaceholderText('debate.topicPlaceholder')
    const claudeButton = screen.getByText('Claude')
    const gptButton = screen.getByText('GPT-4')

    expect(startButton).toBeDisabled()

    fireEvent.change(topicInput, { target: { value: 'Test debate topic' } })
    fireEvent.click(claudeButton)
    fireEvent.click(gptButton)

    expect(startButton).not.toBeDisabled()
  })

  it('starts debate when start button is clicked', async () => {
    render(<DebatePage />)

    const topicInput = screen.getByPlaceholderText('debate.topicPlaceholder')
    const claudeButton = screen.getByText('Claude')
    const gptButton = screen.getByText('GPT-4')
    const startButton = screen.getByText('debate.start')

    fireEvent.change(topicInput, { target: { value: 'AI ethics' } })
    fireEvent.click(claudeButton)
    fireEvent.click(gptButton)
    fireEvent.click(startButton)

    await waitFor(() => {
      expect(mockStartDebate).toHaveBeenCalledWith('AI ethics', ['claude-sonnet-4.6', 'gpt-4o'])
    })
  })

  it('shows reset button when debate is active', () => {
    mockDebateSession.status = 'running'
    mockDebateSession.topic = 'Test Topic'

    render(<DebatePage />)

    expect(screen.getByText('common.reset')).toBeInTheDocument()
  })

  it('resets debate when reset button is clicked', () => {
    mockDebateSession.status = 'running'
    mockDebateSession.topic = 'Test Topic'

    render(<DebatePage />)

    const resetButton = screen.getByText('common.reset')
    fireEvent.click(resetButton)

    expect(mockReset).toHaveBeenCalled()
  })

  it('displays debate rounds when available', () => {
    mockDebateSession.status = 'running'
    mockDebateSession.rounds = [
      {
        roundNumber: 1,
        responses: [
          {
            modelId: 'claude-sonnet-4.6',
            provider: 'bedrock' as const,
            content: 'Claude response',
            isStreaming: false,
          },
          {
            modelId: 'gpt-4o',
            provider: 'openai' as const,
            content: 'GPT response',
            isStreaming: false,
          },
        ],
      },
    ]

    render(<DebatePage />)

    expect(screen.getByText(/debate.round.*1/)).toBeInTheDocument()
    expect(screen.getByText('Claude response')).toBeInTheDocument()
    expect(screen.getByText('GPT response')).toBeInTheDocument()
  })

  it('shows summary when debate is complete', () => {
    mockDebateSession.status = 'done'
    mockDebateSession.summary = 'This is the consensus summary'

    render(<DebatePage />)

    expect(screen.getByText('debate.summary')).toBeInTheDocument()
    expect(screen.getByText('This is the consensus summary')).toBeInTheDocument()
  })

  it('shows stop button when debate is running', async () => {
    const { useDebateStore } = vi.mocked(await import('@/entities/debate/debate.store'))

    useDebateStore.mockImplementation((selector: any) => {
      const state = {
        session: mockDebateSession,
        isRunning: true,
        startDebate: mockStartDebate,
        addRound: mockAddRound,
        updateRoundResponse: mockUpdateRoundResponse,
        setStatus: mockSetStatus,
        setSummary: mockSetSummary,
        reset: mockReset,
      }
      return selector ? selector(state) : state
    })

    render(<DebatePage />)

    expect(screen.getByText('debate.stop')).toBeInTheDocument()
  })
})