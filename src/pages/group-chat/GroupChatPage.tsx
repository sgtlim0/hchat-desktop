import { useState, useRef } from 'react'
import { ArrowLeft, Send, Square, Check, Trash2 } from 'lucide-react'
import TextareaAutosize from 'react-textarea-autosize'
import { useSessionStore } from '@/entities/session/session.store'
import { useSettingsStore } from '@/entities/settings/settings.store'
import { useGroupChatStore } from '@/entities/group-chat/group-chat.store'
import { MODELS, PROVIDER_COLORS } from '@/shared/constants'
import { createStream, getProviderConfig } from '@/shared/lib/providers/factory'
import type { GroupChatMessage, GroupChatResponse, ProviderType } from '@/shared/types'
import { Button } from '@/shared/ui/Button'

const PROVIDER_ORDER: ProviderType[] = ['bedrock', 'openai', 'gemini']

export function GroupChatPage() {
  const setView = useSessionStore((s) => s.setView)
  const credentials = useSettingsStore((s) => s.credentials)
  const openaiApiKey = useSettingsStore((s) => s.openaiApiKey)
  const geminiApiKey = useSettingsStore((s) => s.geminiApiKey)

  const { selectedModels, toggleModel, messages, addMessage, updateResponse, isStreaming, setStreaming, clearMessages } = useGroupChatStore()

  const [input, setInput] = useState('')
  const [isComposing, setIsComposing] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  async function handleSend() {
    if (!input.trim() || isStreaming || selectedModels.length < 2) return

    const prompt = input.trim()
    setInput('')
    setStreaming(true)

    const messageId = `gchat-${Date.now()}`
    const responses: GroupChatResponse[] = selectedModels.map((modelId) => {
      const model = MODELS.find((m) => m.id === modelId)
      return {
        modelId,
        provider: model?.provider ?? 'bedrock',
        content: '',
        isStreaming: true,
      }
    })

    const message: GroupChatMessage = {
      id: messageId,
      prompt,
      responses,
      timestamp: new Date().toISOString(),
    }
    addMessage(message)

    const abortController = new AbortController()
    abortRef.current = abortController

    const streamPromises = selectedModels.map(async (modelId) => {
      const startTime = Date.now()

      try {
        const config = getProviderConfig(modelId, {
          credentials,
          openaiApiKey,
          geminiApiKey,
        })

        const stream = createStream(config, {
          modelId,
          messages: [{ role: 'user', content: prompt }],
          signal: abortController.signal,
        })

        let fullText = ''
        for await (const event of stream) {
          if (event.type === 'text' && event.content) {
            fullText += event.content
            const currentText = fullText
            updateResponse(messageId, modelId, (resp) => ({
              ...resp,
              content: currentText,
            }))
          } else if (event.type === 'error') {
            updateResponse(messageId, modelId, (resp) => ({
              ...resp,
              error: event.error,
              isStreaming: false,
            }))
            return
          }
        }

        const responseTime = Date.now() - startTime
        updateResponse(messageId, modelId, (resp) => ({
          ...resp,
          isStreaming: false,
          responseTime,
        }))
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          updateResponse(messageId, modelId, (resp) => ({
            ...resp,
            isStreaming: false,
          }))
          return
        }
        const errorMsg = error instanceof Error ? error.message : 'Unknown error'
        updateResponse(messageId, modelId, (resp) => ({
          ...resp,
          error: errorMsg,
          isStreaming: false,
        }))
      }
    })

    await Promise.allSettled(streamPromises)
    setStreaming(false)
    abortRef.current = null
    scrollToBottom()
  }

  function handleStop() {
    abortRef.current?.abort()
    setStreaming(false)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey && !isComposing) {
      e.preventDefault()
      handleSend()
    }
  }

  function formatTime(ms: number): string {
    return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="h-[52px] border-b border-border px-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setView('home')}
            className="p-1.5 hover:bg-hover rounded-lg transition"
          >
            <ArrowLeft size={18} className="text-text-secondary" />
          </button>
          <h1 className="text-sm font-semibold text-text-primary">그룹 채팅</h1>
          <span className="text-xs text-text-tertiary">
            {selectedModels.length}개 모델 선택됨
          </span>
        </div>
        {messages.length > 0 && (
          <Button variant="secondary" size="sm" onClick={clearMessages}>
            <Trash2 size={14} />
            초기화
          </Button>
        )}
      </div>

      {/* Model Selection */}
      <div className="px-4 py-3 border-b border-border bg-page/50">
        <p className="text-xs text-text-tertiary mb-2">비교할 모델을 2-4개 선택하세요</p>
        <div className="flex flex-wrap gap-2">
          {PROVIDER_ORDER.map((provider) => {
            const providerModels = MODELS.filter((m) => m.provider === provider)
            return providerModels.map((model) => {
              const isSelected = selectedModels.includes(model.id)
              return (
                <button
                  key={model.id}
                  onClick={() => toggleModel(model.id)}
                  disabled={!isSelected && selectedModels.length >= 4}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition border ${
                    isSelected
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-text-secondary hover:bg-hover disabled:opacity-40 disabled:cursor-not-allowed'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: PROVIDER_COLORS[provider] }}
                  />
                  {isSelected && <Check size={12} />}
                  {model.shortLabel}
                </button>
              )
            })
          })}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
        {messages.length === 0 && (
          <div className="flex-1 flex items-center justify-center text-text-tertiary text-sm py-20">
            모델을 선택하고 메시지를 보내면 병렬로 응답을 비교할 수 있습니다
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className="space-y-3">
            {/* User prompt */}
            <div className="bg-card border border-border rounded-xl px-4 py-3">
              <p className="text-sm text-text-primary whitespace-pre-wrap">{msg.prompt}</p>
            </div>

            {/* Model responses grid */}
            <div className={`grid gap-3 ${
              msg.responses.length <= 2 ? 'grid-cols-2' : 'grid-cols-2'
            }`}>
              {msg.responses.map((resp) => {
                const model = MODELS.find((m) => m.id === resp.modelId)
                const color = PROVIDER_COLORS[resp.provider]

                return (
                  <div
                    key={resp.modelId}
                    className="border rounded-xl overflow-hidden"
                    style={{ borderColor: color + '40' }}
                  >
                    {/* Response header */}
                    <div
                      className="px-3 py-2 flex items-center justify-between"
                      style={{ backgroundColor: color + '10' }}
                    >
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: color }}
                        />
                        <span className="text-xs font-semibold">{model?.shortLabel ?? resp.modelId}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {resp.isStreaming && (
                          <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                        )}
                        {resp.responseTime && (
                          <span className="text-[11px] text-text-tertiary">
                            {formatTime(resp.responseTime)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Response content */}
                    <div className="px-3 py-3 min-h-[80px]">
                      {resp.error ? (
                        <p className="text-xs text-danger">{resp.error}</p>
                      ) : (
                        <p className="text-sm text-text-primary whitespace-pre-wrap leading-relaxed">
                          {resp.content || (resp.isStreaming ? '응답 대기 중...' : '')}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-4 pb-4">
        <div className="rounded-xl border border-border-input bg-input p-3 flex items-end gap-2">
          <TextareaAutosize
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onCompositionStart={() => setIsComposing(true)}
            onCompositionEnd={() => setIsComposing(false)}
            placeholder={
              selectedModels.length < 2
                ? '먼저 2개 이상의 모델을 선택하세요'
                : '모든 모델에 동시에 보낼 메시지를 입력하세요...'
            }
            disabled={selectedModels.length < 2}
            minRows={1}
            maxRows={6}
            className="flex-1 bg-transparent resize-none outline-none text-sm placeholder:text-text-tertiary disabled:opacity-50"
          />
          <div className="flex-shrink-0">
            {isStreaming ? (
              <button
                onClick={handleStop}
                className="p-2 hover:bg-hover rounded-lg transition"
              >
                <Square size={20} className="text-text-secondary" />
              </button>
            ) : (
              <button
                onClick={handleSend}
                disabled={!input.trim() || selectedModels.length < 2}
                className={`p-2 rounded-lg transition ${
                  input.trim() && selectedModels.length >= 2
                    ? 'bg-primary hover:opacity-90 text-white'
                    : 'bg-hover text-text-tertiary cursor-not-allowed'
                }`}
              >
                <Send size={20} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
