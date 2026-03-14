import { X, Globe } from 'lucide-react'
import type { PageContext } from '@ext/shared/types'

interface ExtPageContextBannerProps {
  pageContext: PageContext
  onRemove: () => void
}

export function ExtPageContextBanner({ pageContext, onRemove }: ExtPageContextBannerProps) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--primary)]/5 border-b border-[var(--primary)]/20">
      <Globe size={12} className="text-[var(--primary)] flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-medium text-[var(--primary)] truncate">
          {pageContext.title}
        </p>
        <p className="text-[9px] text-[var(--text-tertiary)] truncate">
          {pageContext.url}
        </p>
      </div>
      <button
        onClick={onRemove}
        className="p-0.5 rounded hover:bg-[var(--primary)]/10 text-[var(--primary)] transition-colors"
      >
        <X size={12} />
      </button>
    </div>
  )
}
