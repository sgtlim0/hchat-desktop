// Message type constants for background SW <-> UI communication
export const MSG = {
  GET_PAGE_CONTENT: 'GET_PAGE_CONTENT',
  PAGE_CONTENT: 'PAGE_CONTENT',
  START_STREAM: 'START_STREAM',
  STREAM_CHUNK: 'STREAM_CHUNK',
  STREAM_DONE: 'STREAM_DONE',
  STREAM_ERROR: 'STREAM_ERROR',
  QUICK_ACTION: 'QUICK_ACTION',
  OPEN_SIDE_PANEL: 'OPEN_SIDE_PANEL',
  STOP_STREAM: 'STOP_STREAM',
} as const

export type MessageType = typeof MSG[keyof typeof MSG]

export interface StreamChunkPayload {
  streamId: string
  event: {
    type: 'text' | 'done' | 'error' | 'usage'
    content?: string
    error?: string
    usage?: { inputTokens: number; outputTokens: number }
  }
}

export interface QuickActionPayload {
  action: string
  selectedText: string
  tabId: number
}

export interface ExtMessage {
  type: MessageType
  payload?: unknown
}

export function sendToBackground(message: ExtMessage): void {
  chrome.runtime.sendMessage(message)
}

export function requestPageContent(tabId: number): Promise<{
  title: string
  url: string
  content: string
  selectedText: string
} | null> {
  return new Promise((resolve) => {
    chrome.tabs.sendMessage(tabId, { type: 'GET_PAGE' }, (response) => {
      if (chrome.runtime.lastError) {
        resolve(null)
      } else {
        resolve(response)
      }
    })
  })
}

export function createStreamListener(
  streamId: string,
  onChunk: (text: string) => void,
  onDone: () => void,
  onError: (error: string) => void,
  onUsage?: (usage: { inputTokens: number; outputTokens: number }) => void,
): () => void {
  const listener = (message: ExtMessage) => {
    const payload = message.payload as StreamChunkPayload | undefined
    if (!payload || payload.streamId !== streamId) return

    switch (message.type) {
      case MSG.STREAM_CHUNK: {
        const event = payload.event
        if (event.type === 'text' && event.content) {
          onChunk(event.content)
        } else if (event.type === 'usage' && event.usage && onUsage) {
          onUsage(event.usage)
        } else if (event.type === 'done') {
          onDone()
          chrome.runtime.onMessage.removeListener(listener)
        } else if (event.type === 'error') {
          onError(event.error || 'Unknown error')
          chrome.runtime.onMessage.removeListener(listener)
        }
        break
      }
      case MSG.STREAM_DONE:
        onDone()
        chrome.runtime.onMessage.removeListener(listener)
        break
      case MSG.STREAM_ERROR:
        onError((payload as unknown as { error: string }).error || 'Stream error')
        chrome.runtime.onMessage.removeListener(listener)
        break
    }
  }

  chrome.runtime.onMessage.addListener(listener)

  // Return cleanup function
  return () => chrome.runtime.onMessage.removeListener(listener)
}
