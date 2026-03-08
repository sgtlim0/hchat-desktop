import { useState, useEffect } from 'react'

export function usePageVisibility(): {
  isVisible: boolean
  isHidden: boolean
} {
  const [isVisible, setIsVisible] = useState(() =>
    typeof document !== 'undefined' ? !document.hidden : true,
  )

  useEffect(() => {
    if (typeof document === 'undefined') return

    const handler = () => setIsVisible(!document.hidden)
    document.addEventListener('visibilitychange', handler)
    return () => document.removeEventListener('visibilitychange', handler)
  }, [])

  return { isVisible, isHidden: !isVisible }
}
