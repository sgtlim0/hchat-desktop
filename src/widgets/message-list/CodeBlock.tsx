import { useState } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Copy, Check, PanelRightOpen } from 'lucide-react'
import { useTranslation } from '@/shared/i18n'

interface CodeBlockProps {
  language: string
  children: string
  onOpenInCanvas?: (language: string, content: string) => void
}

export function CodeBlock({ language, children, onOpenInCanvas }: CodeBlockProps) {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(children)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="rounded-lg border border-border overflow-hidden mb-3">
      <div className="flex items-center justify-between px-4 py-2 bg-card">
        <span className="text-xs text-text-secondary">{language}</span>
        <div className="flex items-center gap-2">
          {onOpenInCanvas && (
            <button
              onClick={() => onOpenInCanvas(language, children)}
              className="flex items-center gap-1 text-xs text-text-secondary hover:text-primary transition"
              aria-label={t('artifact.openInCanvas')}
            >
              <PanelRightOpen size={14} />
              <span>{t('artifact.openInCanvas')}</span>
            </button>
          )}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-xs text-text-secondary hover:text-text-primary transition"
          >
            {copied ? (
              <>
                <Check size={14} />
                <span>{t('common.copied')}</span>
              </>
            ) : (
              <>
                <Copy size={14} />
                <span>{t('common.copy')}</span>
              </>
            )}
          </button>
        </div>
      </div>
      <SyntaxHighlighter
        language={language}
        style={vscDarkPlus}
        customStyle={{
          margin: 0,
          padding: '16px',
          fontSize: '13px',
          lineHeight: '1.5',
          borderRadius: 0,
        }}
      >
        {children}
      </SyntaxHighlighter>
    </div>
  )
}
