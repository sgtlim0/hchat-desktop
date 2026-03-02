import type { LucideIcon } from 'lucide-react'

interface IconButtonProps {
  icon: LucideIcon
  onClick?: () => void
  size?: number
  className?: string
  tooltip?: string
  ariaLabel?: string
  disabled?: boolean
}

export function IconButton({
  icon: Icon,
  onClick,
  size = 32,
  className = '',
  tooltip,
  ariaLabel,
  disabled,
}: IconButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg bg-transparent hover:bg-hover focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 transition flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      title={tooltip}
      aria-label={ariaLabel ?? tooltip}
      disabled={disabled}
    >
      <Icon size={16} className="text-text-secondary" />
    </button>
  )
}
