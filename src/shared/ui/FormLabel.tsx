import type { ReactNode } from 'react'

interface FormLabelProps {
  children: ReactNode
  htmlFor?: string
  className?: string
}

export function FormLabel({ children, htmlFor, className = '' }: FormLabelProps) {
  return (
    <label
      htmlFor={htmlFor}
      className={`text-[13px] font-semibold text-text-primary ${className}`}
    >
      {children}
    </label>
  )
}
