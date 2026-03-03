import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { HeaderTabs } from '../HeaderTabs'

vi.mock('@/shared/i18n', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    language: 'en',
  }),
}))

vi.mock('lucide-react', () => ({
  MessageSquare: () => <div data-testid="icon-message">MessageSquare</div>,
  Languages: () => <div data-testid="icon-languages">Languages</div>,
  FileText: () => <div data-testid="icon-filetext">FileText</div>,
  ScanLine: () => <div data-testid="icon-scanline">ScanLine</div>,
}))

let mockView = 'home'
const mockSetView = vi.fn()

vi.mock('@/entities/session/session.store', () => ({
  useSessionStore: vi.fn((selector) => {
    const state = {
      view: mockView,
      setView: mockSetView,
    }
    return selector(state)
  }),
}))

describe('HeaderTabs', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockView = 'home'
  })

  it('renders 4 tabs on home view', () => {
    render(<HeaderTabs />)
    expect(screen.getByText('headerTab.assistant')).toBeInTheDocument()
    expect(screen.getByText('headerTab.translate')).toBeInTheDocument()
    expect(screen.getByText('headerTab.docWriter')).toBeInTheDocument()
    expect(screen.getByText('headerTab.ocr')).toBeInTheDocument()
  })

  it('renders tabs on translate view', () => {
    mockView = 'translate'
    render(<HeaderTabs />)
    expect(screen.getByText('headerTab.translate')).toBeInTheDocument()
  })

  it('renders tabs on docWriter view', () => {
    mockView = 'docWriter'
    render(<HeaderTabs />)
    expect(screen.getByText('headerTab.docWriter')).toBeInTheDocument()
  })

  it('renders tabs on ocr view', () => {
    mockView = 'ocr'
    render(<HeaderTabs />)
    expect(screen.getByText('headerTab.ocr')).toBeInTheDocument()
  })

  it('does not render on chat view', () => {
    mockView = 'chat'
    const { container } = render(<HeaderTabs />)
    expect(container.innerHTML).toBe('')
  })

  it('does not render on settings view', () => {
    mockView = 'settings'
    const { container } = render(<HeaderTabs />)
    expect(container.innerHTML).toBe('')
  })

  it('does not render on non-tool views', () => {
    mockView = 'memory'
    const { container } = render(<HeaderTabs />)
    expect(container.innerHTML).toBe('')
  })

  it('highlights active tab on home view', () => {
    mockView = 'home'
    render(<HeaderTabs />)
    const assistantTab = screen.getByText('headerTab.assistant').closest('button')
    expect(assistantTab?.className).toContain('text-primary')
  })

  it('highlights active tab on translate view', () => {
    mockView = 'translate'
    render(<HeaderTabs />)
    const translateTab = screen.getByText('headerTab.translate').closest('button')
    expect(translateTab?.className).toContain('text-primary')
  })

  it('calls setView when tab is clicked', () => {
    render(<HeaderTabs />)
    fireEvent.click(screen.getByText('headerTab.translate'))
    expect(mockSetView).toHaveBeenCalledWith('translate')
  })

  it('calls setView with docWriter when doc writer tab is clicked', () => {
    render(<HeaderTabs />)
    fireEvent.click(screen.getByText('headerTab.docWriter'))
    expect(mockSetView).toHaveBeenCalledWith('docWriter')
  })

  it('calls setView with ocr when OCR tab is clicked', () => {
    render(<HeaderTabs />)
    fireEvent.click(screen.getByText('headerTab.ocr'))
    expect(mockSetView).toHaveBeenCalledWith('ocr')
  })

  it('calls setView with home when assistant tab is clicked', () => {
    mockView = 'translate'
    render(<HeaderTabs />)
    fireEvent.click(screen.getByText('headerTab.assistant'))
    expect(mockSetView).toHaveBeenCalledWith('home')
  })

  it('renders icons for each tab', () => {
    render(<HeaderTabs />)
    expect(screen.getByTestId('icon-message')).toBeInTheDocument()
    expect(screen.getByTestId('icon-languages')).toBeInTheDocument()
    expect(screen.getByTestId('icon-filetext')).toBeInTheDocument()
    expect(screen.getByTestId('icon-scanline')).toBeInTheDocument()
  })
})
