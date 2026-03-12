import { useEffect, useRef } from 'react'
import { MessageCircle } from 'lucide-react'
import { MessageBubble } from './MessageBubble'

interface MessageItem {
  id: string
  role: 'user' | 'assistant'
  segments: Array<{ type: string; content?: string }>
  createdAt?: string
}

interface MessageListProps {
  messages: MessageItem[]
  streamingText: string
}

export function MessageList({ messages, streamingText }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, streamingText])

  if (messages.length === 0 && !streamingText) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-slate-400">
        <MessageCircle className="h-10 w-10" />
        <p className="text-sm">Start a conversation</p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto py-2">
      {messages.map(msg => (
        <MessageBubble key={msg.id} message={msg} />
      ))}
      {streamingText && (
        <MessageBubble
          message={{
            role: 'assistant',
            segments: [{ type: 'text', content: streamingText }],
          }}
        />
      )}
      {streamingText && (
        <div className="flex items-center gap-1 px-4 py-1">
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-500 [animation-delay:0ms]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-500 [animation-delay:150ms]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-500 [animation-delay:300ms]" />
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  )
}
