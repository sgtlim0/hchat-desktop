import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useGeoIntelligenceStore } from '../geo-intelligence.store'

vi.mock('@/shared/lib/geo-intel-api', () => ({
  geoIntelApi: {
    fetchLayer: vi.fn(),
  },
}))

vi.mock('@/entities/toast/toast.store', () => ({
  useToastStore: {
    getState: vi.fn(() => ({
      addToast: vi.fn(),
    })),
  },
}))

vi.mock('@/shared/lib/db', () => ({
  db: {
    geoBookmarks: {
      toArray: vi.fn().mockResolvedValue([]),
      add: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
    },
  },
}))

const mockCryptoRandomUUID = vi.fn(() => 'test-uuid-1234')
vi.stubGlobal('crypto', { randomUUID: mockCryptoRandomUUID })

import { geoIntelApi } from '@/shared/lib/geo-intel-api'
import { useToastStore } from '@/entities/toast/toast.store'

const INITIAL_STATE = {
  enabledLayers: [],
  features: { flights: [], earthquakes: [], fires: [] },
  isLoading: { flights: false, earthquakes: false, fires: false },
  lastUpdated: { flights: null, earthquakes: null, fires: null },
  error: { flights: null, earthquakes: null, fires: null },
  center: [126.978, 37.566] as [number, number],
  zoom: 3,
  selectedFeatureId: null,
  bookmarks: [],
  autoRefresh: false,
  refreshInterval: 60,
}

const MOCK_FLIGHTS = [
  { id: 'abc123', layerType: 'flights' as const, coordinates: [126.978, 37.566] as [number, number], properties: { callsign: 'KAL001' } },
]

describe('GeoIntelligenceStore', () => {
  beforeEach(() => {
    useGeoIntelligenceStore.setState(INITIAL_STATE)
    vi.clearAllMocks()
  })

  describe('initial state', () => {
    it('should have correct default values', () => {
      const state = useGeoIntelligenceStore.getState()
      expect(state.enabledLayers).toEqual([])
      expect(state.center).toEqual([126.978, 37.566])
      expect(state.zoom).toBe(3)
      expect(state.autoRefresh).toBe(false)
      expect(state.refreshInterval).toBe(60)
      expect(state.selectedFeatureId).toBeNull()
    })

    it('should initialize all layer records with default values', () => {
      const state = useGeoIntelligenceStore.getState()
      expect(state.features.flights).toEqual([])
      expect(state.features.earthquakes).toEqual([])
      expect(state.features.fires).toEqual([])
      expect(state.isLoading.flights).toBe(false)
      expect(state.error.flights).toBeNull()
    })
  })

  describe('toggleLayer', () => {
    it('should enable a layer and trigger fetch', () => {
      vi.mocked(geoIntelApi.fetchLayer).mockResolvedValue(MOCK_FLIGHTS)

      useGeoIntelligenceStore.getState().toggleLayer('flights')

      const state = useGeoIntelligenceStore.getState()
      expect(state.enabledLayers).toContain('flights')
      expect(geoIntelApi.fetchLayer).toHaveBeenCalledWith('flights')
    })

    it('should disable an enabled layer', () => {
      useGeoIntelligenceStore.setState({ enabledLayers: ['flights'] })

      useGeoIntelligenceStore.getState().toggleLayer('flights')

      const state = useGeoIntelligenceStore.getState()
      expect(state.enabledLayers).not.toContain('flights')
    })

    it('should not fetch when disabling a layer', () => {
      useGeoIntelligenceStore.setState({ enabledLayers: ['earthquakes'] })

      useGeoIntelligenceStore.getState().toggleLayer('earthquakes')

      expect(geoIntelApi.fetchLayer).not.toHaveBeenCalled()
    })

    it('should handle multiple layers independently', () => {
      vi.mocked(geoIntelApi.fetchLayer).mockResolvedValue([])

      useGeoIntelligenceStore.getState().toggleLayer('flights')
      useGeoIntelligenceStore.getState().toggleLayer('earthquakes')

      const state = useGeoIntelligenceStore.getState()
      expect(state.enabledLayers).toEqual(['flights', 'earthquakes'])
    })
  })

  describe('fetchLayerData', () => {
    it('should set loading state and fetch data', async () => {
      vi.mocked(geoIntelApi.fetchLayer).mockResolvedValue(MOCK_FLIGHTS)

      await useGeoIntelligenceStore.getState().fetchLayerData('flights')

      const state = useGeoIntelligenceStore.getState()
      expect(state.features.flights).toEqual(MOCK_FLIGHTS)
      expect(state.isLoading.flights).toBe(false)
      expect(state.error.flights).toBeNull()
      expect(state.lastUpdated.flights).toBeTruthy()
    })

    it('should set error state on fetch failure', async () => {
      vi.mocked(geoIntelApi.fetchLayer).mockRejectedValue(new Error('Network error'))

      await useGeoIntelligenceStore.getState().fetchLayerData('earthquakes')

      const state = useGeoIntelligenceStore.getState()
      expect(state.features.earthquakes).toEqual([])
      expect(state.isLoading.earthquakes).toBe(false)
      expect(state.error.earthquakes).toBe('Network error')
    })

    it('should handle non-Error thrown values', async () => {
      vi.mocked(geoIntelApi.fetchLayer).mockRejectedValue('string error')

      await useGeoIntelligenceStore.getState().fetchLayerData('fires')

      const state = useGeoIntelligenceStore.getState()
      expect(state.error.fires).toBe('Failed to fetch fires')
    })

    it('should not affect other layers when fetching one', async () => {
      useGeoIntelligenceStore.setState({
        features: { ...INITIAL_STATE.features, earthquakes: MOCK_FLIGHTS },
      })
      vi.mocked(geoIntelApi.fetchLayer).mockResolvedValue([])

      await useGeoIntelligenceStore.getState().fetchLayerData('flights')

      const state = useGeoIntelligenceStore.getState()
      expect(state.features.flights).toEqual([])
      expect(state.features.earthquakes).toEqual(MOCK_FLIGHTS)
    })
  })

  describe('refreshAll', () => {
    it('should fetch all enabled layers in parallel', async () => {
      useGeoIntelligenceStore.setState({ enabledLayers: ['flights', 'earthquakes'] })
      vi.mocked(geoIntelApi.fetchLayer).mockResolvedValue([])

      await useGeoIntelligenceStore.getState().refreshAll()

      expect(geoIntelApi.fetchLayer).toHaveBeenCalledTimes(2)
    })

    it('should not fetch disabled layers', async () => {
      useGeoIntelligenceStore.setState({ enabledLayers: ['flights'] })
      vi.mocked(geoIntelApi.fetchLayer).mockResolvedValue([])

      await useGeoIntelligenceStore.getState().refreshAll()

      expect(geoIntelApi.fetchLayer).toHaveBeenCalledTimes(1)
      expect(geoIntelApi.fetchLayer).toHaveBeenCalledWith('flights')
    })

    it('should do nothing when no layers are enabled', async () => {
      await useGeoIntelligenceStore.getState().refreshAll()

      expect(geoIntelApi.fetchLayer).not.toHaveBeenCalled()
    })
  })

  describe('map state', () => {
    it('should update center', () => {
      useGeoIntelligenceStore.getState().setCenter([127.0, 38.0])

      expect(useGeoIntelligenceStore.getState().center).toEqual([127.0, 38.0])
    })

    it('should update zoom', () => {
      useGeoIntelligenceStore.getState().setZoom(10)

      expect(useGeoIntelligenceStore.getState().zoom).toBe(10)
    })

    it('should select feature', () => {
      useGeoIntelligenceStore.getState().selectFeature('abc123')

      expect(useGeoIntelligenceStore.getState().selectedFeatureId).toBe('abc123')
    })

    it('should deselect feature with null', () => {
      useGeoIntelligenceStore.setState({ selectedFeatureId: 'abc123' })

      useGeoIntelligenceStore.getState().selectFeature(null)

      expect(useGeoIntelligenceStore.getState().selectedFeatureId).toBeNull()
    })
  })

  describe('auto-refresh', () => {
    it('should toggle auto-refresh', () => {
      useGeoIntelligenceStore.getState().setAutoRefresh(true)
      expect(useGeoIntelligenceStore.getState().autoRefresh).toBe(true)

      useGeoIntelligenceStore.getState().setAutoRefresh(false)
      expect(useGeoIntelligenceStore.getState().autoRefresh).toBe(false)
    })

    it('should set refresh interval', () => {
      useGeoIntelligenceStore.getState().setRefreshInterval(300)
      expect(useGeoIntelligenceStore.getState().refreshInterval).toBe(300)
    })
  })

  describe('hydrate', () => {
    it('should load bookmarks from IndexedDB', async () => {
      const mockBookmarks = [
        { id: 'bm-1', name: 'Seoul', center: [126.978, 37.566], zoom: 10, enabledLayers: ['flights'], createdAt: '2026-01-01T00:00:00Z' },
      ]
      const { db } = await import('@/shared/lib/db')
      vi.mocked(db.geoBookmarks.toArray).mockResolvedValue(mockBookmarks as never)

      await useGeoIntelligenceStore.getState().hydrate()

      expect(useGeoIntelligenceStore.getState().bookmarks).toEqual(mockBookmarks)
    })

    it('should show toast on hydration error', async () => {
      const { db } = await import('@/shared/lib/db')
      vi.mocked(db.geoBookmarks.toArray).mockRejectedValue(new Error('DB error'))
      const mockAddToast = vi.fn()
      vi.mocked(useToastStore.getState).mockReturnValue({ addToast: mockAddToast } as never)

      await useGeoIntelligenceStore.getState().hydrate()

      expect(mockAddToast).toHaveBeenCalledWith({ type: 'error', message: 'Failed to load geo bookmarks' })
    })
  })

  describe('bookmarks', () => {
    it('should add bookmark with crypto.randomUUID', async () => {
      useGeoIntelligenceStore.setState({
        center: [127.0, 37.5],
        zoom: 8,
        enabledLayers: ['flights', 'fires'],
      })

      await useGeoIntelligenceStore.getState().addBookmark('Test Bookmark')

      const state = useGeoIntelligenceStore.getState()
      expect(state.bookmarks).toHaveLength(1)
      expect(state.bookmarks[0].id).toBe('geo-bm-test-uuid-1234')
      expect(state.bookmarks[0].name).toBe('Test Bookmark')
      expect(state.bookmarks[0].center).toEqual([127.0, 37.5])
      expect(state.bookmarks[0].zoom).toBe(8)
      expect(state.bookmarks[0].enabledLayers).toEqual(['flights', 'fires'])
    })

    it('should persist bookmark to IndexedDB', async () => {
      const { db } = await import('@/shared/lib/db')

      await useGeoIntelligenceStore.getState().addBookmark('My Place')

      expect(db.geoBookmarks.add).toHaveBeenCalledTimes(1)
    })

    it('should show toast on add bookmark error', async () => {
      const { db } = await import('@/shared/lib/db')
      vi.mocked(db.geoBookmarks.add).mockRejectedValue(new Error('Write error'))
      const mockAddToast = vi.fn()
      vi.mocked(useToastStore.getState).mockReturnValue({ addToast: mockAddToast } as never)

      await useGeoIntelligenceStore.getState().addBookmark('Fail Bookmark')

      expect(mockAddToast).toHaveBeenCalledWith({ type: 'error', message: 'Failed to save bookmark' })
    })

    it('should delete bookmark from state and IndexedDB', async () => {
      useGeoIntelligenceStore.setState({
        bookmarks: [
          { id: 'bm-1', name: 'A', center: [0, 0], zoom: 3, enabledLayers: [], createdAt: '' },
          { id: 'bm-2', name: 'B', center: [0, 0], zoom: 3, enabledLayers: [], createdAt: '' },
        ],
      })
      const { db } = await import('@/shared/lib/db')

      await useGeoIntelligenceStore.getState().deleteBookmark('bm-1')

      const state = useGeoIntelligenceStore.getState()
      expect(state.bookmarks).toHaveLength(1)
      expect(state.bookmarks[0].id).toBe('bm-2')
      expect(db.geoBookmarks.delete).toHaveBeenCalledWith('bm-1')
    })

    it('should show toast on delete bookmark error', async () => {
      useGeoIntelligenceStore.setState({
        bookmarks: [{ id: 'bm-1', name: 'A', center: [0, 0], zoom: 3, enabledLayers: [], createdAt: '' }],
      })
      const { db } = await import('@/shared/lib/db')
      vi.mocked(db.geoBookmarks.delete).mockRejectedValue(new Error('Delete error'))
      const mockAddToast = vi.fn()
      vi.mocked(useToastStore.getState).mockReturnValue({ addToast: mockAddToast } as never)

      await useGeoIntelligenceStore.getState().deleteBookmark('bm-1')

      expect(mockAddToast).toHaveBeenCalledWith({ type: 'error', message: 'Failed to delete bookmark' })
    })
  })
})
