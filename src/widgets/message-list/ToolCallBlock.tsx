import { useTranslation } from '@/shared/i18n'
import { ToolCallBlockItem } from '@/shared/ui/ToolCallBlockItem'
import type { ToolCall } from '@/shared/types'

interface ToolCallBlockProps {
  toolCall: ToolCall
}

export function ToolCallBlock({ toolCall }: ToolCallBlockProps) {
  const { t } = useTranslation()
  const statusTextMap = {
    running: t('tool.statusRunning'),
    done: t('tool.statusDone'),
    error: t('tool.statusError'),
  }

  return (
    <ToolCallBlockItem
      toolName={toolCall.toolName}
      status={toolCall.status}
      statusText={statusTextMap[toolCall.status]}
    />
  )
}
