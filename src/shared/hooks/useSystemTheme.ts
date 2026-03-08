import { useState, useEffect } from 'react'

type Theme = 'light' | 'dark'

/**
 * Hook that detects and tracks the system's color scheme preference
 *
 * Usage:
 * ```typescript
 * function MyComponent() {
 *   const systemTheme = useSystemTheme() // 'light' | 'dark'
 *
 *   return <div>System prefers: {systemTheme}</div>
 * }
 * ```
 */

function getSystemTheme(): Theme {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function useSystemTheme(): Theme {
  const [theme, setTheme] = useState<Theme>(getSystemTheme)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const mql = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e: MediaQueryListEvent) => {
      setTheme(e.matches ? 'dark' : 'light')
    }

    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])

  return theme
}
