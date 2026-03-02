import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import { useSettingsStore } from '@/entities/settings/settings.store'
import { MODELS, PROVIDER_COLORS, PROVIDER_LABELS } from '@/shared/constants'
import { getModelShortName } from '@/shared/lib/model-meta'
import type { ProviderType } from '@/shared/types'

const PROVIDER_ORDER: ProviderType[] = ['bedrock', 'openai', 'gemini']

export function ModelSelector() {
  const selectedModel = useSettingsStore((s) => s.selectedModel)
  const setSelectedModel = useSettingsStore((s) => s.setSelectedModel)
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  const currentModel = MODELS.find((m) => m.id === selectedModel)
  const displayName = getModelShortName(selectedModel)
  const providerColor = currentModel ? PROVIDER_COLORS[currentModel.provider] : undefined

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border-input hover:bg-hover transition text-xs font-medium"
      >
        {providerColor && (
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: providerColor }}
          />
        )}
        <span>{displayName}</span>
        <ChevronDown size={14} className="text-text-tertiary" />
      </button>

      {isOpen && (
        <div className="absolute bottom-full mb-2 right-0 bg-card border border-border rounded-lg shadow-lg py-1 min-w-[240px] z-50 animate-fade-in">
          {PROVIDER_ORDER.map((provider) => {
            const providerModels = MODELS.filter((m) => m.provider === provider)
            if (providerModels.length === 0) return null

            return (
              <div key={provider}>
                <div className="px-3 py-1.5 text-[11px] font-semibold text-text-tertiary uppercase tracking-wide flex items-center gap-1.5">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: PROVIDER_COLORS[provider] }}
                  />
                  {PROVIDER_LABELS[provider]}
                </div>
                {providerModels.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => {
                      setSelectedModel(model.id)
                      setIsOpen(false)
                    }}
                    className={`w-full px-3 py-2 text-left hover:bg-hover transition ${
                      selectedModel === model.id ? 'bg-hover' : ''
                    }`}
                  >
                    <div className="text-sm font-medium">{model.label}</div>
                    <div className="text-xs text-text-tertiary">
                      {model.capabilities.join(' · ')}
                    </div>
                  </button>
                ))}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
