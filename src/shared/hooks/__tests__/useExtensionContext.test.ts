import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useExtensionContext } from '../useExtensionContext'

describe('useExtensionContext', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    // Clean up any global chrome mock
    if ('chrome' in globalThis) {
      delete (globalThis as Record<string, unknown>).chrome
    }
  })

  it('initializes with null context', () => {
    const { result } = renderHook(() => useExtensionContext())
    expect(result.current.extContext).toBeNull()
  })

  it('clears context on clearContext call', () => {
    const { result } = renderHook(() => useExtensionContext())

    // Simulate receiving a message
    act(() => {
      window.dispatchEvent(
        new MessageEvent('message', {
          data: {
            type: 'CONTEXT_FROM_EXTENSION',
            payload: {
              context: {
                url: 'https://example.com',
                title: 'Test Page',
                selectedText: '',
                bodyText: 'Hello World',
                capturedAt: Date.now(),
              },
              mode: 'summarize',
            },
          },
        }),
      )
    })

    expect(result.current.extContext).not.toBeNull()

    act(() => {
      result.current.clearContext()
    })

    expect(result.current.extContext).toBeNull()
  })

  it('receives context from postMessage', () => {
    const { result } = renderHook(() => useExtensionContext())

    act(() => {
      window.dispatchEvent(
        new MessageEvent('message', {
          data: {
            type: 'CONTEXT_FROM_EXTENSION',
            payload: {
              context: {
                url: 'https://test.com',
                title: 'Test',
                selectedText: 'selected text',
                bodyText: 'body',
                capturedAt: 1000,
              },
              mode: 'explain',
            },
          },
        }),
      )
    })

    expect(result.current.extContext).not.toBeNull()
    expect(result.current.extContext!.mode).toBe('explain')
    expect(result.current.extContext!.context.url).toBe('https://test.com')
  })

  it('ignores unrelated messages', () => {
    const { result } = renderHook(() => useExtensionContext())

    act(() => {
      window.dispatchEvent(
        new MessageEvent('message', {
          data: { type: 'SOME_OTHER_MESSAGE', payload: {} },
        }),
      )
    })

    expect(result.current.extContext).toBeNull()
  })

  it('cleans up listener on unmount', () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener')
    const { unmount } = renderHook(() => useExtensionContext())
    unmount()
    expect(removeSpy).toHaveBeenCalledWith('message', expect.any(Function))
  })
})
