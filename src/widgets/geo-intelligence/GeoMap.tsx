import { useEffect, useRef, useState } from 'react'
import { AlertCircle, Loader2 } from 'lucide-react'
import { useGeoIntelligenceStore } from '@/entities/geo-intelligence/geo-intelligence.store'
import { useTranslation } from '@/shared/i18n'
import type { GeoLayerType, GeoFeature } from '@/shared/types'
import type { Map as MapLibreMapType, GeoJSONSource as MapLibreGeoJSONSource } from 'maplibre-gl'

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

interface LayerHandler {
  layer: string
  event: string
  handler: (...args: unknown[]) => void
}

export function GeoMap() {
  const { t } = useTranslation()
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapLibreMapType | null>(null)
  const handlersRef = useRef<LayerHandler[]>([])
  const [mapLoaded, setMapLoaded] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)

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

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const clickHandler = (e: any) => {
              const feature = e.features?.[0]
              if (feature?.properties?.id) {
                selectFeature(String(feature.properties.id))
              }
            }
            const mouseenterHandler = () => {
              map.getCanvas().style.cursor = 'pointer'
            }
            const mouseleaveHandler = () => {
              map.getCanvas().style.cursor = ''
            }

            map.on('click', layer, clickHandler)
            map.on('mouseenter', layer, mouseenterHandler)
            map.on('mouseleave', layer, mouseleaveHandler)

            handlersRef.current.push(
              { layer, event: 'click', handler: clickHandler },
              { layer, event: 'mouseenter', handler: mouseenterHandler },
              { layer, event: 'mouseleave', handler: mouseleaveHandler },
            )
          }

          setMapLoaded(true)
        })

        map.on('moveend', () => {
          const mapCenter = map.getCenter()
          setCenter([mapCenter.lng, mapCenter.lat])
          setZoom(map.getZoom())
        })

        mapRef.current = map
      } catch (error) {
        if (mounted) {
          const message = error instanceof Error ? error.message : 'Failed to load map'
          setMapError(message)
        }
      }
    }

    initMap()

    return () => {
      mounted = false
      if (mapRef.current) {
        handlersRef.current.forEach(({ layer, event, handler }) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ;(mapRef.current as any)?.off(event, layer, handler)
        })
        handlersRef.current = []
        mapRef.current.remove()
        mapRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Update source data when features or enabled layers change
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return

    for (const layer of LAYER_TYPES) {
      const source = mapRef.current.getSource(layer) as MapLibreGeoJSONSource | undefined
      if (!source) continue

      const isEnabled = enabledLayers.includes(layer)
      const layerFeatures = isEnabled ? features[layer] : []
      source.setData(toGeoJSON(layerFeatures))

      const visibility = isEnabled ? 'visible' : 'none'
      if (mapRef.current.getLayer(layer)) {
        mapRef.current.setLayoutProperty(layer, 'visibility', visibility)
      }
    }
  }, [features, enabledLayers, mapLoaded])

  if (mapError) {
    return (
      <div className="flex-1 flex items-center justify-center bg-surface">
        <div className="flex flex-col items-center gap-3 text-text-secondary">
          <AlertCircle className="w-8 h-8 text-red-500" />
          <p className="text-sm font-medium">{t('geoIntel.error')}</p>
          <p className="text-xs text-text-tertiary max-w-64 text-center">{mapError}</p>
          <button
            onClick={() => {
              setMapError(null)
              setMapLoaded(false)
            }}
            className="px-4 py-1.5 text-sm rounded-lg bg-primary text-white hover:bg-primary/90 transition"
          >
            {t('geoIntel.refreshNow')}
          </button>
        </div>
      </div>
    )
  }

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
