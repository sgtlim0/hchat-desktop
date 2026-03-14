import { useEffect, useRef } from 'react'
import { useTranslation } from '@hchat/shared'
import { useExtSessionStore } from '@ext/stores/session.store'
import { ExtMessageBubble } from './ExtMessageBubble'

interface ExtMessageListProps {
  sessionId: string
}

export function ExtMessageList({ sessionId }: ExtMessageListProps) {
  const { t } = useTranslation()
  const messages = useExtSessionStore((s) => s.messages[sessionId] ?? [])
  const bottomRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, messages[messages.length - 1]?.segments])

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-[var(--text-tertiary)] text-sm px-4">
        {t('chat.startConversation')}
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
      {messages.map((message) => (
        <ExtMessageBubble key={message.id} message={message} />
      ))}
      <div ref={bottomRef} />
    </div>
  )
}
