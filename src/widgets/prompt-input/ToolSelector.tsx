import { memo, useState, useCallback, useRef, useEffect } from 'react'
import { Wrench } from 'lucide-react'
import { useToolIntegrationStore } from '@/entities/tool-integration/tool-integration.store'
import { useTranslation } from '@/shared/i18n'

export const ToolSelector = memo(function ToolSelector({ sessionId }: { sessionId: string }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const confluence = useToolIntegrationStore((s) => s.confluence)
  const jira = useToolIntegrationStore((s) => s.jira)
  const activeTools = useToolIntegrationStore((s) => s.getActiveTools(sessionId))
  const setActiveTools = useToolIntegrationStore((s) => s.setActiveTools)

  const confluenceConfigured = !!(confluence.baseUrl && confluence.email && confluence.apiToken)
  const jiraConfigured = !!(jira.baseUrl && jira.email && jira.apiToken)
  const anyConfigured = confluenceConfigured || jiraConfigured
  const anyActive = activeTools.confluence || activeTools.jira

  const handleToggle = useCallback(() => setOpen((p) => !p), [])

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={handleToggle}
        className={`p-2 rounded-lg transition-colors ${
          anyActive
            ? 'text-primary bg-primary/10 hover:bg-primary/20'
            : 'text-text-secondary hover:text-text-primary hover:bg-card'
        }`}
        aria-label={t('tools.addTools')}
        title={t('tools.addTools')}
      >
        <Wrench className="w-4 h-4" />
      </button>

      {open && (
        <div className="absolute bottom-full left-0 mb-2 w-64 bg-surface border border-border rounded-lg shadow-lg p-3 z-50">
          <p className="text-xs font-semibold text-text-secondary mb-2">{t('tools.addTools')}</p>

          {!anyConfigured && (
            <p className="text-xs text-amber-500 mb-2">{t('internalSearch.configNeeded')}</p>
          )}

          <label className="flex items-center justify-between py-1.5 cursor-pointer">
            <span className="text-sm text-text-primary">Confluence</span>
            <input
              type="checkbox"
              checked={activeTools.confluence}
              onChange={() => setActiveTools(sessionId, { confluence: !activeTools.confluence })}
              disabled={!confluenceConfigured}
              className="accent-primary"
            />
          </label>

          <label className="flex items-center justify-between py-1.5 cursor-pointer">
            <span className="text-sm text-text-primary">Jira</span>
            <input
              type="checkbox"
              checked={activeTools.jira}
              onChange={() => setActiveTools(sessionId, { jira: !activeTools.jira })}
              disabled={!jiraConfigured}
              className="accent-primary"
            />
          </label>
        </div>
      )}
    </div>
  )
})
