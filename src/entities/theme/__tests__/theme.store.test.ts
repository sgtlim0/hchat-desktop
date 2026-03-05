import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useThemeStore } from '../theme.store'
import type { CustomTheme } from '@/shared/types'

// Mock the db module
vi.mock('@/shared/lib/db', () => ({
  getAllCustomThemes: vi.fn(() => Promise.resolve([])),
  putCustomTheme: vi.fn(() => Promise.resolve()),
  deleteCustomThemeFromDb: vi.fn(() => Promise.resolve()),
}))

describe('ThemeStore', () => {
  beforeEach(() => {
    useThemeStore.setState({
      themes: [],
      selectedThemeId: null,
    })

    // Mock document.documentElement.style.setProperty
    document.documentElement.style.setProperty = vi.fn()
  })

  it('should add a new theme', () => {
    const { addTheme } = useThemeStore.getState()

    const variables = {
      '--color-primary': '#ff0000',
      '--color-bg': '#ffffff',
      '--color-text': '#000000',
    }

    addTheme('Custom Red Theme', variables)

    const themes = useThemeStore.getState().themes
    expect(themes).toHaveLength(1)
    expect(themes[0].name).toBe('Custom Red Theme')
    expect(themes[0].variables).toEqual(variables)
    expect(themes[0].isActive).toBe(false)
    expect(themes[0].id).toMatch(/^theme-/)
  })

  it('should update a theme', () => {
    const { addTheme, updateTheme } = useThemeStore.getState()

    // Add a theme first
    addTheme('Original Theme', { '--color-primary': '#000000' })

    const themeId = useThemeStore.getState().themes[0].id

    // Update the theme
    updateTheme(themeId, {
      name: 'Updated Theme',
      variables: { '--color-primary': '#ffffff', '--color-bg': '#000000' },
    })

    const updatedTheme = useThemeStore.getState().themes[0]
    expect(updatedTheme.name).toBe('Updated Theme')
    expect(updatedTheme.variables['--color-primary']).toBe('#ffffff')
    expect(updatedTheme.variables['--color-bg']).toBe('#000000')
  })

  it('should delete a theme', () => {
    const { addTheme, deleteTheme, selectTheme } = useThemeStore.getState()

    // Add two themes
    addTheme('Theme 1', { '--color-primary': '#111111' })
    addTheme('Theme 2', { '--color-primary': '#222222' })

    const themes = useThemeStore.getState().themes
    const themeToDelete = themes[0].id
    const themeToKeep = themes[1].id

    // Select the theme to delete
    selectTheme(themeToDelete)

    deleteTheme(themeToDelete)

    const remainingThemes = useThemeStore.getState().themes
    expect(remainingThemes).toHaveLength(1)
    expect(remainingThemes[0].id).toBe(themeToKeep)
    expect(useThemeStore.getState().selectedThemeId).toBeNull()
  })

  it('should activate a theme and apply CSS variables', () => {
    const { activateTheme } = useThemeStore.getState()

    const variables = {
      '--color-primary': '#0000ff',
      '--color-bg': '#f0f0f0',
      '--color-text': '#333333',
    }

    // Use setState to avoid Date.now() collision and control order
    useThemeStore.setState({
      themes: [
        {
          id: 'theme-blue',
          name: 'Blue Theme',
          variables,
          isActive: false,
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
        },
        {
          id: 'theme-green',
          name: 'Green Theme',
          variables: { '--color-primary': '#00ff00' },
          isActive: false,
          createdAt: '2026-01-02T00:00:00Z',
          updatedAt: '2026-01-02T00:00:00Z',
        },
      ],
    })

    activateTheme('theme-blue')

    // Check that the theme is marked as active
    const updatedThemes = useThemeStore.getState().themes
    expect(updatedThemes[0].isActive).toBe(true)
    expect(updatedThemes[1].isActive).toBe(false)

    // Check that CSS variables were applied
    expect(document.documentElement.style.setProperty).toHaveBeenCalledWith('--color-primary', '#0000ff')
    expect(document.documentElement.style.setProperty).toHaveBeenCalledWith('--color-bg', '#f0f0f0')
    expect(document.documentElement.style.setProperty).toHaveBeenCalledWith('--color-text', '#333333')
  })

  it('should deactivate a theme', () => {
    const { addTheme, activateTheme, deactivateTheme } = useThemeStore.getState()

    addTheme('Test Theme', { '--color-primary': '#ff00ff' })

    const themeId = useThemeStore.getState().themes[0].id

    // First activate the theme
    activateTheme(themeId)
    expect(useThemeStore.getState().themes[0].isActive).toBe(true)

    // Then deactivate it
    deactivateTheme(themeId)
    expect(useThemeStore.getState().themes[0].isActive).toBe(false)
  })

  it('should select and deselect a theme', () => {
    const { addTheme, selectTheme } = useThemeStore.getState()

    addTheme('Test Theme', { '--color-primary': '#123456' })

    const themeId = useThemeStore.getState().themes[0].id

    // Select the theme
    selectTheme(themeId)
    expect(useThemeStore.getState().selectedThemeId).toBe(themeId)

    // Deselect the theme
    selectTheme(null)
    expect(useThemeStore.getState().selectedThemeId).toBeNull()
  })

  it('should duplicate a theme', () => {
    const { addTheme, duplicateTheme } = useThemeStore.getState()

    const originalVariables = {
      '--color-primary': '#abcdef',
      '--color-bg': '#fedcba',
    }

    addTheme('Original Theme', originalVariables)

    const originalId = useThemeStore.getState().themes[0].id

    duplicateTheme(originalId)

    const themes = useThemeStore.getState().themes
    expect(themes).toHaveLength(2)

    const duplicatedTheme = themes[0] // Duplicates are added at the beginning
    expect(duplicatedTheme.name).toBe('Original Theme (Copy)')
    expect(duplicatedTheme.variables).toEqual(originalVariables)
    expect(duplicatedTheme.isActive).toBe(false)
    expect(duplicatedTheme.id).not.toBe(originalId)
  })

  it('should not duplicate a non-existent theme', () => {
    const { duplicateTheme } = useThemeStore.getState()

    duplicateTheme('non-existent-id')

    expect(useThemeStore.getState().themes).toHaveLength(0)
  })

  it('should hydrate themes from database with default theme', async () => {
    const { hydrate } = useThemeStore.getState()
    const { getAllCustomThemes, putCustomTheme } = await import('@/shared/lib/db')

    // Mock empty database to trigger default theme creation
    vi.mocked(getAllCustomThemes).mockResolvedValueOnce([])
    vi.mocked(putCustomTheme).mockResolvedValue(undefined)

    await hydrate()

    const themes = useThemeStore.getState().themes
    expect(themes).toHaveLength(1)
    expect(themes[0].name).toBe('Ocean Blue')
    expect(themes[0].variables['--color-primary']).toBe('#0369a1')
  })

  it('should hydrate existing themes from database', async () => {
    const { hydrate } = useThemeStore.getState()

    const mockThemes: CustomTheme[] = [
      {
        id: 'theme-123',
        name: 'Existing Theme',
        variables: { '--color-primary': '#987654' },
        isActive: false,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
    ]

    const { getAllCustomThemes } = await import('@/shared/lib/db')
    vi.mocked(getAllCustomThemes).mockResolvedValueOnce(mockThemes)

    await hydrate()

    const themes = useThemeStore.getState().themes
    expect(themes).toEqual(mockThemes)
  })
})