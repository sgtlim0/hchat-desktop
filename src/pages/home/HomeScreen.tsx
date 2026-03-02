import { useState, useMemo } from 'react'
import { Settings } from 'lucide-react'
import { PromptInput } from '@/widgets/prompt-input/PromptInput'
import { AssistantCard } from '@/shared/ui/AssistantCard'
import {
  ASSISTANT_PRESETS,
  ASSISTANT_CATEGORIES,
  type AssistantCategory,
  type AssistantPreset,
} from '@/shared/constants/assistants'
import { MODELS, PROVIDER_COLORS } from '@/shared/constants'
import { useSessionStore } from '@/entities/session/session.store'
import { useSettingsStore } from '@/entities/settings/settings.store'
import { usePersonaStore } from '@/entities/persona/persona.store'
import { useTranslation } from '@/shared/i18n'
import type { TranslationKey } from '@/shared/i18n'

type Tab = 'official' | 'custom'

export function HomeScreen() {
  const { t } = useTranslation()
  const credentials = useSettingsStore((s) => s.credentials)
  const setSettingsOpen = useSettingsStore((s) => s.setSettingsOpen)
  const setSettingsTab = useSettingsStore((s) => s.setSettingsTab)
  const personas = usePersonaStore((s) => s.personas)

  const [tab, setTab] = useState<Tab>('official')
  const [category, setCategory] = useState<AssistantCategory>('all')

  const hasCredentials = Boolean(credentials?.accessKeyId && credentials?.secretAccessKey)

  const customPersonas = useMemo(
    () => personas.filter((p) => !p.isDefault),
    [personas],
  )

  const filteredPresets = useMemo(
    () =>
      category === 'all'
        ? ASSISTANT_PRESETS
        : ASSISTANT_PRESETS.filter((p) => p.category === category),
    [category],
  )

  function handleSend(_message: string) {
    // Message handling is done in PromptInput
  }

  function handleAssistantClick(preset: AssistantPreset) {
    const { createSession, setPendingPrompt } = useSessionStore.getState()
    const { setSelectedModel } = useSettingsStore.getState()
    setSelectedModel(preset.modelId)
    setPendingPrompt(null)
    createSession(t(preset.titleKey as TranslationKey))
  }

  function handlePersonaClick(persona: { id: string; name: string; systemPrompt: string }) {
    const { createSession } = useSessionStore.getState()
    const { setActivePersona } = usePersonaStore.getState()
    setActivePersona(persona.id)
    createSession(persona.name)
  }

  function handleOpenSettings() {
    setSettingsTab('api-keys')
    setSettingsOpen(true)
  }

  return (
    <div className="h-full flex flex-col overflow-y-auto px-4 sm:px-6">
      <div className="w-full max-w-3xl mx-auto py-8 space-y-6">
        {/* Credentials missing banner */}
        {!hasCredentials && (
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4 flex items-center gap-3">
            <Settings size={20} className="text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                {t('home.credentialsMissing')}
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                {t('home.credentialsHint')}
              </p>
            </div>
            <button
              onClick={handleOpenSettings}
              className="text-xs font-medium text-amber-700 dark:text-amber-300 hover:underline flex-shrink-0"
            >
              {t('home.configure')}
            </button>
          </div>
        )}

        {/* Hero */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
              <div className="w-7 h-7 rounded-full bg-primary" />
            </div>
          </div>
          <p className="text-sm text-text-secondary">{t('home.heading')}</p>
        </div>

        {/* Prompt input */}
        <div>
          <PromptInput onSend={handleSend} placeholder={t('home.placeholder')} />
        </div>

        {/* Tab toggle */}
        <div className="flex items-center gap-1 border-b border-border">
          <TabButton active={tab === 'official'} onClick={() => { setTab('official'); setCategory('all') }}>
            {t('assistant.tab.official')}
          </TabButton>
          <TabButton active={tab === 'custom'} onClick={() => setTab('custom')}>
            {t('assistant.tab.custom')}
          </TabButton>
        </div>

        {/* Category filter (official tab only) */}
        {tab === 'official' && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {ASSISTANT_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  category === cat.id
                    ? 'bg-primary text-white'
                    : 'bg-hover text-text-secondary hover:text-text-primary'
                }`}
              >
                {t(cat.labelKey as TranslationKey)}
              </button>
            ))}
          </div>
        )}

        {/* Card grid */}
        {tab === 'official' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredPresets.map((preset) => {
              const model = MODELS.find((m) => m.id === preset.modelId)
              return (
                <AssistantCard
                  key={preset.id}
                  icon={preset.icon}
                  title={t(preset.titleKey as TranslationKey)}
                  description={t(preset.descKey as TranslationKey)}
                  modelLabel={model?.shortLabel ?? preset.modelId}
                  providerColor={PROVIDER_COLORS[preset.provider]}
                  onClick={() => handleAssistantClick(preset)}
                />
              )
            })}
          </div>
        ) : (
          <>
            {customPersonas.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {customPersonas.map((persona) => (
                  <AssistantCard
                    key={persona.id}
                    icon={persona.icon ?? 'Bot'}
                    title={persona.name}
                    description={persona.description}
                    modelLabel=""
                    providerColor="#6B7280"
                    onClick={() => handlePersonaClick(persona)}
                  />
                ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <p className="text-sm text-text-secondary">{t('assistant.empty')}</p>
                <p className="mt-1 text-xs text-text-tertiary">{t('assistant.createHint')}</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium transition border-b-2 ${
        active
          ? 'border-primary text-primary'
          : 'border-transparent text-text-secondary hover:text-text-primary'
      }`}
    >
      {children}
    </button>
  )
}
