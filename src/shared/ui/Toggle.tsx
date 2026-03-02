interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  className?: string
  ariaLabel?: string
}

export function Toggle({ checked, onChange, className = '', ariaLabel }: ToggleProps) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={() => onChange(!checked)}
      className={`w-10 h-[22px] rounded-full transition relative focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 ${
        checked ? 'bg-primary' : 'bg-border'
      } ${className}`}
    >
      <div
        className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-[18px]' : 'translate-x-1'
        }`}
      />
    </button>
  )
}
