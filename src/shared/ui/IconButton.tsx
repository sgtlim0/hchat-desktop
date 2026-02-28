import type { LucideIcon } from 'lucide-react'

interface IconButtonProps {
  icon: LucideIcon
  onClick?: () => void
  size?: number
  className?: string
  tooltip?: string
}

export function IconButton({
  icon: Icon,
  onClick,
  size = 32,
  className = '',
  tooltip
}: IconButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg bg-transparent hover:bg-hover transition flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      title={tooltip}
    >
      <Icon size={16} className="text-text-secondary" />
    </button>
  )
}
