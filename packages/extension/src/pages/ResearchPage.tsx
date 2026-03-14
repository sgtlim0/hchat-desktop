import { useState } from 'react'
import { Search, Zap, Brain, StopCircle, RotateCcw, Copy } from 'lucide-react'
import { useTranslation } from '@hchat/shared'
import { useResearch } from '@ext/hooks/useResearch'
import type { ResearchMode } from '@ext/hooks/useResearch'
import { ExtResearchProgress } from '@ext/components/ExtResearchProgress'
import { ExtSourceCard } from '@ext/components/ExtSourceCard'
import { ExtMarkdownRenderer } from '@ext/components/ExtMarkdownRenderer'
import { useExtSettingsStore } from '@ext/stores/settings.store'
import { useExtToastStore } from '@ext/stores/toast.store'

export function ResearchPage() {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [mode, setMode] = useState<ResearchMode>('quick')
  const { state, isRunning, start, stop, reset } = useResearch()
  const settings = useExtSettingsStore()
  const addToast = useExtToastStore((s) => s.addToast)

  function handleStart() {
    if (!query.trim()) return
    if (!settings.awsAccessKeyId) {
      addToast('error', 'AWS credentials required for research')
      return
    }
    start(
      query.trim(),
      mode,
      {
        accessKeyId: settings.awsAccessKeyId,
        secretAccessKey: settings.awsSecretAccessKey,
        region: settings.awsRegion,
      },
      settings.selectedModel,
    )
  }

  function handleCopyReport() {
    if (!state.report) return
    navigator.clipboard.writeText(state.report)
    addToast('success', t('common.copied'))
  }

  const hasResults = state.step === 'done' && state.report

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="px-3 py-2.5 border-b border-[var(--border)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Search size={14} className="text-[var(--primary)]" />
            <h1 className="text-sm font-bold text-[var(--text-primary)]">Research</h1>
          </div>
          {isRunning ? (
            <button
              onClick={stop}
              className="flex items-center gap-1 px-2.5 py-1 text-[10px] bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              <StopCircle size={11} />
              Stop
            </button>
          ) : hasResults ? (
            <button
              onClick={reset}
              className="flex items-center gap-1 px-2.5 py-1 text-[10px] text-[var(--text-secondary)] border border-[var(--border)] rounded-lg hover:bg-[var(--bg-hover)] transition-colors"
            >
              <RotateCcw size={11} />
              New
            </button>
          ) : null}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        {/* Query input */}
        {!isRunning && !hasResults && (
          <>
            {/* Mode toggle */}
            <div className="flex gap-1 p-0.5 bg-[var(--bg-card)] rounded-lg">
              <button
                onClick={() => setMode('quick')}
                className={`flex-1 flex items-center justify-center gap-1 py-1.5 text-[10px] font-medium rounded-md transition-colors ${
                  mode === 'quick'
                    ? 'bg-[var(--primary)] text-white'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Zap size={11} />
                Quick (3-step)
              </button>
              <button
                onClick={() => setMode('deep')}
                className={`flex-1 flex items-center justify-center gap-1 py-1.5 text-[10px] font-medium rounded-md transition-colors ${
                  mode === 'deep'
                    ? 'bg-[var(--primary)] text-white'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Brain size={11} />
                Deep (7-step)
              </button>
            </div>

            {/* Query input */}
            <div className="relative">
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleStart()
                }}
                placeholder="What would you like to research?"
                rows={3}
                className="w-full px-3 py-2 text-xs bg-[var(--bg-card)] border border-[var(--border)] rounded-lg resize-none focus:outline-none focus:border-[var(--primary)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]"
              />
              <div className="flex justify-between items-center mt-1.5">
                <span className="text-[9px] text-[var(--text-tertiary)]">
                  {mode === 'quick' ? '3 sources, direct search' : '5 sources, query expansion'}
                </span>
                <button
                  onClick={handleStart}
                  disabled={!query.trim()}
                  className="flex items-center gap-1 px-3 py-1.5 text-[10px] bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-40"
                >
                  <Search size={11} />
                  Research
                </button>
              </div>
            </div>
          </>
        )}

        {/* Progress */}
        {(isRunning || (state.step !== 'idle' && !hasResults)) && (
          <ExtResearchProgress
            step={state.step}
            message={state.message}
            queryCount={state.queries.length}
            sourceCount={state.sources.length}
          />
        )}

        {/* Error */}
        {state.error && (
          <div className="px-3 py-2 text-[10px] text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-lg">
            {state.error}
          </div>
        )}

        {/* Expanded queries */}
        {state.queries.length > 1 && (
          <div className="space-y-1">
            <h3 className="text-[10px] font-medium text-[var(--text-secondary)]">
              Search Queries ({state.queries.length})
            </h3>
            <div className="flex flex-wrap gap-1">
              {state.queries.map((q, i) => (
                <span
                  key={i}
                  className="px-1.5 py-0.5 text-[9px] bg-[var(--bg-card)] border border-[var(--border)] rounded text-[var(--text-primary)]"
                >
                  {q}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Sources */}
        {state.sources.length > 0 && (
          <div className="space-y-1.5">
            <h3 className="text-[10px] font-medium text-[var(--text-secondary)]">
              Sources ({state.sources.length})
            </h3>
            {state.sources.map((source, idx) => (
              <ExtSourceCard key={idx} source={source} index={idx} />
            ))}
          </div>
        )}

        {/* Report */}
        {hasResults && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-medium text-[var(--text-secondary)]">
                Research Report
              </h3>
              <button
                onClick={handleCopyReport}
                className="flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
              >
                <Copy size={10} />
                Copy
              </button>
            </div>
            <div className="border border-[var(--border)] rounded-lg p-3 bg-[var(--bg-card)]">
              <ExtMarkdownRenderer content={state.report} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
