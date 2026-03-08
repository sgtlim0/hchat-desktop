import { describe, it, expect, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useStaleWhileRevalidate } from '../useStaleWhileRevalidate'

describe('useStaleWhileRevalidate', () => {
  it('starts loading', () => {
    const fetcher = vi.fn(() => new Promise<string>(() => {}))
    const { result } = renderHook(() => useStaleWhileRevalidate('test', fetcher))
    expect(result.current.isLoading).toBe(true)
    expect(result.current.data).toBeNull()
  })

  it('resolves data', async () => {
    const fetcher = vi.fn(() => Promise.resolve('hello'))
    const { result } = renderHook(() => useStaleWhileRevalidate('k1', fetcher))
    await waitFor(() => expect(result.current.data).toBe('hello'))
    expect(result.current.isLoading).toBe(false)
  })

  it('captures error', async () => {
    const fetcher = vi.fn(() => Promise.reject(new Error('fail')))
    const { result } = renderHook(() => useStaleWhileRevalidate('k2', fetcher))
    await waitFor(() => expect(result.current.error?.message).toBe('fail'))
  })

  it('provides mutate function', async () => {
    const fetcher = vi.fn(() => Promise.resolve(42))
    const { result } = renderHook(() => useStaleWhileRevalidate('k3', fetcher))
    await waitFor(() => expect(result.current.data).toBe(42))
    expect(typeof result.current.mutate).toBe('function')
  })
})
