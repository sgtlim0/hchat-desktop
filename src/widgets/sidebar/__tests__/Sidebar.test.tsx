import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Sidebar } from '../Sidebar'
import type { Session } from '@/shared/types'

// Mock i18n
vi.mock('@/shared/i18n', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    language: 'en',
  }),
}))

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  MessageSquare: () => <div>MessageSquare</div>,
  Folder: () => <div>Folder</div>,
  Star: () => <div>Star</div>,
  Search: () => <div>Search</div>,
  Plus: () => <div>Plus</div>,
  Brain: () => <div>Brain</div>,
  Network: () => <div>Network</div>,
  CalendarClock: () => <div>CalendarClock</div>,
  Users: () => <div>Users</div>,
  Settings: () => <div>Settings</div>,
  BookOpen: () => <div>BookOpen</div>,
  Swords: () => <div>Swords</div>,
  ChevronDown: () => <div>ChevronDown</div>,
  ChevronRight: () => <div>ChevronRight</div>,
  X: () => <div>X</div>,
  Wand2: () => <div>Wand2</div>,
  Image: () => <div>Image</div>,
  Bot: () => <div>Bot</div>,
  Languages: () => <div>Languages</div>,
  FileText: () => <div>FileText</div>,
  ScanLine: () => <div>ScanLine</div>,
}))

// Mock SessionContextMenu
vi.mock('../SessionContextMenu', () => ({
  SessionContextMenu: ({ sessionId, onClose }: { sessionId: string; onClose: () => void }) => (
    <div data-testid="context-menu" data-session={sessionId}>
      <button onClick={onClose}>Close</button>
    </div>
  ),
}))

// Mock session store
const mockSessions: Session[] = []
const mockCurrentSessionId = ''
const mockSelectSession = vi.fn()
const mockCreateSession = vi.fn()
const mockSetView = vi.fn()
const mockSetSearchOpen = vi.fn()

vi.mock('@/entities/session/session.store', () => ({
  useSessionStore: vi.fn((selector) => {
    const state = {
      sessions: mockSessions,
      currentSessionId: mockCurrentSessionId,
      selectSession: mockSelectSession,
      createSession: mockCreateSession,
      setView: mockSetView,
      setSearchOpen: mockSetSearchOpen,
    }
    return selector(state)
  }),
}))

// Mock settings store
const mockSetSettingsOpen = vi.fn()

vi.mock('@/entities/settings/settings.store', () => ({
  useSettingsStore: vi.fn((selector) => {
    const state = {
      setSettingsOpen: mockSetSettingsOpen,
      sidebarOpen: true,
      toggleSidebar: vi.fn(),
    }
    return selector(state)
  }),
}))

// Mock folder store
vi.mock('@/entities/folder/folder.store', () => ({
  useFolderStore: vi.fn((selector) => {
    const state = {
      folders: [],
      selectedFolderId: null,
      selectFolder: vi.fn(),
      addFolder: vi.fn(),
    }
    return selector(state)
  }),
}))

describe('Sidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSessions.length = 0
  })

  it('renders search button', () => {
    render(<Sidebar />)
    expect(screen.getByText('sidebar.search')).toBeInTheDocument()
  })

  it('renders new chat button', () => {
    render(<Sidebar />)
    expect(screen.getByText('sidebar.newChat')).toBeInTheDocument()
  })

  it('renders H Chat branding', () => {
    render(<Sidebar />)
    expect(screen.getByText('H Chat')).toBeInTheDocument()
  })

  it('renders projects section', () => {
    render(<Sidebar />)
    expect(screen.getByText('sidebar.projects')).toBeInTheDocument()
  })

  it('renders tools section', () => {
    render(<Sidebar />)
    expect(screen.getByText('sidebar.tools')).toBeInTheDocument()
    expect(screen.getByText('sidebar.groupChat')).toBeInTheDocument()
    expect(screen.getByText('sidebar.memory')).toBeInTheDocument()
    expect(screen.getByText('sidebar.agentSwarm')).toBeInTheDocument()
    expect(screen.getByText('sidebar.scheduler')).toBeInTheDocument()
    expect(screen.getByText('sidebar.promptLibrary')).toBeInTheDocument()
    expect(screen.getByText('sidebar.debate')).toBeInTheDocument()
  })

  it('renders settings button', () => {
    render(<Sidebar />)
    expect(screen.getByText('settings.title')).toBeInTheDocument()
  })

  it('calls createSession when new chat button is clicked', () => {
    render(<Sidebar />)
    const newChatButton = screen.getByText('sidebar.newChat')
    fireEvent.click(newChatButton)
    expect(mockCreateSession).toHaveBeenCalled()
  })

  it('calls setSearchOpen when search button is clicked', () => {
    render(<Sidebar />)
    const searchButton = screen.getByText('sidebar.search')
    fireEvent.click(searchButton)
    expect(mockSetSearchOpen).toHaveBeenCalledWith(true)
  })

  it('calls setView when projects is clicked', () => {
    render(<Sidebar />)
    const projectsButton = screen.getByText('sidebar.projects')
    fireEvent.click(projectsButton)
    expect(mockSetView).toHaveBeenCalledWith('projects')
  })

  it('calls setView when group chat is clicked', () => {
    render(<Sidebar />)
    const groupChatButton = screen.getByText('sidebar.groupChat')
    fireEvent.click(groupChatButton)
    expect(mockSetView).toHaveBeenCalledWith('groupChat')
  })

  it('calls setSettingsOpen when settings is clicked', () => {
    render(<Sidebar />)
    const settingsButton = screen.getByText('settings.title')
    fireEvent.click(settingsButton)
    expect(mockSetSettingsOpen).toHaveBeenCalledWith(true)
  })

  it('renders favorite sessions', () => {
    mockSessions.push({
      id: 'session-1',
      title: 'Favorite Chat',
      modelId: 'claude-sonnet-4.6',
      isFavorite: true,
      isStreaming: false,
      pinned: false,
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    render(<Sidebar />)
    expect(screen.getByText('sidebar.favorites')).toBeInTheDocument()
    expect(screen.getByText('Favorite Chat')).toBeInTheDocument()
  })

  it('renders recent sessions', () => {
    mockSessions.push({
      id: 'session-1',
      title: 'Recent Chat',
      modelId: 'claude-sonnet-4.6',
      isFavorite: false,
      isStreaming: false,
      pinned: false,
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    render(<Sidebar />)
    expect(screen.getByText('sidebar.recentChats')).toBeInTheDocument()
    expect(screen.getByText('Recent Chat')).toBeInTheDocument()
  })

  it('calls selectSession when session is clicked', () => {
    mockSessions.push({
      id: 'session-1',
      title: 'Test Chat',
      modelId: 'claude-sonnet-4.6',
      isFavorite: false,
      isStreaming: false,
      pinned: false,
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    render(<Sidebar />)
    const sessionButton = screen.getByText('Test Chat')
    fireEvent.click(sessionButton)
    expect(mockSelectSession).toHaveBeenCalledWith('session-1')
  })

  it('shows streaming indicator for active sessions', () => {
    mockSessions.push({
      id: 'session-1',
      title: 'Streaming Chat',
      modelId: 'claude-sonnet-4.6',
      isFavorite: false,
      isStreaming: true,
      pinned: false,
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    const { container } = render(<Sidebar />)
    const streamingIndicator = container.querySelector('.animate-pulse-dot')
    expect(streamingIndicator).toBeInTheDocument()
  })

  it('opens context menu on right click', () => {
    mockSessions.push({
      id: 'session-1',
      title: 'Test Chat',
      modelId: 'claude-sonnet-4.6',
      isFavorite: false,
      isStreaming: false,
      pinned: false,
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    render(<Sidebar />)
    const sessionButton = screen.getByText('Test Chat')
    fireEvent.contextMenu(sessionButton.closest('div')!)

    expect(screen.getByTestId('context-menu')).toBeInTheDocument()
    expect(screen.getByTestId('context-menu')).toHaveAttribute('data-session', 'session-1')
  })

  it('closes context menu when close button is clicked', () => {
    mockSessions.push({
      id: 'session-1',
      title: 'Test Chat',
      modelId: 'claude-sonnet-4.6',
      isFavorite: false,
      isStreaming: false,
      pinned: false,
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    render(<Sidebar />)
    const sessionButton = screen.getByText('Test Chat')
    fireEvent.contextMenu(sessionButton.closest('div')!)

    const closeButton = screen.getByText('Close')
    fireEvent.click(closeButton)

    expect(screen.queryByTestId('context-menu')).not.toBeInTheDocument()
  })

  it('separates favorite and recent sessions', () => {
    mockSessions.push(
      {
        id: 'session-1',
        title: 'Favorite 1',
        modelId: 'claude-sonnet-4.6',
        isFavorite: true,
        isStreaming: false,
        pinned: false,
        tags: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'session-2',
        title: 'Recent 1',
        modelId: 'claude-sonnet-4.6',
        isFavorite: false,
        isStreaming: false,
        pinned: false,
        tags: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    )

    render(<Sidebar />)
    expect(screen.getByText('sidebar.favorites')).toBeInTheDocument()
    expect(screen.getByText('sidebar.recentChats')).toBeInTheDocument()
    expect(screen.getByText('Favorite 1')).toBeInTheDocument()
    expect(screen.getByText('Recent 1')).toBeInTheDocument()
  })
})
