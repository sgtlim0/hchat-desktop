import { getCredentials, saveCredentials, getSettings, saveSettings } from '@/shared/storage'
import { sendMessage, MSG } from '@/shared/messages'
import type { Credentials } from '@/shared/types'

const $ = <T extends HTMLElement>(id: string): T =>
  document.getElementById(id) as T

const accessKeyInput = $<HTMLInputElement>('access-key')
const secretKeyInput = $<HTMLInputElement>('secret-key')
const regionSelect = $<HTMLSelectElement>('region')
const modelSelect = $<HTMLSelectElement>('model')
const btnTest = $<HTMLButtonElement>('btn-test')
const btnSave = $<HTMLButtonElement>('btn-save')
const btnSidePanel = $<HTMLButtonElement>('btn-sidepanel')
const statusDiv = $<HTMLDivElement>('status')

function showStatus(message: string, type: 'success' | 'error' | 'info'): void {
  statusDiv.classList.remove('hidden', 'bg-green-50', 'text-green-700', 'bg-red-50', 'text-red-700', 'bg-blue-50', 'text-blue-700')

  const styles: Record<string, string[]> = {
    success: ['bg-green-50', 'text-green-700'],
    error: ['bg-red-50', 'text-red-700'],
    info: ['bg-blue-50', 'text-blue-700'],
  }

  statusDiv.classList.add(...styles[type])
  statusDiv.textContent = message
}

function getFormCredentials(): Credentials {
  return {
    accessKeyId: accessKeyInput.value.trim(),
    secretAccessKey: secretKeyInput.value.trim(),
    region: regionSelect.value,
  }
}

async function loadSavedData(): Promise<void> {
  const credentials = await getCredentials()
  if (credentials) {
    accessKeyInput.value = credentials.accessKeyId
    secretKeyInput.value = credentials.secretAccessKey
    regionSelect.value = credentials.region
  }

  const settings = await getSettings()
  modelSelect.value = settings.model
}

btnTest.addEventListener('click', async () => {
  const creds = getFormCredentials()
  if (!creds.accessKeyId || !creds.secretAccessKey) {
    showStatus('Access Key와 Secret Key를 입력해주세요.', 'error')
    return
  }

  btnTest.disabled = true
  btnTest.textContent = '테스트 중...'
  showStatus('Bedrock 연결을 확인하고 있습니다...', 'info')

  try {
    await saveCredentials(creds)
    const result = await sendMessage<{ success: boolean; error?: string }>(
      MSG.TEST_CONNECTION,
    )

    if (result.success) {
      showStatus('연결 성공! Bedrock API가 정상 작동합니다.', 'success')
    } else {
      showStatus(result.error ?? '연결에 실패했습니다.', 'error')
    }
  } catch (err) {
    showStatus(`오류: ${(err as Error).message}`, 'error')
  } finally {
    btnTest.disabled = false
    btnTest.textContent = '연결 테스트'
  }
})

btnSave.addEventListener('click', async () => {
  const creds = getFormCredentials()
  if (!creds.accessKeyId || !creds.secretAccessKey) {
    showStatus('Access Key와 Secret Key를 입력해주세요.', 'error')
    return
  }

  try {
    await saveCredentials(creds)
    await saveSettings({
      model: modelSelect.value,
      language: 'ko',
      darkMode: false,
    })
    showStatus('설정이 저장되었습니다.', 'success')
  } catch (err) {
    showStatus(`저장 실패: ${(err as Error).message}`, 'error')
  }
})

btnSidePanel.addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (tab?.id) {
    await chrome.sidePanel.open({ tabId: tab.id })
    window.close()
  }
})

loadSavedData()
