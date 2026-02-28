interface AvatarProps {
  initials: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Avatar({ initials, size = 'md', className = '' }: AvatarProps) {
  const sizeMap = {
    sm: 24,
    md: 32,
    lg: 40,
  }

  const fontSize = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  }

  const dimension = sizeMap[size]

  return (
    <div
      className={`rounded-full bg-primary text-white font-semibold flex items-center justify-center ${fontSize[size]} ${className}`}
      style={{ width: dimension, height: dimension }}
    >
      {initials}
    </div>
  )
}
