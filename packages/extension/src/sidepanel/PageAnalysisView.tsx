import { useState, useEffect, useCallback } from 'react'
import { FileText, List, HelpCircle } from 'lucide-react'
import { DEFAULT_MODEL_ID, MODELS } from '@hchat/shared'
import { usePageContext } from '../hooks/usePageContext'
import { useStreamingChat } from '../hooks/useStreamingChat'
import { useMessageBuilder } from '../hooks/useMessageBuilder'
import { PageContextBanner } from '../components/PageContextBanner'
import { PromptInput } from '../components/PromptInput'
import { MessageBubble } from '../components/MessageBubble'

const quickActions = [
  { id: 'summarize', label: 'Summarize', prompt: 'Summarize this page concisely.', Icon: FileText },
  { id: 'keypoints', label: 'Key Points', prompt: 'Extract the key points from this page as a bullet list.', Icon: List },
  { id: 'question', label: 'Free Question', prompt: '', Icon: HelpCircle },
]

export function PageAnalysisView() {
  const { pageData, isLoading, fetchPageContent } = usePageContext()
  const { isStreaming, streamingText, sendMessage, stopStreaming } = useStreamingChat()
  const { buildSystemPrompt } = useMessageBuilder()
  const [result, setResult] = useState('')
  const [showInput, setShowInput] = useState(false)

  useEffect(() => {
    fetchPageContent()
  }, [fetchPageContent])

  // Collect result when streaming ends
  useEffect(() => {
    if (!isStreaming && streamingText) {
      setResult(streamingText)
    }
  }, [isStreaming, streamingText])

  const runAction = useCallback(
    (prompt: string) => {
      setResult('')
      const modelId = localStorage.getItem('hchat-model') || DEFAULT_MODEL_ID
      const model = MODELS.find(m => m.id === modelId)
      const system = buildSystemPrompt(undefined, pageData?.content)

      sendMessage({
        modelId,
        messages: [{ role: 'user', content: prompt }],
        system,
        provider: model?.provider || 'bedrock',
      })
    },
    [pageData, buildSystemPrompt, sendMessage],
  )

  function handleAction(id: string) {
    const action = quickActions.find(a => a.id === id)
    if (!action) return

    if (id === 'question') {
      setShowInput(true)
      return
    }

    setShowInput(false)
    runAction(action.prompt)
  }

  function handleFreeQuestion(text: string) {
    runAction(text)
  }

  const displayText = isStreaming ? streamingText : result

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0">
        <PageContextBanner
          title={pageData?.title || 'No page detected'}
          url={pageData?.url || ''}
          isLoading={isLoading}
        />
      </div>

      <div className="shrink-0 border-b border-slate-200 px-3 py-2 dark:border-slate-700">
        <div className="flex gap-2">
          {quickActions.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => handleAction(id)}
              disabled={isStreaming || !pageData}
              className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium
                text-slate-700 transition-colors hover:border-blue-400 hover:text-blue-600
                disabled:cursor-not-allowed disabled:opacity-50
                dark:border-slate-600 dark:text-slate-300 dark:hover:border-blue-500"
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {displayText ? (
          <MessageBubble
            message={{
              role: 'assistant',
              segments: [{ type: 'text', content: displayText }],
            }}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">
            {pageData
              ? 'Choose an action above to analyze this page'
              : 'Navigate to a page to get started'}
          </div>
        )}
        {isStreaming && (
          <div className="flex items-center gap-1 px-4 py-1">
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-500 [animation-delay:0ms]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-500 [animation-delay:150ms]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-500 [animation-delay:300ms]" />
          </div>
        )}
      </div>

      {showInput && (
        <PromptInput
          onSend={handleFreeQuestion}
          isStreaming={isStreaming}
          onStop={stopStreaming}
          placeholder="Ask about this page..."
        />
      )}
    </div>
  )
}
