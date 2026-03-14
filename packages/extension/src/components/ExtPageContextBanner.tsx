import { X, Globe, Table2, FileText, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'
import type { PageIntelligence } from '@ext/shared/types'

interface ExtPageContextBannerProps {
  readonly intelligence: PageIntelligence
  readonly selectedSections: number
  readonly selectedTables: number
  readonly onRemove: () => void
  readonly onConfigure: () => void
}

export function ExtPageContextBanner({
  intelligence,
  selectedSections,
  selectedTables,
  onRemove,
  onConfigure,
}: ExtPageContextBannerProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="bg-[var(--primary)]/5 border-b border-[var(--primary)]/20">
      <div className="flex items-center gap-2 px-3 py-1.5">
        <Globe size={12} className="text-[var(--primary)] shrink-0" />
        <button
          onClick={() => setExpanded((p) => !p)}
          className="flex-1 min-w-0 text-left"
        >
          <p className="text-[10px] font-medium text-[var(--primary)] truncate">
            {intelligence.title}
          </p>
          <div className="flex items-center gap-2 text-[9px] text-[var(--text-tertiary)]">
            <span>{intelligence.sections.length} sections</span>
            <span>·</span>
            <span>{intelligence.tables.length} tables</span>
            <span>·</span>
            <span>~{intelligence.readingTime} min</span>
          </div>
        </button>
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            onClick={() => setExpanded((p) => !p)}
            className="p-0.5 rounded hover:bg-[var(--primary)]/10 text-[var(--primary)] transition-colors"
          >
            {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
          <button
            onClick={onRemove}
            className="p-0.5 rounded hover:bg-[var(--primary)]/10 text-[var(--primary)] transition-colors"
          >
            <X size={12} />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-3 pb-2 space-y-1.5">
          <div className="flex items-center gap-2 text-[9px]">
            <div className="flex items-center gap-1 px-1.5 py-0.5 bg-[var(--bg-card)] rounded">
              <FileText size={9} className="text-[var(--primary)]" />
              <span className="text-[var(--text-primary)]">{selectedSections}/{intelligence.sections.length} sections</span>
            </div>
            <div className="flex items-center gap-1 px-1.5 py-0.5 bg-[var(--bg-card)] rounded">
              <Table2 size={9} className="text-[var(--primary)]" />
              <span className="text-[var(--text-primary)]">{selectedTables}/{intelligence.tables.length} tables</span>
            </div>
          </div>
          <button
            onClick={onConfigure}
            className="w-full px-2 py-1 text-[9px] text-[var(--primary)] border border-[var(--primary)]/30 rounded hover:bg-[var(--primary)]/10 transition-colors"
          >
            Configure context
          </button>
          <p className="text-[8px] text-[var(--text-tertiary)] truncate">{intelligence.url}</p>
        </div>
      )}
    </div>
  )
}
