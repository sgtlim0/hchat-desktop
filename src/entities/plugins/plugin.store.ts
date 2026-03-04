import { create } from 'zustand'
import type { Plugin, PluginStatus } from '@/shared/types'
import { getAllPlugins, putPlugin, deletePluginFromDb } from '@/shared/lib/db'

interface PluginState {
  plugins: Plugin[]
  searchQuery: string
  selectedPluginId: string | null

  hydrate: () => Promise<void>
  addPlugin: (plugin: Omit<Plugin, 'id' | 'installedAt'>) => void
  installPlugin: (id: string) => void
  uninstallPlugin: (id: string) => void
  enablePlugin: (id: string) => void
  disablePlugin: (id: string) => void
  updateConfig: (id: string, config: Record<string, unknown>) => void
  deletePlugin: (id: string) => void
  selectPlugin: (id: string | null) => void
  setSearchQuery: (query: string) => void
  getInstalled: () => Plugin[]
  getAvailable: () => Plugin[]
}

const DEFAULT_PLUGINS: Omit<Plugin, 'id' | 'installedAt'>[] = [
  {
    name: 'Code Formatter',
    description: 'AI 코드 자동 포매팅',
    icon: '🔧',
    version: '1.0.0',
    author: 'H Chat',
    status: 'available',
    permissions: ['read', 'write'],
    config: {},
  },
  {
    name: 'Grammar Check',
    description: '문법 및 맞춤법 교정',
    icon: '✅',
    version: '1.0.0',
    author: 'H Chat',
    status: 'available',
    permissions: ['read'],
    config: {},
  },
  {
    name: 'Image Analyzer',
    description: '이미지 분석 및 설명',
    icon: '🖼️',
    version: '1.0.0',
    author: 'H Chat',
    status: 'available',
    permissions: ['read', 'vision'],
    config: {},
  },
  {
    name: 'Data Visualizer',
    description: '데이터 차트 및 그래프',
    icon: '📊',
    version: '1.0.0',
    author: 'H Chat',
    status: 'available',
    permissions: ['read', 'write'],
    config: {},
  },
]

export const usePluginStore = create<PluginState>((set, get) => ({
  plugins: [],
  searchQuery: '',
  selectedPluginId: null,

  hydrate: async () => {
    const plugins = await getAllPlugins()

    if (plugins.length === 0) {
      const defaultPlugins = DEFAULT_PLUGINS.map((p, idx) => ({
        ...p,
        id: `plugin-${Date.now()}-${idx}`,
      }))

      await Promise.all(defaultPlugins.map(p => putPlugin(p)))
      set({ plugins: defaultPlugins })
    } else {
      set({ plugins })
    }
  },

  addPlugin: (plugin) => {
    const id = `plugin-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const newPlugin: Plugin = { ...plugin, id }

    set((state) => ({
      plugins: [...state.plugins, newPlugin],
    }))

    putPlugin(newPlugin)
  },

  installPlugin: (id) => {
    const now = new Date().toISOString()

    set((state) => {
      const updated = state.plugins.map((p) =>
        p.id === id
          ? { ...p, status: 'installed' as PluginStatus, installedAt: now }
          : p
      )
      return { plugins: updated }
    })

    const plugin = get().plugins.find(p => p.id === id)
    if (plugin) {
      putPlugin({ ...plugin, status: 'installed', installedAt: now })
    }
  },

  uninstallPlugin: (id) => {
    set((state) => {
      const updated = state.plugins.map((p) =>
        p.id === id
          ? { ...p, status: 'available' as PluginStatus, installedAt: undefined }
          : p
      )
      return { plugins: updated }
    })

    const plugin = get().plugins.find(p => p.id === id)
    if (plugin) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { installedAt, ...rest } = plugin
      putPlugin({ ...rest, status: 'available' })
    }
  },

  enablePlugin: (id) => {
    set((state) => {
      const updated = state.plugins.map((p) =>
        p.id === id ? { ...p, status: 'installed' as PluginStatus } : p
      )
      return { plugins: updated }
    })

    const plugin = get().plugins.find(p => p.id === id)
    if (plugin) {
      putPlugin({ ...plugin, status: 'installed' })
    }
  },

  disablePlugin: (id) => {
    set((state) => {
      const updated = state.plugins.map((p) =>
        p.id === id ? { ...p, status: 'disabled' as PluginStatus } : p
      )
      return { plugins: updated }
    })

    const plugin = get().plugins.find(p => p.id === id)
    if (plugin) {
      putPlugin({ ...plugin, status: 'disabled' })
    }
  },

  updateConfig: (id, config) => {
    set((state) => {
      const updated = state.plugins.map((p) =>
        p.id === id ? { ...p, config } : p
      )
      return { plugins: updated }
    })

    const plugin = get().plugins.find(p => p.id === id)
    if (plugin) {
      putPlugin({ ...plugin, config })
    }
  },

  deletePlugin: (id) => {
    set((state) => ({
      plugins: state.plugins.filter((p) => p.id !== id),
      selectedPluginId: state.selectedPluginId === id ? null : state.selectedPluginId,
    }))

    deletePluginFromDb(id)
  },

  selectPlugin: (id) => {
    set({ selectedPluginId: id })
  },

  setSearchQuery: (query) => {
    set({ searchQuery: query })
  },

  getInstalled: () => {
    return get().plugins.filter((p) => p.status === 'installed')
  },

  getAvailable: () => {
    return get().plugins.filter((p) => p.status === 'available')
  },
}))
