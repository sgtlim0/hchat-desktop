import { useState, useRef, type KeyboardEvent } from 'react'
import TextareaAutosize from 'react-textarea-autosize'
import { Plus, Send, Square } from 'lucide-react'
import { useSessionStore } from '@/entities/session/session.store'
import { ModelSelector } from './ModelSelector'
import type { Message } from '@/shared/types'

interface PromptInputProps {
  onSend?: (message: string) => void
  placeholder?: string
}

export function PromptInput({
  onSend,
  placeholder = '메시지를 입력하세요...',
}: PromptInputProps) {
  const [input, setInput] = useState('')
  const [isComposing, setIsComposing] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const currentSessionId = useSessionStore((s) => s.currentSessionId)
  const createSession = useSessionStore((s) => s.createSession)
  const addMessage = useSessionStore((s) => s.addMessage)

  const [isSending, setIsSending] = useState(false)

  function handleSend() {
    if (!input.trim() || isSending) return

    const messageText = input.trim()
    setInput('')
    setIsSending(true)

    // Create session if on home page
    let sessionId = currentSessionId
    if (!sessionId) {
      createSession(messageText.slice(0, 50))
      // Get the newly created session ID from store
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

    // Auto-add mock assistant response after delay
    setTimeout(() => {
      const assistantMessage: Message = {
        id: `msg-${Date.now()}-assistant`,
        sessionId,
        role: 'assistant',
        segments: [
          {
            type: 'text',
            content: '안녕하세요! H Chat Desktop입니다. 무엇을 도와드릴까요?',
          },
        ],
        createdAt: new Date().toISOString(),
      }
      addMessage(sessionId, assistantMessage)
      setIsSending(false)
    }, 500)

    onSend?.(messageText)
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey && !isComposing) {
      e.preventDefault()
      handleSend()
    }
  }

  function handleStop() {
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
        placeholder={placeholder}
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
