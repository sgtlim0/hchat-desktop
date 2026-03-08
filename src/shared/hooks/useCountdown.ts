import { useState, useEffect, useCallback, useRef } from 'react'

interface UseCountdownResult {
  remaining: number
  isRunning: boolean
  isFinished: boolean
  start: () => void
  pause: () => void
  reset: () => void
}

export function useCountdown(durationMs: number): UseCountdownResult {
  const [remaining, setRemaining] = useState(durationMs)
  const [isRunning, setIsRunning] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const clear = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const start = useCallback(() => {
    setIsRunning(true)
  }, [])

  const pause = useCallback(() => {
    setIsRunning(false)
    clear()
  }, [clear])

  const reset = useCallback(() => {
    setIsRunning(false)
    clear()
    setRemaining(durationMs)
  }, [durationMs, clear])

  useEffect(() => {
    if (!isRunning || remaining <= 0) {
      clear()
      return
    }

    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        const next = prev - 100
        if (next <= 0) {
          setIsRunning(false)
          return 0
        }
        return next
      })
    }, 100)

    return clear
  }, [isRunning, remaining, clear])

  return {
    remaining,
    isRunning,
    isFinished: remaining <= 0,
    start,
    pause,
    reset,
  }
}
