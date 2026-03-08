import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { act } from 'react'

// Mock i18n
vi.mock('@/shared/i18n', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'pwa.installBanner': 'Install H Chat for a better experience',
        'pwa.install': 'Install',
        'common.close': 'Close',
      }
      return translations[key] || key
    }
  }),
}))

describe('InstallBanner', () => {
  let matchMediaOriginal: typeof window.matchMedia
  let addEventListenerSpy: ReturnType<typeof vi.spyOn>
  let removeEventListenerSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    matchMediaOriginal = window.matchMedia
    sessionStorage.clear()

    // Mock window.addEventListener and removeEventListener
    addEventListenerSpy = vi.spyOn(window, 'addEventListener')
    removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')
  })

  afterEach(() => {
    window.matchMedia = matchMediaOriginal
    vi.restoreAllMocks()
  })

  it('renders nothing by default (no beforeinstallprompt)', async () => {
    // Mock: not standalone
    window.matchMedia = vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })

    const { InstallBanner } = await import('../InstallBanner')
    const { container } = render(<InstallBanner />)

    expect(container.firstChild).toBeNull()
  })

  it('renders nothing when already in standalone mode', async () => {
    // Mock: standalone mode
    window.matchMedia = vi.fn().mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })

    const { InstallBanner } = await import('../InstallBanner')
    const { container } = render(<InstallBanner />)

    expect(container.firstChild).toBeNull()
  })

  it('renders nothing when previously dismissed', async () => {
    window.matchMedia = vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })
    sessionStorage.setItem('pwa-install-dismissed', '1')

    const { InstallBanner } = await import('../InstallBanner')
    const { container } = render(<InstallBanner />)

    expect(container.firstChild).toBeNull()
  })

  it('shows banner when beforeinstallprompt event fires', async () => {
    window.matchMedia = vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })

    const { InstallBanner } = await import('../InstallBanner')
    render(<InstallBanner />)

    // Create mock beforeinstallprompt event
    const mockPromptEvent = new Event('beforeinstallprompt') as any
    mockPromptEvent.preventDefault = vi.fn()
    mockPromptEvent.prompt = vi.fn()
    mockPromptEvent.userChoice = Promise.resolve({ outcome: 'accepted' })

    // Trigger the event
    act(() => {
      window.dispatchEvent(mockPromptEvent)
    })

    await waitFor(() => {
      expect(screen.getByText('Install H Chat for a better experience')).toBeInTheDocument()
      expect(screen.getByText('Install')).toBeInTheDocument()
      expect(screen.getByLabelText('Close')).toBeInTheDocument()
    })
  })

  it('handles install button click', async () => {
    window.matchMedia = vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })

    const { InstallBanner } = await import('../InstallBanner')
    render(<InstallBanner />)

    // Create mock beforeinstallprompt event
    const mockPromptEvent = new Event('beforeinstallprompt') as any
    mockPromptEvent.preventDefault = vi.fn()
    mockPromptEvent.prompt = vi.fn().mockResolvedValue(undefined)
    mockPromptEvent.userChoice = Promise.resolve({ outcome: 'accepted' })

    // Trigger the event
    act(() => {
      window.dispatchEvent(mockPromptEvent)
    })

    await waitFor(() => {
      expect(screen.getByText('Install')).toBeInTheDocument()
    })

    // Click install button
    const installButton = screen.getByText('Install')
    await act(async () => {
      fireEvent.click(installButton)
    })

    expect(mockPromptEvent.prompt).toHaveBeenCalled()
  })

  it('handles dismiss button click', async () => {
    window.matchMedia = vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })

    const { InstallBanner } = await import('../InstallBanner')
    const { container } = render(<InstallBanner />)

    // Create mock beforeinstallprompt event
    const mockPromptEvent = new Event('beforeinstallprompt') as any
    mockPromptEvent.preventDefault = vi.fn()
    mockPromptEvent.prompt = vi.fn()

    // Trigger the event
    act(() => {
      window.dispatchEvent(mockPromptEvent)
    })

    await waitFor(() => {
      expect(screen.getByLabelText('Close')).toBeInTheDocument()
    })

    // Click dismiss button
    const dismissButton = screen.getByLabelText('Close')
    fireEvent.click(dismissButton)

    // Should set sessionStorage
    expect(sessionStorage.getItem('pwa-install-dismissed')).toBe('1')

    // Banner should disappear
    await waitFor(() => {
      expect(container.firstChild).toBeNull()
    })
  })

  it('cleans up event listeners on unmount', async () => {
    window.matchMedia = vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })

    const { InstallBanner } = await import('../InstallBanner')
    const { unmount } = render(<InstallBanner />)

    // Verify event listener was added
    expect(addEventListenerSpy).toHaveBeenCalledWith('beforeinstallprompt', expect.any(Function))

    unmount()

    // Verify event listener was removed
    expect(removeEventListenerSpy).toHaveBeenCalledWith('beforeinstallprompt', expect.any(Function))
  })
})