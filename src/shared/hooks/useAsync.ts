import { useState, useCallback, useEffect, useRef } from 'react'

export interface AsyncState<T> {
  data: T | null
  error: Error | null
  loading: boolean
}

export function useAsync<T>(
  asyncFn: () => Promise<T>,
  immediate = true,
): AsyncState<T> & { execute: () => Promise<T | null> } {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    error: null,
    loading: immediate,
  })
  const mountedRef = useRef(true)

  const execute = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const data = await asyncFn()
      if (mountedRef.current) {
        setState({ data, error: null, loading: false })
      }
      return data
    } catch (err) {
      if (mountedRef.current) {
        setState({ data: null, error: err instanceof Error ? err : new Error(String(err)), loading: false })
      }
      return null
    }
  }, [asyncFn])

  useEffect(() => {
    mountedRef.current = true
    if (immediate) {
      execute()
    }
    return () => {
      mountedRef.current = false
    }
  }, [execute, immediate])

  return { ...state, execute }
}
