import { describe, it, expect, vi } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useAsync } from '../useAsync'

describe('useAsync', () => {
  it('starts loading when immediate', async () => {
    const fn = vi.fn(() => new Promise<string>((r) => setTimeout(() => r('ok'), 50)))
    const { result } = renderHook(() => useAsync(fn))
    expect(result.current.loading).toBe(true)
    expect(result.current.data).toBeNull()
    await waitFor(() => expect(result.current.loading).toBe(false))
  })

  it('resolves data', async () => {
    const fn = vi.fn(() => Promise.resolve('hello'))
    const { result } = renderHook(() => useAsync(fn))
    await waitFor(() => expect(result.current.data).toBe('hello'))
    expect(result.current.error).toBeNull()
    expect(result.current.loading).toBe(false)
  })

  it('captures error', async () => {
    const fn = vi.fn(() => Promise.reject(new Error('fail')))
    const { result } = renderHook(() => useAsync(fn))
    await waitFor(() => expect(result.current.error?.message).toBe('fail'))
    expect(result.current.data).toBeNull()
    expect(result.current.loading).toBe(false)
  })

  it('does not execute immediately when immediate=false', () => {
    const fn = vi.fn(() => Promise.resolve('data'))
    const { result } = renderHook(() => useAsync(fn, false))
    expect(result.current.loading).toBe(false)
    expect(fn).not.toHaveBeenCalled()
  })

  it('execute can be called manually', async () => {
    const fn = vi.fn(() => Promise.resolve(42))
    const { result } = renderHook(() => useAsync(fn, false))
    await act(async () => {
      await result.current.execute()
    })
    expect(result.current.data).toBe(42)
  })

  it('handles non-Error rejections', async () => {
    const fn = vi.fn(() => Promise.reject('string error'))
    const { result } = renderHook(() => useAsync(fn))
    await waitFor(() => expect(result.current.error?.message).toBe('string error'))
  })
})
