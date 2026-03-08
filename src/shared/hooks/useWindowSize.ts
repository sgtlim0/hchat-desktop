import { useState, useEffect } from 'react'

interface WindowSize {
  width: number
  height: number
  isPortrait: boolean
  isLandscape: boolean
}

export function useWindowSize(): WindowSize {
  const [size, setSize] = useState<WindowSize>(() => {
    const w = typeof window !== 'undefined' ? window.innerWidth : 1024
    const h = typeof window !== 'undefined' ? window.innerHeight : 768
    return { width: w, height: h, isPortrait: h > w, isLandscape: w > h }
  })

  useEffect(() => {
    if (typeof window === 'undefined') return
    const handler = () => {
      const w = window.innerWidth
      const h = window.innerHeight
      setSize({ width: w, height: h, isPortrait: h > w, isLandscape: w > h })
    }
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  return size
}
