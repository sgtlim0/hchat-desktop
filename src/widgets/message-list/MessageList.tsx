import { useEffect, useRef } from 'react'
import { useSessionStore } from '@/entities/session/session.store'
import { MessageBubble } from './MessageBubble'

interface MessageListProps {
  sessionId: string
}

export function MessageList({ sessionId }: MessageListProps) {
  const messages = useSessionStore((s) => s.messages[sessionId] ?? [])
  const session = useSessionStore((s) => s.sessions.find((ss) => ss.id === sessionId))
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, messages[messages.length - 1]?.segments])

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-text-tertiary text-sm">
        대화를 시작해 보세요
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto py-6 px-4 space-y-4">
        {messages.map((message, index) => {
          const isLastAssistant =
            message.role === 'assistant' && index === messages.length - 1
          const isStreaming = isLastAssistant && (session?.isStreaming ?? false)

          return (
            <MessageBubble
              key={message.id}
              message={message}
              isStreaming={isStreaming}
            />
          )
        })}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
