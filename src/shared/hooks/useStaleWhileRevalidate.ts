import { useState, useEffect, useCallback, useRef } from 'react'

interface SWRState<T> {
  data: T | null
  error: Error | null
  isLoading: boolean
  isValidating: boolean
  mutate: () => Promise<void>
}

export function useStaleWhileRevalidate<T>(
  key: string,
  fetcher: () => Promise<T>,
): SWRState<T> {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isValidating, setIsValidating] = useState(false)
  const cacheRef = useRef<Map<string, T>>(new Map())

  const fetchData = useCallback(async () => {
    const cached = cacheRef.current.get(key)
    if (cached) {
      setData(cached)
      setIsLoading(false)
      setIsValidating(true)
    }

    try {
      const result = await fetcher()
      cacheRef.current.set(key, result)
      setData(result)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)))
    } finally {
      setIsLoading(false)
      setIsValidating(false)
    }
  }, [key, fetcher])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const mutate = useCallback(async () => {
    setIsValidating(true)
    await fetchData()
  }, [fetchData])

  return { data, error, isLoading, isValidating, mutate }
}
