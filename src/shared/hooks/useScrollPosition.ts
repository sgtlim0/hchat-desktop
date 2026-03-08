import { useState, useEffect } from 'react'

interface ScrollPosition {
  x: number
  y: number
  direction: 'up' | 'down' | 'idle'
  isAtTop: boolean
  isAtBottom: boolean
}

export function useScrollPosition(threshold = 50): ScrollPosition {
  const [position, setPosition] = useState<ScrollPosition>({
    x: 0, y: 0, direction: 'idle', isAtTop: true, isAtBottom: false,
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    let prevY = window.scrollY

    const handler = () => {
      const y = window.scrollY
      const x = window.scrollX
      const direction = y > prevY ? 'down' : y < prevY ? 'up' : 'idle'
      const isAtTop = y <= threshold
      const isAtBottom = y + window.innerHeight >= document.documentElement.scrollHeight - threshold

      setPosition({ x, y, direction: direction as ScrollPosition['direction'], isAtTop, isAtBottom })
      prevY = y
    }

    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [threshold])

  return position
}
