import { Search, FileText, Brain, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import type { ResearchStep } from '@ext/hooks/useResearch'

interface ExtResearchProgressProps {
  readonly step: ResearchStep
  readonly message: string
  readonly queryCount: number
  readonly sourceCount: number
}

const STEPS: Array<{
  id: ResearchStep
  label: string
  icon: typeof Search
}> = [
  { id: 'query_expansion', label: 'Query Expansion', icon: Brain },
  { id: 'searching', label: 'Web Search', icon: Search },
  { id: 'extracting', label: 'Content Extraction', icon: FileText },
  { id: 'synthesizing', label: 'Synthesis', icon: Brain },
  { id: 'done', label: 'Complete', icon: CheckCircle2 },
]

function stepIndex(step: ResearchStep): number {
  const idx = STEPS.findIndex((s) => s.id === step)
  return idx >= 0 ? idx : -1
}

export function ExtResearchProgress({ step, message, queryCount, sourceCount }: ExtResearchProgressProps) {
  const currentIdx = stepIndex(step)
  const isError = step === 'error'

  return (
    <div className="space-y-1.5">
      {STEPS.map((s, idx) => {
        const isActive = idx === currentIdx
        const isCompleted = idx < currentIdx || step === 'done'
        const isPending = idx > currentIdx

        let statusClass = 'text-[var(--text-tertiary)]'
        if (isActive) statusClass = 'text-[var(--primary)]'
        if (isCompleted) statusClass = 'text-green-500'
        if (isError && isActive) statusClass = 'text-red-500'

        return (
          <div
            key={s.id}
            className={`flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors ${
              isActive ? 'bg-[var(--primary)]/5' : ''
            }`}
          >
            <div className={`shrink-0 ${statusClass}`}>
              {isActive && !isError && step !== 'done' ? (
                <Loader2 size={14} className="animate-spin" />
              ) : isCompleted ? (
                <CheckCircle2 size={14} />
              ) : isError && isActive ? (
                <XCircle size={14} />
              ) : (
                <s.icon size={14} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p
                className={`text-[10px] font-medium ${
                  isPending ? 'text-[var(--text-tertiary)]' : 'text-[var(--text-primary)]'
                }`}
              >
                {s.label}
                {s.id === 'query_expansion' && queryCount > 0 && (
                  <span className="text-[var(--text-tertiary)] font-normal ml-1">({queryCount} queries)</span>
                )}
                {s.id === 'extracting' && sourceCount > 0 && (
                  <span className="text-[var(--text-tertiary)] font-normal ml-1">({sourceCount} sources)</span>
                )}
              </p>
              {isActive && message && (
                <p className="text-[9px] text-[var(--text-tertiary)] truncate">{message}</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
