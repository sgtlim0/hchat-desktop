import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSearch } from '../useSearch'

const items = [
  { id: 1, name: 'Apple' },
  { id: 2, name: 'Banana' },
  { id: 3, name: 'Cherry' },
]

const searchFn = (item: typeof items[0], q: string) =>
  item.name.toLowerCase().includes(q.toLowerCase())

describe('useSearch', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('returns all items initially', () => {
    const { result } = renderHook(() => useSearch({ items, searchFn }))
    expect(result.current.results).toHaveLength(3)
    expect(result.current.query).toBe('')
  })

  it('filters after debounce', () => {
    const { result } = renderHook(() => useSearch({ items, searchFn, debounceMs: 100 }))
    act(() => result.current.setQuery('apple'))
    act(() => { vi.advanceTimersByTime(100) })
    expect(result.current.results).toHaveLength(1)
    expect(result.current.results[0].name).toBe('Apple')
  })

  it('does not filter before debounce', () => {
    const { result } = renderHook(() => useSearch({ items, searchFn, debounceMs: 300 }))
    act(() => result.current.setQuery('apple'))
    act(() => { vi.advanceTimersByTime(100) })
    expect(result.current.results).toHaveLength(3) // not yet filtered
  })

  it('returns resultCount', () => {
    const { result } = renderHook(() => useSearch({ items, searchFn, debounceMs: 0 }))
    act(() => result.current.setQuery('ban'))
    act(() => { vi.advanceTimersByTime(0) })
    expect(result.current.resultCount).toBe(1)
  })

  it('clear resets query and results', () => {
    const { result } = renderHook(() => useSearch({ items, searchFn, debounceMs: 0 }))
    act(() => result.current.setQuery('cherry'))
    act(() => { vi.advanceTimersByTime(0) })
    act(() => result.current.clear())
    expect(result.current.query).toBe('')
    expect(result.current.results).toHaveLength(3)
  })

  it('returns empty for no match', () => {
    const { result } = renderHook(() => useSearch({ items, searchFn, debounceMs: 0 }))
    act(() => result.current.setQuery('xyz'))
    act(() => { vi.advanceTimersByTime(0) })
    expect(result.current.results).toHaveLength(0)
  })
})
