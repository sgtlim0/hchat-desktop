import { useSessionStore } from '@/entities/session/session.store'
import { useSettingsStore } from '@/entities/settings/settings.store'
import { usePersonaStore } from '@/entities/persona/persona.store'
import { useCompressionStore } from '@/entities/compression/compression.store'
import { estimateTokens } from '@/shared/lib/token-estimator'
import { MODELS } from '@/shared/constants'
import { routeModel } from '@/shared/lib/providers/router'
import type { Message, PdfAttachment, SpreadsheetAttachment } from '@/shared/types'

export function useMessageBuilder() {
  const createSession = useSessionStore((s) => s.createSession)
  const addMessage = useSessionStore((s) => s.addMessage)
  const setSessionStreaming = useSessionStore((s) => s.setSessionStreaming)
  const selectedModel = useSettingsStore((s) => s.selectedModel)
  const autoRouting = useSettingsStore((s) => s.autoRouting)
  const activePersona = usePersonaStore((s) => s.getActivePersona())

  const buildChatContext = (
    messageText: string,
    currentSessionId: string | null,
    pdfAttachment: PdfAttachment | null,
    spreadsheetAttachment: SpreadsheetAttachment | null
  ) => {
    const effectiveModel = autoRouting ? routeModel(messageText, MODELS) : selectedModel

    let sessionId = currentSessionId
    if (!sessionId) {
      createSession(messageText.slice(0, 50))
      sessionId = useSessionStore.getState().currentSessionId!
    }

    const timestamp = Date.now()
    const userMessage: Message = {
      id: `msg-${timestamp}`,
      sessionId,
      role: 'user',
      segments: [{ type: 'text', content: messageText }],
      createdAt: new Date().toISOString(),
    }
    addMessage(sessionId, userMessage)

    const assistantMessageId = `msg-${timestamp}-assistant`
    addMessage(sessionId, {
      id: assistantMessageId,
      sessionId,
      role: 'assistant',
      segments: [{ type: 'text', content: '' }],
      createdAt: new Date().toISOString(),
    })
    setSessionStreaming(sessionId, true)

    const allMessages = useSessionStore.getState().messages[sessionId] ?? []
    let chatHistory: Array<{ role: 'user' | 'assistant'; content: string }> = allMessages
      .filter((m) => m.id !== assistantMessageId)
      .map((m) => ({ role: m.role, content: m.segments.find((s) => s.type === 'text')?.content ?? '' }))
      .filter((m) => m.content.length > 0)

    const { compressMessages, pruneMessages, enabled, recordCompression } = useCompressionStore.getState()
    const preTokens = chatHistory.reduce((s, m) => s + estimateTokens(m.content), 0)
    chatHistory = pruneMessages(chatHistory) as typeof chatHistory
    chatHistory = compressMessages(chatHistory) as typeof chatHistory

    if (enabled) {
      const postTokens = chatHistory.reduce((s, m) => s + estimateTokens(m.content), 0)
      const saved = preTokens - postTokens
      if (saved > 0) {
        const model = MODELS.find((m) => m.id === effectiveModel)
        recordCompression(saved, model ? model.cost.input / 1_000_000 : 0)
      }
    }

    let systemPrompt = activePersona?.systemPrompt
    if (pdfAttachment) {
      const pdfContext = `[PDF Document: ${pdfAttachment.fileName} (${pdfAttachment.pageCount} pages)]\n\n${pdfAttachment.text}`
      systemPrompt = systemPrompt ? `${systemPrompt}\n\n${pdfContext}` : pdfContext
    }
    if (spreadsheetAttachment) {
      const spreadsheetContext = spreadsheetAttachment.summary
      systemPrompt = systemPrompt ? `${systemPrompt}\n\n${spreadsheetContext}` : spreadsheetContext
    }

    return { sessionId, assistantMessageId, chatHistory, systemPrompt, effectiveModel }
  }

  return { buildChatContext }
}