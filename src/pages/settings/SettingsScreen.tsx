import { useState, useEffect } from 'react'
import { Key, User, Sparkles, Palette, Puzzle, Plug, Monitor, Shield, Code, X, Radio } from 'lucide-react'
import { useSettingsStore } from '@/entities/settings/settings.store'
import { useChannelStore } from '@/entities/channel/channel.store'
import { SettingsTabItem } from '@/shared/ui/SettingsTabItem'
import { FormLabel } from '@/shared/ui/FormLabel'
import { FormInput } from '@/shared/ui/FormInput'
import { Button } from '@/shared/ui/Button'
import { Toggle } from '@/shared/ui/Toggle'
import { testConnection } from '@/shared/lib/bedrock-client'
import { AWS_REGIONS, DEFAULT_AWS_REGION, MODELS } from '@/shared/constants'

const TABS = [
  { id: 'api-keys', label: 'API 설정', icon: Key },
  { id: 'profile', label: '프로필', icon: User },
  { id: 'features', label: '기능', icon: Sparkles },
  { id: 'customization', label: '사용자 지정', icon: Palette },
  { id: 'extensions', label: '확장', icon: Puzzle },
  { id: 'mcp', label: 'MCP', icon: Plug },
  { id: 'channels', label: '채널 연동', icon: Radio },
  { id: 'desktop', label: '데스크톱', icon: Monitor },
  { id: 'privacy', label: '개인정보', icon: Shield },
  { id: 'developer', label: '개발자', icon: Code },
] as const

type TestStatus = 'idle' | 'testing' | 'success' | 'error'

export function SettingsScreen() {
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
        setTestErrorOpenai('API 키가 유효하지 않습니다')
      }
    } catch (error) {
      setTestStatusOpenai('error')
      setTestErrorOpenai('연결에 실패했습니다')
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
        setTestErrorGemini('API 키가 유효하지 않습니다')
      }
    } catch (error) {
      setTestStatusGemini('error')
      setTestErrorGemini('연결에 실패했습니다')
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
              <h2 className="text-2xl font-bold text-text-primary">API 설정</h2>
              <p className="text-text-secondary text-sm mt-1">
                AI 모델 제공업체에 연결합니다.
              </p>
            </div>

            {/* Model Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-text-primary">모델 설정</h3>

              <div>
                <FormLabel>기본 모델</FormLabel>
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
                  <p className="text-sm text-text-primary font-medium">자동 라우팅</p>
                  <p className="text-xs text-text-secondary mt-0.5">
                    프롬프트 내용에 따라 최적 모델을 자동 선택합니다
                  </p>
                </div>
                <Toggle checked={autoRouting} onChange={setAutoRouting} />
              </div>
            </div>

            {/* AWS Credentials */}
            <div className="space-y-4 pt-6 border-t border-border">
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
                  {testStatusOpenai === 'testing' ? '테스트 중...' : '연결 테스트'}
                </Button>
                {openaiApiKey && (
                  <Button variant="secondary" onClick={handleClearOpenai}>
                    초기화
                  </Button>
                )}
                {testStatusOpenai === 'success' && (
                  <span className="text-xs text-success font-medium">✓ 연결 성공</span>
                )}
                {testStatusOpenai === 'error' && (
                  <span className="text-xs text-danger font-medium">✗ {testErrorOpenai}</span>
                )}
              </div>

              <p className="text-xs text-text-tertiary">
                API 키는 브라우저에 저장되며 OpenAI API에 직접 연결합니다.
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
                  {testStatusGemini === 'testing' ? '테스트 중...' : '연결 테스트'}
                </Button>
                {geminiApiKey && (
                  <Button variant="secondary" onClick={handleClearGemini}>
                    초기화
                  </Button>
                )}
                {testStatusGemini === 'success' && (
                  <span className="text-xs text-success font-medium">✓ 연결 성공</span>
                )}
                {testStatusGemini === 'error' && (
                  <span className="text-xs text-danger font-medium">✗ {testErrorGemini}</span>
                )}
              </div>

              <p className="text-xs text-text-tertiary">
                API 키는 브라우저에 저장되며 Google API에 직접 연결합니다.
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

      case 'channels':
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-text-primary">채널 연동</h2>
              <p className="text-text-secondary text-sm mt-1">
                외부 메시징 서비스와 연동하여 알림을 받을 수 있습니다.
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
                <FormLabel>채널</FormLabel>
                <div className="mt-1.5">
                  <FormInput
                    placeholder="#general"
                    value={slack.channel}
                    onChange={(val) => updateSlack({ channel: val })}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-medium text-text-primary">알림 규칙</h4>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-secondary">작업 완료 시</span>
                  <Toggle checked={slack.notifyOnComplete} onChange={(v) => updateSlack({ notifyOnComplete: v })} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-secondary">에러 발생 시</span>
                  <Toggle checked={slack.notifyOnError} onChange={(v) => updateSlack({ notifyOnError: v })} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-secondary">스케줄 실행 시</span>
                  <Toggle checked={slack.notifyOnSchedule} onChange={(v) => updateSlack({ notifyOnSchedule: v })} />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant="secondary"
                  onClick={testSlackConnection}
                  disabled={!slack.webhookUrl || channelTestStatus === 'testing'}
                >
                  {channelTestStatus === 'testing' ? '테스트 중...' : '연결 테스트'}
                </Button>
                <Button variant="primary" disabled={!slack.webhookUrl}>
                  저장
                </Button>
                {channelTestStatus === 'success' && (
                  <span className="text-xs text-success font-medium">연결 성공</span>
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
                  {telegram.connected ? '재연결' : '연결'}
                </Button>
                {telegram.connected && (
                  <span className="text-xs text-success font-medium">연결됨</span>
                )}
              </div>
            </div>

            {/* Message Preview */}
            <div className="pt-4 border-t border-border">
              <h3 className="text-sm font-semibold text-text-primary mb-3">메시지 미리보기</h3>
              <div className="bg-page border border-border rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded bg-primary/20 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-primary">H</span>
                  </div>
                  <span className="text-sm font-semibold text-text-primary">H Chat Bot</span>
                  <span className="text-[11px] text-text-tertiary">오후 3:24</span>
                </div>
                <p className="text-sm text-text-secondary">
                  [스케줄 완료] 일일 코드 리뷰 요약이 완료되었습니다. 3개 커밋 분석, 주요 이슈 없음.
                </p>
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
