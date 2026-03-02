import { useState, useEffect } from 'react'
import { Key, User, Sparkles, Palette, Puzzle, Plug, Monitor, Shield, Code, X } from 'lucide-react'
import { useSettingsStore } from '@/entities/settings/settings.store'
import { SettingsTabItem } from '@/shared/ui/SettingsTabItem'
import { FormLabel } from '@/shared/ui/FormLabel'
import { FormInput } from '@/shared/ui/FormInput'
import { Button } from '@/shared/ui/Button'
import { Toggle } from '@/shared/ui/Toggle'
import { testConnection } from '@/shared/lib/bedrock-client'
import { AWS_REGIONS, DEFAULT_AWS_REGION } from '@/shared/constants'

const TABS = [
  { id: 'api-keys', label: 'API 설정', icon: Key },
  { id: 'profile', label: '프로필', icon: User },
  { id: 'features', label: '기능', icon: Sparkles },
  { id: 'customization', label: '사용자 지정', icon: Palette },
  { id: 'extensions', label: '확장', icon: Puzzle },
  { id: 'mcp', label: 'MCP', icon: Plug },
  { id: 'desktop', label: '데스크톱', icon: Monitor },
  { id: 'privacy', label: '개인정보', icon: Shield },
  { id: 'developer', label: '개발자', icon: Code },
] as const

type TestStatus = 'idle' | 'testing' | 'success' | 'error'

export function SettingsScreen() {
  const { settingsTab, setSettingsTab, setSettingsOpen, darkMode, toggleDarkMode, credentials, setCredentials } = useSettingsStore()

  const [accessKeyId, setAccessKeyId] = useState(credentials?.accessKeyId ?? '')
  const [secretAccessKey, setSecretAccessKey] = useState(credentials?.secretAccessKey ?? '')
  const [region, setRegion] = useState(credentials?.region ?? DEFAULT_AWS_REGION)
  const [testStatus, setTestStatus] = useState<TestStatus>('idle')
  const [testError, setTestError] = useState('')

  // Sync local state when credentials change externally
  useEffect(() => {
    if (credentials) {
      setAccessKeyId(credentials.accessKeyId)
      setSecretAccessKey(credentials.secretAccessKey)
      setRegion(credentials.region)
    }
  }, [credentials])

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

    const result = await testConnection(creds, 'claude-haiku-3.5')

    if (result.success) {
      setTestStatus('success')
    } else {
      setTestStatus('error')
      setTestError(result.error ?? '연결에 실패했습니다')
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

  const renderContent = () => {
    switch (settingsTab) {
      case 'api-keys':
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-text-primary">API 설정</h2>
              <p className="text-text-secondary text-sm mt-1">
                AWS Bedrock을 통해 AI 모델에 연결합니다.
              </p>
            </div>

            {/* AWS Credentials */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-text-primary">AWS 자격증명</h3>

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
                    placeholder="시크릿 키를 입력하세요"
                    value={secretAccessKey}
                    onChange={setSecretAccessKey}
                    type="password"
                  />
                </div>
              </div>

              <div>
                <FormLabel>리전</FormLabel>
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
                  {testStatus === 'testing' ? '테스트 중...' : '연결 테스트'}
                </Button>
                {credentials && (
                  <Button variant="secondary" onClick={handleClearCredentials}>
                    초기화
                  </Button>
                )}
                {testStatus === 'success' && (
                  <span className="text-xs text-success font-medium">✓ 연결 성공</span>
                )}
                {testStatus === 'error' && (
                  <span className="text-xs text-danger font-medium">✗ {testError}</span>
                )}
              </div>

              <p className="text-xs text-text-tertiary">
                자격증명은 브라우저의 localStorage에 저장됩니다.
                외부 서버로 전송되지 않으며, 로컬 Vite 프록시를 통해 AWS에 직접 연결합니다.
              </p>
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
