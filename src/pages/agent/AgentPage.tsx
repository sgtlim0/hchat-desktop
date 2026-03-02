import { useState, useCallback, useRef } from 'react'
import { useSettingsStore } from '@/entities/settings/settings.store'
import { useSessionStore } from '@/entities/session/session.store'
import { createStream, getProviderConfig } from '@/shared/lib/providers/factory'
import { AGENT_TOOLS, getAgentSystemPrompt } from '@/shared/lib/agent/tools'
import { parseToolCalls, stripToolCalls } from '@/shared/lib/agent/parser'
import { useTranslation } from '@/shared/i18n'
import { Button } from '@/shared/ui/Button'

interface AgentStep {
  type: 'thinking' | 'tool_call' | 'tool_result' | 'response'
  content: string
  toolName?: string
  toolArgs?: Record<string, string>
}

export function AgentPage() {
  const { t } = useTranslation()
  const goHome = useSessionStore((s) => s.goHome)
  const selectedModel = useSettingsStore((s) => s.selectedModel)
  const credentials = useSettingsStore((s) => s.credentials)
  const openaiApiKey = useSettingsStore((s) => s.openaiApiKey)
  const geminiApiKey = useSettingsStore((s) => s.geminiApiKey)

  const [prompt, setPrompt] = useState('')
  const [steps, setSteps] = useState<AgentStep[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [, setFinalResponse] = useState('')
  const abortRef = useRef<AbortController | null>(null)

  const handleRun = useCallback(async () => {
    if (!prompt.trim() || isRunning) return

    setIsRunning(true)
    setSteps([])
    setFinalResponse('')
    abortRef.current = new AbortController()

    const config = getProviderConfig(selectedModel, { credentials, openaiApiKey, geminiApiKey })
    const systemPrompt = getAgentSystemPrompt()
    const history: Array<{ role: 'user' | 'assistant'; content: string }> = [
      { role: 'user', content: prompt },
    ]

    const maxSteps = 5

    try {
      for (let step = 0; step < maxSteps; step++) {
        // Stream LLM response
        setSteps((prev) => [...prev, { type: 'thinking', content: `Step ${step + 1}: Thinking...` }])

        let fullResponse = ''
        for await (const event of createStream(config, {
          modelId: selectedModel,
          messages: history,
          system: systemPrompt,
          signal: abortRef.current?.signal,
        })) {
          if (event.type === 'text' && event.content) {
            fullResponse += event.content
          }
          if (event.type === 'error') {
            setSteps((prev) => [...prev, { type: 'response', content: `Error: ${event.error}` }])
            setIsRunning(false)
            return
          }
        }

        // Parse tool calls
        const toolCalls = parseToolCalls(fullResponse)
        const textContent = stripToolCalls(fullResponse)

        if (toolCalls.length === 0) {
          // No tool calls — this is the final response
          setFinalResponse(fullResponse)
          setSteps((prev) => {
            const updated = [...prev]
            updated[updated.length - 1] = { type: 'response', content: textContent || fullResponse }
            return updated
          })
          break
        }

        // Execute tool calls
        history.push({ role: 'assistant', content: fullResponse })

        for (const call of toolCalls) {
          setSteps((prev) => [
            ...prev,
            { type: 'tool_call', content: `Calling ${call.name}...`, toolName: call.name, toolArgs: call.args },
          ])

          const tool = AGENT_TOOLS.find((t) => t.name === call.name)
          let result: string
          if (tool) {
            result = await tool.execute(call.args)
          } else {
            result = `Unknown tool: ${call.name}`
          }

          setSteps((prev) => [
            ...prev,
            { type: 'tool_result', content: result, toolName: call.name },
          ])

          history.push({
            role: 'user',
            content: `<tool_result name="${call.name}">${result}</tool_result>`,
          })
        }
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        setSteps((prev) => [
          ...prev,
          { type: 'response', content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` },
        ])
      }
    } finally {
      setIsRunning(false)
    }
  }, [prompt, isRunning, selectedModel, credentials, openaiApiKey, geminiApiKey])

  const handleStop = useCallback(() => {
    abortRef.current?.abort()
    setIsRunning(false)
  }, [])

  return (
    <div className="flex flex-col h-full bg-page">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-border">
        <button
          onClick={goHome}
          className="p-1.5 rounded-lg hover:bg-hover transition-colors text-text-secondary"
          aria-label={t('common.back')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <h1 className="text-lg font-semibold text-text-primary">{t('agent.title')}</h1>
        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">Beta</span>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Steps Timeline */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-2xl mx-auto space-y-3">
            {steps.length === 0 && !isRunning && (
              <div className="text-center text-text-tertiary text-sm py-12">
                {t('agent.description')}
              </div>
            )}

            {steps.map((step, i) => (
              <div key={i} className="flex gap-3 animate-fade-in">
                <div className="flex-shrink-0 mt-1">
                  {step.type === 'thinking' && (
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    </div>
                  )}
                  {step.type === 'tool_call' && (
                    <div className="w-6 h-6 rounded-full bg-amber/20 flex items-center justify-center text-xs">
                      🔧
                    </div>
                  )}
                  {step.type === 'tool_result' && (
                    <div className="w-6 h-6 rounded-full bg-success/20 flex items-center justify-center text-xs">
                      ✅
                    </div>
                  )}
                  {step.type === 'response' && (
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-xs text-white">
                      AI
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  {step.type === 'tool_call' && (
                    <div className="bg-card rounded-lg p-3 border border-border">
                      <div className="text-xs font-medium text-text-secondary mb-1">
                        {t('agent.toolCall')}: {step.toolName}
                      </div>
                      {step.toolArgs && Object.keys(step.toolArgs).length > 0 && (
                        <pre className="text-xs text-text-tertiary font-mono whitespace-pre-wrap">
                          {JSON.stringify(step.toolArgs, null, 2)}
                        </pre>
                      )}
                    </div>
                  )}
                  {step.type === 'tool_result' && (
                    <div className="bg-card rounded-lg p-3 border border-success/30">
                      <div className="text-xs font-medium text-success mb-1">
                        {t('agent.toolResult')}: {step.toolName}
                      </div>
                      <pre className="text-xs text-text-primary font-mono whitespace-pre-wrap">
                        {step.content}
                      </pre>
                    </div>
                  )}
                  {step.type === 'thinking' && (
                    <div className="text-sm text-text-secondary italic">{step.content}</div>
                  )}
                  {step.type === 'response' && (
                    <div className="bg-card rounded-lg p-4 border border-border">
                      <div className="text-sm text-text-primary whitespace-pre-wrap">{step.content}</div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Available Tools */}
        <div className="px-6 py-2 border-t border-border">
          <div className="flex gap-2 flex-wrap">
            {AGENT_TOOLS.filter((t) => t.available).map((tool) => (
              <span key={tool.name} className="text-xs bg-card px-2 py-1 rounded-full text-text-secondary border border-border">
                🔧 {tool.name}
              </span>
            ))}
          </div>
        </div>

        {/* Input */}
        <div className="px-6 py-4 border-t border-border">
          <div className="max-w-2xl mx-auto flex gap-3">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={t('agent.promptPlaceholder')}
              rows={2}
              className="flex-1 p-3 bg-input border border-border-input rounded-xl text-sm text-text-primary resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleRun()
                }
              }}
            />
            {isRunning ? (
              <Button variant="secondary" onClick={handleStop}>
                {t('agent.stop')}
              </Button>
            ) : (
              <Button onClick={handleRun} disabled={!prompt.trim()}>
                {t('agent.run')}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
