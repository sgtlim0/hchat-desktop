import { useEffect } from 'react'
import { X, Shield, Download, Filter, Search, Trash2 } from 'lucide-react'
import { useSessionStore } from '@/entities/session/session.store'
import { useAuditStore } from '@/entities/audit/audit.store'
import { useTranslation } from '@/shared/i18n'
import type { AuditAction } from '@/shared/types'

export function AuditLogPage() {
  const { t } = useTranslation()
  const setView = useSessionStore((state) => state.setView)
  const {
    entries,
    filterAction,
    filterDateRange,
    searchQuery,
    hydrated,
    hydrate,
    clearAll,
    setFilterAction,
    setFilterDateRange,
    setSearchQuery,
    getFilteredEntries,
    exportAsJson,
    exportAsCsv,
  } = useAuditStore()

  useEffect(() => {
    if (!hydrated) {
      hydrate()
    }
  }, [hydrated, hydrate])

  const filteredEntries = getFilteredEntries()

  const handleExportCsv = () => {
    const csvString = exportAsCsv()
    const blob = new Blob([csvString], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'audit-log.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleExportJson = () => {
    const jsonString = exportAsJson()
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'audit-log.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleClearAll = () => {
    if (window.confirm(t('audit.clearConfirm'))) {
      clearAll()
    }
  }

  const actionColors: Record<AuditAction, string> = {
    session_create: 'bg-green-500/10 text-green-600 border-green-500/20',
    session_delete: 'bg-red-500/10 text-red-600 border-red-500/20',
    message_send: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    file_upload: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
    settings_change: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    export: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20',
    import: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20',
    guardrail_trigger: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
    model_switch: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
    api_call: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
  }

  const actions: (AuditAction | 'all')[] = [
    'all',
    'session_create',
    'session_delete',
    'message_send',
    'file_upload',
    'settings_change',
    'export',
    'import',
    'guardrail_trigger',
    'model_switch',
    'api_call',
  ]

  return (
    <div className="flex h-full flex-col bg-bg-primary">
      {/* Header */}
      <div className="border-b border-border-default bg-bg-secondary px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setView('home')}
              className="rounded-lg p-2 hover:bg-bg-hover"
              aria-label={t('common.close')}
            >
              <X className="h-5 w-5 text-text-secondary" />
            </button>
            <Shield className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-xl font-semibold text-text-primary">{t('audit.title')}</h1>
              <p className="text-sm text-text-tertiary">{t('audit.subtitle')}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-7xl space-y-4">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border-default bg-bg-secondary p-4">
            {/* Action Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-text-tertiary" />
              <select
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value as AuditAction | 'all')}
                className="rounded-lg border border-border-default bg-bg-primary px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {actions.map((action) => (
                  <option key={action} value={action}>
                    {action === 'all' ? t('audit.filterAction') : t(`audit.action.${action}`)}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range */}
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={filterDateRange?.start || ''}
                onChange={(e) =>
                  setFilterDateRange(
                    e.target.value
                      ? { start: e.target.value, end: filterDateRange?.end || e.target.value }
                      : null
                  )
                }
                className="rounded-lg border border-border-default bg-bg-primary px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <span className="text-text-tertiary">—</span>
              <input
                type="date"
                value={filterDateRange?.end || ''}
                onChange={(e) =>
                  setFilterDateRange(
                    e.target.value
                      ? { start: filterDateRange?.start || e.target.value, end: e.target.value }
                      : null
                  )
                }
                className="rounded-lg border border-border-default bg-bg-primary px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Search */}
            <div className="flex flex-1 items-center gap-2 rounded-lg border border-border-default bg-bg-primary px-3 py-1.5">
              <Search className="h-4 w-4 text-text-tertiary" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('common.search')}
                className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none"
              />
            </div>

            {/* Export Buttons */}
            <button
              onClick={handleExportCsv}
              className="flex items-center gap-2 rounded-lg border border-border-default bg-bg-primary px-3 py-1.5 text-sm text-text-primary hover:bg-bg-hover"
            >
              <Download className="h-4 w-4" />
              {t('audit.exportCsv')}
            </button>

            <button
              onClick={handleExportJson}
              className="flex items-center gap-2 rounded-lg border border-border-default bg-bg-primary px-3 py-1.5 text-sm text-text-primary hover:bg-bg-hover"
            >
              <Download className="h-4 w-4" />
              {t('audit.exportJson')}
            </button>

            {/* Clear All */}
            <button
              onClick={handleClearAll}
              disabled={entries.length === 0}
              className="flex items-center gap-2 rounded-lg border border-border-default bg-bg-primary px-3 py-1.5 text-sm text-red-600 hover:bg-red-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="h-4 w-4" />
              {t('audit.clearAll')}
            </button>
          </div>

          {/* Entries Table */}
          {filteredEntries.length === 0 ? (
            <div className="rounded-xl border border-border-default bg-bg-secondary p-12 text-center">
              <Shield className="mx-auto h-12 w-12 text-text-tertiary opacity-50" />
              <p className="mt-4 text-text-secondary">{t('audit.noEntries')}</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-border-default bg-bg-secondary">
              <div className="max-h-[calc(100vh-320px)] overflow-y-auto">
                <table className="w-full">
                  <thead className="sticky top-0 bg-bg-secondary border-b border-border-default">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-text-tertiary">
                        {t('audit.timestamp')}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-text-tertiary">
                        {t('audit.action')}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-text-tertiary">
                        {t('audit.details')}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-text-tertiary">
                        {t('audit.model')}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-text-tertiary">
                        {t('audit.session')}
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-text-tertiary">
                        {t('audit.cost')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-default">
                    {filteredEntries.map((entry) => (
                      <tr key={entry.id} className="hover:bg-bg-hover">
                        <td className="px-4 py-3 text-sm text-text-secondary">
                          {new Date(entry.createdAt).toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${
                              actionColors[entry.action]
                            }`}
                          >
                            {t(`audit.action.${entry.action}`)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-text-primary max-w-md truncate">
                          {entry.details}
                        </td>
                        <td className="px-4 py-3 text-sm text-text-secondary">
                          {entry.modelId ? (
                            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                              {entry.modelId}
                            </span>
                          ) : (
                            <span className="text-text-tertiary">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-text-secondary">
                          {entry.sessionId ? (
                            <button
                              onClick={() => {
                                // Navigate to session (simplified - would need proper routing)
                                console.log('Navigate to session:', entry.sessionId)
                              }}
                              className="text-primary hover:underline"
                            >
                              {entry.sessionId.slice(0, 8)}...
                            </button>
                          ) : (
                            <span className="text-text-tertiary">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-text-secondary">
                          {entry.cost ? `$${entry.cost.toFixed(4)}` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
