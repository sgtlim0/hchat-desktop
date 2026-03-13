import { createBedrockClient } from './bedrock-client'
import { getCredentials } from '@/shared/storage'
import { MSG } from '@/shared/messages'
import type { AnalysisRequest } from '@/shared/types'

chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false })
})

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  const { type, payload } = message

  if (type === MSG.ANALYZE) {
    handleAnalyze(payload as AnalysisRequest)
      .then(sendResponse)
      .catch((err) => sendResponse({ error: (err as Error).message }))
    return true
  }

  if (type === MSG.TEST_CONNECTION) {
    handleTestConnection()
      .then(sendResponse)
      .catch((err) => sendResponse({ error: (err as Error).message }))
    return true
  }

  if (type === MSG.EXTRACT_TEXT) {
    handleExtractText(payload as { tabId: number })
      .then(sendResponse)
      .catch((err) => sendResponse({ error: (err as Error).message }))
    return true
  }

  return false
})

chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== 'analyze-stream') return

  port.onMessage.addListener(async (request: AnalysisRequest) => {
    try {
      const credentials = request.credentials
      const client = createBedrockClient(credentials)

      await client.invokeStream(
        request.model,
        [{ role: 'user', content: request.content }],
        undefined,
        (text) => port.postMessage({ type: MSG.ANALYSIS_CHUNK, text }),
        (usage) => port.postMessage({ type: MSG.ANALYSIS_DONE, usage }),
      )
    } catch (err) {
      port.postMessage({
        type: MSG.ANALYSIS_ERROR,
        error: (err as Error).message,
      })
    }
  })
})

async function handleAnalyze(request: AnalysisRequest): Promise<unknown> {
  const client = createBedrockClient(request.credentials)
  const result = await client.invoke(
    request.model,
    [{ role: 'user', content: request.content }],
  )
  return {
    mode: request.mode,
    content: result.content[0]?.text ?? '',
    model: request.model,
    tokenUsage: result.usage
      ? { input: result.usage.input_tokens, output: result.usage.output_tokens }
      : undefined,
  }
}

async function handleTestConnection(): Promise<{ success: boolean; error?: string }> {
  try {
    const credentials = await getCredentials()
    if (!credentials) {
      return { success: false, error: '자격 증명이 설정되지 않았습니다.' }
    }
    const client = createBedrockClient(credentials)
    const ok = await client.testConnection()
    return ok
      ? { success: true }
      : { success: false, error: 'Bedrock 연결에 실패했습니다.' }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

async function handleExtractText(payload: { tabId: number }): Promise<{ text: string }> {
  const results = await chrome.scripting.executeScript({
    target: { tabId: payload.tabId },
    func: () => document.body.innerText,
  })
  return { text: results[0]?.result ?? '' }
}
