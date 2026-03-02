import * as Icons from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface AssistantCardProps {
  icon: string
  title: string
  description: string
  modelLabel: string
  providerColor: string
  onClick: () => void
}

function getIcon(name: string): LucideIcon {
  const icon = (Icons as unknown as Record<string, LucideIcon>)[name]
  return icon ?? Icons.Bot
}

export function AssistantCard({
  icon,
  title,
  description,
  modelLabel,
  providerColor,
  onClick,
}: AssistantCardProps) {
  const Icon = getIcon(icon)

  return (
    <button
      onClick={onClick}
      className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 text-left transition hover:border-primary hover:shadow-md"
    >
      <div
        className="flex h-10 w-10 items-center justify-center rounded-full"
        style={{ backgroundColor: `${providerColor}15` }}
      >
        <Icon size={20} style={{ color: providerColor }} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-text-primary truncate">{title}</p>
        <p className="mt-0.5 text-xs text-text-secondary line-clamp-2 leading-relaxed">
          {description}
        </p>
      </div>
      <div className="flex items-center gap-1.5">
        <span
          className="inline-block h-2 w-2 rounded-full"
          style={{ backgroundColor: providerColor }}
        />
        <span className="text-[11px] text-text-tertiary">{modelLabel}</span>
      </div>
    </button>
  )
}
