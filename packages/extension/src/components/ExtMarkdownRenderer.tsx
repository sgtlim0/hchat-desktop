import { useState, type ReactNode } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Copy, Check } from 'lucide-react'

interface ExtMarkdownRendererProps {
  content: string
}

function CodeBlock({ language, value }: { language: string; value: string }) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }).catch(console.error)
  }

  return (
    <div className="relative group my-1.5 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1 bg-[#2d2d2d] text-[10px] text-gray-400">
        <span>{language || 'code'}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 hover:text-white transition-colors"
        >
          {copied ? <Check size={10} /> : <Copy size={10} />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      <SyntaxHighlighter
        style={oneDark}
        language={language || 'text'}
        customStyle={{
          margin: 0,
          padding: '8px 12px',
          fontSize: '11px',
          lineHeight: '1.4',
          borderRadius: 0,
        }}
      >
        {value}
      </SyntaxHighlighter>
    </div>
  )
}

export function ExtMarkdownRenderer({ content }: ExtMarkdownRendererProps) {
  if (!content) {
    return <span className="text-[var(--text-tertiary)] animate-pulse">...</span>
  }

  return (
    <div className="ext-markdown text-sm leading-relaxed">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className ?? '')
            const value = String(children).replace(/\n$/, '')

            if (match) {
              return <CodeBlock language={match[1]} value={value} />
            }

            return (
              <code
                className="px-1 py-0.5 bg-[var(--bg-card)] border border-[var(--border)] rounded text-xs font-mono"
                {...props}
              >
                {children}
              </code>
            )
          },
          p({ children }: { children?: ReactNode }) {
            return <p className="mb-1.5 last:mb-0">{children}</p>
          },
          ul({ children }: { children?: ReactNode }) {
            return <ul className="list-disc ml-4 mb-1.5 space-y-0.5">{children}</ul>
          },
          ol({ children }: { children?: ReactNode }) {
            return <ol className="list-decimal ml-4 mb-1.5 space-y-0.5">{children}</ol>
          },
          blockquote({ children }: { children?: ReactNode }) {
            return (
              <blockquote className="border-l-2 border-[var(--primary)] pl-2 my-1.5 text-[var(--text-secondary)]">
                {children}
              </blockquote>
            )
          },
          table({ children }: { children?: ReactNode }) {
            return (
              <div className="overflow-x-auto my-1.5">
                <table className="w-full text-xs border-collapse border border-[var(--border)]">
                  {children}
                </table>
              </div>
            )
          },
          th({ children }: { children?: ReactNode }) {
            return (
              <th className="border border-[var(--border)] px-2 py-1 bg-[var(--bg-card)] text-left font-medium">
                {children}
              </th>
            )
          },
          td({ children }: { children?: ReactNode }) {
            return (
              <td className="border border-[var(--border)] px-2 py-1">{children}</td>
            )
          },
          a({ href, children }: { href?: string; children?: ReactNode }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--primary)] hover:underline"
              >
                {children}
              </a>
            )
          },
        }}
      />
    </div>
  )
}
