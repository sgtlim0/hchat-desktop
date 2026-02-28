import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Message } from '@/shared/types'
import { CodeBlock } from './CodeBlock'
import { ToolCallGroup } from './ToolCallGroup'

interface MessageBubbleProps {
  message: Message
}

export function MessageBubble({ message }: MessageBubbleProps) {
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

  return (
    <div className="py-1">
      {message.segments.map((segment, index) => {
        if (segment.type === 'tool' && segment.toolCalls) {
          return <ToolCallGroup key={index} toolCalls={segment.toolCalls} />
        }

        if (segment.type === 'text' && segment.content) {
          return (
            <div key={index} className="prose-chat text-text-primary text-sm leading-relaxed">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
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
                      <CodeBlock language={match[1]}>
                        {String(children).replace(/\n$/, '')}
                      </CodeBlock>
                    )
                  },
                }}
              >
                {segment.content}
              </ReactMarkdown>
            </div>
          )
        }

        return null
      })}
    </div>
  )
}
