import { ExternalLink, Sparkles, Loader2 } from 'lucide-react'
import type { ConfluencePageVM } from '@/shared/types/atlassian'
import { AiBlock } from './AiBlock'

interface PageCardProps {
  page: ConfluencePageVM
  onSummarize: (pageId: string) => void
}

export function PageCard({ page, onSummarize }: PageCardProps) {
  return (
    <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg p-4 transition-all hover:border-blue-500/30">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            {page.space && (
              <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-semibold tracking-wide rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                {page.space}
              </span>
            )}
            {page.last_modified && (
              <span className="text-[11px] text-[var(--text-secondary)]">{page.last_modified.slice(0, 10)}</span>
            )}
          </div>
          <a
            href={page.link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-[var(--text-primary)] hover:text-blue-400 transition-colors flex items-center gap-1"
          >
            {page.title}
            <ExternalLink size={12} className="text-[var(--text-secondary)] flex-shrink-0" />
          </a>
          {page.excerpt && (
            <p className="text-[12px] text-[var(--text-secondary)] mt-1.5 line-clamp-2 leading-relaxed">
              {page.excerpt.replace(/<[^>]*>/g, '')}
            </p>
          )}
        </div>
        <button
          onClick={() => onSummarize(page.id)}
          disabled={page.is_summarizing || !!page.ai_summary}
          className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
        >
          {page.is_summarizing ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <Sparkles size={12} />
          )}
          {page.ai_summary ? '요약됨' : page.is_summarizing ? '요약 중...' : 'AI 요약'}
        </button>
      </div>
      {page.ai_summary && <AiBlock text={page.ai_summary} label="AI 요약" />}
    </div>
  )
}
