import { useEffect, useRef } from 'react'

export function useOnMount(callback: () => void | (() => void)): void {
  const hasRun = useRef(false)

  useEffect(() => {
    if (hasRun.current) return
    hasRun.current = true
    const cleanup = callback()
    return typeof cleanup === 'function' ? cleanup : undefined
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}

export function useOnUnmount(callback: () => void): void {
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  useEffect(() => {
    return () => callbackRef.current()
  }, [])
}
