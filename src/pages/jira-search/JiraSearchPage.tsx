import { useState, useCallback } from 'react'
import { Search, Bug, Loader2, Lightbulb } from 'lucide-react'
import { useJiraSearchStore } from '@/entities/jira-search/jira-search.store'
import { useToolIntegrationStore } from '@/entities/tool-integration/tool-integration.store'
import { TicketCard, AiBlock, LockScreen } from '@/widgets/atlassian'
import { useTranslation } from '@/shared/i18n'

export function JiraSearchPage() {
  const { t } = useTranslation()
  const isConfigured = useToolIntegrationStore((s) => s.isConfluenceConfigured)

  const { tickets, aiOverview, total, loading, error, search, analyze, clearResults } =
    useJiraSearchStore()

  const [query, setQuery] = useState('')
  const [projectKeys, setProjectKeys] = useState('')
  const [ticketIds, setTicketIds] = useState('')

  const handleSearch = useCallback(() => {
    if (!query.trim() && !ticketIds.trim()) return
    const keys = projectKeys.split(',').map((s) => s.trim()).filter(Boolean)
    const ids = ticketIds.split(',').map((s) => s.trim()).filter(Boolean)
    search(query.trim(), keys, ids)
  }, [query, projectKeys, ticketIds, search])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') handleSearch()
    },
    [handleSearch]
  )

  if (!isConfigured()) return <LockScreen />

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-xl font-bold text-[var(--text-primary)] mb-6 flex items-center gap-2">
        <Bug size={22} />
        {t('jira.title')}
      </h1>

      <div className="grid grid-cols-[300px_1fr] gap-6">
        {/* Sidebar */}
        <div className="flex flex-col gap-4">
          <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg p-4 flex flex-col gap-3">
            <div>
              <label className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1 block">
                {t('common.search')}
              </label>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t('jira.searchPlaceholder')}
                className="w-full px-3 py-2 text-sm bg-[var(--bg-primary)] border border-[var(--border)] rounded-md text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-[var(--primary)]"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1 block">
                {t('jira.projectKeys')}
              </label>
              <input
                type="text"
                value={projectKeys}
                onChange={(e) => setProjectKeys(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="HCHAT, INFRA"
                className="w-full px-3 py-2 text-sm bg-[var(--bg-primary)] border border-[var(--border)] rounded-md text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-[var(--primary)]"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1 block">
                {t('jira.ticketIds')}
              </label>
              <input
                type="text"
                value={ticketIds}
                onChange={(e) => setTicketIds(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="HCHAT-123, INFRA-456"
                className="w-full px-3 py-2 text-sm bg-[var(--bg-primary)] border border-[var(--border)] rounded-md text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-[var(--primary)]"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={loading || (!query.trim() && !ticketIds.trim())}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--primary)] text-white rounded-md text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
              {t('jira.search')}
            </button>
          </div>

          {/* Tips */}
          <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg p-4">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-400 uppercase tracking-wider mb-2">
              <Lightbulb size={12} />
              {t('atlassian.tip.title')}
            </div>
            <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
              {t('atlassian.tip.jql')}
            </p>
          </div>
        </div>

        {/* Results */}
        <div className="flex flex-col gap-3">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {aiOverview && <AiBlock text={aiOverview} label={t('jira.aiOverview')} />}

          {total > 0 && (
            <div className="text-[12px] text-[var(--text-secondary)] font-semibold">
              {t('jira.results')} ({total})
            </div>
          )}

          {tickets.map((ticket) => (
            <TicketCard key={ticket.key} ticket={ticket} onAnalyze={analyze} />
          ))}

          {!loading && tickets.length === 0 && !error && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Bug size={40} className="text-[var(--text-secondary)] opacity-30 mb-3" />
              <p className="text-sm text-[var(--text-secondary)]">{t('jira.empty')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
