import { memo, useMemo, useState, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Components } from 'react-markdown'
import type { Message } from '@/shared/types'
import { CodeBlock } from './CodeBlock'
import { ToolCallGroup } from './ToolCallGroup'
import * as tts from '@/shared/lib/tts'
import { useLearningStore, type FeedbackRating } from '@/entities/learning/learning.store'
import { useCompressionStore } from '@/entities/compression/compression.store'

interface MessageBubbleProps {
  message: Message
  isStreaming?: boolean
  messageIndex?: number
  onFork?: (messageIndex: number) => void
  onOpenInCanvas?: (language: string, content: string) => void
}

function AssistantAvatar() {
  return (
    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
      <span className="text-xs font-bold text-primary">H</span>
    </div>
  )
}

const remarkPlugins = [remarkGfm]

function createMarkdownComponents(
  onOpenInCanvas?: (language: string, content: string) => void,
): Components {
  return {
    code({ className, children, ...props }) {
      const match = /language-(\w+)/.exec(className ?? '')
      const isInline = !match

      if (isInline) {
        return (
          <code className="bg-card px-1.5 py-0.5 rounded text-[13px] font-mono" {...props}>
            {children}
          </code>
        )
      }

      return (
        <CodeBlock language={match[1]} onOpenInCanvas={onOpenInCanvas}>
          {String(children).replace(/\n$/, '')}
        </CodeBlock>
      )
    },
  }
}

// Static components for when there's no canvas callback (e.g., streaming, no callback)
const defaultMarkdownComponents = createMarkdownComponents()

export const MessageBubble = memo(function MessageBubble({
  message,
  isStreaming = false,
  messageIndex,
  onFork,
  onOpenInCanvas,
}: MessageBubbleProps) {
  const [isSpeaking, setIsSpeaking] = useState(false)

  const markdownComponents = useMemo(
    () => (onOpenInCanvas ? createMarkdownComponents(onOpenInCanvas) : defaultMarkdownComponents),
    [onOpenInCanvas],
  )

  const handleTts = useCallback(() => {
    if (isSpeaking) {
      tts.stop()
      setIsSpeaking(false)
      return
    }
    const text = message.segments
      .filter((s) => s.type === 'text')
      .map((s) => s.content)
      .join('\n')
    if (!text) return
    tts.speak(text)
    setIsSpeaking(true)
    const interval = setInterval(() => {
      if (!tts.isSpeaking()) {
        setIsSpeaking(false)
        clearInterval(interval)
      }
    }, 500)
  }, [message.segments, isSpeaking])

  const handleFork = useCallback(() => {
    if (messageIndex !== undefined && onFork) onFork(messageIndex)
  }, [messageIndex, onFork])

  if (message.role === 'user') {
    const textContent = message.segments
      .filter((s) => s.type === 'text')
      .map((s) => s.content)
      .join('\n')

    return (
      <div className="flex justify-end">
        <div className="bg-primary text-white rounded-2xl rounded-br-md px-4 py-3 max-w-[75%]">
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{textContent}</p>
        </div>
      </div>
    )
  }

  const hasContent = message.segments.some(
    (s) => (s.type === 'text' && s.content) || (s.type === 'tool' && s.toolCalls)
  )

  return (
    <div className="flex gap-3 py-1">
      <AssistantAvatar />
      <div className="flex-1 min-w-0">
        {message.segments.map((segment, index) => {
          if (segment.type === 'tool' && segment.toolCalls) {
            return <ToolCallGroup key={index} toolCalls={segment.toolCalls} />
          }

          if (segment.type === 'text' && segment.content) {
            return (
              <MarkdownSegment
                key={index}
                content={segment.content}
                isStreaming={isStreaming}
                components={markdownComponents}
              />
            )
          }

          return null
        })}
        {isStreaming && (
          <span className={`inline-block w-2 h-4 bg-primary animate-cursor-blink${hasContent ? ' ml-0.5 align-middle' : ''}`} />
        )}
        {!isStreaming && hasContent && (
          <div className="flex gap-2 mt-2">
            {tts.isSupported() && (
              <button
                onClick={handleTts}
                className="text-xs text-text-secondary hover:text-primary transition-colors px-2 py-1 rounded hover:bg-card"
                aria-label={isSpeaking ? 'Stop reading' : 'Read aloud'}
              >
                {isSpeaking ? '⏹ Stop' : '🔊 Read'}
              </button>
            )}
            {onFork && messageIndex !== undefined && (
              <button
                onClick={handleFork}
                className="text-xs text-text-secondary hover:text-primary transition-colors px-2 py-1 rounded hover:bg-card"
                aria-label="Fork from here"
              >
                🔀 Fork
              </button>
            )}
            <CompressionBadge />
            <FeedbackButtons messageId={message.id} sessionId={message.sessionId} />
          </div>
        )}
      </div>
    </div>
  )
})

const MarkdownSegment = memo(function MarkdownSegment({
  content,
  isStreaming,
  components,
}: {
  content: string
  isStreaming: boolean
  components: Components
}) {
  const rendered = useMemo(() => {
    if (isStreaming) return null
    return (
      <ReactMarkdown remarkPlugins={remarkPlugins} components={components}>
        {content}
      </ReactMarkdown>
    )
  }, [content, isStreaming, components])

  return (
    <div className="prose-chat text-text-primary text-sm leading-relaxed">
      {isStreaming ? (
        <ReactMarkdown remarkPlugins={remarkPlugins} components={components}>
          {content}
        </ReactMarkdown>
      ) : (
        rendered
      )}
    </div>
  )
})

const CompressionBadge = memo(function CompressionBadge() {
  const enabled = useCompressionStore((s) => s.enabled)
  const stats = useCompressionStore((s) => s.stats)
  if (!enabled || stats.totalSavedTokens <= 0) return null
  return (
    <span className="text-xs text-text-secondary px-2 py-1">
      {stats.totalSavedTokens.toLocaleString()} tokens saved
    </span>
  )
})

const FeedbackButtons = memo(function FeedbackButtons({
  messageId,
  sessionId,
}: {
  messageId: string
  sessionId: string
}) {
  const existing = useLearningStore((s) => s.getFeedbackForMessage(messageId))
  const submitFeedback = useLearningStore((s) => s.submitFeedback)

  const handleFeedback = useCallback(
    (rating: FeedbackRating) => {
      if (existing) return
      submitFeedback(messageId, sessionId, '', rating)
    },
    [messageId, sessionId, existing, submitFeedback],
  )

  return (
    <>
      <button
        onClick={() => handleFeedback('good')}
        className={`text-xs px-2 py-1 rounded transition-colors ${
          existing?.rating === 'good'
            ? 'text-green-500 bg-green-500/10'
            : 'text-text-secondary hover:text-green-500 hover:bg-card'
        }`}
        aria-label="Good response"
        disabled={!!existing}
      >
        👍
      </button>
      <button
        onClick={() => handleFeedback('bad')}
        className={`text-xs px-2 py-1 rounded transition-colors ${
          existing?.rating === 'bad'
            ? 'text-red-500 bg-red-500/10'
            : 'text-text-secondary hover:text-red-500 hover:bg-card'
        }`}
        aria-label="Bad response"
        disabled={!!existing}
      >
        👎
      </button>
    </>
  )
})
