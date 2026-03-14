import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { geoIntelApi } from '../geo-intel-api'

global.fetch = vi.fn()

function mockFetchResponse(data: unknown, status = 200) {
  vi.mocked(global.fetch).mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(data),
  } as unknown as Response)
}

function mockFetchError(error: Error) {
  vi.mocked(global.fetch).mockRejectedValue(error)
}

const MOCK_FEATURES = [
  { id: 'f1', layerType: 'flights', coordinates: [126.978, 37.566], properties: { callsign: 'KAL001' } },
  { id: 'f2', layerType: 'flights', coordinates: [127.0, 37.5], properties: { callsign: 'AAR202' } },
]

describe('geoIntelApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('fetchLayer', () => {
    it('should fetch and return features array from response', async () => {
      mockFetchResponse({ type: 'flights', count: 2, features: MOCK_FEATURES })

      const result = await geoIntelApi.fetchLayer('flights')

      expect(result).toEqual(MOCK_FEATURES)
      expect(global.fetch).toHaveBeenCalledTimes(1)
      expect(vi.mocked(global.fetch).mock.calls[0][0]).toContain('/api/geo/flights')
    })

    it('should append bounds query parameter when provided', async () => {
      mockFetchResponse({ type: 'flights', count: 0, features: [] })

      await geoIntelApi.fetchLayer('flights', [126, 37, 128, 38])

      const url = vi.mocked(global.fetch).mock.calls[0][0] as string
      expect(url).toContain('bounds=126%2C37%2C128%2C38')
    })

    it('should work without bounds parameter', async () => {
      mockFetchResponse({ type: 'earthquakes', count: 0, features: [] })

      await geoIntelApi.fetchLayer('earthquakes')

      const url = vi.mocked(global.fetch).mock.calls[0][0] as string
      expect(url).toContain('/api/geo/earthquakes')
      expect(url).not.toContain('bounds')
    })

    it('should throw on HTTP error status', async () => {
      mockFetchResponse({ error: 'not found' }, 404)

      await expect(geoIntelApi.fetchLayer('flights')).rejects.toThrow('Failed to fetch flights: 404')
    })

    it('should throw on HTTP 500 server error', async () => {
      mockFetchResponse({ error: 'internal' }, 500)

      await expect(geoIntelApi.fetchLayer('fires')).rejects.toThrow('Failed to fetch fires: 500')
    })

    it('should throw on invalid response format (missing features)', async () => {
      mockFetchResponse({ type: 'flights', count: 0 })

      await expect(geoIntelApi.fetchLayer('flights')).rejects.toThrow('Invalid response format from flights API')
    })

    it('should throw on invalid response format (features not array)', async () => {
      mockFetchResponse({ type: 'flights', features: 'not-array' })

      await expect(geoIntelApi.fetchLayer('flights')).rejects.toThrow('Invalid response format from flights API')
    })

    it('should throw timeout error when request is aborted', async () => {
      const abortError = new Error('The operation was aborted')
      abortError.name = 'AbortError'
      mockFetchError(abortError)

      await expect(geoIntelApi.fetchLayer('earthquakes')).rejects.toThrow('Request timeout for earthquakes')
    })

    it('should re-throw network errors', async () => {
      mockFetchError(new TypeError('Failed to fetch'))

      await expect(geoIntelApi.fetchLayer('fires')).rejects.toThrow('Failed to fetch')
    })

    it('should pass AbortSignal to fetch', async () => {
      mockFetchResponse({ type: 'flights', count: 0, features: [] })

      await geoIntelApi.fetchLayer('flights')

      const fetchOptions = vi.mocked(global.fetch).mock.calls[0][1] as RequestInit
      expect(fetchOptions.signal).toBeInstanceOf(AbortSignal)
    })

    it('should handle empty features array', async () => {
      mockFetchResponse({ type: 'earthquakes', count: 0, features: [] })

      const result = await geoIntelApi.fetchLayer('earthquakes')
      expect(result).toEqual([])
    })

    it('should handle response with error field but valid features', async () => {
      mockFetchResponse({ type: 'fires', count: 0, features: [], error: 'FIRMS_MAP_KEY not configured' })

      const result = await geoIntelApi.fetchLayer('fires')
      expect(result).toEqual([])
    })
  })
})
