import { MODELS, PROVIDER_COLORS } from '@hchat/shared'

interface ModelSelectorProps {
  value: string
  onChange: (modelId: string) => void
}

export function ModelSelector({ value, onChange }: ModelSelectorProps) {
  const selected = MODELS.find(m => m.id === value)
  const dotColor = selected ? PROVIDER_COLORS[selected.provider] : '#888'

  return (
    <div className="relative flex items-center">
      <span
        className="pointer-events-none absolute left-2 h-2 w-2 rounded-full"
        style={{ backgroundColor: dotColor }}
      />
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full appearance-none rounded-md border border-slate-200 bg-white py-1 pl-6 pr-6 text-xs
          text-slate-700 outline-none transition-colors hover:border-blue-400 focus:border-blue-500
          dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
      >
        {MODELS.map(m => (
          <option key={m.id} value={m.id}>
            {m.shortLabel}
          </option>
        ))}
      </select>
    </div>
  )
}
