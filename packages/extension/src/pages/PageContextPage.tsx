import { RefreshCw, FileText, Table2, Link, Image, Check, Square, ArrowLeft } from 'lucide-react'
import { useTranslation } from '@hchat/shared'
import { usePageIntelligenceStore } from '@ext/stores/page-intelligence.store'
import { useExtSessionStore } from '@ext/stores/session.store'
import { ExtSectionViewer } from '@ext/components/ExtSectionViewer'

export function PageContextPage() {
  const { t } = useTranslation()
  const intelligence = usePageIntelligenceStore((s) => s.intelligence)
  const isLoading = usePageIntelligenceStore((s) => s.isLoading)
  const error = usePageIntelligenceStore((s) => s.error)
  const selected = usePageIntelligenceStore((s) => s.selected)
  const extract = usePageIntelligenceStore((s) => s.extract)
  const toggleSection = usePageIntelligenceStore((s) => s.toggleSection)
  const toggleTable = usePageIntelligenceStore((s) => s.toggleTable)
  const toggleMetadata = usePageIntelligenceStore((s) => s.toggleMetadata)
  const toggleLinks = usePageIntelligenceStore((s) => s.toggleLinks)
  const selectAll = usePageIntelligenceStore((s) => s.selectAll)
  const deselectAll = usePageIntelligenceStore((s) => s.deselectAll)
  const setPage = useExtSessionStore((s) => s.setPage)

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="px-3 py-2.5 border-b border-[var(--border)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage('chat')}
              className="p-0.5 rounded hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]"
            >
              <ArrowLeft size={14} />
            </button>
            <h1 className="text-sm font-bold text-[var(--text-primary)]">
              Context Config
            </h1>
          </div>
          <button
            onClick={extract}
            disabled={isLoading}
            className="flex items-center gap-1 px-2.5 py-1 text-[10px] bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-40"
          >
            <RefreshCw size={11} className={isLoading ? 'animate-spin' : ''} />
            {isLoading ? t('common.loading') : 'Extract'}
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        {error && (
          <div className="px-3 py-2 text-[10px] text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-lg">
            {error}
          </div>
        )}

        {!intelligence && !isLoading && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileText size={32} className="text-[var(--text-tertiary)] mb-3" />
            <p className="text-xs text-[var(--text-secondary)] mb-1">
              Configure page context for chat
            </p>
            <p className="text-[10px] text-[var(--text-tertiary)] mb-4">
              Select which parts of the page to include in AI context
            </p>
            <button
              onClick={extract}
              className="px-4 py-2 text-xs bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors"
            >
              Extract Page
            </button>
          </div>
        )}

        {intelligence && (
          <>
            {/* Page info */}
            <div className="border border-[var(--border)] rounded-lg p-2.5">
              <h3 className="text-[11px] font-medium text-[var(--text-primary)] mb-1">
                {intelligence.title}
              </h3>
              <p className="text-[9px] text-[var(--primary)] truncate mb-1">
                {intelligence.url}
              </p>
              <div className="flex gap-3 text-[9px] text-[var(--text-tertiary)]">
                <span>~{intelligence.readingTime} min</span>
                <span>Density: {(intelligence.contentDensity * 100).toFixed(0)}%</span>
                {intelligence.metadata.author && <span>{intelligence.metadata.author}</span>}
              </div>
            </div>

            {/* Quick stats + select all/none */}
            <div className="flex items-center justify-between">
              <div className="flex gap-2 text-[9px] text-[var(--text-tertiary)]">
                <span className="flex items-center gap-0.5">
                  <FileText size={9} /> {selected.sections.length}/{intelligence.sections.length}
                </span>
                <span className="flex items-center gap-0.5">
                  <Table2 size={9} /> {selected.tables.length}/{intelligence.tables.length}
                </span>
                <span className="flex items-center gap-0.5">
                  <Link size={9} /> {intelligence.links.length}
                </span>
                <span className="flex items-center gap-0.5">
                  <Image size={9} /> {intelligence.images.length}
                </span>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={selectAll}
                  className="px-1.5 py-0.5 text-[8px] text-[var(--primary)] hover:bg-[var(--primary)]/10 rounded transition-colors"
                >
                  All
                </button>
                <button
                  onClick={deselectAll}
                  className="px-1.5 py-0.5 text-[8px] text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)] rounded transition-colors"
                >
                  None
                </button>
              </div>
            </div>

            {/* Toggle options */}
            <div className="space-y-1">
              <ToggleOption
                label="Include metadata"
                sublabel="Author, date, reading time"
                checked={selected.includeMetadata}
                onToggle={toggleMetadata}
              />
              <ToggleOption
                label="Include links"
                sublabel={`${intelligence.links.length} links found`}
                checked={selected.includeLinks}
                onToggle={toggleLinks}
              />
            </div>

            {/* Sections */}
            {intelligence.sections.length > 0 && (
              <div>
                <h3 className="text-[10px] font-medium text-[var(--text-secondary)] mb-1">
                  Sections ({selected.sections.length}/{intelligence.sections.length})
                </h3>
                <div className="border border-[var(--border)] rounded-lg overflow-hidden">
                  <ExtSectionViewer
                    sections={intelligence.sections}
                    selectedIndices={selected.sections as number[]}
                    onToggle={toggleSection}
                  />
                </div>
              </div>
            )}

            {/* Tables */}
            {intelligence.tables.length > 0 && (
              <div>
                <h3 className="text-[10px] font-medium text-[var(--text-secondary)] mb-1">
                  Tables ({selected.tables.length}/{intelligence.tables.length})
                </h3>
                <div className="space-y-1">
                  {intelligence.tables.map((table, idx) => {
                    const isSelected = selected.tables.includes(idx)
                    return (
                      <button
                        key={idx}
                        onClick={() => toggleTable(idx)}
                        className={`w-full flex items-center gap-2 px-2.5 py-2 border rounded-lg text-left transition-colors ${
                          isSelected
                            ? 'border-[var(--primary)] bg-[var(--primary)]/5'
                            : 'border-[var(--border)] hover:bg-[var(--bg-hover)]'
                        }`}
                      >
                        <div
                          className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${
                            isSelected
                              ? 'bg-[var(--primary)] border-[var(--primary)]'
                              : 'border-[var(--border)]'
                          }`}
                        >
                          {isSelected && <Check size={9} className="text-white" strokeWidth={3} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-medium text-[var(--text-primary)]">
                            {table.caption || `Table ${idx + 1}`}
                          </p>
                          <p className="text-[9px] text-[var(--text-tertiary)]">
                            {table.headers.slice(0, 4).join(', ')}
                            {table.headers.length > 4 && ` +${table.headers.length - 4}`}
                            {' · '}{table.rows.length} rows
                          </p>
                        </div>
                        <Table2 size={12} className={isSelected ? 'text-[var(--primary)]' : 'text-[var(--text-tertiary)]'} />
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Back to chat */}
            <button
              onClick={() => setPage('chat')}
              className="w-full px-3 py-2 text-xs font-medium text-[var(--primary)] border border-[var(--primary)] rounded-lg hover:bg-[var(--primary)]/10 transition-colors"
            >
              Back to Chat
            </button>
          </>
        )}
      </div>
    </div>
  )
}

function ToggleOption({
  label,
  sublabel,
  checked,
  onToggle,
}: {
  label: string
  sublabel: string
  checked: boolean
  onToggle: () => void
}) {
  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-[var(--bg-hover)] transition-colors"
    >
      <div
        className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${
          checked ? 'bg-[var(--primary)] border-[var(--primary)]' : 'border-[var(--border)]'
        }`}
      >
        {checked && <Check size={9} className="text-white" strokeWidth={3} />}
      </div>
      <div className="text-left">
        <p className="text-[10px] text-[var(--text-primary)]">{label}</p>
        <p className="text-[9px] text-[var(--text-tertiary)]">{sublabel}</p>
      </div>
    </button>
  )
}
