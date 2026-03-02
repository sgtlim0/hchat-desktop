import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useTranslation } from '@/shared/i18n'
import { ToolCallBlock } from './ToolCallBlock'
import type { ToolCall } from '@/shared/types'

interface ToolCallGroupProps {
  toolCalls: ToolCall[]
}

export function ToolCallGroup({ toolCalls }: ToolCallGroupProps) {
  const { t } = useTranslation()
  const hasRunning = toolCalls.some((tc) => tc.status === 'running')
  const [expanded, setExpanded] = useState(hasRunning)

  return (
    <div className="my-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-xs text-text-secondary hover:text-text-primary transition"
      >
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        <span>{t('tool.toolCount', { count: toolCalls.length, status: hasRunning ? t('tool.running') : t('tool.allDone') })}</span>
      </button>
      {expanded && (
        <div className="mt-2 space-y-1.5 ml-5 animate-fade-in">
          {toolCalls.map((tc) => (
            <ToolCallBlock key={tc.id} toolCall={tc} />
          ))}
        </div>
      )}
    </div>
  )
}
