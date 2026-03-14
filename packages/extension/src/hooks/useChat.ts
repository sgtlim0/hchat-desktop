import { useCallback, useRef } from 'react'
import type { Message } from '@hchat/shared/types/core'
import type { ExtStreamChunk, ExtStreamEnd, ExtStreamError } from '@ext/shared/types'
import { useExtSessionStore } from '@ext/stores/session.store'
import { useExtSettingsStore } from '@ext/stores/settings.store'
import { useExtUsageStore } from '@ext/stores/usage.store'
import { useExtToastStore } from '@ext/stores/toast.store'

export function useChat() {
  const portRef = useRef<chrome.runtime.Port | null>(null)

  const addMessage = useExtSessionStore((s) => s.addMessage)
  const updateLastMessage = useExtSessionStore((s) => s.updateLastMessage)
  const setStreaming = useExtSessionStore((s) => s.setStreaming)
  const isStreaming = useExtSessionStore((s) => s.isStreaming)
  const selectedModel = useExtSettingsStore((s) => s.selectedModel)
  const addUsage = useExtUsageStore((s) => s.addUsage)
  const addToast = useExtToastStore((s) => s.addToast)

  const sendMessage = useCallback(
    (sessionId: string, userText: string, existingMessages: Message[], systemPrompt?: string) => {
      // Add user message
      const userMessage: Message = {
        id: `msg-${Date.now()}-user`,
        sessionId,
        role: 'user',
        segments: [{ type: 'text', content: userText }],
        createdAt: new Date().toISOString(),
      }
      addMessage(sessionId, userMessage)

      // Add empty assistant message for streaming
      const assistantId = `msg-${Date.now()}-assistant`
      const assistantMessage: Message = {
        id: assistantId,
        sessionId,
        role: 'assistant',
        segments: [{ type: 'text', content: '' }],
        createdAt: new Date().toISOString(),
      }
      addMessage(sessionId, assistantMessage)
      setStreaming(true)

      // Build messages array for API
      const apiMessages = [
        ...existingMessages.map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.segments.map((s) => s.content ?? '').join(''),
        })),
        { role: 'user' as const, content: userText },
      ]

      // Create port connection to background
      const port = chrome.runtime.connect({ name: 'chat-stream' })
      portRef.current = port

      port.postMessage({
        type: 'stream-start',
        modelId: selectedModel,
        messages: apiMessages,
        system: systemPrompt,
        sessionId,
      })

      port.onMessage.addListener((message: ExtStreamChunk | ExtStreamEnd | ExtStreamError) => {
        if (message.type === 'stream-chunk') {
          updateLastMessage(sessionId, (msg) => ({
            ...msg,
            segments: [
              {
                type: 'text',
                content: (msg.segments[0]?.content ?? '') + message.text,
              },
            ],
          }))
        }

        if (message.type === 'stream-end') {
          setStreaming(false)
          portRef.current = null
          if (message.usage) {
            addUsage({
              modelId: selectedModel,
              inputTokens: message.usage.inputTokens,
              outputTokens: message.usage.outputTokens,
            })
          }
        }

        if (message.type === 'stream-error') {
          setStreaming(false)
          portRef.current = null
          addToast('error', message.error)
          updateLastMessage(sessionId, (msg) => ({
            ...msg,
            segments: [{ type: 'text', content: `Error: ${message.error}` }],
          }))
        }
      })

      port.onDisconnect.addListener(() => {
        setStreaming(false)
        portRef.current = null
      })
    },
    [selectedModel, addMessage, updateLastMessage, setStreaming, addUsage, addToast],
  )

  const stopStreaming = useCallback(
    (sessionId: string) => {
      if (portRef.current) {
        portRef.current.disconnect()
        portRef.current = null
      }
      chrome.runtime.sendMessage({ type: 'ABORT_STREAM', sessionId })
      setStreaming(false)
    },
    [setStreaming],
  )

  return { sendMessage, stopStreaming, isStreaming }
}
