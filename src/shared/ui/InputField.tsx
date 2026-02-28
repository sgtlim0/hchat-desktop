import { forwardRef } from 'react'

interface InputFieldProps {
  placeholder?: string
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void
  className?: string
  disabled?: boolean
}

export const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
  ({ placeholder, value, onChange, onKeyDown, className = '', disabled = false }, ref) => {
    return (
      <input
        ref={ref}
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        disabled={disabled}
        className={`rounded-xl bg-input border border-border-input px-4 py-3 text-sm placeholder:text-text-tertiary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 transition ${className}`}
      />
    )
  }
)

InputField.displayName = 'InputField'
