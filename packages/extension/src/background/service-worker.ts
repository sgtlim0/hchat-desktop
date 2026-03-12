// Background Service Worker — Chrome Extension MV3
// Handles context menus, message routing, and SSE streaming

export type MessageType =
  | 'GET_PAGE_CONTENT'
  | 'PAGE_CONTENT'
  | 'START_STREAM'
  | 'STREAM_CHUNK'
  | 'STREAM_DONE'
  | 'STREAM_ERROR'
  | 'QUICK_ACTION'
  | 'OPEN_SIDE_PANEL'
  | 'STOP_STREAM'

export interface ExtMessage {
  type: MessageType
  payload?: unknown
}

interface StreamRequest {
  streamId: string
  modelId: string
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
  system?: string
  provider: string
  credentials?: { accessKeyId: string; secretAccessKey: string; region: string }
  apiKey?: string
}

interface StreamEvent {
  type: 'text' | 'done' | 'error' | 'usage'
  content?: string
  error?: string
  usage?: { inputTokens: number; outputTokens: number }
}

const DEFAULT_API_BASE = 'https://sgtlim0--hchat-api-api.modal.run'

// Track active streams for abort
const activeStreams = new Map<string, AbortController>()

// API base URL — loaded from storage
let apiBaseUrl = DEFAULT_API_BASE

chrome.storage.sync.get(['apiBaseUrl'], (result) => {
  apiBaseUrl = result.apiBaseUrl || DEFAULT_API_BASE
})

// Listen for storage changes
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && changes.apiBaseUrl) {
    apiBaseUrl = changes.apiBaseUrl.newValue || DEFAULT_API_BASE
  }
})

// Context menu setup
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'hchat-summarize',
    title: 'H Chat: Summarize',
    contexts: ['page', 'selection'],
  })
  chrome.contextMenus.create({
    id: 'hchat-translate',
    title: 'H Chat: Translate',
    contexts: ['selection'],
  })
  chrome.contextMenus.create({
    id: 'hchat-explain',
    title: 'H Chat: Explain',
    contexts: ['selection'],
  })
  chrome.contextMenus.create({
    id: 'hchat-ask',
    title: 'H Chat: Ask AI',
    contexts: ['page', 'selection'],
  })
})

// Context menu click handler
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab?.id) return

  const action = info.menuItemId.toString().replace('hchat-', '')
  const selectedText = info.selectionText || ''

  // Open side panel
  await chrome.sidePanel.open({ tabId: tab.id })

  // Send action to side panel after it loads
  setTimeout(() => {
    chrome.runtime.sendMessage({
      type: 'QUICK_ACTION',
      payload: { action, selectedText, tabId: tab.id },
    })
  }, 500)
})

// Message handler
chrome.runtime.onMessage.addListener(
  (message: ExtMessage, _sender, sendResponse) => {
    switch (message.type) {
      case 'GET_PAGE_CONTENT': {
        const payload = message.payload as { tabId: number }
        chrome.tabs.sendMessage(
          payload.tabId,
          { type: 'GET_PAGE' },
          (response) => {
            sendResponse(response)
          },
        )
        return true // async response
      }

      case 'START_STREAM': {
        handleStartStream(message.payload as StreamRequest)
        return false
      }

      case 'STOP_STREAM': {
        const { streamId } = message.payload as { streamId: string }
        const controller = activeStreams.get(streamId)
        if (controller) {
          controller.abort()
          activeStreams.delete(streamId)
        }
        return false
      }

      default:
        return false
    }
  },
)

async function handleStartStream(request: StreamRequest): Promise<void> {
  const { streamId, modelId, messages, system } = request
  const controller = new AbortController()
  activeStreams.set(streamId, controller)

  try {
    // Determine endpoint based on provider
    let endpoint = `${apiBaseUrl}/api/chat`
    const body: Record<string, unknown> = { modelId, messages, system }

    if (request.provider === 'openai') {
      endpoint = `${apiBaseUrl}/api/openai/chat`
    } else if (request.provider === 'gemini') {
      endpoint = `${apiBaseUrl}/api/gemini/chat`
    } else {
      body.credentials = request.credentials
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    })

    if (!response.ok) {
      chrome.runtime.sendMessage({
        type: 'STREAM_ERROR',
        payload: {
          streamId,
          error: `HTTP ${response.status}: ${response.statusText}`,
        },
      })
      return
    }

    const reader = response.body?.getReader()
    if (!reader) {
      chrome.runtime.sendMessage({
        type: 'STREAM_ERROR',
        payload: { streamId, error: 'No response body' },
      })
      return
    }

    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed.startsWith('data: ')) continue

        try {
          const event = JSON.parse(trimmed.slice(6)) as StreamEvent
          chrome.runtime.sendMessage({
            type: 'STREAM_CHUNK',
            payload: { streamId, event },
          })

          if (event.type === 'done' || event.type === 'error') {
            activeStreams.delete(streamId)
            return
          }
        } catch {
          // Skip malformed JSON lines
        }
      }
    }

    chrome.runtime.sendMessage({
      type: 'STREAM_DONE',
      payload: { streamId },
    })
  } catch (error) {
    if ((error as Error).name !== 'AbortError') {
      chrome.runtime.sendMessage({
        type: 'STREAM_ERROR',
        payload: {
          streamId,
          error: (error as Error).message || 'Stream failed',
        },
      })
    }
  } finally {
    activeStreams.delete(streamId)
  }
}

// Enable side panel on action click
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch(() => {
    // Fallback if sidePanel API not available
  })
