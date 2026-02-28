import type { LucideIcon } from 'lucide-react'

interface SettingsTabItemProps {
  icon: LucideIcon
  label: string
  active?: boolean
  onClick?: () => void
}

export function SettingsTabItem({ icon: Icon, label, active = false, onClick }: SettingsTabItemProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full rounded-lg px-3 py-2 gap-2.5 text-[13px] cursor-pointer flex items-center ${
        active
          ? 'bg-hover font-medium text-text-primary'
          : 'text-text-secondary hover:bg-hover/50'
      }`}
    >
      <Icon size={16} className="flex-shrink-0" />
      <span>{label}</span>
    </button>
  )
}
