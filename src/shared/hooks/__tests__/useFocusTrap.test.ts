import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useFocusTrap } from '../useFocusTrap'

describe('useFocusTrap', () => {
  it('returns a ref', () => {
    const { result } = renderHook(() => useFocusTrap())
    expect(result.current).toHaveProperty('current')
  })

  it('ref is initially null', () => {
    const { result } = renderHook(() => useFocusTrap())
    expect(result.current.current).toBeNull()
  })

  it('accepts active parameter', () => {
    const { result } = renderHook(() => useFocusTrap(false))
    expect(result.current).toHaveProperty('current')
  })

  it('does not throw when inactive', () => {
    expect(() => renderHook(() => useFocusTrap(false))).not.toThrow()
  })
})
