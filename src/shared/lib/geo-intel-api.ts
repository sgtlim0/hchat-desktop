import type { GeoLayerType, GeoFeature } from '@/shared/types'

const API_BASE = import.meta.env.VITE_API_BASE_URL || ''

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

    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to fetch ${layer}: ${response.status}`)
    }

    return response.json()
  },
}
