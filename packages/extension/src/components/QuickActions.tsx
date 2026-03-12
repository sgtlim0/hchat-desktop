import { FileText, Languages, BookOpen, Search } from 'lucide-react'

interface QuickActionsProps {
  onAction: (action: string) => void
}

const actions = [
  { id: 'summarize', label: 'Summarize', Icon: FileText },
  { id: 'translate', label: 'Translate', Icon: Languages },
  { id: 'explain', label: 'Explain', Icon: BookOpen },
  { id: 'ask', label: 'Ask AI', Icon: Search },
]

export function QuickActions({ onAction }: QuickActionsProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {actions.map(({ id, label, Icon }) => (
        <button
          key={id}
          onClick={() => onAction(id)}
          className="flex flex-col items-center gap-1.5 rounded-xl border border-slate-200 bg-white p-3
            transition-all hover:scale-[1.02] hover:border-blue-400 hover:shadow-sm
            dark:border-slate-700 dark:bg-slate-800 dark:hover:border-blue-500"
        >
          <Icon className="h-5 w-5 text-blue-500" />
          <span className="text-xs font-medium text-slate-700 dark:text-slate-200">
            {label}
          </span>
        </button>
      ))}
    </div>
  )
}
