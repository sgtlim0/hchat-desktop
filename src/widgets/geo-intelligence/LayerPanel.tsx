import { Plane, Activity, Flame, Loader2 } from 'lucide-react'
import { useGeoIntelligenceStore } from '@/entities/geo-intelligence/geo-intelligence.store'
import { useTranslation } from '@/shared/i18n'
import type { GeoLayerType } from '@/shared/types'

const LAYER_CONFIG: {
  type: GeoLayerType
  icon: typeof Plane
  color: string
  labelKey: string
}[] = [
  { type: 'flights', icon: Plane, color: '#3b82f6', labelKey: 'geoIntel.flights' },
  { type: 'earthquakes', icon: Activity, color: '#ef4444', labelKey: 'geoIntel.earthquakes' },
  { type: 'fires', icon: Flame, color: '#f97316', labelKey: 'geoIntel.fires' },
]

function formatLastUpdated(iso: string | null): string {
  if (!iso) return '-'
  try {
    const date = new Date(iso)
    return date.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  } catch {
    return '-'
  }
}

export function LayerPanel() {
  const { t } = useTranslation()

  const enabledLayers = useGeoIntelligenceStore((s) => s.enabledLayers)
  const features = useGeoIntelligenceStore((s) => s.features)
  const isLoading = useGeoIntelligenceStore((s) => s.isLoading)
  const lastUpdated = useGeoIntelligenceStore((s) => s.lastUpdated)
  const error = useGeoIntelligenceStore((s) => s.error)
  const toggleLayer = useGeoIntelligenceStore((s) => s.toggleLayer)

  return (
    <aside className="w-72 bg-surface border-r border-border p-4 overflow-y-auto">
      <h2 className="text-sm font-semibold text-text-primary mb-3">
        {t('geoIntel.layers')}
      </h2>

      <div className="space-y-2">
        {LAYER_CONFIG.map(({ type, icon: Icon, color, labelKey }) => {
          const isEnabled = enabledLayers.includes(type)
          const layerLoading = isLoading[type]
          const layerError = error[type]
          const featureCount = features[type].length
          const updated = lastUpdated[type]

          return (
            <div
              key={type}
              className="p-3 rounded-lg border border-border hover:bg-hover transition"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <Icon className="w-4 h-4 text-text-secondary" />
                  <span className="text-sm font-medium text-text-primary">
                    {t(labelKey as any)}
                  </span>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isEnabled}
                    onChange={() => toggleLayer(type)}
                    className="sr-only peer"
                    aria-label={
                      isEnabled
                        ? t('geoIntel.disableLayer')
                        : t('geoIntel.enableLayer')
                    }
                  />
                  <div className="w-9 h-5 bg-zinc-300 dark:bg-zinc-600 peer-focus:ring-2 peer-focus:ring-primary/30 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary" />
                </label>
              </div>

              {/* Status line */}
              <div className="mt-2 text-xs text-text-tertiary">
                {layerLoading ? (
                  <span className="flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    {t('geoIntel.loading')}
                  </span>
                ) : layerError ? (
                  <span className="text-red-500">{layerError}</span>
                ) : isEnabled ? (
                  <span className="flex items-center justify-between">
                    <span>{t('geoIntel.featureCount', { count: featureCount })}</span>
                    <span>
                      {t('geoIntel.lastUpdated')}: {formatLastUpdated(updated)}
                    </span>
                  </span>
                ) : (
                  <span>{t('geoIntel.noData')}</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </aside>
  )
}
