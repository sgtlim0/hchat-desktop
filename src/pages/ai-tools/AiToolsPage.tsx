import { useState, useCallback } from 'react'
import { useSettingsStore } from '@/entities/settings/settings.store'
import { useSessionStore } from '@/entities/session/session.store'
import { createStream, getProviderConfig } from '@/shared/lib/providers/factory'
import { useTranslation } from '@/shared/i18n'
import { Button } from '@/shared/ui/Button'
import type { TranslationKey } from '@/shared/i18n'

type ToolId = 'summarize' | 'translate' | 'grammar' | 'rewrite' | 'expand' | 'simplify' | 'tone' | 'bullets' | 'headline' | 'email' | 'docHealth'

interface AiTool {
  id: ToolId
  icon: string
  labelKey: TranslationKey
  descKey: TranslationKey
  systemPrompt: string
  needsOption?: boolean
  options?: { value: string; labelKey: TranslationKey }[]
}

const AI_TOOLS: AiTool[] = [
  {
    id: 'summarize',
    icon: '📝',
    labelKey: 'aiTools.summarize',
    descKey: 'aiTools.summarizeDesc',
    systemPrompt: 'You are a summarization expert. Provide a clear, concise summary of the given text. Maintain key points and important details.',
  },
  {
    id: 'translate',
    icon: '🌐',
    labelKey: 'aiTools.translate',
    descKey: 'aiTools.translateDesc',
    systemPrompt: 'You are a professional translator. Translate the text to the requested language. Preserve tone and meaning.',
    needsOption: true,
    options: [
      { value: 'Korean', labelKey: 'aiTools.langKo' },
      { value: 'English', labelKey: 'aiTools.langEn' },
      { value: 'Japanese', labelKey: 'aiTools.langJa' },
      { value: 'Chinese', labelKey: 'aiTools.langZh' },
      { value: 'Spanish', labelKey: 'aiTools.langEs' },
    ],
  },
  {
    id: 'grammar',
    icon: '✅',
    labelKey: 'aiTools.grammar',
    descKey: 'aiTools.grammarDesc',
    systemPrompt: 'You are a grammar and spelling expert. Check the text for grammar, spelling, and punctuation errors. List each issue found with the correction. Then provide the corrected text.',
  },
  {
    id: 'rewrite',
    icon: '✏️',
    labelKey: 'aiTools.rewrite',
    descKey: 'aiTools.rewriteDesc',
    systemPrompt: 'You are a professional writer. Rewrite the given text to improve clarity, flow, and readability while preserving the original meaning.',
  },
  {
    id: 'expand',
    icon: '📖',
    labelKey: 'aiTools.expand',
    descKey: 'aiTools.expandDesc',
    systemPrompt: 'You are a content writer. Expand the given text with more detail, examples, and explanations. Make it 2-3x longer while maintaining quality.',
  },
  {
    id: 'simplify',
    icon: '💡',
    labelKey: 'aiTools.simplify',
    descKey: 'aiTools.simplifyDesc',
    systemPrompt: 'You are a plain language expert. Simplify the text so it can be understood by a general audience. Avoid jargon and complex sentences.',
  },
  {
    id: 'tone',
    icon: '🎭',
    labelKey: 'aiTools.tone',
    descKey: 'aiTools.toneDesc',
    systemPrompt: 'You are a writing style expert. Rewrite the text in the requested tone/style.',
    needsOption: true,
    options: [
      { value: 'professional', labelKey: 'aiTools.toneProfessional' },
      { value: 'casual', labelKey: 'aiTools.toneCasual' },
      { value: 'formal', labelKey: 'aiTools.toneFormal' },
      { value: 'friendly', labelKey: 'aiTools.toneFriendly' },
    ],
  },
  {
    id: 'bullets',
    icon: '📋',
    labelKey: 'aiTools.bullets',
    descKey: 'aiTools.bulletsDesc',
    systemPrompt: 'You are a content organizer. Convert the text into a clear, organized bullet-point list. Group related items together.',
  },
  {
    id: 'headline',
    icon: '🏷️',
    labelKey: 'aiTools.headline',
    descKey: 'aiTools.headlineDesc',
    systemPrompt: 'You are a headline writer. Generate 5 compelling headlines/titles for the given text. Vary the style: informative, catchy, question-based, etc.',
  },
  {
    id: 'email',
    icon: '📧',
    labelKey: 'aiTools.email',
    descKey: 'aiTools.emailDesc',
    systemPrompt: 'You are a professional email writer. Draft a polished email based on the given notes/points. Include subject line, greeting, body, and sign-off.',
  },
  {
    id: 'docHealth',
    icon: '🏥',
    labelKey: 'aiTools.docHealth',
    descKey: 'aiTools.docHealthDesc',
    systemPrompt: `You are a document quality analyst. Perform a comprehensive health check on the given text:
1. **Spelling & Grammar**: List errors with corrections
2. **Readability**: Rate readability (1-10) and suggest improvements
3. **Consistency**: Check for inconsistent formatting, capitalization, terminology
4. **Structure**: Evaluate organization and suggest improvements
5. **Clarity**: Flag unclear or ambiguous sentences
6. **Overall Score**: Give a score out of 100 with breakdown

Format the output clearly with sections and bullet points.`,
  },
]

export function AiToolsPage() {
  const { t } = useTranslation()
  const goHome = useSessionStore((s) => s.goHome)
  const selectedModel = useSettingsStore((s) => s.selectedModel)
  const credentials = useSettingsStore((s) => s.credentials)
  const openaiApiKey = useSettingsStore((s) => s.openaiApiKey)
  const geminiApiKey = useSettingsStore((s) => s.geminiApiKey)

  const [selectedTool, setSelectedTool] = useState<ToolId | null>(null)
  const [inputText, setInputText] = useState('')
  const [outputText, setOutputText] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedOption, setSelectedOption] = useState('')

  const currentTool = AI_TOOLS.find((t) => t.id === selectedTool)

  const handleProcess = useCallback(async () => {
    if (!currentTool || !inputText.trim() || isProcessing) return

    setIsProcessing(true)
    setOutputText('')

    let userPrompt = inputText
    if (currentTool.needsOption && selectedOption) {
      userPrompt = `[Target: ${selectedOption}]\n\n${inputText}`
    }

    try {
      const config = getProviderConfig(selectedModel, { credentials, openaiApiKey, geminiApiKey })
      const messages = [{ role: 'user' as const, content: userPrompt }]

      let result = ''
      for await (const event of createStream(config, {
        modelId: selectedModel,
        messages,
        system: currentTool.systemPrompt,
      })) {
        if (event.type === 'text' && event.content) {
          result += event.content
          setOutputText(result)
        }
        if (event.type === 'error') {
          setOutputText(`Error: ${event.error}`)
          break
        }
      }
    } catch (error) {
      setOutputText(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsProcessing(false)
    }
  }, [currentTool, inputText, isProcessing, selectedModel, credentials, openaiApiKey, geminiApiKey, selectedOption])

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(outputText)
  }, [outputText])

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
        <h1 className="text-lg font-semibold text-text-primary">{t('aiTools.title')}</h1>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Tool Grid */}
        <div className="w-64 border-r border-border overflow-y-auto p-4 flex-shrink-0">
          <div className="grid grid-cols-2 gap-2">
            {AI_TOOLS.map((tool) => (
              <button
                key={tool.id}
                onClick={() => {
                  setSelectedTool(tool.id)
                  setOutputText('')
                  setSelectedOption(tool.options?.[0]?.value ?? '')
                }}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl text-center transition-all ${
                  selectedTool === tool.id
                    ? 'bg-primary/10 border-2 border-primary'
                    : 'bg-card hover:bg-hover border-2 border-transparent'
                }`}
              >
                <span className="text-xl">{tool.icon}</span>
                <span className="text-xs font-medium text-text-primary leading-tight">
                  {t(tool.labelKey)}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Work Area */}
        <div className="flex-1 flex flex-col p-6 overflow-hidden">
          {!selectedTool ? (
            <div className="flex-1 flex items-center justify-center text-text-secondary text-sm">
              {t('aiTools.selectTool')}
            </div>
          ) : (
            <>
              <div className="mb-4">
                <h2 className="text-base font-semibold text-text-primary flex items-center gap-2">
                  <span>{currentTool!.icon}</span>
                  {t(currentTool!.labelKey)}
                </h2>
                <p className="text-sm text-text-secondary mt-1">
                  {t(currentTool!.descKey)}
                </p>
              </div>

              {/* Option selector */}
              {currentTool?.needsOption && currentTool.options && (
                <div className="flex gap-2 mb-3">
                  {currentTool.options.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setSelectedOption(opt.value)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        selectedOption === opt.value
                          ? 'bg-primary text-white'
                          : 'bg-card text-text-secondary hover:bg-hover'
                      }`}
                    >
                      {t(opt.labelKey)}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex-1 flex gap-4 min-h-0">
                {/* Input */}
                <div className="flex-1 flex flex-col">
                  <label className="text-xs font-medium text-text-secondary mb-1.5">
                    {t('aiTools.input')}
                  </label>
                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={t('aiTools.inputPlaceholder')}
                    className="flex-1 p-4 bg-input border border-border-input rounded-xl text-sm text-text-primary resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>

                {/* Output */}
                <div className="flex-1 flex flex-col">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium text-text-secondary">
                      {t('aiTools.output')}
                    </label>
                    {outputText && (
                      <button
                        onClick={handleCopy}
                        className="text-xs text-primary hover:underline"
                      >
                        {t('common.copy')}
                      </button>
                    )}
                  </div>
                  <div className="flex-1 p-4 bg-card border border-border rounded-xl text-sm text-text-primary overflow-y-auto whitespace-pre-wrap">
                    {isProcessing && !outputText && (
                      <span className="text-text-secondary animate-pulse">{t('aiTools.processing')}</span>
                    )}
                    {outputText || (!isProcessing && (
                      <span className="text-text-tertiary">{t('aiTools.outputPlaceholder')}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="mt-4 flex justify-center">
                <Button
                  onClick={handleProcess}
                  disabled={!inputText.trim() || isProcessing}
                  className="px-8"
                >
                  {isProcessing ? t('aiTools.processing') : t('aiTools.run')}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
