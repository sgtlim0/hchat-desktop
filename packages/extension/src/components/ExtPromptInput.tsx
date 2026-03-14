import { useState, useRef, useCallback, type KeyboardEvent } from 'react'
import { ArrowUp, Square, FileText, X } from 'lucide-react'
import { useTranslation } from '@hchat/shared'
import { useExtSessionStore } from '@ext/stores/session.store'
import { useExtSettingsStore } from '@ext/stores/settings.store'
import { useChat } from '@ext/hooks/useChat'
import { usePageContext } from '@ext/hooks/usePageContext'
import { ExtPageContextBanner } from './ExtPageContextBanner'

export function ExtPromptInput() {
  const { t } = useTranslation()
  const [input, setInput] = useState('')
  const [isComposing, setIsComposing] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const currentSessionId = useExtSessionStore((s) => s.currentSessionId)
  const messages = useExtSessionStore((s) =>
    currentSessionId ? (s.messages[currentSessionId] ?? []) : [],
  )
  const createSession = useExtSessionStore((s) => s.createSession)
  const selectedModel = useExtSettingsStore((s) => s.selectedModel)
  const { sendMessage, stopStreaming, isStreaming } = useChat()
  const { pageContext, isLoading: pageLoading, extractPage, clearContext } = usePageContext()

  const handleSend = useCallback(() => {
    const text = input.trim()
    if (!text || isStreaming) return

    let sessionId = currentSessionId
    if (!sessionId) {
      sessionId = createSession(selectedModel)
    }

    // Build system prompt with page context if available
    let systemPrompt: string | undefined
    if (pageContext) {
      systemPrompt = `The user is currently viewing a web page.\nTitle: ${pageContext.title}\nURL: ${pageContext.url}\n\nPage content:\n${pageContext.text.slice(0, 4000)}`
    }

    sendMessage(sessionId, text, messages, systemPrompt)
    setInput('')
    textareaRef.current?.focus()
  }, [input, isStreaming, currentSessionId, selectedModel, createSession, sendMessage, messages, pageContext])

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && !isComposing) {
      e.preventDefault()
      handleSend()
    }
  }

  function handleStop() {
    if (currentSessionId) {
      stopStreaming(currentSessionId)
    }
  }

  return (
    <div className="border-t border-[var(--border)] bg-[var(--bg-page)]">
      {pageContext && (
        <ExtPageContextBanner pageContext={pageContext} onRemove={clearContext} />
      )}
      <div className="flex items-end gap-1.5 px-3 py-2">
        <button
          onClick={extractPage}
          disabled={pageLoading}
          className={`p-1.5 rounded-lg transition-colors ${
            pageContext
              ? 'text-[var(--primary)] bg-[var(--primary)]/10'
              : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
          }`}
          title={t('ext.pageContext')}
        >
          {pageContext ? <X size={16} onClick={(e) => { e.stopPropagation(); clearContext() }} /> : <FileText size={16} />}
        </button>
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onCompositionStart={() => setIsComposing(true)}
          onCompositionEnd={() => setIsComposing(false)}
          placeholder={t('chat.placeholder')}
          rows={1}
          className="flex-1 resize-none bg-[var(--bg-input)] border border-[var(--border-input)] rounded-xl px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[var(--primary)] max-h-[120px] overflow-y-auto"
          style={{ minHeight: '36px' }}
        />
        {isStreaming ? (
          <button
            onClick={handleStop}
            className="p-1.5 rounded-lg bg-[var(--danger)] text-white transition-colors"
            title={t('chat.stop')}
          >
            <Square size={16} />
          </button>
        ) : (
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="p-1.5 rounded-lg bg-[var(--primary)] text-white disabled:opacity-40 transition-colors"
            title={t('chat.send')}
          >
            <ArrowUp size={16} />
          </button>
        )}
      </div>
    </div>
  )
}
