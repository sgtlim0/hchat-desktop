interface ToolCallBlockItemProps {
  toolName: string
  status: 'running' | 'done' | 'error'
  statusText: string
}

export function ToolCallBlockItem({ toolName, status, statusText }: ToolCallBlockItemProps) {
  const statusColors = {
    running: 'bg-primary',
    done: 'bg-success',
    error: 'bg-danger',
  }

  return (
    <div className="rounded-lg bg-card px-2.5 py-1.5 gap-2 inline-flex items-center text-xs">
      <div className={`w-2 h-2 rounded-full ${statusColors[status]} ${status === 'running' ? 'animate-pulse' : ''}`} />
      <span className="font-medium text-text-primary">{toolName}</span>
      <span className="text-text-secondary">{statusText}</span>
    </div>
  )
}
