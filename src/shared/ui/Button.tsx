import type { ReactNode } from 'react'

interface ButtonProps {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  onClick?: () => void
  className?: string
  disabled?: boolean
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  className = '',
  disabled = false
}: ButtonProps) {
  const baseStyles = 'rounded-lg font-medium transition cursor-pointer inline-flex items-center justify-center'

  const variantStyles = {
    primary: 'bg-primary text-white hover:opacity-90',
    secondary: 'border border-border-input text-text-primary hover:bg-hover',
    ghost: 'text-text-secondary hover:bg-hover',
    danger: 'text-danger hover:bg-danger/10',
  }

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-6 py-3 text-sm',
  }

  const disabledStyles = disabled ? 'opacity-50 cursor-not-allowed' : ''

  return (
    <button
      onClick={disabled ? undefined : onClick}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${disabledStyles} ${className}`}
    >
      {children}
    </button>
  )
}
