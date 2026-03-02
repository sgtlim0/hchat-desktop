import { useState, useRef, useEffect, type KeyboardEvent } from 'react'
import TextareaAutosize from 'react-textarea-autosize'
import { Plus, Send, Square, User, FileText, X } from 'lucide-react'
import { useSessionStore } from '@/entities/session/session.store'
import { useSettingsStore } from '@/entities/settings/settings.store'
import { useUsageStore, calculateCost } from '@/entities/usage/usage.store'
import { usePersonaStore } from '@/entities/persona/persona.store'
import { useTranslation } from '@/shared/i18n'
import { ModelSelector } from './ModelSelector'
import { createStream, getProviderConfig } from '@/shared/lib/providers/factory'
import { routeModel } from '@/shared/lib/providers/router'
import { putMessage } from '@/shared/lib/db'
import type { Message, UsageEntry, PdfAttachment } from '@/shared/types'
import { MODELS } from '@/shared/constants'
import { useOnlineStatus } from '@/shared/hooks/useOnlineStatus'
import { estimateTokens } from '@/shared/lib/token-estimator'

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
  const pendingPrompt = useSessionStore((s) => s.pendingPrompt)
  const setPendingPrompt = useSessionStore((s) => s.setPendingPrompt)
  const createSession = useSessionStore((s) => s.createSession)
  const addMessage = useSessionStore((s) => s.addMessage)
  const updateLastMessage = useSessionStore((s) => s.updateLastMessage)
  const setSessionStreaming = useSessionStore((s) => s.setSessionStreaming)
  const credentials = useSettingsStore((s) => s.credentials)
  const openaiApiKey = useSettingsStore((s) => s.openaiApiKey)
  const geminiApiKey = useSettingsStore((s) => s.geminiApiKey)
  const selectedModel = useSettingsStore((s) => s.selectedModel)
  const autoRouting = useSettingsStore((s) => s.autoRouting)

  const addUsage = useUsageStore((s) => s.addUsage)
  const activePersona = usePersonaStore((s) => s.getActivePersona())
  const personas = usePersonaStore((s) => s.personas)
  const activePersonaId = usePersonaStore((s) => s.activePersonaId)
  const setActivePersona = usePersonaStore((s) => s.setActivePersona)

  const isOnline = useOnlineStatus()
  const [isSending, setIsSending] = useState(false)
  const [showPersonaMenu, setShowPersonaMenu] = useState(false)
  const [pdfAttachment, setPdfAttachment] = useState<PdfAttachment | null>(null)
  const [pdfLoading, setPdfLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handlePdfUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !file.name.endsWith('.pdf')) return

    setPdfLoading(true)
    try {
      const { extractPdfText } = await import('@/shared/lib/pdf-extractor')
      const result = await extractPdfText(file)
      setPdfAttachment({
        fileName: file.name,
        pageCount: result.pageCount,
        text: result.text,
      })
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'PDF extraction failed'
      console.error('PDF extraction error:', msg)
    } finally {
      setPdfLoading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // Consume pending prompt (from quick actions or quick chat)
  useEffect(() => {
    if (pendingPrompt) {
      setInput(pendingPrompt)
      setPendingPrompt(null)
      textareaRef.current?.focus()
    }
  }, [pendingPrompt, setPendingPrompt])

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
    if (!input.trim() || isSending || !isOnline) return

    if (!hasRequiredCredentials()) {
      const store = useSettingsStore.getState()
      store.setSettingsOpen(true)
      store.setSettingsTab('api-keys')
      return
    }

    const messageText = input.trim()
    setInput('')
    setIsSending(true)

    // Auto-route model if enabled
    const effectiveModel = autoRouting
      ? routeModel(messageText, MODELS)
      : selectedModel

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
    const config = getProviderConfig(effectiveModel, {
      credentials,
      openaiApiKey,
      geminiApiKey,
    })

    // Stream response
    const abortController = new AbortController()
    abortRef.current = abortController
    let fullText = ''

    try {
      // Build system prompt with optional PDF context
      let systemPrompt = activePersona?.systemPrompt
      if (pdfAttachment) {
        const pdfContext = `[PDF Document: ${pdfAttachment.fileName} (${pdfAttachment.pageCount} pages)]\n\n${pdfAttachment.text}`
        systemPrompt = systemPrompt
          ? `${systemPrompt}\n\n${pdfContext}`
          : pdfContext
      }

      const stream = createStream(config, {
        modelId: effectiveModel,
        messages: chatHistory,
        signal: abortController.signal,
        system: systemPrompt,
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

      // Record usage
      const model = MODELS.find((m) => m.id === effectiveModel)
      if (model && fullText) {
        const inputTokens = estimateTokens(messageText)
        const outputTokens = estimateTokens(fullText)
        const cost = calculateCost(effectiveModel, inputTokens, outputTokens)
        const usageEntry: UsageEntry = {
          id: `usage-${Date.now()}`,
          sessionId,
          modelId: effectiveModel,
          provider: model.provider,
          inputTokens,
          outputTokens,
          cost,
          createdAt: new Date().toISOString(),
        }
        addUsage(usageEntry)
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
    <div className="space-y-2">
      {/* Persona chip */}
      <div className="relative flex items-center gap-2">
        <button
          onClick={() => setShowPersonaMenu(!showPersonaMenu)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition border ${
            activePersona
              ? 'border-primary/30 bg-primary/10 text-primary'
              : 'border-border text-text-tertiary hover:bg-hover'
          }`}
        >
          <User size={12} />
          {activePersona ? activePersona.name : t('persona.select')}
        </button>
        {showPersonaMenu && (
          <div className="absolute bottom-full left-0 mb-1 bg-surface border border-border rounded-lg shadow-lg py-1 z-50 min-w-[200px]">
            <button
              onClick={() => { setActivePersona(null); setShowPersonaMenu(false) }}
              className={`w-full text-left px-3 py-1.5 text-sm hover:bg-hover transition ${
                !activePersonaId ? 'text-primary font-medium' : 'text-text-secondary'
              }`}
            >
              {t('persona.none')}
            </button>
            {personas.map((p) => (
              <button
                key={p.id}
                onClick={() => { setActivePersona(p.id); setShowPersonaMenu(false) }}
                className={`w-full text-left px-3 py-1.5 text-sm hover:bg-hover transition ${
                  activePersonaId === p.id ? 'text-primary font-medium' : 'text-text-secondary'
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* PDF attachment chip */}
      {pdfAttachment && (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-xs">
          <FileText size={14} className="text-primary" />
          <span className="text-primary font-medium truncate max-w-[200px]">{pdfAttachment.fileName}</span>
          <span className="text-text-tertiary">{t('pdf.pages', { count: String(pdfAttachment.pageCount) })}</span>
          <button
            onClick={() => setPdfAttachment(null)}
            className="p-0.5 hover:bg-primary/20 rounded transition"
          >
            <X size={12} className="text-primary" />
          </button>
        </div>
      )}
      {pdfLoading && (
        <div className="text-xs text-text-tertiary">{t('pdf.extracting')}</div>
      )}

      <div className="rounded-xl border border-border-input bg-input p-3 flex items-end gap-2">
      {/* Attachment button */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        onChange={handlePdfUpload}
        className="hidden"
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        aria-label={t('chat.attach')}
        className="p-2 hover:bg-hover rounded-lg transition flex-shrink-0 focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
      >
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
            aria-label={t('chat.stop')}
            className="p-2 hover:bg-hover rounded-lg transition focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
          >
            <Square size={20} className="text-text-secondary" />
          </button>
        ) : (
          <button
            onClick={handleSend}
            disabled={!input.trim() || !isOnline}
            aria-label={t('chat.send')}
            className={`p-2 rounded-lg transition focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 ${
              input.trim() && isOnline
                ? 'bg-primary hover:opacity-90 text-white'
                : 'bg-hover text-text-tertiary cursor-not-allowed'
            }`}
          >
            <Send size={20} />
          </button>
        )}
      </div>
    </div>
    </div>
  )
}
