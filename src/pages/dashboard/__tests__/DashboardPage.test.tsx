import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DashboardPage } from '../DashboardPage'

// Mock i18n
vi.mock('@/shared/i18n', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

// Mock stores
const mockSetView = vi.fn()
const mockSessions = [
  {
    id: 'session-1',
    title: 'Test Session',
    isFavorite: false,
  },
  {
    id: 'session-2',
    title: 'Favorite Session',
    isFavorite: true,
  },
]

vi.mock('@/entities/session/session.store', () => ({
  useSessionStore: vi.fn((selector) => {
    const state = {
      setView: mockSetView,
      sessions: mockSessions,
    }
    return selector(state)
  }),
}))

const mockLayouts = [
  {
    id: 'layout-1',
    name: 'Default Layout',
    widgets: [
      {
        id: 'widget-1',
        type: 'recentChats',
        title: 'Recent Chats',
        visible: true,
        order: 0,
      },
      {
        id: 'widget-2',
        type: 'usageSummary',
        title: 'Usage Summary',
        visible: true,
        order: 1,
      },
    ],
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
]

const mockHydrate = vi.fn()
const mockSelectLayout = vi.fn()
const mockUpdateWidget = vi.fn()

vi.mock('@/entities/dashboard/dashboard.store', () => ({
  useDashboardStore: vi.fn((selector) => {
    const state = {
      layouts: mockLayouts,
      activeLayoutId: 'layout-1',
      hydrate: mockHydrate,
      selectLayout: mockSelectLayout,
      updateWidget: mockUpdateWidget,
    }
    return selector ? selector(state) : state
  }),
}))

// Mock Button component
vi.mock('@/shared/ui/Button', () => ({
  Button: ({ children, onClick, className }: {
    children: React.ReactNode
    onClick?: () => void
    className?: string
  }) => (
    <button onClick={onClick} className={className}>
      {children}
    </button>
  ),
}))

// Mock lucide icons
vi.mock('lucide-react', () => ({
  X: () => null,
  LayoutDashboard: () => null,
  Plus: () => null,
  GripVertical: () => null,
  MessageSquare: () => null,
  BarChart3: () => null,
  Zap: () => null,
  Database: () => null,
  CalendarClock: () => null,
  Star: () => null,
  Eye: () => null,
  EyeOff: () => null,
}))

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders dashboard page with header', () => {
    render(<DashboardPage />)

    expect(screen.getByText('dashboard.title')).toBeInTheDocument()
    expect(screen.getByText('dashboard.subtitle')).toBeInTheDocument()
  })

  it('calls hydrate on mount', () => {
    render(<DashboardPage />)

    expect(mockHydrate).toHaveBeenCalled()
  })

  it('navigates to home when close button is clicked', () => {
    render(<DashboardPage />)

    const closeButton = screen.getByLabelText('common.close')
    fireEvent.click(closeButton)

    expect(mockSetView).toHaveBeenCalledWith('home')
  })

  it('displays widget cards', () => {
    render(<DashboardPage />)

    expect(screen.getByText('Recent Chats')).toBeInTheDocument()
    expect(screen.getByText('Usage Summary')).toBeInTheDocument()
  })

  it('shows recent sessions in recentChats widget', () => {
    render(<DashboardPage />)

    expect(screen.getByText('Test Session')).toBeInTheDocument()
  })

  it('shows usage summary in usageSummary widget', () => {
    render(<DashboardPage />)

    expect(screen.getByText('dashboard.totalCost')).toBeInTheDocument()
    expect(screen.getByText('dashboard.tokens')).toBeInTheDocument()
    expect(screen.getByText('$0.00')).toBeInTheDocument()
  })

  it('toggles widget visibility when eye button is clicked', () => {
    render(<DashboardPage />)

    const visibilityButtons = screen.getAllByTitle('dashboard.hide')
    if (visibilityButtons.length > 0) {
      fireEvent.click(visibilityButtons[0])
      expect(mockUpdateWidget).toHaveBeenCalledWith('layout-1', 'widget-1', { visible: false })
    }
  })

  it('shows empty state when no widgets are visible', async () => {
    const { useDashboardStore } = vi.mocked(await import('@/entities/dashboard/dashboard.store'))

    useDashboardStore.mockImplementation((selector: ((s: Record<string, unknown>) => unknown) | undefined) => {
      const state = {
        layouts: [
          {
            id: 'layout-1',
            name: 'Default Layout',
            widgets: [],
            createdAt: '2024-01-01',
            updatedAt: '2024-01-01',
          },
        ],
        activeLayoutId: 'layout-1',
        hydrate: mockHydrate,
        selectLayout: mockSelectLayout,
        updateWidget: mockUpdateWidget,
      }
      return selector ? selector(state) : state
    })

    render(<DashboardPage />)

    expect(screen.getByText('dashboard.noWidgets')).toBeInTheDocument()
  })
})