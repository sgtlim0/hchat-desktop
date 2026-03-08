import { useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { useToolIntegrationStore } from '@/entities/tool-integration/tool-integration.store'
import { FormLabel } from '@/shared/ui/FormLabel'
import { FormInput } from '@/shared/ui/FormInput'
import { Button } from '@/shared/ui/Button'
import { useToastStore } from '@/entities/toast/toast.store'

export function ToolIntegrationSection() {
  const [shareCredentials, setShareCredentials] = useState(false)
  const [testingConfluence, setTestingConfluence] = useState(false)
  const [testingJira, setTestingJira] = useState(false)

  const { addToast } = useToastStore()

  const {
    confluence,
    jira,
    updateConfluence,
    updateJira,
    shareCredentials: shareCredentialsAction,
    testConnection
  } = useToolIntegrationStore(
    useShallow((state) => ({
      confluence: state.confluence,
      jira: state.jira,
      updateConfluence: state.updateConfluence,
      updateJira: state.updateJira,
      shareCredentials: state.shareCredentials,
      testConnection: state.testConnection
    }))
  )

  const handleShareCredentialsChange = (checked: boolean) => {
    setShareCredentials(checked)
    if (checked) {
      shareCredentialsAction()
    }
  }

  const handleTestConfluence = async () => {
    setTestingConfluence(true)
    try {
      const success = await testConnection('confluence')
      if (success) {
        addToast({ message: 'Confluence 연결 성공', type: 'success' })
      } else {
        addToast({ message: 'Confluence 연결 실패: 입력 정보를 확인하세요', type: 'error' })
      }
    } catch {
      addToast({ message: 'Confluence 연결 테스트 중 오류 발생', type: 'error' })
    } finally {
      setTestingConfluence(false)
    }
  }

  const handleTestJira = async () => {
    setTestingJira(true)
    try {
      const success = await testConnection('jira')
      if (success) {
        addToast({ message: 'Jira 연결 성공', type: 'success' })
      } else {
        addToast({ message: 'Jira 연결 실패: 입력 정보를 확인하세요', type: 'error' })
      }
    } catch {
      addToast({ message: 'Jira 연결 테스트 중 오류 발생', type: 'error' })
    } finally {
      setTestingJira(false)
    }
  }

  const StatusDot = ({ connected }: { connected: boolean }) => {
    if (connected) {
      return <CheckCircle2 className="w-4 h-4 text-green-500" />
    }
    return <XCircle className="w-4 h-4 text-text-tertiary" />
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-text-primary">도구 연동</h3>

      {/* Confluence Section */}
      <div className="bg-card rounded-lg p-4 border border-border">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm font-medium text-text-primary">Confluence</span>
          <StatusDot connected={confluence.connected} />
        </div>

        <div className="space-y-3">
          <div>
            <FormLabel className="block mb-1.5">Base URL</FormLabel>
            <FormInput
              placeholder="https://company.atlassian.net"
              value={confluence.baseUrl}
              onChange={(value) => updateConfluence({ baseUrl: value })}
            />
          </div>

          <div>
            <FormLabel className="block mb-1.5">Email</FormLabel>
            <FormInput
              placeholder="user@company.com"
              value={confluence.email}
              onChange={(value) => updateConfluence({ email: value })}
            />
          </div>

          <div>
            <FormLabel className="block mb-1.5">API Token</FormLabel>
            <FormInput
              type="password"
              placeholder="ATAT..."
              value={confluence.apiToken}
              onChange={(value) => updateConfluence({ apiToken: value })}
            />
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleTestConfluence}
            disabled={testingConfluence || !confluence.baseUrl || !confluence.email || !confluence.apiToken}
            className="w-full"
          >
            {testingConfluence ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                연결 테스트 중...
              </>
            ) : (
              '연결 테스트'
            )}
          </Button>
        </div>
      </div>

      {/* Jira Section */}
      <div className="bg-card rounded-lg p-4 border border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-text-primary">Jira</span>
            <StatusDot connected={jira.connected} />
          </div>
          <label className="flex items-center gap-1.5 text-xs text-text-secondary cursor-pointer">
            <input
              type="checkbox"
              checked={shareCredentials}
              onChange={(e) => handleShareCredentialsChange(e.target.checked)}
              className="w-3.5 h-3.5 rounded border-border-input text-primary focus:ring-1 focus:ring-primary/30"
            />
            <span>같은 계정 사용</span>
          </label>
        </div>

        <div className="space-y-3">
          <div>
            <FormLabel className="block mb-1.5">Base URL</FormLabel>
            <FormInput
              placeholder="https://company.atlassian.net"
              value={jira.baseUrl}
              onChange={(value) => updateJira({ baseUrl: value })}
              disabled={shareCredentials}
            />
          </div>

          <div>
            <FormLabel className="block mb-1.5">Email</FormLabel>
            <FormInput
              placeholder="user@company.com"
              value={jira.email}
              onChange={(value) => updateJira({ email: value })}
              disabled={shareCredentials}
            />
          </div>

          <div>
            <FormLabel className="block mb-1.5">API Token</FormLabel>
            <FormInput
              type="password"
              placeholder="ATAT..."
              value={jira.apiToken}
              onChange={(value) => updateJira({ apiToken: value })}
              disabled={shareCredentials}
            />
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleTestJira}
            disabled={testingJira || !jira.baseUrl || !jira.email || !jira.apiToken}
            className="w-full"
          >
            {testingJira ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                연결 테스트 중...
              </>
            ) : (
              '연결 테스트'
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}