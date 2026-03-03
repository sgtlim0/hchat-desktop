import { useState, useEffect, useRef } from 'react'
import { Key, User, Sparkles, Palette, Puzzle, Plug, Monitor, Shield, Code, X, Radio, BarChart3, UserCircle, Trash2, Plus, HardDrive } from 'lucide-react'
import { useSettingsStore } from '@/entities/settings/settings.store'
import { useChannelStore } from '@/entities/channel/channel.store'
import { useUsageStore } from '@/entities/usage/usage.store'
import { usePersonaStore } from '@/entities/persona/persona.store'
import { useTranslation } from '@/shared/i18n'
import { SettingsTabItem } from '@/shared/ui/SettingsTabItem'
import { FormLabel } from '@/shared/ui/FormLabel'
import { FormInput } from '@/shared/ui/FormInput'
import { Button } from '@/shared/ui/Button'
import { Toggle } from '@/shared/ui/Toggle'
import { testConnection } from '@/shared/lib/bedrock-client'
import { AWS_REGIONS, DEFAULT_AWS_REGION, MODELS } from '@/shared/constants'
import type { Persona, UsageCategory } from '@/shared/types'
import type { TFunction } from '@/shared/i18n'
import { groupByDate, groupByWeek, getLast30Days } from '@/shared/lib/usage-chart'
import { BarChart } from '@/shared/ui/BarChart'
import { analyzeStorage, formatBytes, getStorageQuota, deleteOldSessions, clearAllData, exportAllData, importAllData, type StorageInfo } from '@/shared/lib/storage-analyzer'
import { useSessionStore } from '@/entities/session/session.store'
import { RoiDashboard } from './RoiDashboard'

const TABS = [
  { id: 'api-keys', labelKey: 'settings.tab.apiKeys' as const, icon: Key },
  { id: 'usage', labelKey: 'settings.tab.usage' as const, icon: BarChart3 },
  { id: 'personas', labelKey: 'settings.tab.personas' as const, icon: UserCircle },
  { id: 'profile', labelKey: 'settings.tab.profile' as const, icon: User },
  { id: 'features', labelKey: 'settings.tab.features' as const, icon: Sparkles },
  { id: 'customization', labelKey: 'settings.tab.customization' as const, icon: Palette },
  { id: 'storage', labelKey: 'storage.title' as const, icon: HardDrive },
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
  const usageEntries = useUsageStore((s) => s.entries)

  const clearAllUsage = useUsageStore((s) => s.clearAll)
  const getCategorySummary = useUsageStore((s) => s.getCategorySummary)
  const { personas, addPersona, updatePersona: updatePersonaStore, deletePersona: deletePersonaAction } = usePersonaStore()

  // Persona form state
  const [personaForm, setPersonaForm] = useState<Partial<Persona> | null>(null)

  // Usage category filter
  const [usageCategoryFilter, setUsageCategoryFilter] = useState<UsageCategory | 'all'>('all')

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

      case 'usage': {
        // Category filter
        const USAGE_CATEGORIES: { id: UsageCategory | 'all'; labelKey: string; color: string }[] = [
          { id: 'all', labelKey: 'usage.category.all', color: '#6B7280' },
          { id: 'chat', labelKey: 'usage.category.chat', color: '#3B82F6' },
          { id: 'translate', labelKey: 'usage.category.translate', color: '#10B981' },
          { id: 'doc-write', labelKey: 'usage.category.docWrite', color: '#F59E0B' },
          { id: 'image-gen', labelKey: 'usage.category.imageGen', color: '#8B5CF6' },
          { id: 'data-analysis', labelKey: 'usage.category.analysis', color: '#EF4444' },
        ]

        const filteredEntries = usageCategoryFilter === 'all'
          ? usageEntries
          : usageEntries.filter((e) => (e.category ?? 'chat') === usageCategoryFilter)

        const filteredCost = filteredEntries.reduce((sum, e) => sum + e.cost, 0)

        // Aggregate by model
        const modelAgg: Record<string, { inputTokens: number; outputTokens: number; cost: number; count: number }> = {}
        for (const e of filteredEntries) {
          const agg = modelAgg[e.modelId] ?? { inputTokens: 0, outputTokens: 0, cost: 0, count: 0 }
          modelAgg[e.modelId] = {
            inputTokens: agg.inputTokens + e.inputTokens,
            outputTokens: agg.outputTokens + e.outputTokens,
            cost: agg.cost + e.cost,
            count: agg.count + 1,
          }
        }

        // Chart data
        const recentEntries = getLast30Days(filteredEntries)
        const dailyData = groupByDate(recentEntries)
        const weeklyData = groupByWeek(recentEntries)

        // Category donut data
        const categorySummary = getCategorySummary()
        const categoryTotal = categorySummary.reduce((s, c) => s + c.totalCost, 0)
        const CATEGORY_COLORS: Record<string, string> = {
          chat: '#3B82F6', translate: '#10B981', 'doc-write': '#F59E0B',
          ocr: '#06B6D4', 'image-gen': '#8B5CF6', 'data-analysis': '#EF4444',
        }

        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-text-primary">{t('usage.title')}</h2>
              <p className="text-text-secondary text-sm mt-1">{t('usage.description')}</p>
            </div>

            {/* Category filter pills */}
            <div className="flex flex-wrap gap-2">
              {USAGE_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setUsageCategoryFilter(cat.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition border ${
                    usageCategoryFilter === cat.id
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-surface text-text-secondary hover:bg-hover'
                  }`}
                >
                  <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: cat.color }} />
                  {t(cat.labelKey as any)}
                </button>
              ))}
            </div>

            {/* Total cost */}
            <div className="p-4 border border-border rounded-xl bg-surface">
              <p className="text-sm text-text-secondary">{t('usage.totalCost')}</p>
              <p className="text-3xl font-bold text-text-primary mt-1">${filteredCost.toFixed(6)}</p>
              <p className="text-xs text-text-tertiary mt-1">{t('usage.totalRequests', { count: String(filteredEntries.length) })}</p>
            </div>

            {/* Category donut chart */}
            {categoryTotal > 0 && usageCategoryFilter === 'all' && (
              <div className="p-4 border border-border rounded-xl bg-surface">
                <h3 className="text-sm font-semibold text-text-primary mb-4">{t('usage.category.chart')}</h3>
                <div className="flex items-center gap-8">
                  <svg viewBox="0 0 100 100" width={140} height={140} className="flex-shrink-0">
                    {(() => {
                      let offset = 0
                      const radius = 38
                      const circumference = 2 * Math.PI * radius
                      return categorySummary
                        .filter((s) => s.totalCost > 0)
                        .map((s) => {
                          const pct = s.totalCost / categoryTotal
                          const dashArray = `${pct * circumference} ${circumference}`
                          const dashOffset = -offset * circumference
                          offset += pct
                          return (
                            <circle
                              key={s.category}
                              cx="50" cy="50" r={radius}
                              fill="none"
                              stroke={CATEGORY_COLORS[s.category] ?? '#6B7280'}
                              strokeWidth="14"
                              strokeDasharray={dashArray}
                              strokeDashoffset={dashOffset}
                              transform="rotate(-90 50 50)"
                            />
                          )
                        })
                    })()}
                  </svg>
                  <div className="space-y-1.5">
                    {categorySummary
                      .filter((s) => s.totalCost > 0)
                      .map((s) => (
                        <div key={s.category} className="flex items-center gap-2 text-xs">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[s.category] ?? '#6B7280' }} />
                          <span className="text-text-secondary w-20">
                            {t(`usage.category.${s.category === 'doc-write' ? 'docWrite' : s.category === 'image-gen' ? 'imageGen' : s.category === 'data-analysis' ? 'analysis' : s.category}` as any)}
                          </span>
                          <span className="text-text-primary font-medium">${s.totalCost.toFixed(4)}</span>
                          <span className="text-text-tertiary">({(s.totalCost / categoryTotal * 100).toFixed(0)}%)</span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}

            {/* Usage chart */}
            {recentEntries.length > 0 && (
              <UsageChartSection
                dailyData={dailyData}
                weeklyData={weeklyData}
                t={t}
              />
            )}

            {/* Model breakdown */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-text-primary">{t('usage.byModel')}</h3>
              {Object.keys(modelAgg).length === 0 ? (
                <p className="text-sm text-text-secondary">{t('usage.noData')}</p>
              ) : (
                <div className="border border-border rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-hover">
                      <tr>
                        <th className="text-left px-4 py-2 text-text-secondary font-medium">{t('usage.model')}</th>
                        <th className="text-right px-4 py-2 text-text-secondary font-medium">{t('usage.requests')}</th>
                        <th className="text-right px-4 py-2 text-text-secondary font-medium">{t('usage.inputTokens')}</th>
                        <th className="text-right px-4 py-2 text-text-secondary font-medium">{t('usage.outputTokens')}</th>
                        <th className="text-right px-4 py-2 text-text-secondary font-medium">{t('usage.cost')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(modelAgg).map(([modelId, agg]) => {
                        const model = MODELS.find((m) => m.id === modelId)
                        return (
                          <tr key={modelId} className="border-t border-border">
                            <td className="px-4 py-2 text-text-primary">{model?.label ?? modelId}</td>
                            <td className="px-4 py-2 text-right text-text-secondary">{agg.count}</td>
                            <td className="px-4 py-2 text-right text-text-secondary">{agg.inputTokens.toLocaleString()}</td>
                            <td className="px-4 py-2 text-right text-text-secondary">{agg.outputTokens.toLocaleString()}</td>
                            <td className="px-4 py-2 text-right text-text-primary font-medium">${agg.cost.toFixed(6)}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* ROI Dashboard */}
            <div className="mt-6 pt-6 border-t border-border">
              <h3 className="text-lg font-semibold text-text-primary mb-4">{t('roi.title')}</h3>
              <RoiDashboard />
            </div>

            <div className="pt-4">
              <Button variant="secondary" onClick={() => clearAllUsage()}>
                {t('usage.clearAll')}
              </Button>
            </div>
          </div>
        )
      }

      case 'personas': {
        function handleSavePersona() {
          if (!personaForm?.name?.trim() || !personaForm?.systemPrompt?.trim()) return
          const now = new Date().toISOString()

          if (personaForm.id) {
            updatePersonaStore(personaForm.id, {
              name: personaForm.name.trim(),
              description: personaForm.description?.trim() ?? '',
              systemPrompt: personaForm.systemPrompt.trim(),
              icon: personaForm.icon ?? 'bot',
            })
          } else {
            addPersona({
              id: `persona-${Date.now()}`,
              name: personaForm.name.trim(),
              description: personaForm.description?.trim() ?? '',
              systemPrompt: personaForm.systemPrompt.trim(),
              icon: personaForm.icon ?? 'bot',
              isDefault: false,
              createdAt: now,
              updatedAt: now,
            })
          }
          setPersonaForm(null)
        }

        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-text-primary">{t('persona.title')}</h2>
              <p className="text-text-secondary text-sm mt-1">{t('persona.description')}</p>
            </div>

            <Button variant="primary" onClick={() => setPersonaForm({})}>
              <Plus size={16} />
              {t('persona.new')}
            </Button>

            {/* Persona form */}
            {personaForm && (
              <div className="p-4 border border-border rounded-xl bg-surface space-y-3">
                <h3 className="text-sm font-semibold text-text-primary">
                  {personaForm.id ? t('common.edit') : t('persona.new')}
                </h3>
                <input
                  value={personaForm.name ?? ''}
                  onChange={(e) => setPersonaForm({ ...personaForm, name: e.target.value })}
                  placeholder={t('persona.namePlaceholder')}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-input text-sm text-text-primary outline-none focus:border-primary"
                />
                <input
                  value={personaForm.description ?? ''}
                  onChange={(e) => setPersonaForm({ ...personaForm, description: e.target.value })}
                  placeholder={t('persona.descPlaceholder')}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-input text-sm text-text-primary outline-none focus:border-primary"
                />
                <textarea
                  value={personaForm.systemPrompt ?? ''}
                  onChange={(e) => setPersonaForm({ ...personaForm, systemPrompt: e.target.value })}
                  placeholder={t('persona.promptPlaceholder')}
                  rows={4}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-input text-sm text-text-primary outline-none focus:border-primary resize-none"
                />
                <div className="flex justify-end gap-2">
                  <Button variant="secondary" onClick={() => setPersonaForm(null)}>{t('common.cancel')}</Button>
                  <Button variant="primary" onClick={handleSavePersona}>{t('common.save')}</Button>
                </div>
              </div>
            )}

            {/* Persona list */}
            <div className="space-y-3">
              {personas.map((p) => (
                <div key={p.id} className="p-4 border border-border rounded-xl bg-surface flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-text-primary">{p.name}</h3>
                      {p.isDefault && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">{t('persona.preset')}</span>
                      )}
                    </div>
                    <p className="text-xs text-text-secondary mt-0.5">{p.description}</p>
                    <p className="text-xs text-text-tertiary mt-1 line-clamp-2">{p.systemPrompt}</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0 ml-3">
                    <button
                      onClick={() => setPersonaForm(p)}
                      className="p-1.5 hover:bg-hover rounded-lg transition"
                      title={t('common.edit')}
                    >
                      <Code size={14} className="text-text-tertiary" />
                    </button>
                    {!p.isDefault && (
                      <button
                        onClick={() => deletePersonaAction(p.id)}
                        className="p-1.5 hover:bg-hover rounded-lg transition"
                        title={t('common.delete')}
                      >
                        <Trash2 size={14} className="text-text-tertiary" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      }

      case 'storage':
        return <StorageTab />

      case 'privacy':
        return <PrivacyTab />

      case 'features':
        return <FeaturesTab />

      default:
        return (
          <div className="flex items-center justify-center h-64 text-text-secondary text-sm">
            {t('settings.notReady', { tab: t(TABS.find((tab) => tab.id === settingsTab)?.labelKey ?? 'settings.tab.apiKeys') })}
          </div>
        )
    }
  }

  function PrivacyTab() {
    const guardrailEnabled = useSettingsStore((s) => s.guardrailEnabled)
    const setGuardrailEnabled = useSettingsStore((s) => s.setGuardrailEnabled)

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-bold text-text-primary">{t('privacy.title')}</h3>
          <p className="text-sm text-text-secondary mt-1">{t('privacy.description')}</p>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg border border-border">
            <div>
              <div className="font-medium text-sm text-text-primary">{t('privacy.guardrail')}</div>
              <div className="text-xs text-text-secondary mt-0.5">{t('privacy.guardrailDesc')}</div>
            </div>
            <Toggle checked={guardrailEnabled} onChange={setGuardrailEnabled} />
          </div>
        </div>
      </div>
    )
  }

  function FeaturesTab() {
    const thinkingDepth = useSettingsStore((s) => s.thinkingDepth)
    const setThinkingDepth = useSettingsStore((s) => s.setThinkingDepth)
    const depthOptions = [
      { value: 'fast' as const, label: t('thinking.fast'), desc: t('features.thinkingFastDesc') },
      { value: 'balanced' as const, label: t('thinking.balanced'), desc: t('features.thinkingBalancedDesc') },
      { value: 'deep' as const, label: t('thinking.deep'), desc: t('features.thinkingDeepDesc') },
    ]

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-bold text-text-primary">{t('settings.tab.features')}</h3>
          <p className="text-sm text-text-secondary mt-1">{t('features.description')}</p>
        </div>
        <div className="space-y-4">
          <div className="p-4 rounded-lg border border-border">
            <div className="font-medium text-sm text-text-primary mb-3">{t('features.thinkingDepth')}</div>
            <div className="space-y-2">
              {depthOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setThinkingDepth(opt.value)}
                  className={`w-full text-left p-3 rounded-lg border transition ${
                    thinkingDepth === opt.value
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:bg-hover'
                  }`}
                >
                  <div className="font-medium text-sm text-text-primary">{opt.label}</div>
                  <div className="text-xs text-text-secondary mt-0.5">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  function StorageTab() {
    const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null)
    const [quota, setQuota] = useState<{ usage: number; quota: number } | null>(null)
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [selectedDays, setSelectedDays] = useState(30)
    const hydrate = useSessionStore((s) => s.hydrate)
    const fileInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
      loadStorageInfo()
    }, [])

    async function loadStorageInfo() {
      setIsAnalyzing(true)
      try {
        const [info, quotaInfo] = await Promise.all([
          analyzeStorage(),
          getStorageQuota(),
        ])
        setStorageInfo(info)
        setQuota(quotaInfo)
      } catch (error) {
        console.error('Failed to analyze storage:', error)
      } finally {
        setIsAnalyzing(false)
      }
    }

    async function handleClearAll() {
      if (!confirm(t('storage.clearConfirm'))) return

      try {
        await clearAllData()
        await hydrate()
        await loadStorageInfo()
        alert(t('storage.cleared'))
      } catch (error) {
        console.error('Failed to clear data:', error)
        alert(`Error: ${error}`)
      }
    }

    async function handleDeleteOld() {
      if (!storageInfo) return

      const oldSessions = storageInfo.estimatedBySession.filter((s) => {
        const cutoffDate = new Date()
        cutoffDate.setDate(cutoffDate.getDate() - selectedDays)
        return new Date(s.sessionId.split('-')[1]) < cutoffDate
      })

      if (!confirm(t('storage.deleteOldConfirm', { days: String(selectedDays), count: String(oldSessions.length) }))) return

      try {
        const deletedCount = await deleteOldSessions(selectedDays)
        await hydrate()
        await loadStorageInfo()
        alert(t('storage.deleted', { count: String(deletedCount) }))
      } catch (error) {
        console.error('Failed to delete old sessions:', error)
        alert(`Error: ${error}`)
      }
    }

    async function handleExportBackup() {
      try {
        const jsonString = await exportAllData()
        const blob = new Blob([jsonString], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `hchat-backup-${new Date().toISOString().slice(0, 10)}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        alert(t('storage.backupSuccess'))
      } catch (error) {
        console.error('Failed to export backup:', error)
        alert(`Error: ${error}`)
      }
    }

    function handleImportBackup() {
      if (fileInputRef.current) {
        fileInputRef.current.click()
      }
    }

    async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
      const file = e.target.files?.[0]
      if (!file) return

      if (!confirm(t('storage.restoreConfirm'))) {
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
        return
      }

      try {
        const text = await file.text()
        await importAllData(text)
        await hydrate()
        await loadStorageInfo()
        alert(t('storage.restoreSuccess'))
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      } catch (error) {
        console.error('Failed to import backup:', error)
        alert(`Error: ${error instanceof Error ? error.message : error}`)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      }
    }

    const usagePercent = quota && quota.quota > 0 ? (quota.usage / quota.quota) * 100 : 0

    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">{t('storage.title')}</h2>
          <p className="text-text-secondary text-sm mt-1">{t('storage.description')}</p>
        </div>

        {isAnalyzing ? (
          <div className="flex items-center justify-center h-32">
            <p className="text-sm text-text-secondary">{t('storage.analyzing')}</p>
          </div>
        ) : storageInfo ? (
          <>
            {/* Storage overview */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 border border-border rounded-xl bg-surface">
                <p className="text-sm text-text-secondary">{t('storage.totalUsed')}</p>
                <p className="text-2xl font-bold text-text-primary mt-1">{formatBytes(storageInfo.totalSize)}</p>
                {quota && quota.quota > 0 && (
                  <p className="text-xs text-text-tertiary mt-1">
                    {t('storage.quota')}: {formatBytes(quota.quota)}
                  </p>
                )}
              </div>
              <div className="p-4 border border-border rounded-xl bg-surface">
                <p className="text-sm text-text-secondary">{t('storage.sessions')}</p>
                <p className="text-2xl font-bold text-text-primary mt-1">{storageInfo.sessionsCount}</p>
              </div>
              <div className="p-4 border border-border rounded-xl bg-surface">
                <p className="text-sm text-text-secondary">{t('storage.messages')}</p>
                <p className="text-2xl font-bold text-text-primary mt-1">{storageInfo.messagesCount}</p>
              </div>
            </div>

            {/* Progress bar */}
            {quota && quota.quota > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-secondary">{t('storage.totalUsed')}</span>
                  <span className="text-text-primary font-medium">{usagePercent.toFixed(1)}%</span>
                </div>
                <div className="w-full h-2 bg-hover rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${Math.min(usagePercent, 100)}%` }}
                  />
                </div>
              </div>
            )}

            {/* Delete old sessions */}
            <div className="space-y-4 pt-6 border-t border-border">
              <h3 className="text-lg font-semibold text-text-primary">{t('storage.deleteOld')}</h3>
              <div className="flex items-center gap-3">
                <select
                  value={selectedDays}
                  onChange={(e) => setSelectedDays(Number(e.target.value))}
                  className="px-3 py-2 rounded-lg border border-border bg-input text-text-primary text-sm outline-none focus:border-primary transition"
                >
                  <option value={30}>{t('storage.olderThan', { days: '30' })}</option>
                  <option value={60}>{t('storage.olderThan', { days: '60' })}</option>
                  <option value={90}>{t('storage.olderThan', { days: '90' })}</option>
                </select>
                <Button variant="secondary" onClick={handleDeleteOld}>
                  {t('storage.deleteOld')}
                </Button>
              </div>
            </div>

            {/* Backup and Restore */}
            <div className="space-y-4 pt-6 border-t border-border">
              <h3 className="text-lg font-semibold text-text-primary">{t('storage.backup')}</h3>
              <p className="text-sm text-text-secondary">
                Export all your data as a JSON backup file, or import from a previous backup.
              </p>
              <div className="flex items-center gap-3">
                <Button variant="secondary" onClick={handleExportBackup}>
                  {t('storage.backup')}
                </Button>
                <Button variant="secondary" onClick={handleImportBackup}>
                  {t('storage.restore')}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
            </div>

            {/* Clear all data */}
            <div className="space-y-4 pt-6 border-t border-border">
              <h3 className="text-lg font-semibold text-text-primary">{t('storage.clearAll')}</h3>
              <p className="text-sm text-text-secondary">{t('storage.clearConfirm')}</p>
              <Button variant="secondary" onClick={handleClearAll}>
                {t('storage.clearAll')}
              </Button>
            </div>
          </>
        ) : null}
      </div>
    )
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

// Extracted chart section to keep SettingsScreen manageable
function UsageChartSection({
  dailyData,
  weeklyData,
  t,
}: {
  dailyData: Array<{ date: string; cost: number; requests: number }>
  weeklyData: Array<{ weekStart: string; cost: number; requests: number }>
  t: TFunction
}) {
  const [chartMode, setChartMode] = useState<'daily' | 'weekly'>('daily')

  const chartData = chartMode === 'daily'
    ? dailyData.map((d) => ({ label: d.date.slice(5), value: d.cost }))
    : weeklyData.map((d) => ({ label: d.weekStart.slice(5), value: d.cost }))

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-text-primary">{t('usage.chart.title')}</h3>
        <div className="flex items-center gap-1 bg-hover rounded-lg p-0.5">
          <button
            onClick={() => setChartMode('daily')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition ${
              chartMode === 'daily' ? 'bg-surface text-text-primary shadow-sm' : 'text-text-tertiary'
            }`}
          >
            {t('usage.chart.daily')}
          </button>
          <button
            onClick={() => setChartMode('weekly')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition ${
              chartMode === 'weekly' ? 'bg-surface text-text-primary shadow-sm' : 'text-text-tertiary'
            }`}
          >
            {t('usage.chart.weekly')}
          </button>
        </div>
      </div>
      <div className="p-4 border border-border rounded-xl bg-surface">
        <BarChart
          data={chartData}
          height={200}
          formatValue={(v) => `$${v.toFixed(4)}`}
        />
      </div>
    </div>
  )
}
