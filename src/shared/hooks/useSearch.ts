import { useState, useEffect, useMemo, useCallback } from 'react'

interface UseSearchOptions<T> {
  items: T[]
  searchFn: (item: T, query: string) => boolean
  debounceMs?: number
}

interface UseSearchResult<T> {
  query: string
  setQuery: (query: string) => void
  results: T[]
  isSearching: boolean
  resultCount: number
  clear: () => void
}

export function useSearch<T>(options: UseSearchOptions<T>): UseSearchResult<T> {
  const { items, searchFn, debounceMs = 300 } = options
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    if (!query) {
      setDebouncedQuery('')
      setIsSearching(false)
      return
    }
    setIsSearching(true)
    const timer = setTimeout(() => {
      setDebouncedQuery(query)
      setIsSearching(false)
    }, debounceMs)
    return () => clearTimeout(timer)
  }, [query, debounceMs])

  const results = useMemo(() => {
    if (!debouncedQuery.trim()) return items
    return items.filter((item) => searchFn(item, debouncedQuery))
  }, [items, debouncedQuery, searchFn])

  const clear = useCallback(() => {
    setQuery('')
    setDebouncedQuery('')
  }, [])

  return {
    query,
    setQuery,
    results,
    isSearching,
    resultCount: results.length,
    clear,
  }
}
