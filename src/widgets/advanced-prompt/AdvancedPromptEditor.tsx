import { useState, useRef, useEffect, useCallback } from 'react'
import { useTranslation } from '@/shared/i18n'
import { Maximize2, Minimize2, Eye, EyeOff, History, X, Copy, Check, Hash } from 'lucide-react'
import { Button } from '@/shared/ui/Button'

interface AdvancedPromptEditorProps {
  value: string
  onChange: (value: string) => void
  onSubmit: (value: string) => void
  history?: string[]
  placeholder?: string
  maxLength?: number
}

interface AutocompleteItem {
  value: string
  label: string
  description?: string
}

const PRESET_VARIABLES: AutocompleteItem[] = [
  { value: '{{input}}', label: 'input', description: 'User input' },
  { value: '{{output}}', label: 'output', description: 'Previous output' },
  { value: '{{date}}', label: 'date', description: 'Current date' },
  { value: '{{model}}', label: 'model', description: 'Model name' },
  { value: '{{language}}', label: 'language', description: 'Current language' },
]

const SLASH_COMMANDS: AutocompleteItem[] = [
  { value: '/summarize', label: 'summarize', description: 'Summarize the text' },
  { value: '/translate', label: 'translate', description: 'Translate to another language' },
  { value: '/explain', label: 'explain', description: 'Explain in simple terms' },
  { value: '/code', label: 'code', description: 'Write code' },
  { value: '/analyze', label: 'analyze', description: 'Analyze the content' },
  { value: '/rewrite', label: 'rewrite', description: 'Rewrite professionally' },
]

const COMMAND_TEMPLATES: Record<string, string> = {
  '/summarize': 'Summarize the following text in a concise manner:\n\n{{input}}',
  '/translate': 'Translate the following text to {{language}}:\n\n{{input}}',
  '/explain': 'Explain the following in simple terms:\n\n{{input}}',
  '/code': 'Write code to accomplish the following:\n\n{{input}}',
  '/analyze': 'Analyze the following content:\n\n{{input}}',
  '/rewrite': 'Rewrite the following text professionally:\n\n{{input}}',
}

export function AdvancedPromptEditor({
  value,
  onChange,
  onSubmit,
  history = [],
  placeholder,
  maxLength,
}: AdvancedPromptEditorProps) {
  const { t } = useTranslation()
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [showLineNumbers, setShowLineNumbers] = useState(false)
  const [copied, setCopied] = useState(false)
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [autocompleteVisible, setAutocompleteVisible] = useState(false)
  const [autocompleteItems, setAutocompleteItems] = useState<AutocompleteItem[]>([])
  const [autocompleteIndex, setAutocompleteIndex] = useState(0)
  const [autocompletePosition, setAutocompletePosition] = useState({ top: 0, left: 0 })

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const autocompleteRef = useRef<HTMLDivElement>(null)

  const lines = value.split('\n')
  const lineCount = lines.length
  const charCount = value.length
  const wordCount = value.trim().split(/\s+/).filter(Boolean).length

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    textarea.style.height = 'auto'
    textarea.style.height = `${textarea.scrollHeight}px`
  }, [value])

  // Handle escape key to close fullscreen or autocomplete
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (autocompleteVisible) {
          setAutocompleteVisible(false)
        } else if (isFullscreen) {
          setIsFullscreen(false)
        }
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isFullscreen, autocompleteVisible])

  const getCursorCoordinates = useCallback(() => {
    const textarea = textareaRef.current
    if (!textarea) return { top: 0, left: 0 }

    const { selectionStart } = textarea
    const textBeforeCursor = value.substring(0, selectionStart)
    const lines = textBeforeCursor.split('\n')
    const currentLine = lines.length
    const currentColumn = lines[lines.length - 1].length

    // Approximate position (in real implementation, use more precise calculation)
    const lineHeight = 24
    const charWidth = 8
    const top = (currentLine - 1) * lineHeight + 30
    const left = currentColumn * charWidth + 20

    return { top, left }
  }, [value])

  const checkForAutocomplete = useCallback(
    (text: string, cursorPos: number) => {
      const textBeforeCursor = text.substring(0, cursorPos)
      const lastTwoChars = textBeforeCursor.slice(-2)
      const lineStart = textBeforeCursor.lastIndexOf('\n') + 1
      const currentLine = textBeforeCursor.substring(lineStart)

      // Check for {{ variable autocomplete
      if (lastTwoChars === '{{') {
        setAutocompleteItems(PRESET_VARIABLES)
        setAutocompleteIndex(0)
        setAutocompleteVisible(true)
        setAutocompletePosition(getCursorCoordinates())
        return
      }

      // Check for / slash command autocomplete
      if (currentLine.trim().startsWith('/') && cursorPos === textBeforeCursor.length) {
        const query = currentLine.trim().substring(1).toLowerCase()
        const filtered = SLASH_COMMANDS.filter(
          (cmd) => cmd.label.toLowerCase().includes(query)
        )
        if (filtered.length > 0) {
          setAutocompleteItems(filtered)
          setAutocompleteIndex(0)
          setAutocompleteVisible(true)
          setAutocompletePosition(getCursorCoordinates())
          return
        }
      }

      setAutocompleteVisible(false)
    },
    [getCursorCoordinates]
  )

  const insertAutocomplete = useCallback(
    (item: AutocompleteItem) => {
      const textarea = textareaRef.current
      if (!textarea) return

      const cursorPos = textarea.selectionStart
      const textBeforeCursor = value.substring(0, cursorPos)
      const textAfterCursor = value.substring(cursorPos)

      let newText = ''
      let newCursorPos = cursorPos

      // Check if it's a variable or command
      if (item.value.startsWith('{{')) {
        // Variable insertion - replace {{ with the full variable
        const beforeVar = textBeforeCursor.slice(0, -2)
        newText = beforeVar + item.value + textAfterCursor
        newCursorPos = beforeVar.length + item.value.length
      } else if (item.value.startsWith('/')) {
        // Command insertion - replace the line with template
        const lineStart = textBeforeCursor.lastIndexOf('\n') + 1
        const beforeLine = textBeforeCursor.substring(0, lineStart)
        const template = COMMAND_TEMPLATES[item.value] || item.value
        newText = beforeLine + template + textAfterCursor
        newCursorPos = beforeLine.length + template.length
      }

      onChange(newText)
      setAutocompleteVisible(false)

      // Restore cursor position
      setTimeout(() => {
        textarea.focus()
        textarea.setSelectionRange(newCursorPos, newCursorPos)
      }, 0)
    },
    [value, onChange]
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      const textarea = textareaRef.current
      if (!textarea) return

      // Handle autocomplete navigation
      if (autocompleteVisible) {
        if (e.key === 'ArrowDown') {
          e.preventDefault()
          setAutocompleteIndex((prev) => (prev + 1) % autocompleteItems.length)
          return
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault()
          setAutocompleteIndex(
            (prev) => (prev - 1 + autocompleteItems.length) % autocompleteItems.length
          )
          return
        }
        if (e.key === 'Enter' || e.key === 'Tab') {
          e.preventDefault()
          insertAutocomplete(autocompleteItems[autocompleteIndex])
          return
        }
        if (e.key === 'Escape') {
          e.preventDefault()
          setAutocompleteVisible(false)
          return
        }
      }

      // Handle Tab key for indentation
      if (e.key === 'Tab') {
        e.preventDefault()
        const start = textarea.selectionStart
        const end = textarea.selectionEnd
        const newValue = value.substring(0, start) + '  ' + value.substring(end)
        onChange(newValue)
        setTimeout(() => {
          textarea.setSelectionRange(start + 2, start + 2)
        }, 0)
        return
      }

      // Handle history navigation with Up/Down arrows
      if (!autocompleteVisible && history.length > 0) {
        const atStart = textarea.selectionStart === 0
        const atEnd = textarea.selectionStart === value.length

        if (e.key === 'ArrowUp' && atStart && e.ctrlKey) {
          e.preventDefault()
          if (historyIndex < history.length - 1) {
            const newIndex = historyIndex + 1
            setHistoryIndex(newIndex)
            onChange(history[newIndex])
          }
          return
        }

        if (e.key === 'ArrowDown' && atEnd && e.ctrlKey) {
          e.preventDefault()
          if (historyIndex > 0) {
            const newIndex = historyIndex - 1
            setHistoryIndex(newIndex)
            onChange(history[newIndex])
          } else if (historyIndex === 0) {
            setHistoryIndex(-1)
            onChange('')
          }
          return
        }
      }

      // Handle Cmd/Ctrl+Enter to submit
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault()
        onSubmit(value)
        return
      }
    },
    [
      autocompleteVisible,
      autocompleteItems,
      autocompleteIndex,
      history,
      historyIndex,
      value,
      onChange,
      onSubmit,
      insertAutocomplete,
    ]
  )

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value
      if (maxLength && newValue.length > maxLength) return

      onChange(newValue)
      checkForAutocomplete(newValue, e.target.selectionStart)
      setHistoryIndex(-1)
    },
    [maxLength, onChange, checkForAutocomplete]
  )

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [value])

  const handleClear = useCallback(() => {
    onChange('')
    setHistoryIndex(-1)
    textareaRef.current?.focus()
  }, [onChange])

  const handleHistorySelect = useCallback(
    (item: string) => {
      onChange(item)
      setShowHistory(false)
      textareaRef.current?.focus()
    },
    [onChange]
  )

  const renderMarkdownPreview = useCallback((text: string) => {
    // Basic markdown rendering
    const html = text
      // Headers
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold mt-4 mb-2">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-4 mb-2">$1</h1>')
      // Bold
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
      // Italic
      .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
      // Code blocks
      .replace(/```([\s\S]*?)```/g, '<pre class="bg-surface p-3 rounded my-2 overflow-x-auto"><code>$1</code></pre>')
      // Inline code
      .replace(/`(.*?)`/g, '<code class="bg-surface px-1.5 py-0.5 rounded text-sm">$1</code>')
      // Lists
      .replace(/^\* (.*$)/gim, '<li class="ml-4">$1</li>')
      .replace(/(<li.*<\/li>)/s, '<ul class="list-disc my-2">$1</ul>')
      // Line breaks
      .replace(/\n/g, '<br />')

    return html
  }, [])

  const toolbar = (
    <div className="flex items-center justify-between gap-2 p-3 border-b border-border bg-surface">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsFullscreen(!isFullscreen)}
          aria-label={t('advancedEditor.fullscreen')}
        >
          {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowPreview(!showPreview)}
          aria-label={t('advancedEditor.preview')}
        >
          {showPreview ? <EyeOff size={18} /> : <Eye size={18} />}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowHistory(!showHistory)}
          aria-label={t('advancedEditor.history')}
          disabled={history.length === 0}
        >
          <History size={18} />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowLineNumbers(!showLineNumbers)}
          aria-label={t('advancedEditor.lineNumbers')}
        >
          <Hash size={18} />
        </Button>
      </div>

      <div className="flex items-center gap-3 text-sm text-text-secondary">
        <span>
          {t('advancedEditor.lines')}: {lineCount}
        </span>
        <span>
          {t('advancedEditor.words')}: {wordCount}
        </span>
        <span>
          {t('advancedEditor.chars')}: {charCount}
          {maxLength && `/${maxLength}`}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={handleCopy} aria-label={t('advancedEditor.copy')}>
          {copied ? <Check size={18} /> : <Copy size={18} />}
        </Button>
        <Button variant="ghost" size="sm" onClick={handleClear} aria-label={t('advancedEditor.clear')}>
          <X size={18} />
        </Button>
      </div>
    </div>
  )

  const editorContent = (
    <div className="relative flex-1 flex">
      {/* Line numbers */}
      {showLineNumbers && (
        <div className="w-12 bg-surface border-r border-border text-text-secondary text-sm text-right py-3 pr-2 font-mono select-none">
          {lines.map((_, i) => (
            <div key={i} className="leading-6">
              {i + 1}
            </div>
          ))}
        </div>
      )}

      {/* Editor pane */}
      <div className={`flex-1 relative ${showPreview ? 'w-1/2' : 'w-full'}`}>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || t('advancedEditor.placeholder')}
          className="w-full h-full p-4 bg-page text-text-primary resize-none focus:outline-none font-mono text-sm leading-6"
          style={{ minHeight: isFullscreen ? 'calc(100vh - 180px)' : '200px' }}
        />

        {/* Autocomplete dropdown */}
        {autocompleteVisible && (
          <div
            ref={autocompleteRef}
            className="absolute z-50 bg-surface border border-border rounded-lg shadow-lg max-w-xs"
            style={{ top: autocompletePosition.top, left: autocompletePosition.left }}
          >
            {autocompleteItems.map((item, index) => (
              <button
                key={item.value}
                className={`w-full px-3 py-2 text-left hover:bg-page transition-colors ${
                  index === autocompleteIndex ? 'bg-page' : ''
                }`}
                onClick={() => insertAutocomplete(item)}
              >
                <div className="font-medium text-sm text-text-primary">{item.label}</div>
                {item.description && (
                  <div className="text-xs text-text-secondary mt-0.5">{item.description}</div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Preview pane */}
      {showPreview && (
        <div className="flex-1 w-1/2 border-l border-border p-4 overflow-y-auto bg-surface">
          <div className="text-sm text-text-secondary mb-3 font-semibold">
            {t('advancedEditor.previewTitle')}
          </div>
          <div
            className="prose prose-sm max-w-none text-text-primary"
            dangerouslySetInnerHTML={{ __html: renderMarkdownPreview(value) }}
          />
        </div>
      )}
    </div>
  )

  const historyPanel = showHistory && history.length > 0 && (
    <div className="border-t border-border bg-surface p-3">
      <div className="text-sm font-semibold text-text-primary mb-2">
        {t('advancedEditor.recentPrompts')}
      </div>
      <div className="max-h-40 overflow-y-auto space-y-1">
        {history.slice(0, 10).map((item, index) => (
          <button
            key={index}
            onClick={() => handleHistorySelect(item)}
            className="w-full text-left px-3 py-2 rounded hover:bg-page transition-colors text-sm text-text-secondary truncate"
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  )

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-page flex flex-col">
        <div className="border-b border-border bg-surface px-4 py-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text-primary">
            {t('advancedEditor.title')}
          </h2>
          <Button variant="ghost" size="sm" onClick={() => setIsFullscreen(false)}>
            <X size={20} />
          </Button>
        </div>

        {toolbar}

        <div className="flex-1 flex flex-col overflow-hidden">
          {editorContent}
        </div>

        {historyPanel}

        <div className="border-t border-border bg-surface px-4 py-3 flex items-center justify-between">
          <div className="text-sm text-text-secondary">
            {t('advancedEditor.shortcuts')}:{' '}
            <kbd className="px-2 py-1 bg-page rounded text-xs">Cmd/Ctrl+Enter</kbd>{' '}
            {t('advancedEditor.submit')},{' '}
            <kbd className="px-2 py-1 bg-page rounded text-xs">Ctrl+↑/↓</kbd>{' '}
            {t('advancedEditor.historyNav')}
          </div>
          <Button onClick={() => onSubmit(value)} disabled={!value.trim()}>
            {t('advancedEditor.submit')}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="border border-border rounded-xl bg-surface overflow-hidden">
      {toolbar}
      <div className="flex flex-col">{editorContent}</div>
      {historyPanel}
    </div>
  )
}
