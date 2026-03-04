import { create } from 'zustand'
import type { CustomTheme } from '@/shared/types'
import { getAllCustomThemes, putCustomTheme, deleteCustomThemeFromDb } from '@/shared/lib/db'

interface ThemeState {
  themes: CustomTheme[]
  selectedThemeId: string | null

  hydrate: () => Promise<void>
  addTheme: (name: string, variables: Record<string, string>) => void
  updateTheme: (id: string, updates: Partial<Omit<CustomTheme, 'id' | 'createdAt'>>) => void
  deleteTheme: (id: string) => void
  activateTheme: (id: string) => void
  deactivateTheme: (id: string) => void
  selectTheme: (id: string | null) => void
  duplicateTheme: (id: string) => void
}

const DEFAULT_THEME: Omit<CustomTheme, 'id' | 'createdAt' | 'updatedAt'> = {
  name: 'Ocean Blue',
  variables: {
    '--color-primary': '#0369a1',
    '--color-bg': '#0c1524',
    '--color-card': '#1a2744',
    '--color-border': '#2d3f5f',
    '--color-text-primary': '#e8f0fe',
  },
  isActive: false,
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  themes: [],
  selectedThemeId: null,

  hydrate: async () => {
    const themes = await getAllCustomThemes()

    if (themes.length === 0) {
      const now = new Date().toISOString()
      const defaultTheme: CustomTheme = {
        ...DEFAULT_THEME,
        id: `theme-${Date.now()}`,
        createdAt: now,
        updatedAt: now,
      }

      await putCustomTheme(defaultTheme)
      set({ themes: [defaultTheme] })
    } else {
      set({ themes })
    }
  },

  addTheme: (name, variables) => {
    const now = new Date().toISOString()
    const id = `theme-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

    const newTheme: CustomTheme = {
      id,
      name,
      variables,
      isActive: false,
      createdAt: now,
      updatedAt: now,
    }

    set((state) => ({
      themes: [newTheme, ...state.themes],
    }))

    putCustomTheme(newTheme)
  },

  updateTheme: (id, updates) => {
    const now = new Date().toISOString()

    set((state) => {
      const updated = state.themes.map((t) =>
        t.id === id
          ? { ...t, ...updates, updatedAt: now }
          : t
      )
      return { themes: updated }
    })

    const theme = get().themes.find(t => t.id === id)
    if (theme) {
      putCustomTheme({ ...theme, ...updates, updatedAt: now })
    }
  },

  deleteTheme: (id) => {
    set((state) => ({
      themes: state.themes.filter((t) => t.id !== id),
      selectedThemeId: state.selectedThemeId === id ? null : state.selectedThemeId,
    }))

    deleteCustomThemeFromDb(id)
  },

  activateTheme: (id) => {
    const now = new Date().toISOString()

    set((state) => {
      const updated = state.themes.map((t) => ({
        ...t,
        isActive: t.id === id,
        updatedAt: t.id === id ? now : t.updatedAt,
      }))
      return { themes: updated }
    })

    const activeTheme = get().themes.find(t => t.id === id)
    if (activeTheme) {
      const root = document.documentElement
      Object.entries(activeTheme.variables).forEach(([key, value]) => {
        root.style.setProperty(key, value)
      })

      get().themes.forEach(theme => {
        putCustomTheme({ ...theme, isActive: theme.id === id, updatedAt: theme.id === id ? now : theme.updatedAt })
      })
    }
  },

  deactivateTheme: (id) => {
    const now = new Date().toISOString()

    set((state) => {
      const updated = state.themes.map((t) =>
        t.id === id
          ? { ...t, isActive: false, updatedAt: now }
          : t
      )
      return { themes: updated }
    })

    const theme = get().themes.find(t => t.id === id)
    if (theme) {
      putCustomTheme({ ...theme, isActive: false, updatedAt: now })
    }
  },

  selectTheme: (id) => {
    set({ selectedThemeId: id })
  },

  duplicateTheme: (id) => {
    const original = get().themes.find(t => t.id === id)
    if (!original) return

    const now = new Date().toISOString()
    const newId = `theme-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

    const duplicate: CustomTheme = {
      ...original,
      id: newId,
      name: `${original.name} (Copy)`,
      isActive: false,
      createdAt: now,
      updatedAt: now,
    }

    set((state) => ({
      themes: [duplicate, ...state.themes],
    }))

    putCustomTheme(duplicate)
  },
}))
