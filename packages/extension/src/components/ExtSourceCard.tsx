import { ExternalLink } from 'lucide-react'
import type { ResearchSource } from '@ext/hooks/useResearch'

interface ExtSourceCardProps {
  readonly source: ResearchSource
  readonly index: number
}

function authorityColor(score: number): string {
  if (score >= 0.8) return 'text-green-600 dark:text-green-400'
  if (score >= 0.6) return 'text-blue-600 dark:text-blue-400'
  if (score >= 0.4) return 'text-amber-600 dark:text-amber-400'
  return 'text-[var(--text-tertiary)]'
}

function authorityLabel(score: number): string {
  if (score >= 0.8) return 'High'
  if (score >= 0.6) return 'Medium'
  if (score >= 0.4) return 'Low'
  return 'Unknown'
}

export function ExtSourceCard({ source, index }: ExtSourceCardProps) {
  const score = source.score ?? 0.5
  let domain = ''
  try {
    domain = new URL(source.url).hostname.replace('www.', '')
  } catch {
    domain = source.url
  }

  return (
    <a
      href={source.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-start gap-2 px-2.5 py-2 border border-[var(--border)] rounded-lg hover:bg-[var(--bg-hover)] transition-colors group"
    >
      <span className="shrink-0 w-5 h-5 flex items-center justify-center rounded-full bg-[var(--primary)]/10 text-[var(--primary)] text-[9px] font-bold">
        {index + 1}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-medium text-[var(--text-primary)] line-clamp-2 group-hover:text-[var(--primary)]">
          {source.title}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-[9px] text-[var(--text-tertiary)] truncate">{domain}</span>
          <span className={`text-[8px] font-medium ${authorityColor(score)}`}>
            {authorityLabel(score)} ({(score * 100).toFixed(0)}%)
          </span>
        </div>
        {source.snippet && (
          <p className="text-[9px] text-[var(--text-secondary)] line-clamp-2 mt-0.5">
            {source.snippet}
          </p>
        )}
      </div>
      <ExternalLink
        size={10}
        className="shrink-0 mt-0.5 text-[var(--text-tertiary)] opacity-0 group-hover:opacity-100 transition-opacity"
      />
    </a>
  )
}
