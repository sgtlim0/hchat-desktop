import { create } from 'zustand'
import type { GeoLayerType, GeoFeature, GeoBookmark } from '@/shared/types'
import { geoIntelApi } from '@/shared/lib/geo-intel-api'

function createLayerRecord<T>(value: T): Record<GeoLayerType, T> {
  return {
    flights: value,
    earthquakes: value,
    fires: value,
  }
}

interface GeoIntelligenceState {
  enabledLayers: GeoLayerType[]
  features: Record<GeoLayerType, GeoFeature[]>
  isLoading: Record<GeoLayerType, boolean>
  lastUpdated: Record<GeoLayerType, string | null>
  error: Record<GeoLayerType, string | null>
  center: [number, number]
  zoom: number
  selectedFeatureId: string | null
  bookmarks: GeoBookmark[]
  autoRefresh: boolean
  refreshInterval: number

  hydrate: () => Promise<void>
  toggleLayer: (layer: GeoLayerType) => void
  fetchLayerData: (layer: GeoLayerType) => Promise<void>
  refreshAll: () => Promise<void>
  setCenter: (center: [number, number]) => void
  setZoom: (zoom: number) => void
  selectFeature: (id: string | null) => void
  setAutoRefresh: (enabled: boolean) => void
  setRefreshInterval: (interval: number) => void
  addBookmark: (name: string) => void
  deleteBookmark: (id: string) => void
}

export const useGeoIntelligenceStore = create<GeoIntelligenceState>((set, get) => ({
  enabledLayers: [],
  features: createLayerRecord<GeoFeature[]>([]),
  isLoading: createLayerRecord(false),
  lastUpdated: createLayerRecord<string | null>(null),
  error: createLayerRecord<string | null>(null),
  center: [126.978, 37.566],
  zoom: 3,
  selectedFeatureId: null,
  bookmarks: [],
  autoRefresh: false,
  refreshInterval: 60,

  hydrate: async () => {
    try {
      const { db } = await import('@/shared/lib/db')
      const bookmarks = await db.geoBookmarks.toArray()
      set({ bookmarks })
    } catch (error) {
      console.error('Failed to hydrate geo bookmarks:', error)
    }
  },

  toggleLayer: (layer) => {
    const { enabledLayers, fetchLayerData } = get()
    const isEnabled = enabledLayers.includes(layer)

    if (isEnabled) {
      set({
        enabledLayers: enabledLayers.filter((l) => l !== layer),
      })
    } else {
      set({
        enabledLayers: [...enabledLayers, layer],
      })
      fetchLayerData(layer)
    }
  },

  fetchLayerData: async (layer) => {
    set((state) => ({
      isLoading: { ...state.isLoading, [layer]: true },
      error: { ...state.error, [layer]: null },
    }))

    try {
      const features = await geoIntelApi.fetchLayer(layer)
      set((state) => ({
        features: { ...state.features, [layer]: features },
        isLoading: { ...state.isLoading, [layer]: false },
        lastUpdated: { ...state.lastUpdated, [layer]: new Date().toISOString() },
      }))
    } catch (error) {
      const message = error instanceof Error ? error.message : `Failed to fetch ${layer}`
      set((state) => ({
        isLoading: { ...state.isLoading, [layer]: false },
        error: { ...state.error, [layer]: message },
      }))
    }
  },

  refreshAll: async () => {
    const { enabledLayers, fetchLayerData } = get()
    await Promise.all(enabledLayers.map((layer) => fetchLayerData(layer)))
  },

  setCenter: (center) => {
    set({ center })
  },

  setZoom: (zoom) => {
    set({ zoom })
  },

  selectFeature: (id) => {
    set({ selectedFeatureId: id })
  },

  setAutoRefresh: (enabled) => {
    set({ autoRefresh: enabled })
  },

  setRefreshInterval: (interval) => {
    set({ refreshInterval: interval })
  },

  addBookmark: async (name) => {
    const { center, zoom, enabledLayers } = get()
    const bookmark: GeoBookmark = {
      id: `geo-bm-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name,
      center: [...center] as [number, number],
      zoom,
      enabledLayers: [...enabledLayers],
      createdAt: new Date().toISOString(),
    }

    try {
      const { db } = await import('@/shared/lib/db')
      await db.geoBookmarks.add(bookmark)
      set((state) => ({
        bookmarks: [...state.bookmarks, bookmark],
      }))
    } catch (error) {
      console.error('Failed to add geo bookmark:', error)
    }
  },

  deleteBookmark: async (id) => {
    try {
      const { db } = await import('@/shared/lib/db')
      await db.geoBookmarks.delete(id)
      set((state) => ({
        bookmarks: state.bookmarks.filter((b) => b.id !== id),
      }))
    } catch (error) {
      console.error('Failed to delete geo bookmark:', error)
    }
  },
}))
