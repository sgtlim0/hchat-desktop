import { useState, useCallback, useRef, useEffect } from 'react'

interface StreamParams {
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

export function useStreamingChat() {
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingText, setStreamingText] = useState('')
  const streamIdRef = useRef<string | null>(null)
  const listenerRef = useRef<((msg: { type?: string; payload?: { streamId?: string; event?: StreamEvent; error?: string } }) => void) | null>(null)

  useEffect(() => {
    return () => {
      if (listenerRef.current) {
        chrome.runtime.onMessage.removeListener(listenerRef.current)
      }
    }
  }, [])

  const sendMessage = useCallback((params: StreamParams) => {
    const streamId = crypto.randomUUID()
    streamIdRef.current = streamId
    setIsStreaming(true)
    setStreamingText('')

    if (listenerRef.current) {
      chrome.runtime.onMessage.removeListener(listenerRef.current)
    }

    const listener = (message: { type?: string; payload?: { streamId?: string; event?: StreamEvent; error?: string } }) => {
      if (!message?.payload || message.payload.streamId !== streamId) return

      switch (message.type) {
        case 'STREAM_CHUNK': {
          const event = message.payload.event
          if (event?.type === 'text' && event.content) {
            setStreamingText(prev => prev + event.content)
          }
          break
        }
        case 'STREAM_DONE':
        case 'STREAM_ERROR': {
          setIsStreaming(false)
          chrome.runtime.onMessage.removeListener(listener)
          listenerRef.current = null
          break
        }
      }
    }

    listenerRef.current = listener
    chrome.runtime.onMessage.addListener(listener)

    chrome.runtime.sendMessage({
      type: 'START_STREAM',
      payload: { streamId, ...params },
    })
  }, [])

  const stopStreaming = useCallback(() => {
    if (streamIdRef.current) {
      chrome.runtime.sendMessage({
        type: 'STOP_STREAM',
        payload: { streamId: streamIdRef.current },
      })
      setIsStreaming(false)
    }
  }, [])

  return { isStreaming, streamingText, sendMessage, stopStreaming }
}
