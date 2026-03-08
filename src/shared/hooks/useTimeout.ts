import { useEffect, useRef, useCallback } from 'react'

export function useTimeout(callback: () => void, delayMs: number | null): {
  reset: () => void
  clear: () => void
} {
  const savedCallback = useRef(callback)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    savedCallback.current = callback
  }, [callback])

  const clear = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const reset = useCallback(() => {
    clear()
    if (delayMs !== null) {
      timerRef.current = setTimeout(() => savedCallback.current(), delayMs)
    }
  }, [delayMs, clear])

  useEffect(() => {
    if (delayMs === null) return
    timerRef.current = setTimeout(() => savedCallback.current(), delayMs)
    return clear
  }, [delayMs, clear])

  return { reset, clear }
}
