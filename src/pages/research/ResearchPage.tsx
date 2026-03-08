import { useState } from 'react'
import { Search, Loader2, FileText, ExternalLink, X, Trash2 } from 'lucide-react'
import { useResearchStore } from '@/entities/research/research.store'
import { useTranslation } from '@/shared/i18n'
import { Button } from '@/shared/ui/Button'

export function ResearchPage() {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [depth, setDepth] = useState(1)
  const { sessions, isResearching, startResearch, cancelResearch, clearSession, clearAll } =
    useResearchStore()

  const currentSession = sessions[0]

  function handleStart() {
    const trimmed = query.trim()
    if (!trimmed || isResearching) return
    startResearch(trimmed, depth)
    setQuery('')
  }

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{t('deepResearch') || 'Deep Research'}</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          {t('deepResearchDesc') || 'AI-powered multi-source research with citations'}
        </p>
      </div>

      {/* Search Input */}
      <div className="mb-6 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-secondary)]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleStart()}
            placeholder={t('researchPlaceholder') || 'Enter your research question...'}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] py-2.5 pl-10 pr-4 text-sm focus:border-[var(--primary)] focus:outline-none"
            disabled={isResearching}
          />
        </div>
        <select
          value={depth}
          onChange={(e) => setDepth(Number(e.target.value))}
          className="rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2 text-sm"
          disabled={isResearching}
        >
          <option value={1}>Depth 1</option>
          <option value={2}>Depth 2</option>
          <option value={3}>Depth 3</option>
        </select>
        {isResearching ? (
          <Button onClick={cancelResearch} className="bg-red-500 text-white">
            <X className="mr-1 h-4 w-4" /> {t('cancel') || 'Cancel'}
          </Button>
        ) : (
          <Button onClick={handleStart} disabled={!query.trim()}>
            <Search className="mr-1 h-4 w-4" /> {t('research') || 'Research'}
          </Button>
        )}
      </div>

      {/* Current Research Progress */}
      {currentSession?.status === 'running' && (
        <div className="mb-6 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-4">
          <div className="mb-3 flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-[var(--primary)]" />
            <span className="text-sm font-medium">{t('researching') || 'Researching'}...</span>
          </div>

          {currentSession.queries.length > 0 && (
            <div className="mb-3">
              <p className="mb-1 text-xs font-medium text-[var(--text-secondary)]">
                {t('searchQueries') || 'Search Queries'} ({currentSession.queries.length})
              </p>
              <div className="flex flex-wrap gap-1">
                {currentSession.queries.map((q, i) => (
                  <span key={i} className="rounded-full bg-[var(--primary)]/10 px-2.5 py-0.5 text-xs text-[var(--primary)]">
                    {q}
                  </span>
                ))}
              </div>
            </div>
          )}

          {currentSession.sources.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-medium text-[var(--text-secondary)]">
                {t('sources') || 'Sources'} ({currentSession.sources.length})
              </p>
              {currentSession.sources.map((s, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                  <span className="font-mono">{s.score.toFixed(2)}</span>
                  <span className="truncate">{s.title}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Research Sessions */}
      {sessions.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{t('researchHistory') || 'Research History'}</h2>
            {sessions.length > 1 && (
              <button onClick={clearAll} className="text-xs text-red-500 hover:underline">
                {t('clearAll') || 'Clear All'}
              </button>
            )}
          </div>

          {sessions.filter((s) => s.status === 'done' || s.status === 'error').map((session) => (
            <div key={session.id} className="rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-4">
              <div className="mb-2 flex items-start justify-between">
                <div>
                  <h3 className="font-medium">{session.query}</h3>
                  <p className="text-xs text-[var(--text-secondary)]">
                    {new Date(session.createdAt).toLocaleString()} | {session.sources.length} {t('sources') || 'sources'}
                  </p>
                </div>
                <button onClick={() => clearSession(session.id)} className="p-1 text-[var(--text-secondary)] hover:text-red-500">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {session.status === 'error' && (
                <p className="text-sm text-red-500">{session.error}</p>
              )}

              {session.report && (
                <div className="mt-3 max-h-96 overflow-y-auto rounded border border-[var(--border)] bg-[var(--bg-primary)] p-3">
                  <div className="prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap text-sm">
                    {session.report}
                  </div>
                </div>
              )}

              {session.sources.length > 0 && (
                <div className="mt-3">
                  <p className="mb-1 text-xs font-medium text-[var(--text-secondary)]">
                    <FileText className="mr-1 inline h-3 w-3" />
                    {t('sources') || 'Sources'}
                  </p>
                  <div className="space-y-1">
                    {session.sources.map((s, i) => (
                      <a
                        key={i}
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs text-[var(--primary)] hover:underline"
                      >
                        <ExternalLink className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{s.title || s.url}</span>
                        <span className="ml-auto font-mono text-[var(--text-secondary)]">{s.score.toFixed(2)}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {sessions.length === 0 && !isResearching && (
        <div className="mt-12 text-center text-[var(--text-secondary)]">
          <Search className="mx-auto mb-3 h-12 w-12 opacity-30" />
          <p className="text-sm">{t('researchEmpty') || 'Enter a question to start deep research'}</p>
        </div>
      )}
    </div>
  )
}
