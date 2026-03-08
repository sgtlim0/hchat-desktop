import { useState, useEffect } from 'react'

type Theme = 'light' | 'dark'

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
