import { forwardRef } from 'react'

export interface FormInputProps {
  placeholder?: string
  value?: string
  onChange?: (value: string) => void
  type?: string
  className?: string
  disabled?: boolean
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ placeholder, value, onChange, type = 'text', className = '', disabled }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        placeholder={placeholder}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.value)}
        className={`w-full rounded-lg bg-input border border-border-input px-3.5 py-2.5 text-[13px] focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 transition ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      />
    )
  }
)

FormInput.displayName = 'FormInput'
