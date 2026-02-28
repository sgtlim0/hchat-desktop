import { forwardRef } from 'react'

interface FormInputProps {
  placeholder?: string
  value?: string
  onChange?: (value: string) => void
  type?: string
  className?: string
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ placeholder, value, onChange, type = 'text', className = '' }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className={`w-full rounded-lg bg-input border border-border-input px-3.5 py-2.5 text-[13px] focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 transition ${className}`}
      />
    )
  }
)

FormInput.displayName = 'FormInput'
