import { MODELS, PROVIDER_COLORS } from '@hchat/shared'
import type { ProviderType } from '@hchat/shared/types'
import { useExtSettingsStore } from '@ext/stores/settings.store'

export function ExtModelSelector() {
  const selectedModel = useExtSettingsStore((s) => s.selectedModel)
  const updateSettings = useExtSettingsStore((s) => s.updateSettings)

  const modelDef = MODELS.find((m) => m.id === selectedModel)
  const providerColor = modelDef
    ? PROVIDER_COLORS[modelDef.provider as ProviderType]
    : '#999'

  return (
    <div className="flex items-center gap-1.5">
      <span
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ backgroundColor: providerColor }}
      />
      <select
        value={selectedModel}
        onChange={(e) => updateSettings({ selectedModel: e.target.value })}
        className="text-xs bg-transparent border-none outline-none cursor-pointer text-[var(--text-primary)] pr-1"
      >
        <optgroup label="AWS Bedrock">
          {MODELS.filter((m) => m.provider === 'bedrock').map((m) => (
            <option key={m.id} value={m.id}>{m.shortLabel}</option>
          ))}
        </optgroup>
        <optgroup label="OpenAI">
          {MODELS.filter((m) => m.provider === 'openai').map((m) => (
            <option key={m.id} value={m.id}>{m.shortLabel}</option>
          ))}
        </optgroup>
        <optgroup label="Google Gemini">
          {MODELS.filter((m) => m.provider === 'gemini').map((m) => (
            <option key={m.id} value={m.id}>{m.shortLabel}</option>
          ))}
        </optgroup>
      </select>
    </div>
  )
}
