import { useState, useRef, useCallback } from 'react'
import { ArrowUp, Square } from 'lucide-react'

interface PromptInputProps {
  onSend: (text: string) => void
  isStreaming: boolean
  onStop: () => void
  placeholder?: string
}

export function PromptInput({ onSend, isStreaming, onStop, placeholder }: PromptInputProps) {
  const [text, setText] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const resize = useCallback(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`
  }, [])

  function handleSend() {
    const trimmed = text.trim()
    if (!trimmed || isStreaming) return
    onSend(trimmed)
    setText('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="border-t border-slate-200 px-3 py-2 dark:border-slate-700">
      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={e => {
            setText(e.target.value)
            resize()
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || 'Type a message...'}
          rows={1}
          className="min-h-[40px] max-h-[120px] flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm
            text-slate-800 outline-none placeholder:text-slate-400 focus:border-blue-400
            dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
        />
        {isStreaming ? (
          <button
            onClick={onStop}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-500 text-white transition-colors hover:bg-red-600"
            title="Stop"
          >
            <Square className="h-3.5 w-3.5" fill="currentColor" />
          </button>
        ) : (
          <button
            onClick={handleSend}
            disabled={!text.trim()}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white transition-colors
              hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
            title="Send"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        )}
      </div>
      <div className="mt-1 text-right text-[10px] text-slate-400">
        {text.length}
      </div>
    </div>
  )
}
