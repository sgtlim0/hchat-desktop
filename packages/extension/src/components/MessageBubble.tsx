import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

interface MessageBubbleProps {
  message: {
    role: 'user' | 'assistant'
    segments: Array<{ type: string; content?: string }>
    createdAt?: string
  }
}

function renderMarkdown(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = []
  const lines = text.split('\n')
  let i = 0

  while (i < lines.length) {
    // Code block
    if (lines[i].startsWith('```')) {
      const lang = lines[i].slice(3).trim()
      const codeLines: string[] = []
      i++
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i])
        i++
      }
      i++ // skip closing ```
      nodes.push(
        <CodeBlock key={nodes.length} code={codeLines.join('\n')} lang={lang} />,
      )
      continue
    }

    // Inline formatting
    nodes.push(
      <span key={nodes.length}>
        {renderInline(lines[i])}
        {i < lines.length - 1 && <br />}
      </span>,
    )
    i++
  }

  return nodes
}

function renderInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = []
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`([^`]+)`|\[(.+?)\]\((.+?)\))/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index))
    }

    if (match[2]) {
      parts.push(<strong key={parts.length}>{match[2]}</strong>)
    } else if (match[3]) {
      parts.push(<em key={parts.length}>{match[3]}</em>)
    } else if (match[4]) {
      parts.push(
        <code
          key={parts.length}
          className="rounded bg-slate-200 px-1 py-0.5 text-xs dark:bg-slate-700"
        >
          {match[4]}
        </code>,
      )
    } else if (match[5] && match[6]) {
      parts.push(
        <a
          key={parts.length}
          href={match[6]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 underline hover:text-blue-600"
        >
          {match[5]}
        </a>,
      )
    }

    lastIndex = match.index + match[0].length
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }

  return parts
}

function CodeBlock({ code, lang }: { code: string; lang: string }) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="group relative my-1.5 overflow-hidden rounded-lg">
      {lang && (
        <div className="flex items-center justify-between bg-slate-800 px-3 py-1 text-[10px] text-slate-400">
          <span>{lang}</span>
          <button
            onClick={handleCopy}
            className="opacity-0 transition-opacity group-hover:opacity-100"
          >
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          </button>
        </div>
      )}
      <pre className="overflow-x-auto bg-slate-900 p-3 text-xs leading-relaxed text-green-400">
        <code>{code}</code>
      </pre>
      {!lang && (
        <button
          onClick={handleCopy}
          className="absolute right-2 top-2 rounded p-1 text-slate-500 opacity-0 transition-opacity hover:text-slate-300 group-hover:opacity-100"
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
        </button>
      )}
    </div>
  )
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false)
  const isUser = message.role === 'user'
  const content = message.segments[0]?.content || ''

  function handleCopy() {
    navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className={`group flex ${isUser ? 'justify-end' : 'justify-start'} px-3 py-1`}>
      <div className="relative max-w-[85%]">
        <div
          className={`rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
            isUser
              ? 'rounded-br-sm bg-blue-600 text-white'
              : 'rounded-bl-sm bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100'
          }`}
        >
          {isUser ? content : renderMarkdown(content)}
        </div>
        <button
          onClick={handleCopy}
          className={`absolute -top-1 rounded p-0.5 opacity-0 transition-opacity group-hover:opacity-100 ${
            isUser
              ? 'left-0 -translate-x-full text-slate-400'
              : 'right-0 translate-x-full text-slate-400'
          }`}
          title="Copy"
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
        </button>
      </div>
    </div>
  )
}
