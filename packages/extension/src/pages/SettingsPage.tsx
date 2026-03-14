import { useState } from 'react'
import { Eye, EyeOff, ChevronDown, ChevronUp } from 'lucide-react'
import { useTranslation, MODELS, AWS_REGIONS } from '@hchat/shared'
import { useExtSettingsStore } from '@ext/stores/settings.store'
import { useExtToastStore } from '@ext/stores/toast.store'

export function SettingsPage() {
  const { t } = useTranslation()
  const settings = useExtSettingsStore()
  const updateSettings = useExtSettingsStore((s) => s.updateSettings)
  const addToast = useExtToastStore((s) => s.addToast)
  const [showSecrets, setShowSecrets] = useState(false)
  const [expandedSection, setExpandedSection] = useState<string | null>('model')

  function toggleSection(section: string) {
    setExpandedSection((prev) => (prev === section ? null : section))
  }

  function handleSave() {
    addToast('success', t('common.save'))
  }

  return (
    <div className="flex flex-col h-full">
      <header className="px-3 py-2.5 border-b border-[var(--border)]">
        <h1 className="text-sm font-bold text-[var(--text-primary)]">
          {t('settings.title')}
        </h1>
      </header>

      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
        {/* Model Selection */}
        <Section
          title={t('settings.api.modelSettings')}
          expanded={expandedSection === 'model'}
          onToggle={() => toggleSection('model')}
        >
          <div className="space-y-2">
            <label className="block text-xs text-[var(--text-secondary)]">
              {t('settings.api.defaultModel')}
            </label>
            <select
              value={settings.selectedModel}
              onChange={(e) => updateSettings({ selectedModel: e.target.value })}
              className="w-full px-2.5 py-1.5 text-xs bg-[var(--bg-input)] border border-[var(--border-input)] rounded-lg outline-none focus:ring-1 focus:ring-[var(--primary)]"
            >
              {MODELS.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.label}
                </option>
              ))}
            </select>
          </div>
        </Section>

        {/* AWS Credentials */}
        <Section
          title={t('settings.api.awsCredentials')}
          expanded={expandedSection === 'aws'}
          onToggle={() => toggleSection('aws')}
        >
          <div className="space-y-2">
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1">Access Key ID</label>
              <input
                type={showSecrets ? 'text' : 'password'}
                value={settings.awsAccessKeyId}
                onChange={(e) => updateSettings({ awsAccessKeyId: e.target.value })}
                placeholder="AKIA..."
                className="w-full px-2.5 py-1.5 text-xs bg-[var(--bg-input)] border border-[var(--border-input)] rounded-lg outline-none focus:ring-1 focus:ring-[var(--primary)]"
              />
            </div>
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1">Secret Access Key</label>
              <div className="relative">
                <input
                  type={showSecrets ? 'text' : 'password'}
                  value={settings.awsSecretAccessKey}
                  onChange={(e) => updateSettings({ awsSecretAccessKey: e.target.value })}
                  placeholder={t('settings.api.secretPlaceholder')}
                  className="w-full px-2.5 py-1.5 pr-8 text-xs bg-[var(--bg-input)] border border-[var(--border-input)] rounded-lg outline-none focus:ring-1 focus:ring-[var(--primary)]"
                />
                <button
                  onClick={() => setShowSecrets(!showSecrets)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]"
                >
                  {showSecrets ? <EyeOff size={12} /> : <Eye size={12} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1">
                {t('settings.api.region')}
              </label>
              <select
                value={settings.awsRegion}
                onChange={(e) => updateSettings({ awsRegion: e.target.value })}
                className="w-full px-2.5 py-1.5 text-xs bg-[var(--bg-input)] border border-[var(--border-input)] rounded-lg outline-none focus:ring-1 focus:ring-[var(--primary)]"
              >
                {AWS_REGIONS.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
          </div>
        </Section>

        {/* OpenAI */}
        <Section
          title="OpenAI API Key"
          expanded={expandedSection === 'openai'}
          onToggle={() => toggleSection('openai')}
        >
          <input
            type={showSecrets ? 'text' : 'password'}
            value={settings.openaiApiKey}
            onChange={(e) => updateSettings({ openaiApiKey: e.target.value })}
            placeholder="sk-..."
            className="w-full px-2.5 py-1.5 text-xs bg-[var(--bg-input)] border border-[var(--border-input)] rounded-lg outline-none focus:ring-1 focus:ring-[var(--primary)]"
          />
        </Section>

        {/* Gemini */}
        <Section
          title="Gemini API Key"
          expanded={expandedSection === 'gemini'}
          onToggle={() => toggleSection('gemini')}
        >
          <input
            type={showSecrets ? 'text' : 'password'}
            value={settings.geminiApiKey}
            onChange={(e) => updateSettings({ geminiApiKey: e.target.value })}
            placeholder="AIza..."
            className="w-full px-2.5 py-1.5 text-xs bg-[var(--bg-input)] border border-[var(--border-input)] rounded-lg outline-none focus:ring-1 focus:ring-[var(--primary)]"
          />
        </Section>

        {/* Appearance */}
        <Section
          title={t('settings.custom.title')}
          expanded={expandedSection === 'appearance'}
          onToggle={() => toggleSection('appearance')}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs">{t('settings.custom.darkMode')}</span>
              <button
                onClick={() => updateSettings({ darkMode: !settings.darkMode })}
                className={`w-9 h-5 rounded-full transition-colors relative ${
                  settings.darkMode ? 'bg-[var(--primary)]' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                    settings.darkMode ? 'translate-x-4' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs">{t('settings.custom.language')}</span>
              <select
                value={settings.language}
                onChange={(e) => updateSettings({ language: e.target.value as 'ko' | 'en' })}
                className="px-2 py-1 text-xs bg-[var(--bg-input)] border border-[var(--border-input)] rounded-lg outline-none"
              >
                <option value="ko">Korean</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>
        </Section>

        <button
          onClick={handleSave}
          className="w-full mt-2 px-3 py-2 bg-[var(--primary)] text-white text-xs font-medium rounded-lg hover:bg-[var(--primary-hover)] transition-colors"
        >
          {t('common.save')}
        </button>
      </div>
    </div>
  )
}

function Section({
  title,
  expanded,
  onToggle,
  children,
}: {
  title: string
  expanded: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div className="border border-[var(--border)] rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
      >
        {title}
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      {expanded && <div className="px-3 pb-3 pt-1">{children}</div>}
    </div>
  )
}
