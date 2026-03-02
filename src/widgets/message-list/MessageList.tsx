import { useEffect, useRef, useCallback, lazy, Suspense } from 'react'
import { useSessionStore } from '@/entities/session/session.store'
import { useTranslation } from '@/shared/i18n'
import { MessageBubble } from './MessageBubble'
import type { Message, Session } from '@/shared/types'

const LazyVirtualizedMessageList = lazy(() =>
  import('./VirtualizedMessageList').then((mod) => ({
    default: mod.VirtualizedMessageList,
  })),
)

const VIRTUALIZATION_THRESHOLD = 50

interface MessageListProps {
  sessionId: string
}

export function MessageList({ sessionId }: MessageListProps) {
  const { t } = useTranslation()
  const messages = useSessionStore((s) => s.messages[sessionId] ?? [])
  const session = useSessionStore((s) => s.sessions.find((ss) => ss.id === sessionId))
  const forkSession = useSessionStore((s) => s.forkSession)
  const bottomRef = useRef<HTMLDivElement>(null)

  const handleFork = useCallback(
    (messageIndex: number) => forkSession(sessionId, messageIndex),
    [sessionId, forkSession],
  )

  const shouldVirtualize = messages.length > VIRTUALIZATION_THRESHOLD

  // Auto-scroll to bottom on new messages (non-virtualized mode only)
  useEffect(() => {
    if (shouldVirtualize) return
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, messages[messages.length - 1]?.segments, shouldVirtualize])

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-text-tertiary text-sm">
        {t('chat.startConversation')}
      </div>
    )
  }

  if (shouldVirtualize) {
    return (
      <Suspense
        fallback={
          <StandardMessageList
            messages={messages}
            session={session}
            handleFork={handleFork}
            bottomRef={bottomRef}
          />
        }
      >
        <LazyVirtualizedMessageList
          messages={messages}
          session={session}
          onFork={handleFork}
        />
      </Suspense>
    )
  }

  return (
    <StandardMessageList
      messages={messages}
      session={session}
      handleFork={handleFork}
      bottomRef={bottomRef}
    />
  )
}

interface StandardMessageListProps {
  messages: Message[]
  session: Session | undefined
  handleFork: (messageIndex: number) => void
  bottomRef: React.RefObject<HTMLDivElement | null>
}

function StandardMessageList({
  messages,
  session,
  handleFork,
  bottomRef,
}: StandardMessageListProps) {
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
              messageIndex={index}
              onFork={handleFork}
            />
          )
        })}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
