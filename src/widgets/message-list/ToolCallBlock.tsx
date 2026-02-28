import { ToolCallBlockItem } from '@/shared/ui/ToolCallBlockItem'
import type { ToolCall } from '@/shared/types'

interface ToolCallBlockProps {
  toolCall: ToolCall
}

const statusTextMap = {
  running: '실행 중...',
  done: '— 완료',
  error: '— 오류',
}

export function ToolCallBlock({ toolCall }: ToolCallBlockProps) {
  return (
    <ToolCallBlockItem
      toolName={toolCall.toolName}
      status={toolCall.status}
      statusText={statusTextMap[toolCall.status]}
    />
  )
}
