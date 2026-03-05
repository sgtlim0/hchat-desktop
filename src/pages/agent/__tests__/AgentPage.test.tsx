import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AgentPage } from '../AgentPage'

// Mock i18n
vi.mock('@/shared/i18n', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

// Mock stores
const mockGoHome = vi.fn()
const mockSelectedModel = 'claude-sonnet-4.6'
const mockCredentials = {
  accessKeyId: 'test-key',
  secretAccessKey: 'test-secret',
  region: 'us-east-1',
}

vi.mock('@/entities/session/session.store', () => ({
  useSessionStore: vi.fn((selector) => {
    const state = {
      goHome: mockGoHome,
    }
    return selector(state)
  }),
}))

vi.mock('@/entities/settings/settings.store', () => ({
  useSettingsStore: vi.fn((selector) => {
    const state = {
      selectedModel: mockSelectedModel,
      credentials: mockCredentials,
      openaiApiKey: '',
      geminiApiKey: '',
    }
    return selector(state)
  }),
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
    apiKey: '',
  })),
}))

// Mock agent tools
vi.mock('@/shared/lib/agent/tools', () => ({
  AGENT_TOOLS: [
    {
      name: 'search',
      available: true,
      execute: vi.fn(() => Promise.resolve('Search results')),
    },
    {
      name: 'memory',
      available: true,
      execute: vi.fn(() => Promise.resolve('Memory loaded')),
    },
  ],
  getAgentSystemPrompt: vi.fn(() => 'System prompt'),
}))

// Mock agent parser
vi.mock('@/shared/lib/agent/parser', () => ({
  parseToolCalls: vi.fn(() => []),
  stripToolCalls: vi.fn((text) => text),
}))

// Mock Button component
vi.mock('@/shared/ui/Button', () => ({
  Button: ({ children, onClick, disabled }: any) => (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
}))

describe('AgentPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders agent page with header and tools', () => {
    render(<AgentPage />)

    expect(screen.getByText('agent.title')).toBeInTheDocument()
    expect(screen.getByText('Beta')).toBeInTheDocument()
    expect(screen.getByText('🔧 search')).toBeInTheDocument()
    expect(screen.getByText('🔧 memory')).toBeInTheDocument()
  })

  it('shows initial description when not running', () => {
    render(<AgentPage />)

    expect(screen.getByText('agent.description')).toBeInTheDocument()
  })

  it('calls goHome when back button is clicked', () => {
    render(<AgentPage />)

    const backButton = screen.getByLabelText('common.back')
    fireEvent.click(backButton)

    expect(mockGoHome).toHaveBeenCalled()
  })

  it('enables run button when prompt is entered', () => {
    render(<AgentPage />)

    const textarea = screen.getByPlaceholderText('agent.promptPlaceholder')
    const runButton = screen.getByText('agent.run')

    expect(runButton).toBeDisabled()

    fireEvent.change(textarea, { target: { value: 'Test prompt' } })

    expect(runButton).not.toBeDisabled()
  })

  it('runs agent when Enter key is pressed', async () => {
    const { createStream } = await import('@/shared/lib/providers/factory')
    render(<AgentPage />)

    const textarea = screen.getByPlaceholderText('agent.promptPlaceholder')
    fireEvent.change(textarea, { target: { value: 'Test prompt' } })
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false })

    await waitFor(() => {
      expect(createStream).toHaveBeenCalled()
    })
  })

  it('shows stop button when agent is running', async () => {
    render(<AgentPage />)

    const textarea = screen.getByPlaceholderText('agent.promptPlaceholder')
    const runButton = screen.getByText('agent.run')

    fireEvent.change(textarea, { target: { value: 'Test prompt' } })
    fireEvent.click(runButton)

    await waitFor(() => {
      expect(screen.getByText('agent.stop')).toBeInTheDocument()
    })
  })

  it('displays thinking step during execution', async () => {
    render(<AgentPage />)

    const textarea = screen.getByPlaceholderText('agent.promptPlaceholder')
    fireEvent.change(textarea, { target: { value: 'Test prompt' } })
    fireEvent.click(screen.getByText('agent.run'))

    await waitFor(() => {
      expect(screen.getByText(/Step 1: Thinking/)).toBeInTheDocument()
    })
  })
})