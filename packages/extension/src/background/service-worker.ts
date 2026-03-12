// Background Service Worker — Chrome Extension MV3
// Handles context menus, message routing, and Bedrock streaming

import { BedrockRuntimeClient, InvokeModelWithResponseStreamCommand } from '@aws-sdk/client-bedrock-runtime'

const BEDROCK_MODEL_MAP: Record<string, string> = {
  'claude-opus-4.6': 'us.anthropic.claude-opus-4-6-v1',
  'claude-sonnet-4.6': 'us.anthropic.claude-sonnet-4-6',
  'claude-haiku-4.5': 'us.anthropic.claude-haiku-4-5-20251001-v1:0',
}

export type MessageType =
  | 'GET_PAGE_CONTENT' | 'START_STREAM' | 'STREAM_CHUNK'
  | 'STREAM_DONE' | 'STREAM_ERROR' | 'QUICK_ACTION'
  | 'OPEN_SIDE_PANEL' | 'STOP_STREAM'

export interface ExtMessage {
  type: MessageType
  payload?: unknown
}

interface StreamRequest {
  streamId: string
  modelId: string
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
  system?: string
  accessKeyId: string
  secretAccessKey: string
  region?: string
}

const activeStreams = new Map<string, AbortController>()

// Context menus
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({ id: 'hchat-summarize', title: 'H Chat: Summarize', contexts: ['page', 'selection'] })
  chrome.contextMenus.create({ id: 'hchat-translate', title: 'H Chat: Translate', contexts: ['selection'] })
  chrome.contextMenus.create({ id: 'hchat-explain', title: 'H Chat: Explain', contexts: ['selection'] })
  chrome.contextMenus.create({ id: 'hchat-ask', title: 'H Chat: Ask AI', contexts: ['page', 'selection'] })
})

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab?.id) return
  const action = info.menuItemId.toString().replace('hchat-', '')
  const selectedText = info.selectionText || ''
  await chrome.sidePanel.open({ tabId: tab.id })
  setTimeout(() => {
    chrome.runtime.sendMessage({ type: 'QUICK_ACTION', payload: { action, selectedText, tabId: tab.id } })
  }, 500)
})

// Message handler
chrome.runtime.onMessage.addListener((message: ExtMessage, _sender, sendResponse) => {
  switch (message.type) {
    case 'GET_PAGE_CONTENT': {
      const payload = message.payload as { tabId: number }
      chrome.tabs.sendMessage(payload.tabId, { type: 'GET_PAGE' }, (response) => {
        sendResponse(response)
      })
      return true
    }
    case 'START_STREAM': {
      handleStartStream(message.payload as StreamRequest)
      return false
    }
    case 'STOP_STREAM': {
      const { streamId } = message.payload as { streamId: string }
      const controller = activeStreams.get(streamId)
      if (controller) { controller.abort(); activeStreams.delete(streamId) }
      return false
    }
    default:
      return false
  }
})

async function handleStartStream(request: StreamRequest): Promise<void> {
  const { streamId, modelId, messages, system, accessKeyId, secretAccessKey, region } = request
  const controller = new AbortController()
  activeStreams.set(streamId, controller)

  try {
    const client = new BedrockRuntimeClient({
      region: region || 'us-east-1',
      credentials: { accessKeyId, secretAccessKey },
    })

    const bedrockModelId = BEDROCK_MODEL_MAP[modelId] ?? modelId

    const command = new InvokeModelWithResponseStreamCommand({
      modelId: bedrockModelId,
      contentType: 'application/json',
      body: JSON.stringify({
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 4096,
        system,
        messages,
      }),
    })

    const response = await client.send(command, { abortSignal: controller.signal })

    let inputTokens = 0
    let outputTokens = 0

    if (response.body) {
      for await (const event of response.body) {
        if (event.chunk?.bytes) {
          const text = new TextDecoder().decode(event.chunk.bytes)
          const data = JSON.parse(text)

          if (data.type === 'content_block_delta' && data.delta?.text) {
            chrome.runtime.sendMessage({
              type: 'STREAM_CHUNK',
              payload: { streamId, event: { type: 'text', content: data.delta.text } },
            })
          } else if (data.type === 'message_delta' && data.usage) {
            outputTokens = data.usage.output_tokens || 0
          } else if (data.type === 'message_start' && data.message?.usage) {
            inputTokens = data.message.usage.input_tokens || 0
          } else if (data.type === 'message_stop') {
            if (inputTokens || outputTokens) {
              chrome.runtime.sendMessage({
                type: 'STREAM_CHUNK',
                payload: { streamId, event: { type: 'usage', usage: { inputTokens, outputTokens } } },
              })
            }
            chrome.runtime.sendMessage({ type: 'STREAM_DONE', payload: { streamId } })
            return
          }
        }
      }
    }

    chrome.runtime.sendMessage({ type: 'STREAM_DONE', payload: { streamId } })
  } catch (error) {
    if ((error as Error).name !== 'AbortError') {
      chrome.runtime.sendMessage({
        type: 'STREAM_ERROR',
        payload: { streamId, error: (error as Error).message || 'Bedrock call failed' },
      })
    }
  } finally {
    activeStreams.delete(streamId)
  }
}

chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {})
