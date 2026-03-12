import { useState, useEffect } from 'react'
import { Eye, EyeOff, Save } from 'lucide-react'
import { MODELS, AWS_REGIONS, DEFAULT_MODEL_ID } from '@hchat/shared'
import { Button } from '../components/Button'
import { toast, ToastContainer } from '../components/ToastContainer'

const DEFAULT_API_BASE = 'https://sgtlim0--hchat-api-api.modal.run'

interface Settings {
  bedrockAccessKeyId: string
  bedrockSecretAccessKey: string
  bedrockRegion: string
  openaiApiKey: string
  geminiApiKey: string
  selectedModel: string
  darkMode: boolean
  language: string
  apiBaseUrl: string
}

const defaultSettings: Settings = {
  bedrockAccessKeyId: '',
  bedrockSecretAccessKey: '',
  bedrockRegion: 'us-east-1',
  openaiApiKey: '',
  geminiApiKey: '',
  selectedModel: DEFAULT_MODEL_ID,
  darkMode: false,
  language: 'ko',
  apiBaseUrl: DEFAULT_API_BASE,
}

export function OptionsApp() {
  const [settings, setSettings] = useState<Settings>(defaultSettings)
  const [loading, setLoading] = useState(false)
  const [showBedrock, setShowBedrock] = useState(false)
  const [showOpenai, setShowOpenai] = useState(false)
  const [showGemini, setShowGemini] = useState(false)

  useEffect(() => {
    chrome.storage.sync.get(null, (result) => {
      setSettings(prev => ({
        ...prev,
        ...(result as Partial<Settings>),
      }))
    })
  }, [])

  useEffect(() => {
    if (settings.darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [settings.darkMode])

  function updateField<K extends keyof Settings>(key: K, value: Settings[K]) {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  async function handleSave() {
    setLoading(true)
    try {
      await new Promise<void>((resolve) => {
        chrome.storage.sync.set(settings, resolve)
      })
      toast('success', 'Settings saved successfully')
    } catch {
      toast('error', 'Failed to save settings')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 dark:bg-slate-900">
      <div className="mx-auto max-w-[600px] px-4">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-sm font-bold text-white">
            H
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100">
              H Chat Settings
            </h1>
            <p className="text-xs text-slate-500">Configure your AI chat extension</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* API Configuration */}
          <Section title="API Configuration">
            {/* Bedrock */}
            <FieldGroup label="AWS Bedrock">
              <PasswordField
                label="Access Key ID"
                value={settings.bedrockAccessKeyId}
                onChange={v => updateField('bedrockAccessKeyId', v)}
                show={showBedrock}
                onToggle={() => setShowBedrock(!showBedrock)}
                placeholder="AKIA..."
              />
              <PasswordField
                label="Secret Access Key"
                value={settings.bedrockSecretAccessKey}
                onChange={v => updateField('bedrockSecretAccessKey', v)}
                show={showBedrock}
                onToggle={() => setShowBedrock(!showBedrock)}
                placeholder="wJal..."
              />
              <div>
                <label className="mb-1 block text-xs text-slate-600 dark:text-slate-400">
                  Region
                </label>
                <select
                  value={settings.bedrockRegion}
                  onChange={e => updateField('bedrockRegion', e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm
                    dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
                >
                  {AWS_REGIONS.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
            </FieldGroup>

            {/* OpenAI */}
            <FieldGroup label="OpenAI">
              <PasswordField
                label="API Key"
                value={settings.openaiApiKey}
                onChange={v => updateField('openaiApiKey', v)}
                show={showOpenai}
                onToggle={() => setShowOpenai(!showOpenai)}
                placeholder="sk-proj-..."
              />
            </FieldGroup>

            {/* Gemini */}
            <FieldGroup label="Google Gemini">
              <PasswordField
                label="API Key"
                value={settings.geminiApiKey}
                onChange={v => updateField('geminiApiKey', v)}
                show={showGemini}
                onToggle={() => setShowGemini(!showGemini)}
                placeholder="AIza..."
              />
            </FieldGroup>
          </Section>

          {/* Model */}
          <Section title="Model">
            <select
              value={settings.selectedModel}
              onChange={e => updateField('selectedModel', e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm
                dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
            >
              {MODELS.map(m => (
                <option key={m.id} value={m.id}>{m.label}</option>
              ))}
            </select>
          </Section>

          {/* Appearance */}
          <Section title="Appearance">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-700 dark:text-slate-300">Dark Mode</span>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  checked={settings.darkMode}
                  onChange={e => updateField('darkMode', e.target.checked)}
                  className="peer sr-only"
                />
                <div className="h-5 w-9 rounded-full bg-slate-300 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all peer-checked:bg-blue-600 peer-checked:after:translate-x-full" />
              </label>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-700 dark:text-slate-300">Language</span>
              <select
                value={settings.language}
                onChange={e => updateField('language', e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm
                  dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
              >
                <option value="ko">Korean</option>
                <option value="en">English</option>
              </select>
            </div>
          </Section>

          {/* API Base URL */}
          <Section title="API Base URL">
            <input
              type="text"
              value={settings.apiBaseUrl}
              onChange={e => updateField('apiBaseUrl', e.target.value)}
              placeholder={DEFAULT_API_BASE}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm
                dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
            />
            <p className="mt-1 text-[10px] text-slate-400">
              Default: {DEFAULT_API_BASE}
            </p>
          </Section>

          {/* Save */}
          <div className="flex justify-end pt-2">
            <Button onClick={handleSave} loading={loading}>
              <Save className="h-3.5 w-3.5" />
              Save Settings
            </Button>
          </div>
        </div>
      </div>

      <ToastContainer />
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
      <h2 className="mb-3 text-sm font-semibold text-slate-800 dark:text-slate-100">
        {title}
      </h2>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
      {children}
    </div>
  )
}

function PasswordField({
  label,
  value,
  onChange,
  show,
  onToggle,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  show: boolean
  onToggle: () => void
  placeholder: string
}) {
  return (
    <div>
      <label className="mb-1 block text-xs text-slate-600 dark:text-slate-400">
        {label}
      </label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 pr-9 text-sm
            dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  )
}
