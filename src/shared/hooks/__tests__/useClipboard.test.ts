import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useClipboard } from '../useClipboard'

describe('useClipboard', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn(() => Promise.resolve()),
        readText: vi.fn(() => Promise.resolve('clipboard content')),
      },
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('starts with copied false', () => {
    const { result } = renderHook(() => useClipboard())
    expect(result.current.copied).toBe(false)
  })

  it('copy sets copied to true', async () => {
    const { result } = renderHook(() => useClipboard())
    await act(async () => {
      await result.current.copy('hello')
    })
    expect(result.current.copied).toBe(true)
  })

  it('copied resets after timeout', async () => {
    const { result } = renderHook(() => useClipboard(1000))
    await act(async () => {
      await result.current.copy('hello')
    })
    expect(result.current.copied).toBe(true)
    act(() => { vi.advanceTimersByTime(1000) })
    expect(result.current.copied).toBe(false)
  })

  it('copy calls clipboard.writeText', async () => {
    const { result } = renderHook(() => useClipboard())
    await act(async () => {
      await result.current.copy('test text')
    })
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('test text')
  })

  it('readText returns clipboard content', async () => {
    const { result } = renderHook(() => useClipboard())
    let text = ''
    await act(async () => {
      text = await result.current.readText()
    })
    expect(text).toBe('clipboard content')
  })

  it('copy returns true on success', async () => {
    const { result } = renderHook(() => useClipboard())
    let success = false
    await act(async () => {
      success = await result.current.copy('test')
    })
    expect(success).toBe(true)
  })

  it('readText returns empty on failure', async () => {
    Object.assign(navigator, {
      clipboard: { readText: vi.fn(() => Promise.reject(new Error('denied'))) },
    })
    const { result } = renderHook(() => useClipboard())
    let text = 'initial'
    await act(async () => {
      text = await result.current.readText()
    })
    expect(text).toBe('')
  })
})
