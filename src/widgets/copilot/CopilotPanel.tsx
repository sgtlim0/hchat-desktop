import { useRef, useEffect, useCallback, type KeyboardEvent } from 'react'
import { X, Minimize2, Maximize2, Send, Trash2, Sparkles } from 'lucide-react'
import { useCopilotStore } from '@/entities/copilot/copilot.store'
import { useSettingsStore } from '@/entities/settings/settings.store'
import { useSessionStore } from '@/entities/session/session.store'
import { useTranslation } from '@/shared/i18n'
import { createStream, getProviderConfig } from '@/shared/lib/providers/factory'

export function CopilotPanel() {
  const { t } = useTranslation()
  const isOpen = useCopilotStore((s) => s.isOpen)
  const size = useCopilotStore((s) => s.size)
  const messages = useCopilotStore((s) => s.messages)
  const input = useCopilotStore((s) => s.input)
  const isStreaming = useCopilotStore((s) => s.isStreaming)
  const contextHint = useCopilotStore((s) => s.contextHint)
  const close = useCopilotStore((s) => s.close)
  const setSize = useCopilotStore((s) => s.setSize)
  const setInput = useCopilotStore((s) => s.setInput)
  const addMessage = useCopilotStore((s) => s.addMessage)
  const updateLastAssistant = useCopilotStore((s) => s.updateLastAssistant)
  const setStreaming = useCopilotStore((s) => s.setStreaming)
  const clearMessages = useCopilotStore((s) => s.clearMessages)
  const selectedModel = useSettingsStore((s) => s.selectedModel)
  const view = useSessionStore((s) => s.view)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-detect context from current view
  useEffect(() => {
    useCopilotStore.getState().setContextHint(view)
  }, [view])

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [messages])

  const handleSend = useCallback(async () => {
    const text = input.trim()
    if (!text || isStreaming) return

    const userMsg = { id: crypto.randomUUID(), role: 'user' as const, content: text, timestamp: new Date().toISOString() }
    addMessage(userMsg)
    setInput('')
    setStreaming(true)

    const assistantMsg = { id: crypto.randomUUID(), role: 'assistant' as const, content: '', timestamp: new Date().toISOString() }
    addMessage(assistantMsg)

    try {
      const settings = useSettingsStore.getState()
      const config = getProviderConfig(selectedModel, {
        credentials: settings.credentials,
        openaiApiKey: settings.openaiApiKey,
        geminiApiKey: settings.geminiApiKey,
      })
      const chatMessages = messages.concat(userMsg).map((m) => ({ role: m.role, content: m.content }))
      const stream = createStream(config, { modelId: selectedModel, messages: chatMessages })
      let full = ''
      for await (const event of stream) {
        if (event.type === 'text') {
          full += event.content ?? ''
          updateLastAssistant(full)
        }
      }
    } catch {
      updateLastAssistant(t('copilot.error'))
    } finally {
      setStreaming(false)
    }
  }, [input, isStreaming, messages, selectedModel, addMessage, setInput, setStreaming, updateLastAssistant, t])

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (!isOpen) return null

  const isFull = size === 'full'
  const panelClass = isFull
    ? 'fixed bottom-4 right-4 w-[420px] h-[600px] z-50'
    : 'fixed bottom-4 right-4 w-[340px] h-[400px] z-50'

  return (
    <div className={`${panelClass} bg-surface rounded-2xl shadow-2xl border border-border flex flex-col overflow-hidden`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-surface-secondary/50">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-text-primary">{t('copilot.title')}</span>
          {contextHint && <span className="text-xs text-text-tertiary px-1.5 py-0.5 bg-surface-secondary rounded">{contextHint}</span>}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={clearMessages} className="p-1 rounded hover:bg-surface-tertiary" aria-label={t('copilot.clear')}>
            <Trash2 className="w-3.5 h-3.5 text-text-tertiary" />
          </button>
          <button onClick={() => setSize(isFull ? 'mini' : 'full')} className="p-1 rounded hover:bg-surface-tertiary" aria-label={isFull ? 'Minimize' : 'Maximize'}>
            {isFull ? <Minimize2 className="w-3.5 h-3.5 text-text-tertiary" /> : <Maximize2 className="w-3.5 h-3.5 text-text-tertiary" />}
          </button>
          <button onClick={close} className="p-1 rounded hover:bg-surface-tertiary" aria-label={t('common.close')}>
            <X className="w-3.5 h-3.5 text-text-tertiary" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {messages.length === 0 && (
          <div className="flex-1 flex items-center justify-center h-full">
            <p className="text-text-tertiary text-xs text-center">{t('copilot.placeholder')}</p>
          </div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] px-3 py-2 rounded-xl text-xs leading-relaxed ${msg.role === 'user' ? 'bg-primary text-white' : 'bg-surface-secondary text-text-primary'}`}>
              {msg.content || (isStreaming ? <span className="animate-pulse">...</span> : '')}
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="p-2.5 border-t border-border">
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('copilot.inputPlaceholder')}
            disabled={isStreaming}
            className="flex-1 px-3 py-2 text-xs rounded-lg bg-surface-secondary border border-border focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
          />
          <button onClick={handleSend} disabled={isStreaming || !input.trim()} className="p-2 rounded-lg bg-primary text-white disabled:opacity-50 hover:bg-primary/90" aria-label={t('copilot.send')}>
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
