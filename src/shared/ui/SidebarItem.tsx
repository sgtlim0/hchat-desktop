import type { LucideIcon } from 'lucide-react'

interface SidebarItemProps {
  icon: LucideIcon
  label: string
  active?: boolean
  onClick?: () => void
  className?: string
}

export function SidebarItem({ icon: Icon, label, active = false, onClick, className = '' }: SidebarItemProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full rounded-lg px-3 py-2 gap-2 text-[13px] cursor-pointer flex items-center ${
        active
          ? 'bg-hover font-medium'
          : 'hover:bg-hover/50'
      } ${className}`}
    >
      <Icon size={16} className="text-text-secondary flex-shrink-0" />
      <span className="truncate">{label}</span>
    </button>
  )
}
