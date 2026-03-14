import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import type { Message } from '@hchat/shared/types/core'
import { ExtMarkdownRenderer } from './ExtMarkdownRenderer'

interface ExtMessageBubbleProps {
  message: Message
}

export function ExtMessageBubble({ message }: ExtMessageBubbleProps) {
  const [copied, setCopied] = useState(false)
  const isUser = message.role === 'user'
  const content = message.segments.map((s) => s.content ?? '').join('')

  function handleCopy() {
    navigator.clipboard.writeText(content).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }).catch(console.error)
  }

  const time = new Date(message.createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className={`group flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`relative max-w-[85%] rounded-xl px-3 py-2 text-sm ${
          isUser
            ? 'bg-[var(--primary)] text-white rounded-br-sm'
            : 'bg-[var(--bg-card)] text-[var(--text-primary)] rounded-bl-sm border border-[var(--border)]'
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap break-words">{content}</p>
        ) : (
          <ExtMarkdownRenderer content={content} />
        )}
        <div
          className={`flex items-center gap-1 mt-1 ${
            isUser ? 'justify-end' : 'justify-between'
          }`}
        >
          <span
            className={`text-[10px] ${
              isUser ? 'text-white/60' : 'text-[var(--text-tertiary)]'
            }`}
          >
            {time}
          </span>
          {!isUser && (
            <button
              onClick={handleCopy}
              className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] transition-opacity"
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
