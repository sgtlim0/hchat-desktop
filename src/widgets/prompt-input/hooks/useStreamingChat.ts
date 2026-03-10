import { useRef, useCallback } from 'react'
import { useSessionStore } from '@/entities/session/session.store'
import { useSettingsStore } from '@/entities/settings/settings.store'
import { useTranslation } from '@/shared/i18n'
import { createStream, getProviderConfig } from '@/shared/lib/providers/factory'
import { createStreamThrottle } from '@/shared/lib/stream-throttle'
import { putMessage } from '@/shared/lib/db'

export function useStreamingChat() {
  const { t } = useTranslation()
  const abortRef = useRef<AbortController | null>(null)
  const updateLastMessage = useSessionStore((s) => s.updateLastMessage)
  const setSessionStreaming = useSessionStore((s) => s.setSessionStreaming)
  const credentials = useSettingsStore((s) => s.credentials)
  const openaiApiKey = useSettingsStore((s) => s.openaiApiKey)
  const geminiApiKey = useSettingsStore((s) => s.geminiApiKey)

  const streamResponse = useCallback(
    async (
      sessionId: string,
      assistantMessageId: string,
      chatHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
      effectiveModel: string,
      systemPrompt?: string
    ): Promise<{ fullText: string; inputTokens: number | null; outputTokens: number | null }> => {
      const config = getProviderConfig(effectiveModel, { credentials, openaiApiKey, geminiApiKey })
      const abortController = new AbortController()
      abortRef.current = abortController

      let fullText = ''
      let inputTokens: number | null = null
      let outputTokens: number | null = null
      const throttle = createStreamThrottle()

      try {
        const stream = createStream(config, {
          modelId: effectiveModel,
          messages: chatHistory,
          signal: abortController.signal,
          system: systemPrompt,
        })

        for await (const event of stream) {
          if (event.type === 'text' && event.content) {
            fullText += event.content
            throttle.update(fullText, (text) => {
              updateLastMessage(sessionId, assistantMessageId, (msg) => ({
                ...msg,
                segments: [{ type: 'text', content: text }],
              }))
            })
          } else if (event.type === 'usage') {
            inputTokens = event.inputTokens ?? null
            outputTokens = event.outputTokens ?? null
          } else if (event.type === 'error') {
            fullText = t('chat.errorOccurred', { error: event.error ?? 'Unknown' })
            updateLastMessage(sessionId, assistantMessageId, (msg) => ({
              ...msg,
              segments: [{ type: 'text', content: fullText }],
            }))
          }
        }
      } catch (error) {
        if (!(error instanceof DOMException && error.name === 'AbortError')) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error'
          fullText = fullText || t('chat.errorOccurred', { error: errorMsg })
          updateLastMessage(sessionId, assistantMessageId, (msg) => ({
            ...msg,
            segments: [{ type: 'text', content: fullText }],
          }))
        }
      } finally {
        throttle.flush((text) => {
          updateLastMessage(sessionId, assistantMessageId, (msg) => ({
            ...msg,
            segments: [{ type: 'text', content: text }],
          }))
        })
        abortRef.current = null
        setSessionStreaming(sessionId, false)

        const finalMessages = useSessionStore.getState().messages[sessionId] ?? []
        const finalAssistant = finalMessages.find((m) => m.id === assistantMessageId)
        if (finalAssistant) putMessage(finalAssistant).catch(console.error)
      }

      return { fullText, inputTokens, outputTokens }
    },
    [t, updateLastMessage, setSessionStreaming, credentials, openaiApiKey, geminiApiKey]
  )

  const abortStream = useCallback(() => {
    abortRef.current?.abort()
  }, [])

  const isStreaming = useCallback(() => {
    return abortRef.current !== null
  }, [])

  return { streamResponse, abortStream, isStreaming }
}