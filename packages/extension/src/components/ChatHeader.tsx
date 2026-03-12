import { Plus } from 'lucide-react'
import { MODELS } from '@hchat/shared'

interface ChatHeaderProps {
  title: string
  modelId: string
  onNewChat: () => void
}

export function ChatHeader({ title, modelId, onNewChat }: ChatHeaderProps) {
  const model = MODELS.find(m => m.id === modelId)

  return (
    <div className="flex h-10 items-center gap-2 border-b border-slate-200 px-3 dark:border-slate-700">
      <span className="flex-1 truncate text-sm font-medium text-slate-800 dark:text-slate-100">
        {title}
      </span>
      {model && (
        <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-medium text-white">
          {model.shortLabel}
        </span>
      )}
      <button
        onClick={onNewChat}
        className="rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
        title="New chat"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  )
}
