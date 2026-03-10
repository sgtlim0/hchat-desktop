import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MainLayout } from '../MainLayout'

// Mock all Zustand stores
const mockSetSearchOpen = vi.fn()
const mockToggleSidebar = vi.fn()
const mockSetSettingsOpen = vi.fn()
const mockHydrate = vi.fn()
const mockCopilotToggle = vi.fn()

vi.mock('@/entities/session/session.store', () => ({
  useSessionStore: vi.fn((selector) => {
    const state = {
      view: 'home',
      currentSessionId: null,
      searchOpen: false,
      setSearchOpen: mockSetSearchOpen,
      hydrated: true,
      hydrate: mockHydrate,
    }
    return typeof selector === 'function' ? selector(state) : state
  }),
}))

vi.mock('@/entities/settings/settings.store', () => ({
  useSettingsStore: vi.fn((selector) => {
    const state = {
      toggleSidebar: mockToggleSidebar,
      settingsOpen: false,
      setSettingsOpen: mockSetSettingsOpen,
    }
    return typeof selector === 'function' ? selector(state) : state
  }),
}))

vi.mock('@/entities/toast/toast.store', () => ({
  useToastStore: vi.fn((selector) => {
    const state = {
      toasts: [],
      removeToast: vi.fn(),
    }
    return typeof selector === 'function' ? selector(state) : state
  }),
}))

vi.mock('@/entities/copilot/copilot.store', () => ({
  useCopilotStore: {
    getState: vi.fn(() => ({
      toggle: mockCopilotToggle,
    })),
  },
}))

// Mock all other stores with hydrate functions
vi.mock('@/entities/project/project.store', () => ({
  useProjectStore: vi.fn((selector) => {
    const state = { hydrate: mockHydrate }
    return typeof selector === 'function' ? selector(state) : state
  }),
}))

vi.mock('@/entities/usage/usage.store', () => ({
  useUsageStore: vi.fn((selector) => {
    const state = { hydrate: mockHydrate }
    return typeof selector === 'function' ? selector(state) : state
  }),
}))

vi.mock('@/entities/prompt-library/prompt-library.store', () => ({
  usePromptLibraryStore: vi.fn((selector) => {
    const state = { hydrate: mockHydrate }
    return typeof selector === 'function' ? selector(state) : state
  }),
}))

vi.mock('@/entities/persona/persona.store', () => ({
  usePersonaStore: vi.fn((selector) => {
    const state = { hydrate: mockHydrate }
    return typeof selector === 'function' ? selector(state) : state
  }),
}))

vi.mock('@/entities/folder/folder.store', () => ({
  useFolderStore: vi.fn((selector) => {
    const state = { hydrate: mockHydrate }
    return typeof selector === 'function' ? selector(state) : state
  }),
}))

vi.mock('@/entities/tag/tag.store', () => ({
  useTagStore: vi.fn((selector) => {
    const state = { hydrate: mockHydrate }
    return typeof selector === 'function' ? selector(state) : state
  }),
}))

vi.mock('@/entities/memory/memory.store', () => ({
  useMemoryStore: vi.fn((selector) => {
    const state = { hydrate: mockHydrate }
    return typeof selector === 'function' ? selector(state) : state
  }),
}))

vi.mock('@/entities/schedule/schedule.store', () => ({
  useScheduleStore: vi.fn((selector) => {
    const state = { hydrate: mockHydrate }
    return typeof selector === 'function' ? selector(state) : state
  }),
}))

vi.mock('@/entities/swarm/swarm.store', () => ({
  useSwarmStore: vi.fn((selector) => {
    const state = { hydrate: mockHydrate }
    return typeof selector === 'function' ? selector(state) : state
  }),
}))

vi.mock('@/entities/channel/channel.store', () => ({
  useChannelStore: vi.fn((selector) => {
    const state = { hydrate: mockHydrate }
    return typeof selector === 'function' ? selector(state) : state
  }),
}))

vi.mock('@/entities/knowledge/knowledge.store', () => ({
  useKnowledgeStore: vi.fn((selector) => {
    const state = { hydrate: mockHydrate }
    return typeof selector === 'function' ? selector(state) : state
  }),
}))

vi.mock('@/entities/workflow/workflow.store', () => ({
  useWorkflowStore: vi.fn((selector) => {
    const state = { hydrate: mockHydrate }
    return typeof selector === 'function' ? selector(state) : state
  }),
}))

vi.mock('@/entities/collab/collab.store', () => ({
  useCollabStore: vi.fn((selector) => {
    const state = { hydrate: mockHydrate }
    return typeof selector === 'function' ? selector(state) : state
  }),
}))

vi.mock('@/entities/audit/audit.store', () => ({
  useAuditStore: vi.fn((selector) => {
    const state = { hydrate: mockHydrate }
    return typeof selector === 'function' ? selector(state) : state
  }),
}))

vi.mock('@/entities/batch/batch.store', () => ({
  useBatchStore: vi.fn((selector) => {
    const state = { hydrate: mockHydrate }
    return typeof selector === 'function' ? selector(state) : state
  }),
}))

vi.mock('@/entities/cache/cache.store', () => ({
  useCacheStore: vi.fn((selector) => {
    const state = { hydrate: mockHydrate }
    return typeof selector === 'function' ? selector(state) : state
  }),
}))

vi.mock('@/entities/plugins/plugin.store', () => ({
  usePluginStore: vi.fn((selector) => {
    const state = { hydrate: mockHydrate }
    return typeof selector === 'function' ? selector(state) : state
  }),
}))

vi.mock('@/entities/theme/theme.store', () => ({
  useThemeStore: vi.fn((selector) => {
    const state = { hydrate: mockHydrate }
    return typeof selector === 'function' ? selector(state) : state
  }),
}))

vi.mock('@/entities/context-manager/context-manager.store', () => ({
  useContextManagerStore: vi.fn((selector) => {
    const state = { hydrate: mockHydrate }
    return typeof selector === 'function' ? selector(state) : state
  }),
}))

vi.mock('@/entities/insights/insights.store', () => ({
  useInsightsStore: vi.fn((selector) => {
    const state = { hydrate: mockHydrate }
    return typeof selector === 'function' ? selector(state) : state
  }),
}))

vi.mock('@/entities/dashboard/dashboard.store', () => ({
  useDashboardStore: vi.fn((selector) => {
    const state = { hydrate: mockHydrate }
    return typeof selector === 'function' ? selector(state) : state
  }),
}))

vi.mock('@/entities/workspace/workspace.store', () => ({
  useWorkspaceStore: vi.fn((selector) => {
    const state = { hydrate: mockHydrate }
    return typeof selector === 'function' ? selector(state) : state
  }),
}))

// Mock UI components
vi.mock('@/widgets/sidebar/Sidebar', () => ({
  Sidebar: () => <div data-testid="sidebar">Sidebar</div>,
}))

vi.mock('@/widgets/header-tabs/HeaderTabs', () => ({
  HeaderTabs: () => <div data-testid="header-tabs">HeaderTabs</div>,
}))

vi.mock('@/pages/home/HomeScreen', () => ({
  HomeScreen: () => <div data-testid="home-screen">HomeScreen</div>,
}))

vi.mock('@/widgets/search/SearchModal', () => ({
  SearchModal: () => <div data-testid="search-modal">SearchModal</div>,
}))

vi.mock('@/shared/ui/ToastContainer', () => ({
  ToastContainer: () => <div data-testid="toast-container">ToastContainer</div>,
}))

vi.mock('@/shared/ui/ErrorBoundary', () => ({
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock('@/shared/ui/InstallBanner', () => ({
  InstallBanner: () => null,
}))

vi.mock('@/shared/ui/SyncStatusBadge', () => ({
  SyncStatusBadge: () => <div data-testid="sync-badge">SyncBadge</div>,
}))

vi.mock('@/shared/ui/KeyboardShortcutsHelp', () => ({
  KeyboardShortcutsHelp: () => <div data-testid="shortcuts-help">ShortcutsHelp</div>,
}))

vi.mock('@/widgets/copilot/CopilotPanel', () => ({
  CopilotPanel: () => <div data-testid="copilot-panel">CopilotPanel</div>,
}))

// Mock hooks
vi.mock('@/shared/i18n', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

vi.mock('@/shared/hooks/useOnlineStatus', () => ({
  useOnlineStatus: () => true,
}))

// Mock route-map lazy components
vi.mock('../route-map', () => ({
  ROUTE_MAP: {
    translate: () => <div data-testid="translate-page">TranslatePage</div>,
    agent: () => <div data-testid="agent-page">AgentPage</div>,
    dashboard: () => <div data-testid="dashboard-page">DashboardPage</div>,
    memory: () => <div data-testid="memory-page">MemoryPage</div>,
    workspace: () => <div data-testid="workspace-page">WorkspacePage</div>,
  },
  SettingsScreen: () => <div data-testid="settings-screen">SettingsScreen</div>,
  ChatPage: () => <div data-testid="chat-page">ChatPage</div>,
}))

// Import mocked modules for dynamic changes
import { useSessionStore } from '@/entities/session/session.store'
import { useSettingsStore } from '@/entities/settings/settings.store'
import { useCopilotStore } from '@/entities/copilot/copilot.store'

describe('MainLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering Tests', () => {
    it('renders without crashing', () => {
      render(<MainLayout />)
      expect(screen.getByTestId('sidebar')).toBeInTheDocument()
    })

    it('renders sidebar component', () => {
      render(<MainLayout />)
      expect(screen.getByTestId('sidebar')).toBeInTheDocument()
    })

    it('renders main content area', () => {
      render(<MainLayout />)
      const mainContent = screen.getByRole('main')
      expect(mainContent).toBeInTheDocument()
      expect(mainContent).toHaveAttribute('id', 'main-content')
    })

    it('renders ToastContainer', () => {
      render(<MainLayout />)
      expect(screen.getByTestId('toast-container')).toBeInTheDocument()
    })

    it('renders header tabs and sync badge', () => {
      render(<MainLayout />)
      expect(screen.getByTestId('header-tabs')).toBeInTheDocument()
      expect(screen.getByTestId('sync-badge')).toBeInTheDocument()
    })

    it('renders skip to content link for accessibility', () => {
      render(<MainLayout />)
      const skipLink = screen.getByText('common.skipToContent')
      expect(skipLink).toBeInTheDocument()
      expect(skipLink).toHaveAttribute('href', '#main-content')
    })

    it('shows loading state when not hydrated', () => {
      ;(useSessionStore as any).mockImplementation((selector: any) => {
        const state = {
          hydrated: false,
          hydrate: vi.fn(),
        }
        return typeof selector === 'function' ? selector(state) : state
      })

      render(<MainLayout />)
      expect(screen.getByText('common.loading')).toBeInTheDocument()
    })
  })

  describe('View Routing Tests', () => {
    beforeEach(() => {
      // Reset settingsOpen to false for routing tests
      ;(useSettingsStore as any).mockImplementation((selector: any) => {
        const state = {
          toggleSidebar: mockToggleSidebar,
          settingsOpen: false,
          setSettingsOpen: mockSetSettingsOpen,
        }
        return typeof selector === 'function' ? selector(state) : state
      })
    })

    it('renders home page when view is "home"', () => {
      ;(useSessionStore as any).mockImplementation((selector: any) => {
        const state = {
          view: 'home',
          currentSessionId: null,
          searchOpen: false,
          setSearchOpen: vi.fn(),
          hydrated: true,
          hydrate: vi.fn(),
        }
        return typeof selector === 'function' ? selector(state) : state
      })

      render(<MainLayout />)
      expect(screen.getByTestId('home-screen')).toBeInTheDocument()
    })

    it('renders chat page when view is "chat" with currentSessionId', () => {
      ;(useSessionStore as any).mockImplementation((selector: any) => {
        const state = {
          view: 'chat',
          currentSessionId: 'session-123',
          searchOpen: false,
          setSearchOpen: vi.fn(),
          hydrated: true,
          hydrate: vi.fn(),
        }
        return typeof selector === 'function' ? selector(state) : state
      })

      render(<MainLayout />)
      expect(screen.getByTestId('chat-page')).toBeInTheDocument()
    })

    it('renders settings when settingsOpen is true', () => {
      ;(useSettingsStore as any).mockImplementation((selector: any) => {
        const state = {
          toggleSidebar: vi.fn(),
          settingsOpen: true,
          setSettingsOpen: vi.fn(),
        }
        return typeof selector === 'function' ? selector(state) : state
      })

      render(<MainLayout />)
      expect(screen.getByTestId('settings-screen')).toBeInTheDocument()
    })

    it('renders translate page when view is "translate"', () => {
      ;(useSessionStore as any).mockImplementation((selector: any) => {
        const state = {
          view: 'translate',
          currentSessionId: null,
          searchOpen: false,
          setSearchOpen: vi.fn(),
          hydrated: true,
          hydrate: vi.fn(),
        }
        return typeof selector === 'function' ? selector(state) : state
      })

      render(<MainLayout />)
      expect(screen.getByTestId('translate-page')).toBeInTheDocument()
    })

    it('renders agent page when view is "agent"', () => {
      ;(useSessionStore as any).mockImplementation((selector: any) => {
        const state = {
          view: 'agent',
          currentSessionId: null,
          searchOpen: false,
          setSearchOpen: vi.fn(),
          hydrated: true,
          hydrate: vi.fn(),
        }
        return typeof selector === 'function' ? selector(state) : state
      })

      render(<MainLayout />)
      expect(screen.getByTestId('agent-page')).toBeInTheDocument()
    })

    it('renders dashboard page when view is "dashboard"', () => {
      ;(useSessionStore as any).mockImplementation((selector: any) => {
        const state = {
          view: 'dashboard',
          currentSessionId: null,
          searchOpen: false,
          setSearchOpen: vi.fn(),
          hydrated: true,
          hydrate: vi.fn(),
        }
        return typeof selector === 'function' ? selector(state) : state
      })

      render(<MainLayout />)
      expect(screen.getByTestId('dashboard-page')).toBeInTheDocument()
    })
  })

  describe('Keyboard Shortcut Tests', () => {
    beforeEach(() => {
      // Reset mocks and ensure default state for keyboard tests
      vi.clearAllMocks()
      ;(useSessionStore as any).mockImplementation((selector: any) => {
        const state = {
          view: 'home',
          currentSessionId: null,
          searchOpen: false,
          setSearchOpen: mockSetSearchOpen,
          hydrated: true,
          hydrate: vi.fn(),
        }
        return typeof selector === 'function' ? selector(state) : state
      })
      ;(useSettingsStore as any).mockImplementation((selector: any) => {
        const state = {
          toggleSidebar: mockToggleSidebar,
          settingsOpen: false,
          setSettingsOpen: mockSetSettingsOpen,
        }
        return typeof selector === 'function' ? selector(state) : state
      })
    })

    it('opens search modal on Cmd+K', () => {
      render(<MainLayout />)

      fireEvent.keyDown(window, { key: 'k', metaKey: true })
      expect(mockSetSearchOpen).toHaveBeenCalledWith(true)
    })

    it('toggles sidebar on Cmd+B', () => {
      render(<MainLayout />)

      fireEvent.keyDown(window, { key: 'b', metaKey: true })
      expect(mockToggleSidebar).toHaveBeenCalled()
    })

    it('opens settings on Cmd+,', () => {
      render(<MainLayout />)

      fireEvent.keyDown(window, { key: ',', metaKey: true })
      expect(mockSetSettingsOpen).toHaveBeenCalledWith(true)
    })

    it('works with Ctrl key instead of Cmd (Windows/Linux)', () => {
      render(<MainLayout />)

      fireEvent.keyDown(window, { key: 'b', ctrlKey: true })
      expect(mockToggleSidebar).toHaveBeenCalled()
    })

    it('toggles copilot on Cmd+J', () => {
      render(<MainLayout />)

      fireEvent.keyDown(window, { key: 'j', metaKey: true })
      expect(mockCopilotToggle).toHaveBeenCalled()
    })
  })

  describe('Store Hydration Tests', () => {
    it('calls hydrate on mount for all stores', async () => {
      render(<MainLayout />)

      await waitFor(() => {
        // The mockHydrate function is called by multiple stores
        expect(mockHydrate).toHaveBeenCalled()
      })
    })

    it('hydrates session store on mount', async () => {
      const hydrate = vi.fn()
      ;(useSessionStore as any).mockImplementation((selector: any) => {
        const state = {
          view: 'home',
          currentSessionId: null,
          searchOpen: false,
          setSearchOpen: vi.fn(),
          hydrated: true,
          hydrate,
        }
        return typeof selector === 'function' ? selector(state) : state
      })

      render(<MainLayout />)

      await waitFor(() => {
        expect(hydrate).toHaveBeenCalled()
      })
    })
  })

  describe('Additional Features', () => {
    beforeEach(() => {
      // Reset settingsOpen for additional feature tests
      ;(useSettingsStore as any).mockImplementation((selector: any) => {
        const state = {
          toggleSidebar: mockToggleSidebar,
          settingsOpen: false,
          setSettingsOpen: mockSetSettingsOpen,
        }
        return typeof selector === 'function' ? selector(state) : state
      })
    })

    it('renders search modal when searchOpen is true', () => {
      ;(useSessionStore as any).mockImplementation((selector: any) => {
        const state = {
          view: 'home',
          currentSessionId: null,
          searchOpen: true,
          setSearchOpen: vi.fn(),
          hydrated: true,
          hydrate: vi.fn(),
        }
        return typeof selector === 'function' ? selector(state) : state
      })

      render(<MainLayout />)
      expect(screen.getByTestId('search-modal')).toBeInTheDocument()
    })

    it('renders copilot panel', () => {
      render(<MainLayout />)
      expect(screen.getByTestId('copilot-panel')).toBeInTheDocument()
    })

    it('falls back to home screen for unknown view', () => {
      ;(useSessionStore as any).mockImplementation((selector: any) => {
        const state = {
          view: 'unknown-view' as any,
          currentSessionId: null,
          searchOpen: false,
          setSearchOpen: vi.fn(),
          hydrated: true,
          hydrate: vi.fn(),
        }
        return typeof selector === 'function' ? selector(state) : state
      })

      render(<MainLayout />)
      expect(screen.getByTestId('home-screen')).toBeInTheDocument()
    })
  })
})