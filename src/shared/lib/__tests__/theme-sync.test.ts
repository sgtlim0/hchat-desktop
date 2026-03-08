import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { syncThemeWithSystem } from '../theme-sync'
import { useSettingsStore } from '@/entities/settings/settings.store'

// Mock the settings store
vi.mock('@/entities/settings/settings.store', () => ({
  useSettingsStore: {
    getState: vi.fn(() => ({
      darkMode: false,
    })),
    setState: vi.fn(),
  },
}))

describe('syncThemeWithSystem', () => {
  let listeners: Array<(e: MediaQueryListEvent) => void> = []
  let mockSetState: ReturnType<typeof vi.fn>
  let darkMode = false

  beforeEach(() => {
    listeners = []
    darkMode = false
    mockSetState = vi.fn()

    // Setup mock settings store
    vi.mocked(useSettingsStore.getState).mockReturnValue({
      darkMode: false,
    } as any)
    vi.mocked(useSettingsStore).setState = mockSetState

    // Setup mock matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: vi.fn((query: string) => ({
        matches: query.includes('dark') ? darkMode : false,
        media: query,
        addEventListener: vi.fn((_: string, handler: (e: MediaQueryListEvent) => void) => {
          listeners.push(handler)
        }),
        removeEventListener: vi.fn((_: string, handler: (e: MediaQueryListEvent) => void) => {
          listeners = listeners.filter((l) => l !== handler)
        }),
      })),
    })
  })

  afterEach(() => {
    listeners = []
    vi.clearAllMocks()
  })

  it('sets dark mode when system is dark', () => {
    darkMode = true
    syncThemeWithSystem()
    expect(mockSetState).toHaveBeenCalledWith({ darkMode: true })
  })

  it('sets light mode when system is light', () => {
    darkMode = false
    // Set store to dark mode so it needs to change to light
    vi.mocked(useSettingsStore.getState).mockReturnValue({
      darkMode: true,
    } as any)

    syncThemeWithSystem()
    expect(mockSetState).toHaveBeenCalledWith({ darkMode: false })
  })

  it('does not call setState if already matching', () => {
    // System is light, store is already light
    darkMode = false
    vi.mocked(useSettingsStore.getState).mockReturnValue({
      darkMode: false,
    } as any)

    syncThemeWithSystem()
    expect(mockSetState).not.toHaveBeenCalled()

    // System is dark, store is already dark
    mockSetState.mockClear()
    darkMode = true
    vi.mocked(useSettingsStore.getState).mockReturnValue({
      darkMode: true,
    } as any)

    syncThemeWithSystem()
    expect(mockSetState).not.toHaveBeenCalled()
  })

  it('returns cleanup function that removes listener', () => {
    const cleanup = syncThemeWithSystem()
    expect(listeners).toHaveLength(1)

    cleanup()
    expect(listeners).toHaveLength(0)
  })

  it('works when matchMedia is not available', () => {
    // @ts-ignore - Testing browser compatibility
    window.matchMedia = undefined

    const cleanup = syncThemeWithSystem()
    expect(mockSetState).not.toHaveBeenCalled()

    // Cleanup should not throw
    expect(() => cleanup()).not.toThrow()
  })

  it('responds to system theme changes', () => {
    darkMode = false
    vi.mocked(useSettingsStore.getState).mockReturnValue({
      darkMode: false,
    } as any)

    syncThemeWithSystem()

    // Clear initial call (if any)
    mockSetState.mockClear()

    // Simulate system change to dark
    listeners.forEach((l) => l({ matches: true } as MediaQueryListEvent))
    expect(mockSetState).toHaveBeenCalledWith({ darkMode: true })

    // Update mock to reflect the new state
    vi.mocked(useSettingsStore.getState).mockReturnValue({
      darkMode: true,
    } as any)

    // Simulate system change to light
    mockSetState.mockClear()
    listeners.forEach((l) => l({ matches: false } as MediaQueryListEvent))
    expect(mockSetState).toHaveBeenCalledWith({ darkMode: false })
  })

  it('only updates when theme actually changes', () => {
    darkMode = false
    vi.mocked(useSettingsStore.getState).mockReturnValue({
      darkMode: false,
    } as any)

    syncThemeWithSystem()
    mockSetState.mockClear()

    // Simulate change to same value (light to light)
    listeners.forEach((l) => l({ matches: false } as MediaQueryListEvent))
    expect(mockSetState).not.toHaveBeenCalled()

    // Now change store to dark
    vi.mocked(useSettingsStore.getState).mockReturnValue({
      darkMode: true,
    } as any)

    // Simulate change to different value (dark to light)
    listeners.forEach((l) => l({ matches: false } as MediaQueryListEvent))
    expect(mockSetState).toHaveBeenCalledWith({ darkMode: false })
  })
})