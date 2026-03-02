import { useEffect, useCallback } from 'react'
import { List, useListRef } from 'react-window'
import type { ReactElement, CSSProperties } from 'react'
import type { Message, Session } from '@/shared/types'
import { MessageBubble } from './MessageBubble'

interface VirtualizedMessageListProps {
  messages: Message[]
  session: Session | undefined
  onFork: (messageIndex: number) => void
}

const ESTIMATED_USER_HEIGHT = 72
const ESTIMATED_ASSISTANT_HEIGHT = 180

function estimateRowHeight(message: Message): number {
  if (message.role === 'user') {
    const textLen = message.segments
      .filter((s) => s.type === 'text')
      .reduce((acc, s) => acc + (s.content?.length ?? 0), 0)
    return Math.max(
      ESTIMATED_USER_HEIGHT,
      ESTIMATED_USER_HEIGHT + Math.floor(textLen / 80) * 20,
    )
  }

  const textLen = message.segments
    .filter((s) => s.type === 'text')
    .reduce((acc, s) => acc + (s.content?.length ?? 0), 0)
  const toolCount = message.segments.filter((s) => s.type === 'tool').length
  return Math.max(
    ESTIMATED_ASSISTANT_HEIGHT,
    ESTIMATED_ASSISTANT_HEIGHT + Math.floor(textLen / 60) * 20 + toolCount * 48,
  )
}

interface MessageRowExtraProps {
  messages: Message[]
  session: Session | undefined
  onFork: (messageIndex: number) => void
}

function MessageRow({
  index,
  style,
  ariaAttributes,
  messages,
  session,
  onFork,
}: {
  index: number
  style: CSSProperties
  ariaAttributes: {
    'aria-posinset': number
    'aria-setsize': number
    role: 'listitem'
  }
} & MessageRowExtraProps): ReactElement {
  const message = messages[index]
  const isLastAssistant =
    message.role === 'assistant' && index === messages.length - 1
  const isStreaming = isLastAssistant && (session?.isStreaming ?? false)

  return (
    <div style={style} {...ariaAttributes}>
      <div className="max-w-3xl mx-auto px-4 pb-4">
        <MessageBubble
          message={message}
          isStreaming={isStreaming}
          messageIndex={index}
          onFork={onFork}
        />
      </div>
    </div>
  )
}

export function VirtualizedMessageList({
  messages,
  session,
  onFork,
}: VirtualizedMessageListProps) {
  const listRef = useListRef(null)

  const getRowHeight = useCallback(
    (index: number): number => estimateRowHeight(messages[index]),
    [messages],
  )

  // Auto-scroll to bottom when new messages arrive or during streaming
  useEffect(() => {
    if (messages.length === 0) return

    requestAnimationFrame(() => {
      listRef.current?.scrollToRow({
        index: messages.length - 1,
        align: 'end',
        behavior: 'smooth',
      })
    })
  }, [messages.length, messages[messages.length - 1]?.segments, listRef])

  return (
    <div className="flex-1 overflow-hidden">
      <List<MessageRowExtraProps>
        listRef={listRef}
        rowCount={messages.length}
        rowHeight={getRowHeight}
        rowComponent={MessageRow}
        rowProps={{ messages, session, onFork }}
        overscanCount={5}
        style={{ height: '100%' }}
      />
    </div>
  )
}
