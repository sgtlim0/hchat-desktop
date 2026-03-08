import { ExternalLink, Sparkles, Loader2, MessageCircle } from 'lucide-react'
import type { JiraTicketVM } from '@/shared/types/atlassian'
import { AiBlock } from './AiBlock'

interface TicketCardProps {
  ticket: JiraTicketVM
  onAnalyze: (issueKey: string) => void
}

function statusVariant(cat: string): string {
  switch (cat.toLowerCase()) {
    case 'done': return 'bg-green-500/10 text-green-400 border-green-500/20'
    case 'in progress': return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
    case 'to do': return 'bg-gray-500/10 text-gray-400 border-gray-500/20'
    default: return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
  }
}

function priorityVariant(priority: string): string {
  switch (priority.toLowerCase()) {
    case 'highest': case 'critical': return 'bg-red-500/10 text-red-400 border-red-500/20'
    case 'high': return 'bg-orange-500/10 text-orange-400 border-orange-500/20'
    case 'medium': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
    case 'low': return 'bg-green-500/10 text-green-400 border-green-500/20'
    default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20'
  }
}

export function TicketCard({ ticket, onAnalyze }: TicketCardProps) {
  return (
    <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg p-4 transition-all hover:border-blue-500/30">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <span className="text-[12px] font-bold text-amber-400 tracking-wide">{ticket.key}</span>
            <span className={`inline-flex items-center px-2 py-0.5 text-[11px] font-semibold rounded border ${statusVariant(ticket.status_category)}`}>
              {ticket.status}
            </span>
            {ticket.priority && (
              <span className={`inline-flex items-center px-2 py-0.5 text-[11px] font-semibold rounded border ${priorityVariant(ticket.priority)}`}>
                {ticket.priority}
              </span>
            )}
            {ticket.issue_type && (
              <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-semibold rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                {ticket.issue_type}
              </span>
            )}
          </div>
          <a
            href={ticket.link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-[var(--text-primary)] hover:text-blue-400 transition-colors flex items-center gap-1"
          >
            {ticket.summary}
            <ExternalLink size={12} className="text-[var(--text-secondary)] flex-shrink-0" />
          </a>
          <div className="flex items-center gap-3 mt-1.5 text-[11px] text-[var(--text-secondary)]">
            <span>{ticket.assignee}</span>
            <span>{ticket.project}</span>
            {ticket.updated && <span>{ticket.updated}</span>}
            {ticket.total_comments !== undefined && ticket.total_comments > 0 && (
              <span className="flex items-center gap-1"><MessageCircle size={10} />{ticket.total_comments}</span>
            )}
          </div>
          {ticket.labels.length > 0 && (
            <div className="flex gap-1 mt-1.5 flex-wrap">
              {ticket.labels.map((label) => (
                <span key={label} className="px-1.5 py-0.5 text-[10px] rounded bg-gray-500/10 text-gray-400 border border-gray-500/20">
                  {label}
                </span>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={() => onAnalyze(ticket.key)}
          disabled={ticket.is_analyzing || !!ticket.ai_analysis}
          className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
        >
          {ticket.is_analyzing ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <Sparkles size={12} />
          )}
          {ticket.ai_analysis ? '분석됨' : ticket.is_analyzing ? '분석 중...' : 'AI 분석'}
        </button>
      </div>
      {ticket.ai_analysis && <AiBlock text={ticket.ai_analysis} label="AI 분석" />}
    </div>
  )
}
