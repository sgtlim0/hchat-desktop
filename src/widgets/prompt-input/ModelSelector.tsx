import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import { useSettingsStore } from '@/entities/settings/settings.store'
import { MODELS } from '@/shared/constants'
import { getModelName } from '@/shared/lib/model-meta'

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

  const currentModelName = getModelName(selectedModel)
    .replace('Claude 4 ', '')
    .replace('Claude 3.5 ', '')

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border-input hover:bg-hover transition text-xs font-medium"
      >
        <span>{currentModelName}</span>
        <ChevronDown size={14} className="text-text-tertiary" />
      </button>

      {isOpen && (
        <div className="absolute bottom-full mb-2 right-0 bg-card border border-border rounded-lg shadow-lg py-1 min-w-[200px] z-50 animate-fade-in">
          {MODELS.map((model) => (
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
              <div className="text-sm font-medium">{model.name}</div>
              <div className="text-xs text-text-tertiary">{model.description}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
