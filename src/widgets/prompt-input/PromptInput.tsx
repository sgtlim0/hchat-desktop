import { useState, useRef, type KeyboardEvent } from 'react'
import TextareaAutosize from 'react-textarea-autosize'
import { Plus, Send, Square } from 'lucide-react'
import { useSessionStore } from '@/entities/session/session.store'
import { useSettingsStore } from '@/entities/settings/settings.store'
import { useTranslation } from '@/shared/i18n'
import { ModelSelector } from './ModelSelector'
import { createStream, getProviderConfig } from '@/shared/lib/providers/factory'
import { putMessage } from '@/shared/lib/db'
import type { Message } from '@/shared/types'
import { MODELS } from '@/shared/constants'

interface PromptInputProps {
  onSend?: (message: string) => void
  placeholder?: string
}

export function PromptInput({
  onSend,
  placeholder,
}: PromptInputProps) {
  const { t } = useTranslation()
  const [input, setInput] = useState('')
  const [isComposing, setIsComposing] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  const currentSessionId = useSessionStore((s) => s.currentSessionId)
  const createSession = useSessionStore((s) => s.createSession)
  const addMessage = useSessionStore((s) => s.addMessage)
  const updateLastMessage = useSessionStore((s) => s.updateLastMessage)
  const setSessionStreaming = useSessionStore((s) => s.setSessionStreaming)
  const credentials = useSettingsStore((s) => s.credentials)
  const openaiApiKey = useSettingsStore((s) => s.openaiApiKey)
  const geminiApiKey = useSettingsStore((s) => s.geminiApiKey)
  const selectedModel = useSettingsStore((s) => s.selectedModel)

  const [isSending, setIsSending] = useState(false)

  function hasRequiredCredentials(): boolean {
    const model = MODELS.find((m) => m.id === selectedModel)
    if (!model) return false

    switch (model.provider) {
      case 'bedrock':
        return Boolean(credentials?.accessKeyId && credentials?.secretAccessKey)
      case 'openai':
        return Boolean(openaiApiKey)
      case 'gemini':
        return Boolean(geminiApiKey)
      default:
        return false
    }
  }

  async function handleSend() {
    if (!input.trim() || isSending) return

    if (!hasRequiredCredentials()) {
      const store = useSettingsStore.getState()
      store.setSettingsOpen(true)
      store.setSettingsTab('api-keys')
      return
    }

    const messageText = input.trim()
    setInput('')
    setIsSending(true)

    // Create session if on home page
    let sessionId = currentSessionId
    if (!sessionId) {
      createSession(messageText.slice(0, 50))
      sessionId = useSessionStore.getState().currentSessionId!
    }

    // Add user message
    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      sessionId,
      role: 'user',
      segments: [{ type: 'text', content: messageText }],
      createdAt: new Date().toISOString(),
    }
    addMessage(sessionId, userMessage)

    // Create empty assistant message for streaming
    const assistantMessageId = `msg-${Date.now()}-assistant`
    const assistantMessage: Message = {
      id: assistantMessageId,
      sessionId,
      role: 'assistant',
      segments: [{ type: 'text', content: '' }],
      createdAt: new Date().toISOString(),
    }
    addMessage(sessionId, assistantMessage)
    setSessionStreaming(sessionId, true)

    // Build message history for context
    const allMessages = useSessionStore.getState().messages[sessionId] ?? []
    const chatHistory = allMessages
      .filter((m) => m.id !== assistantMessageId)
      .map((m) => ({
        role: m.role,
        content: m.segments.find((s) => s.type === 'text')?.content ?? '',
      }))
      .filter((m) => m.content.length > 0)

    // Get provider config
    const config = getProviderConfig(selectedModel, {
      credentials,
      openaiApiKey,
      geminiApiKey,
    })

    // Stream response
    const abortController = new AbortController()
    abortRef.current = abortController
    let fullText = ''

    try {
      const stream = createStream(config, {
        modelId: selectedModel,
        messages: chatHistory,
        signal: abortController.signal,
      })

      for await (const event of stream) {
        if (event.type === 'text' && event.content) {
          fullText += event.content
          const currentText = fullText
          updateLastMessage(sessionId, assistantMessageId, (msg) => ({
            ...msg,
            segments: [{ type: 'text', content: currentText }],
          }))
        } else if (event.type === 'error') {
          fullText = t('chat.errorOccurred', { error: event.error ?? 'Unknown' })
          updateLastMessage(sessionId, assistantMessageId, (msg) => ({
            ...msg,
            segments: [{ type: 'text', content: fullText }],
          }))
        }
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        // User cancelled - keep partial text
      } else {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error'
        fullText = fullText || t('chat.errorOccurred', { error: errorMsg })
        updateLastMessage(sessionId, assistantMessageId, (msg) => ({
          ...msg,
          segments: [{ type: 'text', content: fullText }],
        }))
      }
    } finally {
      abortRef.current = null
      setIsSending(false)
      setSessionStreaming(sessionId, false)

      // Persist final assistant message to IndexedDB
      const finalMessages = useSessionStore.getState().messages[sessionId] ?? []
      const finalAssistant = finalMessages.find((m) => m.id === assistantMessageId)
      if (finalAssistant) {
        putMessage(finalAssistant).catch(console.error)
      }
    }

    onSend?.(messageText)
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey && !isComposing) {
      e.preventDefault()
      handleSend()
    }
  }

  function handleStop() {
    abortRef.current?.abort()
    setIsSending(false)
  }

  return (
    <div className="rounded-xl border border-border-input bg-input p-3 flex items-end gap-2">
      {/* Attachment button */}
      <button className="p-2 hover:bg-hover rounded-lg transition flex-shrink-0">
        <Plus size={20} className="text-text-secondary" />
      </button>

      {/* Textarea */}
      <TextareaAutosize
        ref={textareaRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onCompositionStart={() => setIsComposing(true)}
        onCompositionEnd={() => setIsComposing(false)}
        placeholder={placeholder ?? t('chat.placeholder')}
        minRows={1}
        maxRows={8}
        className="flex-1 bg-transparent resize-none outline-none text-sm placeholder:text-text-tertiary"
      />

      {/* Right side: ModelSelector + Send button */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <ModelSelector />
        {isSending ? (
          <button
            onClick={handleStop}
            className="p-2 hover:bg-hover rounded-lg transition"
          >
            <Square size={20} className="text-text-secondary" />
          </button>
        ) : (
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className={`p-2 rounded-lg transition ${
              input.trim()
                ? 'bg-primary hover:opacity-90 text-white'
                : 'bg-hover text-text-tertiary cursor-not-allowed'
            }`}
          >
            <Send size={20} />
          </button>
        )}
      </div>
    </div>
  )
}
