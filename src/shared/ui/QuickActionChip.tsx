import type { LucideIcon } from 'lucide-react'

interface QuickActionChipProps {
  icon: LucideIcon
  label: string
  onClick?: () => void
}

export function QuickActionChip({ icon: Icon, label, onClick }: QuickActionChipProps) {
  return (
    <button
      onClick={onClick}
      className="rounded-full border border-border px-3.5 py-2 gap-1.5 text-[13px] font-medium hover:bg-hover transition inline-flex items-center"
    >
      <Icon size={14} className="text-text-secondary" />
      <span>{label}</span>
    </button>
  )
}
