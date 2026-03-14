import { useEffect } from 'react'
import { MessageSquare, Plus, Moon, Sun, Wifi, WifiOff } from 'lucide-react'
import { setLanguageProvider, useTranslation, MODELS, PROVIDER_COLORS } from '@hchat/shared'
import type { ProviderType } from '@hchat/shared/types'
import { useExtSettingsStore } from '@ext/stores/settings.store'
import { useExtSessionStore } from '@ext/stores/session.store'

export default function PopupApp() {
  const { t } = useTranslation()
  const darkMode = useExtSettingsStore((s) => s.darkMode)
  const language = useExtSettingsStore((s) => s.language)
  const selectedModel = useExtSettingsStore((s) => s.selectedModel)
  const updateSettings = useExtSettingsStore((s) => s.updateSettings)
  const loadFromStorage = useExtSettingsStore((s) => s.loadFromStorage)
  const sessions = useExtSessionStore((s) => s.sessions)
  const hydrate = useExtSessionStore((s) => s.hydrate)

  useEffect(() => {
    setLanguageProvider(() => language)
  }, [language])

  useEffect(() => {
    loadFromStorage()
    hydrate()
  }, [loadFromStorage, hydrate])

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  const recentSessions = sessions.slice(0, 5)
  const isConnected = selectedModel.length > 0

  function handleOpenSidePanel() {
    chrome.runtime.sendMessage({ type: 'OPEN_SIDEPANEL' })
  }

  function handleNewChat() {
    chrome.runtime.sendMessage({ type: 'OPEN_SIDEPANEL' })
  }

  const modelDef = MODELS.find((m) => m.id === selectedModel)

  return (
    <div className="w-[360px] min-h-[480px] flex flex-col bg-[var(--bg-page)] text-[var(--text-primary)]">
      {/* Header */}
      <header className="bg-[#002C5F] text-white px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-[#00AAA6] rounded-lg flex items-center justify-center font-bold text-sm">
              H
            </div>
            <span className="text-sm font-bold">H Chat</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-xs">
              {isConnected ? (
                <Wifi size={12} className="text-green-400" />
              ) : (
                <WifiOff size={12} className="text-red-400" />
              )}
              <span className="text-white/70">
                {isConnected ? t('ext.connected') : t('ext.disconnected')}
              </span>
            </span>
            <button
              onClick={() => updateSettings({ darkMode: !darkMode })}
              className="p-1 rounded hover:bg-white/10 transition-colors"
            >
              {darkMode ? <Sun size={14} /> : <Moon size={14} />}
            </button>
          </div>
        </div>
      </header>

      {/* Model Selector */}
      <div className="px-4 py-3 border-b border-[var(--border)]">
        <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
          {t('settings.api.defaultModel')}
        </label>
        <select
          value={selectedModel}
          onChange={(e) => updateSettings({ selectedModel: e.target.value })}
          className="w-full px-2.5 py-1.5 text-sm bg-[var(--bg-input)] border border-[var(--border-input)] rounded-lg outline-none focus:ring-1 focus:ring-[var(--primary)]"
        >
          {MODELS.map((model) => (
            <option key={model.id} value={model.id}>
              {model.label}
            </option>
          ))}
        </select>
        {modelDef && (
          <div className="flex items-center gap-1.5 mt-1.5">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: PROVIDER_COLORS[modelDef.provider as ProviderType] }}
            />
            <span className="text-xs text-[var(--text-secondary)]">
              {modelDef.provider === 'bedrock' ? 'AWS Bedrock' : modelDef.provider === 'openai' ? 'OpenAI' : 'Google Gemini'}
            </span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-4 py-3 flex gap-2">
        <button
          onClick={handleOpenSidePanel}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-[#002C5F] text-white rounded-lg text-xs font-medium hover:bg-[#002C5F]/90 transition-colors"
        >
          <MessageSquare size={14} />
          {t('ext.openSidePanel')}
        </button>
        <button
          onClick={handleNewChat}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-[#00AAA6] text-white rounded-lg text-xs font-medium hover:bg-[#00AAA6]/90 transition-colors"
        >
          <Plus size={14} />
          {t('sidebar.newChat')}
        </button>
      </div>

      {/* Recent Sessions */}
      <div className="flex-1 px-4 pb-3">
        <h3 className="text-xs font-medium text-[var(--text-secondary)] mb-2">
          {t('ext.recentSessions')}
        </h3>
        {recentSessions.length === 0 ? (
          <p className="text-xs text-[var(--text-tertiary)] text-center py-6">
            {t('ext.noSessions')}
          </p>
        ) : (
          <div className="space-y-1">
            {recentSessions.map((session) => (
              <button
                key={session.id}
                onClick={handleOpenSidePanel}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-[var(--bg-hover)] transition-colors"
              >
                <div className="text-sm truncate">{session.title}</div>
                <div className="text-xs text-[var(--text-secondary)] truncate">
                  {session.lastMessage ?? ''}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
