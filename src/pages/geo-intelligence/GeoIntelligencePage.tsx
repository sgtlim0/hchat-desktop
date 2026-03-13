import { useEffect, useRef } from 'react'
import { RefreshCw, Globe2 } from 'lucide-react'
import { useGeoIntelligenceStore } from '@/entities/geo-intelligence/geo-intelligence.store'
import { useTranslation } from '@/shared/i18n'
import { GeoMap } from '@/widgets/geo-intelligence/GeoMap'
import { LayerPanel } from '@/widgets/geo-intelligence/LayerPanel'

const INTERVAL_OPTIONS = [
  { value: 60, label: '60s' },
  { value: 120, label: '120s' },
  { value: 300, label: '300s' },
] as const

export function GeoIntelligencePage() {
  const { t } = useTranslation()

  const autoRefresh = useGeoIntelligenceStore((s) => s.autoRefresh)
  const refreshInterval = useGeoIntelligenceStore((s) => s.refreshInterval)
  const setAutoRefresh = useGeoIntelligenceStore((s) => s.setAutoRefresh)
  const setRefreshInterval = useGeoIntelligenceStore((s) => s.setRefreshInterval)
  const hydrate = useGeoIntelligenceStore((s) => s.hydrate)
  const refreshAll = useGeoIntelligenceStore((s) => s.refreshAll)

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Hydrate store and fetch initial data on mount
  useEffect(() => {
    const init = async () => {
      await hydrate()
      await refreshAll()
    }
    init()
  }, [hydrate, refreshAll])

  // Auto-refresh timer
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    if (autoRefresh) {
      intervalRef.current = setInterval(() => {
        refreshAll()
      }, refreshInterval * 1000)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [autoRefresh, refreshInterval, refreshAll])

  const handleIntervalChange = (value: string) => {
    const parsed = Number(value)
    if (!Number.isNaN(parsed)) {
      setRefreshInterval(parsed)
    }
  }

  const handleRefreshNow = () => {
    refreshAll()
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-surface border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Globe2 className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-bold text-text-primary">
            {t('geoIntel.title')}
          </h1>
        </div>

        <div className="flex items-center gap-4">
          {/* Auto-refresh toggle */}
          <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-border accent-primary"
            />
            {t('geoIntel.autoRefresh')}
          </label>

          {/* Refresh interval dropdown */}
          <select
            value={refreshInterval}
            onChange={(e) => handleIntervalChange(e.target.value)}
            disabled={!autoRefresh}
            className="text-sm rounded-lg bg-surface-secondary border border-border px-2 py-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={t('geoIntel.refreshInterval')}
          >
            {INTERVAL_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* Refresh now button */}
          <button
            onClick={handleRefreshNow}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-primary text-white hover:bg-primary/90 transition"
          >
            <RefreshCw className="w-4 h-4" />
            {t('geoIntel.refreshNow')}
          </button>
        </div>
      </header>

      {/* Body: LayerPanel (left sidebar) + GeoMap (main area) */}
      <div className="flex-1 flex overflow-hidden">
        <LayerPanel />
        <GeoMap />
      </div>
    </div>
  )
}
