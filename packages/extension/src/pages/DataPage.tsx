import { useState } from 'react'
import { RefreshCw, Database, Table2, List, Link, Image, FileText, Send, Search } from 'lucide-react'
import { useTranslation } from '@hchat/shared'
import { useDataExtraction } from '@ext/hooks/useDataExtraction'
import { useDatasetDiscovery } from '@ext/hooks/useDatasetDiscovery'
import { ExtDataTable } from '@ext/components/ExtDataTable'
import { DatasetPage } from '@ext/pages/DatasetPage'
import { useExtSessionStore } from '@ext/stores/session.store'
import { useExtSettingsStore } from '@ext/stores/settings.store'
import type { DatasetCandidate } from '@ext/content/dataset-candidate'

type DataTab = 'extract' | 'discover'

export function DataPage() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<DataTab>('extract')
  const { data, isExtracting, error, extract, exportCsv } = useDataExtraction()
  const discovery = useDatasetDiscovery()
  const createSession = useExtSessionStore((s) => s.createSession)
  const setPage = useExtSessionStore((s) => s.setPage)
  const selectedModel = useExtSettingsStore((s) => s.selectedModel)

  function handleSendToChat() {
    if (!data) return
    createSession(selectedModel)
    setPage('chat')
  }

  function handleExtractDataset(_candidate: DatasetCandidate) {
    // Switch to extract tab and run extraction
    setTab('extract')
    extract()
  }

  return (
    <div className="flex flex-col h-full">
      {/* Tab header */}
      <div className="flex border-b border-[var(--border)]">
        <button
          onClick={() => setTab('extract')}
          className={`flex-1 flex items-center justify-center gap-1 py-2 text-[10px] font-medium transition-colors ${
            tab === 'extract'
              ? 'text-[var(--primary)] border-b-2 border-[var(--primary)]'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Database size={12} />
          Extract
        </button>
        <button
          onClick={() => setTab('discover')}
          className={`flex-1 flex items-center justify-center gap-1 py-2 text-[10px] font-medium transition-colors ${
            tab === 'discover'
              ? 'text-[var(--primary)] border-b-2 border-[var(--primary)]'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Search size={12} />
          Discover
          {discovery.candidates.length > 0 && (
            <span className="px-1 py-0.5 text-[8px] bg-[var(--primary)]/10 text-[var(--primary)] rounded-full">
              {discovery.candidates.length}
            </span>
          )}
        </button>
      </div>

      {/* Tab content */}
      {tab === 'discover' ? (
        <DatasetPage
          candidates={discovery.candidates}
          isScanning={discovery.isScanning}
          onScan={discovery.scan}
          onHighlight={discovery.highlight}
          onClearHighlight={discovery.clearHighlight}
          onExtract={handleExtractDataset}
        />
      ) : (
        <ExtractTab
          data={data}
          isExtracting={isExtracting}
          error={error}
          extract={extract}
          exportCsv={exportCsv}
          onSendToChat={handleSendToChat}
          t={t}
        />
      )}
    </div>
  )
}

function ExtractTab({
  data,
  isExtracting,
  error,
  extract,
  exportCsv,
  onSendToChat,
  t,
}: {
  data: ReturnType<typeof useDataExtraction>['data']
  isExtracting: boolean
  error: string | null
  extract: () => void
  exportCsv: (idx: number) => void
  onSendToChat: () => void
  t: ReturnType<typeof useTranslation>['t']
}) {
  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--border)]">
        <span className="text-[10px] text-[var(--text-secondary)]">
          Structured data from current page
        </span>
        <button
          onClick={extract}
          disabled={isExtracting}
          className="flex items-center gap-1 px-2.5 py-1 text-[10px] bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-40"
        >
          <RefreshCw size={11} className={isExtracting ? 'animate-spin' : ''} />
          {isExtracting ? t('common.loading') : 'Extract'}
        </button>
      </div>

      <div className="px-3 py-3">
        {error && (
          <div className="px-3 py-2 mb-3 text-[10px] text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-lg">
            {error}
          </div>
        )}

        {!data && !isExtracting && !error && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Database size={32} className="text-[var(--text-tertiary)] mb-3" />
            <p className="text-xs text-[var(--text-secondary)] mb-1">
              Extract structured data from the current page
            </p>
            <p className="text-[10px] text-[var(--text-tertiary)] mb-4">
              Tables, lists, links, images, and metadata
            </p>
            <button
              onClick={extract}
              className="px-4 py-2 text-xs bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors"
            >
              Extract Data
            </button>
          </div>
        )}

        {data && (
          <div className="space-y-3">
            {/* Summary cards */}
            <div className="grid grid-cols-4 gap-1.5">
              <SummaryCard icon={Table2} label="Tables" count={data.tables.length} />
              <SummaryCard icon={List} label="Lists" count={data.intelligence.lists.length} />
              <SummaryCard icon={Link} label="Links" count={data.intelligence.links.length} />
              <SummaryCard icon={Image} label="Images" count={data.intelligence.images.length} />
            </div>

            {/* Metadata */}
            <div className="border border-[var(--border)] rounded-lg p-2.5">
              <div className="flex items-center gap-1 mb-1.5">
                <FileText size={11} className="text-[var(--text-tertiary)]" />
                <span className="text-[10px] font-medium text-[var(--text-primary)]">Page Info</span>
              </div>
              <div className="space-y-0.5 text-[9px] text-[var(--text-secondary)]">
                <p className="truncate">{data.intelligence.title}</p>
                <p className="text-[var(--primary)] truncate">{data.intelligence.url}</p>
                {data.intelligence.metadata.author && (
                  <p>Author: {data.intelligence.metadata.author}</p>
                )}
                <p>
                  ~{data.intelligence.readingTime} min |
                  Density: {(data.intelligence.contentDensity * 100).toFixed(0)}% |
                  Sections: {data.intelligence.sections.length}
                </p>
              </div>
            </div>

            {/* Tables */}
            {data.tables.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-[10px] font-medium text-[var(--text-secondary)]">
                  Tables ({data.tables.length})
                </h3>
                {data.tables.map((table, idx) => (
                  <ExtDataTable
                    key={idx}
                    table={table.cleaned}
                    stats={table.stats}
                    onExport={() => exportCsv(idx)}
                  />
                ))}
              </div>
            )}

            {/* Lists */}
            {data.intelligence.lists.length > 0 && (
              <div className="space-y-1.5">
                <h3 className="text-[10px] font-medium text-[var(--text-secondary)]">
                  Lists ({data.intelligence.lists.length})
                </h3>
                {data.intelligence.lists.slice(0, 5).map((list, idx) => (
                  <div key={idx} className="border border-[var(--border)] rounded-lg p-2">
                    <span className="text-[9px] text-[var(--text-tertiary)]">
                      {list.type} — {list.items.length} items
                    </span>
                    <ul className="mt-1 space-y-0.5">
                      {list.items.slice(0, 5).map((item, i) => (
                        <li key={i} className="text-[10px] text-[var(--text-primary)] truncate">
                          {list.type === 'ordered' ? `${i + 1}. ` : '• '}{item}
                        </li>
                      ))}
                      {list.items.length > 5 && (
                        <li className="text-[9px] text-[var(--text-tertiary)]">
                          +{list.items.length - 5} more
                        </li>
                      )}
                    </ul>
                  </div>
                ))}
              </div>
            )}

            {/* Send to chat */}
            <button
              onClick={onSendToChat}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-[var(--primary)] text-white text-xs font-medium rounded-lg hover:bg-[var(--primary-hover)] transition-colors"
            >
              <Send size={12} />
              Send to Chat
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function SummaryCard({
  icon: Icon,
  label,
  count,
}: {
  icon: typeof Table2
  label: string
  count: number
}) {
  return (
    <div className="flex flex-col items-center py-1.5 border border-[var(--border)] rounded-lg">
      <Icon size={14} className={count > 0 ? 'text-[var(--primary)]' : 'text-[var(--text-tertiary)]'} />
      <span className="text-xs font-bold text-[var(--text-primary)] mt-0.5">{count}</span>
      <span className="text-[8px] text-[var(--text-tertiary)]">{label}</span>
    </div>
  )
}
