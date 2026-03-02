import { useState, useRef } from 'react'
import { ArrowLeft, Play, RotateCcw, Check, Loader2 } from 'lucide-react'
import TextareaAutosize from 'react-textarea-autosize'
import { useSessionStore } from '@/entities/session/session.store'
import { useSettingsStore } from '@/entities/settings/settings.store'
import { useDebateStore } from '@/entities/debate/debate.store'
import { useTranslation } from '@/shared/i18n'
import { MODELS, PROVIDER_COLORS } from '@/shared/constants'
import { createStream, getProviderConfig } from '@/shared/lib/providers/factory'
import type { GroupChatResponse, ProviderType, DebateRound } from '@/shared/types'
import { Button } from '@/shared/ui/Button'

const MAX_ROUNDS = 3
const PROVIDER_ORDER: ProviderType[] = ['bedrock', 'openai', 'gemini']

export function DebatePage() {
  const { t } = useTranslation()
  const setView = useSessionStore((s) => s.setView)
  const credentials = useSettingsStore((s) => s.credentials)
  const openaiApiKey = useSettingsStore((s) => s.openaiApiKey)
  const geminiApiKey = useSettingsStore((s) => s.geminiApiKey)

  const { session, isRunning, startDebate, addRound, updateRoundResponse, setStatus, setSummary, reset } = useDebateStore()

  const [topic, setTopic] = useState('')
  const [selectedModels, setSelectedModels] = useState<string[]>([])
  const abortRef = useRef<AbortController | null>(null)

  function toggleModel(modelId: string) {
    setSelectedModels((prev) =>
      prev.includes(modelId)
        ? prev.filter((id) => id !== modelId)
        : prev.length < 3
          ? [...prev, modelId]
          : prev
    )
  }

  async function runDebate() {
    if (!topic.trim() || selectedModels.length < 2) return

    startDebate(topic.trim(), selectedModels)
    const abortController = new AbortController()
    abortRef.current = abortController

    try {
      const previousContexts: string[][] = []

      for (let roundNum = 1; roundNum <= MAX_ROUNDS; roundNum++) {
        // Create round with empty responses
        const responses: GroupChatResponse[] = selectedModels.map((modelId) => {
          const model = MODELS.find((m) => m.id === modelId)
          return {
            modelId,
            provider: model?.provider ?? 'bedrock',
            content: '',
            isStreaming: true,
          }
        })

        const round: DebateRound = { roundNumber: roundNum, responses }
        addRound(round)

        // Build context from previous rounds
        const contextMessages = buildRoundContext(topic.trim(), roundNum, previousContexts, selectedModels)

        // Run all models in parallel for this round
        const roundResults: string[] = []

        const streamPromises = selectedModels.map(async (modelId, idx) => {
          const startTime = Date.now()

          try {
            const config = getProviderConfig(modelId, {
              credentials,
              openaiApiKey,
              geminiApiKey,
            })

            const modelMessages = contextMessages.map((msg) => ({
              role: msg.role as 'user' | 'assistant',
              content: msg.content,
            }))

            const stream = createStream(config, {
              modelId,
              messages: modelMessages,
              signal: abortController.signal,
            })

            let fullText = ''
            for await (const event of stream) {
              if (event.type === 'text' && event.content) {
                fullText += event.content
                const currentText = fullText
                updateRoundResponse(roundNum, modelId, (resp) => ({
                  ...resp,
                  content: currentText,
                }))
              } else if (event.type === 'error') {
                updateRoundResponse(roundNum, modelId, (resp) => ({
                  ...resp,
                  error: event.error,
                  isStreaming: false,
                }))
                roundResults[idx] = ''
                return
              }
            }

            const responseTime = Date.now() - startTime
            updateRoundResponse(roundNum, modelId, (resp) => ({
              ...resp,
              isStreaming: false,
              responseTime,
            }))
            roundResults[idx] = fullText
          } catch (error) {
            if (error instanceof DOMException && error.name === 'AbortError') {
              updateRoundResponse(roundNum, modelId, (resp) => ({
                ...resp,
                isStreaming: false,
              }))
              roundResults[idx] = ''
              return
            }
            const errorMsg = error instanceof Error ? error.message : 'Unknown error'
            updateRoundResponse(roundNum, modelId, (resp) => ({
              ...resp,
              error: errorMsg,
              isStreaming: false,
            }))
            roundResults[idx] = ''
          }
        })

        await Promise.allSettled(streamPromises)

        if (abortController.signal.aborted) return

        previousContexts.push(roundResults)
      }

      // Summarize with the first model
      setStatus('summarizing')
      await generateSummary(abortController, previousContexts)
    } catch {
      setStatus('done')
    } finally {
      abortRef.current = null
    }
  }

  function buildRoundContext(
    debateTopic: string,
    roundNum: number,
    previousContexts: string[][],
    models: string[]
  ): Array<{ role: string; content: string }> {
    const messages: Array<{ role: string; content: string }> = []

    if (roundNum === 1) {
      messages.push({
        role: 'user',
        content: `You are participating in a multi-model debate. The topic is: "${debateTopic}"\n\nPlease provide your perspective and arguments. Be specific and constructive. This is round 1 of ${MAX_ROUNDS}.`,
      })
    } else {
      let context = `You are participating in a multi-model debate. The topic is: "${debateTopic}"\n\nThis is round ${roundNum} of ${MAX_ROUNDS}.\n\nHere are the responses from the previous round:\n\n`

      const prevResponses = previousContexts[previousContexts.length - 1]
      models.forEach((modelId, idx) => {
        const model = MODELS.find((m) => m.id === modelId)
        const label = model?.shortLabel ?? modelId
        context += `--- ${label} ---\n${prevResponses[idx] || '(no response)'}\n\n`
      })

      context += `Please respond to the other participants' arguments, refine your position, and try to find common ground. Be specific and constructive.`

      messages.push({ role: 'user', content: context })
    }

    return messages
  }

  async function generateSummary(abortController: AbortController, previousContexts: string[][]) {
    const summaryModel = selectedModels[0]
    const config = getProviderConfig(summaryModel, {
      credentials,
      openaiApiKey,
      geminiApiKey,
    })

    let summaryContext = `You moderated a ${MAX_ROUNDS}-round debate on: "${session?.topic}"\n\nHere is a summary of all rounds:\n\n`

    previousContexts.forEach((roundResponses, roundIdx) => {
      summaryContext += `=== Round ${roundIdx + 1} ===\n`
      selectedModels.forEach((modelId, modelIdx) => {
        const model = MODELS.find((m) => m.id === modelId)
        const label = model?.shortLabel ?? modelId
        summaryContext += `[${label}]: ${roundResponses[modelIdx] || '(no response)'}\n\n`
      })
    })

    summaryContext += `\nPlease provide a concise consensus summary that captures the key agreements, disagreements, and final conclusions from this debate.`

    try {
      const stream = createStream(config, {
        modelId: summaryModel,
        messages: [{ role: 'user', content: summaryContext }],
        signal: abortController.signal,
      })

      let fullSummary = ''
      for await (const event of stream) {
        if (event.type === 'text' && event.content) {
          fullSummary += event.content
          setSummary(fullSummary)
        }
      }
      setStatus('done')
    } catch {
      setStatus('done')
    }
  }

  function handleStop() {
    abortRef.current?.abort()
    setStatus('done')
  }

  function handleReset() {
    abortRef.current?.abort()
    reset()
    setTopic('')
    setSelectedModels([])
  }

  function formatTime(ms: number): string {
    return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`
  }

  const isSetup = !session || session.status === 'setup'

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
          <h1 className="text-sm font-semibold text-text-primary">{t('debate.title')}</h1>
          {session && (
            <span className="text-xs text-text-tertiary">
              {t(`debate.status.${session.status}`)}
            </span>
          )}
        </div>
        {session && (
          <Button variant="secondary" size="sm" onClick={handleReset}>
            <RotateCcw size={14} />
            {t('common.reset')}
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
        {/* Setup section */}
        {isSetup && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="text-center py-4">
              <h2 className="text-lg font-semibold text-text-primary">{t('debate.setup')}</h2>
              <p className="text-sm text-text-secondary mt-1">{t('debate.setupDesc')}</p>
            </div>

            {/* Model selection */}
            <div>
              <p className="text-xs text-text-tertiary mb-2">{t('debate.selectModels')}</p>
              <div className="flex flex-wrap gap-2">
                {PROVIDER_ORDER.map((provider) => {
                  const providerModels = MODELS.filter((m) => m.provider === provider)
                  return providerModels.map((model) => {
                    const isSelected = selectedModels.includes(model.id)
                    return (
                      <button
                        key={model.id}
                        onClick={() => toggleModel(model.id)}
                        disabled={!isSelected && selectedModels.length >= 3}
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
              <p className="text-xs text-text-tertiary mt-1">
                {t('debate.modelsSelected', { count: String(selectedModels.length) })}
              </p>
            </div>

            {/* Topic input */}
            <div>
              <p className="text-xs text-text-tertiary mb-2">{t('debate.topicLabel')}</p>
              <TextareaAutosize
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder={t('debate.topicPlaceholder')}
                minRows={3}
                maxRows={6}
                className="w-full px-4 py-3 rounded-xl border border-border-input bg-input text-sm text-text-primary outline-none focus:border-primary resize-none"
              />
            </div>

            {/* Start button */}
            <Button
              variant="primary"
              onClick={runDebate}
              disabled={!topic.trim() || selectedModels.length < 2}
              className="w-full gap-2"
            >
              <Play size={16} />
              {t('debate.start')}
            </Button>
          </div>
        )}

        {/* Debate rounds */}
        {session && session.rounds.length > 0 && (
          <div className="space-y-6">
            {session.rounds.map((round) => (
              <div key={round.roundNumber} className="space-y-3">
                <h3 className="text-sm font-semibold text-text-primary">
                  {t('debate.round', { n: String(round.roundNumber) })}
                </h3>
                <div className={`grid gap-3 ${round.responses.length <= 2 ? 'grid-cols-2' : 'grid-cols-2 lg:grid-cols-3'}`}>
                  {round.responses.map((resp) => {
                    const model = MODELS.find((m) => m.id === resp.modelId)
                    const color = PROVIDER_COLORS[resp.provider]

                    return (
                      <div
                        key={resp.modelId}
                        className="border rounded-xl overflow-hidden"
                        style={{ borderColor: color + '40' }}
                      >
                        <div
                          className="px-3 py-2 flex items-center justify-between"
                          style={{ backgroundColor: color + '10' }}
                        >
                          <div className="flex items-center gap-1.5">
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: color }}
                            />
                            <span className="text-xs font-semibold">
                              {model?.shortLabel ?? resp.modelId}
                            </span>
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
                        <div className="px-3 py-3 min-h-[80px] max-h-[300px] overflow-y-auto">
                          {resp.error ? (
                            <p className="text-xs text-danger">{resp.error}</p>
                          ) : (
                            <p className="text-sm text-text-primary whitespace-pre-wrap leading-relaxed">
                              {resp.content || (resp.isStreaming ? t('chat.waitingResponse') : '')}
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summarizing indicator */}
        {session?.status === 'summarizing' && !session.summary && (
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <Loader2 size={16} className="animate-spin" />
            {t('debate.summarizing')}
          </div>
        )}

        {/* Summary */}
        {session?.summary && (
          <div className="border border-primary/30 bg-primary/5 rounded-xl p-4 space-y-2">
            <h3 className="text-sm font-semibold text-primary">{t('debate.summary')}</h3>
            <p className="text-sm text-text-primary whitespace-pre-wrap leading-relaxed">
              {session.summary}
            </p>
          </div>
        )}
      </div>

      {/* Stop button while running */}
      {isRunning && (
        <div className="px-4 pb-4">
          <Button variant="secondary" onClick={handleStop} className="w-full">
            {t('debate.stop')}
          </Button>
        </div>
      )}
    </div>
  )
}
