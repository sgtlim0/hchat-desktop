import { useEffect } from 'react'

interface ShortcutOptions {
  key: string           // 'k', 's', 'Enter', etc
  ctrl?: boolean
  meta?: boolean        // Cmd on Mac
  shift?: boolean
  alt?: boolean
  enabled?: boolean     // default true
  preventDefault?: boolean  // default true
}

export function useKeyboardShortcut(
  options: ShortcutOptions,
  callback: () => void
): void {
  const {
    key,
    ctrl = false,
    meta = false,
    shift = false,
    alt = false,
    enabled = true,
    preventDefault = true
  } = options

  useEffect(() => {
    if (!enabled) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if key matches
      if (event.key !== key) {
        return
      }

      // Check if modifiers match exactly
      const ctrlMatch = event.ctrlKey === ctrl
      const metaMatch = event.metaKey === meta
      const shiftMatch = event.shiftKey === shift
      const altMatch = event.altKey === alt

      if (!ctrlMatch || !metaMatch || !shiftMatch || !altMatch) {
        return
      }

      // Prevent default if enabled
      if (preventDefault) {
        event.preventDefault()
      }

      // Call the callback
      callback()
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [key, ctrl, meta, shift, alt, enabled, preventDefault, callback])
}