import { useState, useEffect } from 'react'
import { Key, User, Sparkles, Palette, Puzzle, Plug, Monitor, Shield, Code, X, Radio } from 'lucide-react'
import { useSettingsStore } from '@/entities/settings/settings.store'
import { useChannelStore } from '@/entities/channel/channel.store'
import { useTranslation } from '@/shared/i18n'
import { SettingsTabItem } from '@/shared/ui/SettingsTabItem'
import { FormLabel } from '@/shared/ui/FormLabel'
import { FormInput } from '@/shared/ui/FormInput'
import { Button } from '@/shared/ui/Button'
import { Toggle } from '@/shared/ui/Toggle'
import { testConnection } from '@/shared/lib/bedrock-client'
import { AWS_REGIONS, DEFAULT_AWS_REGION, MODELS } from '@/shared/constants'

const TABS = [
  { id: 'api-keys', labelKey: 'settings.tab.apiKeys' as const, icon: Key },
  { id: 'profile', labelKey: 'settings.tab.profile' as const, icon: User },
  { id: 'features', labelKey: 'settings.tab.features' as const, icon: Sparkles },
  { id: 'customization', labelKey: 'settings.tab.customization' as const, icon: Palette },
  { id: 'extensions', labelKey: 'settings.tab.extensions' as const, icon: Puzzle },
  { id: 'mcp', labelKey: 'settings.tab.mcp' as const, icon: Plug },
  { id: 'channels', labelKey: 'settings.tab.channels' as const, icon: Radio },
  { id: 'desktop', labelKey: 'settings.tab.desktop' as const, icon: Monitor },
  { id: 'privacy', labelKey: 'settings.tab.privacy' as const, icon: Shield },
  { id: 'developer', labelKey: 'settings.tab.developer' as const, icon: Code },
] as const

type TestStatus = 'idle' | 'testing' | 'success' | 'error'

export function SettingsScreen() {
  const { t } = useTranslation()
  const {
    settingsTab,
    setSettingsTab,
    setSettingsOpen,
    darkMode,
    toggleDarkMode,
    credentials,
    setCredentials,
    selectedModel,
    setSelectedModel,
    openaiApiKey,
    setOpenaiApiKey,
    geminiApiKey,
    setGeminiApiKey,
    autoRouting,
    setAutoRouting,
    language,
    setLanguage,
  } = useSettingsStore()
  const { slack, telegram, updateSlack, updateTelegram, testSlackConnection, connectTelegram, testStatus: channelTestStatus } = useChannelStore()

  const [accessKeyId, setAccessKeyId] = useState(credentials?.accessKeyId ?? '')
  const [secretAccessKey, setSecretAccessKey] = useState(credentials?.secretAccessKey ?? '')
  const [region, setRegion] = useState(credentials?.region ?? DEFAULT_AWS_REGION)
  const [testStatus, setTestStatus] = useState<TestStatus>('idle')
  const [testError, setTestError] = useState('')

  const [openaiKey, setOpenaiKey] = useState(openaiApiKey ?? '')
  const [geminiKey, setGeminiKey] = useState(geminiApiKey ?? '')
  const [testStatusOpenai, setTestStatusOpenai] = useState<TestStatus>('idle')
  const [testStatusGemini, setTestStatusGemini] = useState<TestStatus>('idle')
  const [testErrorOpenai, setTestErrorOpenai] = useState('')
  const [testErrorGemini, setTestErrorGemini] = useState('')

  // Sync local state when credentials change externally
  useEffect(() => {
    if (credentials) {
      setAccessKeyId(credentials.accessKeyId)
      setSecretAccessKey(credentials.secretAccessKey)
      setRegion(credentials.region)
    }
  }, [credentials])

  useEffect(() => {
    setOpenaiKey(openaiApiKey ?? '')
  }, [openaiApiKey])

  useEffect(() => {
    setGeminiKey(geminiApiKey ?? '')
  }, [geminiApiKey])

  function handleSaveCredentials() {
    if (!accessKeyId.trim() || !secretAccessKey.trim()) return
    setCredentials({
      accessKeyId: accessKeyId.trim(),
      secretAccessKey: secretAccessKey.trim(),
      region,
    })
  }

  async function handleTest() {
    handleSaveCredentials()
    setTestStatus('testing')
    setTestError('')

    const creds = {
      accessKeyId: accessKeyId.trim(),
      secretAccessKey: secretAccessKey.trim(),
      region,
    }

    const result = await testConnection(creds, 'claude-haiku-4.5')

    if (result.success) {
      setTestStatus('success')
    } else {
      setTestStatus('error')
      setTestError(result.error ?? t('settings.api.connectionFailed'))
    }
  }

  function handleClearCredentials() {
    setAccessKeyId('')
    setSecretAccessKey('')
    setRegion(DEFAULT_AWS_REGION)
    setCredentials(null)
    setTestStatus('idle')
    setTestError('')
  }

  async function handleTestOpenai() {
    const key = openaiKey.trim()
    if (!key) return

    setOpenaiApiKey(key)
    setTestStatusOpenai('testing')
    setTestErrorOpenai('')

    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${key}`,
        },
      })

      if (response.ok) {
        setTestStatusOpenai('success')
      } else {
        setTestStatusOpenai('error')
        setTestErrorOpenai(t('settings.api.invalidApiKey'))
      }
    } catch (error) {
      setTestStatusOpenai('error')
      setTestErrorOpenai(t('settings.api.connectionFailed'))
    }
  }

  function handleClearOpenai() {
    setOpenaiKey('')
    setOpenaiApiKey(null)
    setTestStatusOpenai('idle')
    setTestErrorOpenai('')
  }

  async function handleTestGemini() {
    const key = geminiKey.trim()
    if (!key) return

    setGeminiApiKey(key)
    setTestStatusGemini('testing')
    setTestErrorGemini('')

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`)

      if (response.ok) {
        setTestStatusGemini('success')
      } else {
        setTestStatusGemini('error')
        setTestErrorGemini(t('settings.api.invalidApiKey'))
      }
    } catch (error) {
      setTestStatusGemini('error')
      setTestErrorGemini(t('settings.api.connectionFailed'))
    }
  }

  function handleClearGemini() {
    setGeminiKey('')
    setGeminiApiKey(null)
    setTestStatusGemini('idle')
    setTestErrorGemini('')
  }

  const renderContent = () => {
    switch (settingsTab) {
      case 'api-keys':
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-text-primary">{t('settings.api.title')}</h2>
              <p className="text-text-secondary text-sm mt-1">
                {t('settings.api.description')}
              </p>
            </div>

            {/* Model Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-text-primary">{t('settings.api.modelSettings')}</h3>

              <div>
                <FormLabel>{t('settings.api.defaultModel')}</FormLabel>
                <div className="mt-1.5">
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-input text-text-primary text-sm outline-none focus:border-primary transition"
                  >
                    {MODELS.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.label} ({model.provider})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-primary font-medium">{t('settings.api.autoRouting')}</p>
                  <p className="text-xs text-text-secondary mt-0.5">
                    {t('settings.api.autoRoutingDesc')}
                  </p>
                </div>
                <Toggle checked={autoRouting} onChange={setAutoRouting} ariaLabel={t('settings.api.autoRouting')} />
              </div>
            </div>

            {/* AWS Credentials */}
            <div className="space-y-4 pt-6 border-t border-border">
              <h3 className="text-lg font-semibold text-text-primary">{t('settings.api.awsCredentials')}</h3>

              <div>
                <FormLabel>AWS Access Key ID</FormLabel>
                <div className="mt-1.5">
                  <FormInput
                    placeholder="AKIA..."
                    value={accessKeyId}
                    onChange={setAccessKeyId}
                  />
                </div>
              </div>

              <div>
                <FormLabel>AWS Secret Access Key</FormLabel>
                <div className="mt-1.5">
                  <FormInput
                    placeholder={t('settings.api.secretPlaceholder')}
                    value={secretAccessKey}
                    onChange={setSecretAccessKey}
                    type="password"
                  />
                </div>
              </div>

              <div>
                <FormLabel>{t('settings.api.region')}</FormLabel>
                <div className="mt-1.5">
                  <select
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-input text-text-primary text-sm outline-none focus:border-primary transition"
                  >
                    {AWS_REGIONS.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.id} — {r.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant="secondary"
                  onClick={handleTest}
                  disabled={!accessKeyId.trim() || !secretAccessKey.trim() || testStatus === 'testing'}
                >
                  {testStatus === 'testing' ? t('settings.api.testing') : t('settings.api.testConnection')}
                </Button>
                {credentials && (
                  <Button variant="secondary" onClick={handleClearCredentials}>
                    {t('common.reset')}
                  </Button>
                )}
                {testStatus === 'success' && (
                  <span className="text-xs text-success font-medium">{t('settings.api.connectionSuccess')}</span>
                )}
                {testStatus === 'error' && (
                  <span className="text-xs text-danger font-medium">✗ {testError}</span>
                )}
              </div>

              <p className="text-xs text-text-tertiary">
                {t('settings.api.credentialsNote')}
              </p>
            </div>

            {/* OpenAI */}
            <div className="space-y-4 pt-6 border-t border-border">
              <h3 className="text-lg font-semibold text-text-primary">OpenAI</h3>

              <div>
                <FormLabel>API Key</FormLabel>
                <div className="mt-1.5">
                  <FormInput
                    placeholder="sk-..."
                    value={openaiKey}
                    onChange={setOpenaiKey}
                    type="password"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant="secondary"
                  onClick={handleTestOpenai}
                  disabled={!openaiKey.trim() || testStatusOpenai === 'testing'}
                >
                  {testStatusOpenai === 'testing' ? t('settings.api.testing') : t('settings.api.testConnection')}
                </Button>
                {openaiApiKey && (
                  <Button variant="secondary" onClick={handleClearOpenai}>
                    {t('common.reset')}
                  </Button>
                )}
                {testStatusOpenai === 'success' && (
                  <span className="text-xs text-success font-medium">{t('settings.api.connectionSuccess')}</span>
                )}
                {testStatusOpenai === 'error' && (
                  <span className="text-xs text-danger font-medium">✗ {testErrorOpenai}</span>
                )}
              </div>

              <p className="text-xs text-text-tertiary">
                {t('settings.api.openaiNote')}
              </p>
            </div>

            {/* Gemini */}
            <div className="space-y-4 pt-6 border-t border-border">
              <h3 className="text-lg font-semibold text-text-primary">Google Gemini</h3>

              <div>
                <FormLabel>API Key</FormLabel>
                <div className="mt-1.5">
                  <FormInput
                    placeholder="AIza..."
                    value={geminiKey}
                    onChange={setGeminiKey}
                    type="password"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant="secondary"
                  onClick={handleTestGemini}
                  disabled={!geminiKey.trim() || testStatusGemini === 'testing'}
                >
                  {testStatusGemini === 'testing' ? t('settings.api.testing') : t('settings.api.testConnection')}
                </Button>
                {geminiApiKey && (
                  <Button variant="secondary" onClick={handleClearGemini}>
                    {t('common.reset')}
                  </Button>
                )}
                {testStatusGemini === 'success' && (
                  <span className="text-xs text-success font-medium">{t('settings.api.connectionSuccess')}</span>
                )}
                {testStatusGemini === 'error' && (
                  <span className="text-xs text-danger font-medium">✗ {testErrorGemini}</span>
                )}
              </div>

              <p className="text-xs text-text-tertiary">
                {t('settings.api.geminiNote')}
              </p>
            </div>
          </div>
        )

      case 'customization':
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-text-primary">{t('settings.custom.title')}</h2>
              <p className="text-text-secondary text-sm mt-1">{t('settings.custom.description')}</p>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-text-primary">{t('settings.custom.theme')}</h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-primary">{t('settings.custom.darkMode')}</p>
                  <p className="text-xs text-text-secondary">
                    {darkMode ? t('settings.custom.darkModeOn') : t('settings.custom.darkModeOff')}
                  </p>
                </div>
                <Toggle checked={darkMode} onChange={toggleDarkMode} ariaLabel={t('settings.custom.darkMode')} />
              </div>
            </div>
            <div className="space-y-4 pt-6 border-t border-border">
              <h3 className="text-lg font-semibold text-text-primary">{t('settings.custom.language')}</h3>
              <p className="text-xs text-text-secondary">{t('settings.custom.languageDesc')}</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setLanguage('ko')}
                  aria-pressed={language === 'ko'}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    language === 'ko'
                      ? 'bg-primary text-white'
                      : 'border border-border text-text-secondary hover:bg-hover'
                  }`}
                >
                  한국어
                </button>
                <button
                  onClick={() => setLanguage('en')}
                  aria-pressed={language === 'en'}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    language === 'en'
                      ? 'bg-primary text-white'
                      : 'border border-border text-text-secondary hover:bg-hover'
                  }`}
                >
                  English
                </button>
              </div>
            </div>
          </div>
        )

      case 'channels':
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-text-primary">{t('settings.channels.title')}</h2>
              <p className="text-text-secondary text-sm mt-1">
                {t('settings.channels.description')}
              </p>
            </div>

            {/* Slack Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-text-primary">Slack</h3>

              <div>
                <FormLabel>Webhook URL</FormLabel>
                <div className="mt-1.5">
                  <FormInput
                    placeholder="https://hooks.slack.com/services/..."
                    value={slack.webhookUrl}
                    onChange={(val) => updateSlack({ webhookUrl: val })}
                  />
                </div>
              </div>

              <div>
                <FormLabel>{t('settings.channels.channel')}</FormLabel>
                <div className="mt-1.5">
                  <FormInput
                    placeholder="#general"
                    value={slack.channel}
                    onChange={(val) => updateSlack({ channel: val })}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-medium text-text-primary">{t('settings.channels.notifyRules')}</h4>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-secondary">{t('settings.channels.onComplete')}</span>
                  <Toggle checked={slack.notifyOnComplete} onChange={(v) => updateSlack({ notifyOnComplete: v })} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-secondary">{t('settings.channels.onError')}</span>
                  <Toggle checked={slack.notifyOnError} onChange={(v) => updateSlack({ notifyOnError: v })} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-secondary">{t('settings.channels.onSchedule')}</span>
                  <Toggle checked={slack.notifyOnSchedule} onChange={(v) => updateSlack({ notifyOnSchedule: v })} />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant="secondary"
                  onClick={testSlackConnection}
                  disabled={!slack.webhookUrl || channelTestStatus === 'testing'}
                >
                  {channelTestStatus === 'testing' ? t('settings.api.testing') : t('settings.api.testConnection')}
                </Button>
                <Button variant="primary" disabled={!slack.webhookUrl}>
                  {t('common.save')}
                </Button>
                {channelTestStatus === 'success' && (
                  <span className="text-xs text-success font-medium">{t('settings.channels.connectionSuccess')}</span>
                )}
              </div>
            </div>

            {/* Telegram Section */}
            <div className="space-y-4 pt-4 border-t border-border">
              <h3 className="text-lg font-semibold text-text-primary">Telegram</h3>

              <div>
                <FormLabel>Bot Token</FormLabel>
                <div className="mt-1.5">
                  <FormInput
                    placeholder="123456:ABC-DEF..."
                    value={telegram.botToken}
                    onChange={(val) => updateTelegram({ botToken: val })}
                    type="password"
                  />
                </div>
              </div>

              <div>
                <FormLabel>Chat ID</FormLabel>
                <div className="mt-1.5">
                  <FormInput
                    placeholder="-100..."
                    value={telegram.chatId}
                    onChange={(val) => updateTelegram({ chatId: val })}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant="primary"
                  onClick={connectTelegram}
                  disabled={!telegram.botToken || !telegram.chatId}
                >
                  {telegram.connected ? t('common.reconnect') : t('common.connect')}
                </Button>
                {telegram.connected && (
                  <span className="text-xs text-success font-medium">{t('common.connected')}</span>
                )}
              </div>
            </div>

            {/* Message Preview */}
            <div className="pt-4 border-t border-border">
              <h3 className="text-sm font-semibold text-text-primary mb-3">{t('settings.channels.messagePreview')}</h3>
              <div className="bg-page border border-border rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded bg-primary/20 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-primary">H</span>
                  </div>
                  <span className="text-sm font-semibold text-text-primary">H Chat Bot</span>
                  <span className="text-[11px] text-text-tertiary">오후 3:24</span>
                </div>
                <p className="text-sm text-text-secondary">
                  {t('settings.channels.sampleMessage')}
                </p>
              </div>
            </div>
          </div>
        )

      default:
        return (
          <div className="flex items-center justify-center h-64 text-text-secondary text-sm">
            {t('settings.notReady', { tab: t(TABS.find((tab) => tab.id === settingsTab)?.labelKey ?? 'settings.tab.apiKeys') })}
          </div>
        )
    }
  }

  return (
    <div className="h-full flex">
      {/* Settings Sidebar */}
      <div className="w-[264px] bg-sidebar border-r border-border flex flex-col flex-shrink-0">
        <div className="p-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-text-primary">{t('settings.title')}</h2>
          <button
            onClick={() => setSettingsOpen(false)}
            aria-label={t('common.close')}
            className="p-1.5 hover:bg-hover rounded-lg transition focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
          >
            <X size={18} className="text-text-secondary" />
          </button>
        </div>
        <nav className="flex-1 px-2 space-y-0.5">
          {TABS.map((tab) => (
            <SettingsTabItem
              key={tab.id}
              icon={tab.icon}
              label={t(tab.labelKey)}
              active={settingsTab === tab.id}
              onClick={() => setSettingsTab(tab.id)}
            />
          ))}
        </nav>
      </div>

      {/* Settings Content */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-2xl">
          {renderContent()}
        </div>
      </div>
    </div>
  )
}
