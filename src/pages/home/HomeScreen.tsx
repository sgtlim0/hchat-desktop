import { Settings } from 'lucide-react'
import { PromptInput } from '@/widgets/prompt-input/PromptInput'
import { QuickActionChip } from '@/shared/ui/QuickActionChip'
import { QUICK_ACTIONS } from '@/shared/constants'
import { useSessionStore } from '@/entities/session/session.store'
import { useSettingsStore } from '@/entities/settings/settings.store'
import { Pencil, FileText, Languages, Lightbulb, SearchCode } from 'lucide-react'
import { useTranslation } from '@/shared/i18n'
import type { TranslationKey } from '@/shared/i18n'

const iconMap = {
  pencil: Pencil,
  'file-text': FileText,
  languages: Languages,
  lightbulb: Lightbulb,
  'search-code': SearchCode,
}

export function HomeScreen() {
  const { t } = useTranslation()
  const credentials = useSettingsStore((s) => s.credentials)
  const setSettingsOpen = useSettingsStore((s) => s.setSettingsOpen)
  const setSettingsTab = useSettingsStore((s) => s.setSettingsTab)

  const hasCredentials = Boolean(credentials?.accessKeyId && credentials?.secretAccessKey)

  function handleSend(_message: string) {
    // Message handling is done in PromptInput
  }

  function handleQuickAction(actionId: string) {
    const promptKey = `quickAction.prompt.${actionId}` as TranslationKey
    const prompt = t(promptKey)
    const { createSession, setPendingPrompt } = useSessionStore.getState()
    setPendingPrompt(prompt)
    createSession()
  }

  function handleOpenSettings() {
    setSettingsTab('api-keys')
    setSettingsOpen(true)
  }

  return (
    <div className="h-full flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-3xl space-y-8">
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

        {/* Heading with icon */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <div className="w-8 h-8 rounded-full bg-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-semibold text-text-primary">
            {t('home.heading')}
          </h1>
        </div>

        {/* Prompt input */}
        <div>
          <PromptInput
            onSend={handleSend}
            placeholder={t('home.placeholder')}
          />
        </div>

        {/* Quick actions */}
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {QUICK_ACTIONS.map((action) => {
            const Icon = iconMap[action.icon as keyof typeof iconMap]
            return (
              <QuickActionChip
                key={action.id}
                icon={Icon}
                label={t(action.labelKey as TranslationKey)}
                onClick={() => handleQuickAction(action.id)}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}
