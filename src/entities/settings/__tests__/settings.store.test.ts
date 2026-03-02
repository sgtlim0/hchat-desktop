import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useSettingsStore } from '../settings.store'
import { DEFAULT_MODEL_ID } from '@/shared/constants'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value }),
    removeItem: vi.fn((key: string) => { delete store[key] }),
    clear: vi.fn(() => { store = {} }),
  }
})()

Object.defineProperty(window, 'localStorage', { value: localStorageMock })

describe('SettingsStore', () => {
  beforeEach(() => {
    localStorageMock.clear()
    vi.clearAllMocks()

    // Reset store to defaults
    useSettingsStore.setState({
      selectedModel: DEFAULT_MODEL_ID,
      darkMode: false,
      sidebarOpen: true,
      settingsOpen: false,
      settingsTab: 'api-keys',
      credentials: null,
      openaiApiKey: null,
      geminiApiKey: null,
      autoRouting: false,
      language: 'ko',
    })
  })

  describe('model selection', () => {
    it('has default model', () => {
      expect(useSettingsStore.getState().selectedModel).toBe(DEFAULT_MODEL_ID)
    })

    it('sets selected model', () => {
      useSettingsStore.getState().setSelectedModel('gpt-4o')
      expect(useSettingsStore.getState().selectedModel).toBe('gpt-4o')
    })

    it('persists model to localStorage', () => {
      useSettingsStore.getState().setSelectedModel('gpt-4o')
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'hchat:settings',
        expect.stringContaining('"selectedModel":"gpt-4o"')
      )
    })
  })

  describe('dark mode', () => {
    it('defaults to false', () => {
      expect(useSettingsStore.getState().darkMode).toBe(false)
    })

    it('toggles dark mode', () => {
      useSettingsStore.getState().toggleDarkMode()
      expect(useSettingsStore.getState().darkMode).toBe(true)

      useSettingsStore.getState().toggleDarkMode()
      expect(useSettingsStore.getState().darkMode).toBe(false)
    })
  })

  describe('sidebar', () => {
    it('defaults to open', () => {
      expect(useSettingsStore.getState().sidebarOpen).toBe(true)
    })

    it('toggles sidebar', () => {
      useSettingsStore.getState().toggleSidebar()
      expect(useSettingsStore.getState().sidebarOpen).toBe(false)
    })
  })

  describe('settings panel', () => {
    it('opens and closes settings', () => {
      useSettingsStore.getState().setSettingsOpen(true)
      expect(useSettingsStore.getState().settingsOpen).toBe(true)

      useSettingsStore.getState().setSettingsOpen(false)
      expect(useSettingsStore.getState().settingsOpen).toBe(false)
    })

    it('switches settings tab', () => {
      useSettingsStore.getState().setSettingsTab('customization')
      expect(useSettingsStore.getState().settingsTab).toBe('customization')
    })
  })

  describe('credentials', () => {
    it('defaults to null', () => {
      expect(useSettingsStore.getState().credentials).toBeNull()
    })

    it('sets credentials', () => {
      const creds = { accessKeyId: 'AKIA...', secretAccessKey: 'secret', region: 'us-east-1' }
      useSettingsStore.getState().setCredentials(creds)
      expect(useSettingsStore.getState().credentials).toEqual(creds)
    })

    it('clears credentials', () => {
      useSettingsStore.getState().setCredentials({ accessKeyId: 'a', secretAccessKey: 'b', region: 'us-east-1' })
      useSettingsStore.getState().setCredentials(null)
      expect(useSettingsStore.getState().credentials).toBeNull()
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('hchat:credentials')
    })

    it('hasCredentials returns true when all fields present', () => {
      useSettingsStore.getState().setCredentials({ accessKeyId: 'a', secretAccessKey: 'b', region: 'us-east-1' })
      expect(useSettingsStore.getState().hasCredentials()).toBe(true)
    })

    it('hasCredentials returns false when credentials null', () => {
      expect(useSettingsStore.getState().hasCredentials()).toBe(false)
    })
  })

  describe('API keys', () => {
    it('sets and clears OpenAI key', () => {
      useSettingsStore.getState().setOpenaiApiKey('sk-test')
      expect(useSettingsStore.getState().openaiApiKey).toBe('sk-test')

      useSettingsStore.getState().setOpenaiApiKey(null)
      expect(useSettingsStore.getState().openaiApiKey).toBeNull()
    })

    it('sets and clears Gemini key', () => {
      useSettingsStore.getState().setGeminiApiKey('AIza-test')
      expect(useSettingsStore.getState().geminiApiKey).toBe('AIza-test')

      useSettingsStore.getState().setGeminiApiKey(null)
      expect(useSettingsStore.getState().geminiApiKey).toBeNull()
    })
  })

  describe('auto routing', () => {
    it('defaults to false', () => {
      expect(useSettingsStore.getState().autoRouting).toBe(false)
    })

    it('enables auto routing', () => {
      useSettingsStore.getState().setAutoRouting(true)
      expect(useSettingsStore.getState().autoRouting).toBe(true)
    })
  })

  describe('language', () => {
    it('defaults to ko', () => {
      expect(useSettingsStore.getState().language).toBe('ko')
    })

    it('switches language', () => {
      useSettingsStore.getState().setLanguage('en')
      expect(useSettingsStore.getState().language).toBe('en')
      expect(localStorageMock.setItem).toHaveBeenCalledWith('hchat:language', 'en')
    })
  })
})
