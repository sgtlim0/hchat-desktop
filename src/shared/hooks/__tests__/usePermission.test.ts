import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { usePermission } from '../usePermission'

describe('usePermission', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('returns prompt state initially', () => {
    Object.defineProperty(navigator, 'permissions', {
      value: { query: vi.fn(() => new Promise(() => {})) },
      writable: true, configurable: true,
    })
    const { result } = renderHook(() => usePermission('notifications' as PermissionName))
    expect(result.current.state).toBe('prompt')
  })

  it('resolves to granted', async () => {
    Object.defineProperty(navigator, 'permissions', {
      value: {
        query: vi.fn(() => Promise.resolve({
          state: 'granted',
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        })),
      },
      writable: true, configurable: true,
    })
    const { result } = renderHook(() => usePermission('notifications' as PermissionName))
    await waitFor(() => expect(result.current.state).toBe('granted'))
    expect(result.current.isGranted).toBe(true)
  })

  it('resolves to denied', async () => {
    Object.defineProperty(navigator, 'permissions', {
      value: {
        query: vi.fn(() => Promise.resolve({
          state: 'denied',
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        })),
      },
      writable: true, configurable: true,
    })
    const { result } = renderHook(() => usePermission('notifications' as PermissionName))
    await waitFor(() => expect(result.current.isDenied).toBe(true))
  })

  it('handles unsupported', async () => {
    Object.defineProperty(navigator, 'permissions', {
      value: { query: vi.fn(() => Promise.reject(new Error('not supported'))) },
      writable: true, configurable: true,
    })
    const { result } = renderHook(() => usePermission('notifications' as PermissionName))
    await waitFor(() => expect(result.current.state).toBe('unsupported'))
  })
})
