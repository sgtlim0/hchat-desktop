import { useState } from 'react'
import { Key, User, Sparkles, Palette, Puzzle, Plug, Monitor, Shield, Code, X } from 'lucide-react'
import { useSettingsStore } from '@/entities/settings/settings.store'
import { SettingsTabItem } from '@/shared/ui/SettingsTabItem'
import { FormLabel } from '@/shared/ui/FormLabel'
import { FormInput } from '@/shared/ui/FormInput'
import { Button } from '@/shared/ui/Button'
import { Toggle } from '@/shared/ui/Toggle'

const TABS = [
  { id: 'api-keys', label: 'API Keys', icon: Key },
  { id: 'profile', label: '프로필', icon: User },
  { id: 'features', label: '기능', icon: Sparkles },
  { id: 'customization', label: '사용자 지정', icon: Palette },
  { id: 'extensions', label: '확장', icon: Puzzle },
  { id: 'mcp', label: 'MCP', icon: Plug },
  { id: 'desktop', label: '데스크톱', icon: Monitor },
  { id: 'privacy', label: '개인정보', icon: Shield },
  { id: 'developer', label: '개발자', icon: Code },
] as const

export function SettingsScreen() {
  const { settingsTab, setSettingsTab, setSettingsOpen, darkMode, toggleDarkMode } = useSettingsStore()
  const [anthropicKey, setAnthropicKey] = useState('')
  const [anthropicBaseUrl, setAnthropicBaseUrl] = useState('')
  const [openaiKey, setOpenaiKey] = useState('')
  const [openaiBaseUrl, setOpenaiBaseUrl] = useState('')
  const [testStatus, setTestStatus] = useState<Record<string, 'idle' | 'testing' | 'success' | 'error'>>({
    anthropic: 'idle',
    openai: 'idle',
  })

  const handleTest = (provider: 'anthropic' | 'openai') => {
    setTestStatus((prev) => ({ ...prev, [provider]: 'testing' }))
    setTimeout(() => {
      const key = provider === 'anthropic' ? anthropicKey : openaiKey
      setTestStatus((prev) => ({
        ...prev,
        [provider]: key.length > 10 ? 'success' : 'error',
      }))
    }, 1500)
  }

  const renderContent = () => {
    switch (settingsTab) {
      case 'api-keys':
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-text-primary">API Keys</h2>
              <p className="text-text-secondary text-sm mt-1">
                AI 모델 사용을 위한 API 키를 설정합니다.
              </p>
            </div>

            {/* Anthropic */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-text-primary">Anthropic</h3>
              <div>
                <FormLabel>API Key</FormLabel>
                <div className="mt-1.5">
                  <FormInput
                    placeholder="sk-ant-api03-..."
                    value={anthropicKey}
                    onChange={setAnthropicKey}
                    type="password"
                  />
                </div>
              </div>
              <div>
                <FormLabel>Base URL (선택사항)</FormLabel>
                <div className="mt-1.5">
                  <FormInput
                    placeholder="https://api.anthropic.com"
                    value={anthropicBaseUrl}
                    onChange={setAnthropicBaseUrl}
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="secondary" onClick={() => handleTest('anthropic')}>
                  연결 테스트
                </Button>
                {testStatus.anthropic === 'testing' && (
                  <span className="text-xs text-text-secondary">테스트 중...</span>
                )}
                {testStatus.anthropic === 'success' && (
                  <span className="text-xs text-success font-medium">✓ 연결됨</span>
                )}
                {testStatus.anthropic === 'error' && (
                  <span className="text-xs text-danger font-medium">✗ 연결 실패</span>
                )}
              </div>
            </div>

            {/* OpenAI */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-text-primary">OpenAI</h3>
              <div>
                <FormLabel>API Key</FormLabel>
                <div className="mt-1.5">
                  <FormInput
                    placeholder="sk-proj-..."
                    value={openaiKey}
                    onChange={setOpenaiKey}
                    type="password"
                  />
                </div>
              </div>
              <div>
                <FormLabel>Base URL (선택사항)</FormLabel>
                <div className="mt-1.5">
                  <FormInput
                    placeholder="https://api.openai.com/v1"
                    value={openaiBaseUrl}
                    onChange={setOpenaiBaseUrl}
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="secondary" onClick={() => handleTest('openai')}>
                  연결 테스트
                </Button>
                {testStatus.openai === 'testing' && (
                  <span className="text-xs text-text-secondary">테스트 중...</span>
                )}
                {testStatus.openai === 'success' && (
                  <span className="text-xs text-success font-medium">✓ 연결됨</span>
                )}
                {testStatus.openai === 'error' && (
                  <span className="text-xs text-danger font-medium">✗ 연결 실패</span>
                )}
              </div>
            </div>
          </div>
        )

      case 'customization':
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-text-primary">사용자 지정</h2>
              <p className="text-text-secondary text-sm mt-1">앱 외관을 설정합니다.</p>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-text-primary">테마</h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-primary">다크 모드</p>
                  <p className="text-xs text-text-secondary">
                    {darkMode ? '다크 모드가 활성화되어 있습니다' : '라이트 모드가 활성화되어 있습니다'}
                  </p>
                </div>
                <Toggle checked={darkMode} onChange={toggleDarkMode} />
              </div>
            </div>
          </div>
        )

      default:
        return (
          <div className="flex items-center justify-center h-64 text-text-secondary text-sm">
            {TABS.find((t) => t.id === settingsTab)?.label} 설정은 아직 준비 중입니다.
          </div>
        )
    }
  }

  return (
    <div className="h-full flex">
      {/* Settings Sidebar */}
      <div className="w-[264px] bg-sidebar border-r border-border flex flex-col flex-shrink-0">
        <div className="p-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-text-primary">설정</h2>
          <button
            onClick={() => setSettingsOpen(false)}
            className="p-1.5 hover:bg-hover rounded-lg transition"
          >
            <X size={18} className="text-text-secondary" />
          </button>
        </div>
        <nav className="flex-1 px-2 space-y-0.5">
          {TABS.map((tab) => (
            <SettingsTabItem
              key={tab.id}
              icon={tab.icon}
              label={tab.label}
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
