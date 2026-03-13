import { useEffect, useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useGeoIntelligenceStore } from '@/entities/geo-intelligence/geo-intelligence.store'
import type { GeoLayerType, GeoFeature } from '@/shared/types'

const LAYER_COLORS: Record<GeoLayerType, string> = {
  flights: '#3b82f6',
  earthquakes: '#ef4444',
  fires: '#f97316',
}

const LAYER_RADIUS: Record<GeoLayerType, number> = {
  flights: 4,
  earthquakes: 6,
  fires: 5,
}

function toGeoJSON(features: GeoFeature[]): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: features.map((f) => ({
      type: 'Feature' as const,
      geometry: {
        type: 'Point' as const,
        coordinates: f.coordinates,
      },
      properties: {
        id: f.id,
        layerType: f.layerType,
        ...f.properties,
      },
    })),
  }
}

const LAYER_TYPES: GeoLayerType[] = ['flights', 'earthquakes', 'fires']

export function GeoMap() {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const [mapLoaded, setMapLoaded] = useState(false)

  const center = useGeoIntelligenceStore((s) => s.center)
  const zoom = useGeoIntelligenceStore((s) => s.zoom)
  const features = useGeoIntelligenceStore((s) => s.features)
  const enabledLayers = useGeoIntelligenceStore((s) => s.enabledLayers)
  const setCenter = useGeoIntelligenceStore((s) => s.setCenter)
  const setZoom = useGeoIntelligenceStore((s) => s.setZoom)
  const selectFeature = useGeoIntelligenceStore((s) => s.selectFeature)

  // Initialize MapLibre GL (lazy import)
  useEffect(() => {
    if (!containerRef.current) return
    let mounted = true

    const initMap = async () => {
      try {
        const maplibregl = await import('maplibre-gl')
        await import('maplibre-gl/dist/maplibre-gl.css')

        if (!mounted || !containerRef.current) return

        const map = new maplibregl.default.Map({
          container: containerRef.current,
          style: {
            version: 8,
            sources: {
              osm: {
                type: 'raster',
                tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
                tileSize: 256,
                attribution: '&copy; OpenStreetMap contributors',
              },
            },
            layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
          },
          center,
          zoom,
        })

        map.on('load', () => {
          if (!mounted) return

          // Add empty GeoJSON sources for each layer type
          for (const layer of LAYER_TYPES) {
            map.addSource(layer, {
              type: 'geojson',
              data: { type: 'FeatureCollection', features: [] },
            })

            map.addLayer({
              id: layer,
              type: 'circle',
              source: layer,
              paint: {
                'circle-color': LAYER_COLORS[layer],
                'circle-radius': LAYER_RADIUS[layer],
                'circle-stroke-width': 1,
                'circle-stroke-color': '#ffffff',
                'circle-opacity': 0.85,
              },
            })

            // Click handler for feature selection
            map.on('click', layer, (e: any) => {
              const feature = e.features?.[0]
              if (feature?.properties?.id) {
                selectFeature(feature.properties.id)
              }
            })

            // Pointer cursor on hover
            map.on('mouseenter', layer, () => {
              map.getCanvas().style.cursor = 'pointer'
            })
            map.on('mouseleave', layer, () => {
              map.getCanvas().style.cursor = ''
            })
          }

          setMapLoaded(true)
        })

        // Sync center/zoom back to store on move end
        map.on('moveend', () => {
          const mapCenter = map.getCenter()
          setCenter([mapCenter.lng, mapCenter.lat])
          setZoom(map.getZoom())
        })

        mapRef.current = map
      } catch (error) {
        console.error('Failed to initialize MapLibre GL:', error)
      }
    }

    initMap()

    return () => {
      mounted = false
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
    // Only run on mount/unmount — center/zoom handled via moveend
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Update source data when features or enabled layers change
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return

    for (const layer of LAYER_TYPES) {
      const source = mapRef.current.getSource(layer)
      if (!source) continue

      const isEnabled = enabledLayers.includes(layer)
      const layerFeatures = isEnabled ? features[layer] : []
      source.setData(toGeoJSON(layerFeatures))

      // Toggle layer visibility
      const visibility = isEnabled ? 'visible' : 'none'
      if (mapRef.current.getLayer(layer)) {
        mapRef.current.setLayoutProperty(layer, 'visibility', visibility)
      }
    }
  }, [features, enabledLayers, mapLoaded])

  if (!mapLoaded && !mapRef.current) {
    return (
      <div className="flex-1 flex items-center justify-center bg-surface">
        <div className="flex flex-col items-center gap-2 text-text-secondary">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="text-sm">Loading map...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 relative">
      <div ref={containerRef} className="w-full h-full" />
    </div>
  )
}
