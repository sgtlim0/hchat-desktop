import type { GeoLayerType, GeoFeature } from '@/shared/types'

const API_BASE = import.meta.env.VITE_API_BASE_URL || ''
const REQUEST_TIMEOUT = 30000

export const geoIntelApi = {
  async fetchLayer(
    layer: GeoLayerType,
    bounds?: [number, number, number, number],
  ): Promise<GeoFeature[]> {
    const params = new URLSearchParams()
    if (bounds) {
      params.set('bounds', bounds.join(','))
    }

    const query = params.toString()
    const url = `${API_BASE}/api/geo/${layer}${query ? `?${query}` : ''}`

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT)

    try {
      const response = await fetch(url, { signal: controller.signal })
      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`Failed to fetch ${layer}: ${response.status}`)
      }

      const data = await response.json()
      if (!data.features || !Array.isArray(data.features)) {
        throw new Error(`Invalid response format from ${layer} API`)
      }

      return data.features as GeoFeature[]
    } catch (error) {
      clearTimeout(timeoutId)
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Request timeout for ${layer}`)
      }
      throw error
    }
  },
}
