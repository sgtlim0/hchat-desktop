import { MODELS } from '@hchat/shared'

const BEDROCK_MODELS = MODELS.filter(m => m.provider === 'bedrock')

interface ModelSelectorProps {
  value: string
  onChange: (modelId: string) => void
}

export function ModelSelector({ value, onChange }: ModelSelectorProps) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full appearance-none rounded-md border border-slate-200 bg-white py-1 px-3 pr-6 text-xs
        text-slate-700 outline-none transition-colors hover:border-blue-400 focus:border-blue-500
        dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
    >
      {BEDROCK_MODELS.map(m => (
        <option key={m.id} value={m.id}>
          {m.shortLabel}
        </option>
      ))}
    </select>
  )
}
