import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useDocumentTitle } from '../useDocumentTitle'

describe('useDocumentTitle', () => {
  let originalTitle: string

  beforeEach(() => {
    originalTitle = document.title
    document.title = 'Original Title'
  })

  afterEach(() => {
    document.title = originalTitle
  })

  it('sets document title on mount', () => {
    renderHook(() => useDocumentTitle('New Title'))

    expect(document.title).toBe('New Title | H Chat')
  })

  it('updates when title changes', () => {
    const { rerender } = renderHook(
      ({ title }) => useDocumentTitle(title),
      { initialProps: { title: 'First Title' } }
    )

    expect(document.title).toBe('First Title | H Chat')

    rerender({ title: 'Second Title' })
    expect(document.title).toBe('Second Title | H Chat')
  })

  it('restores original title on unmount', () => {
    const { unmount } = renderHook(() => useDocumentTitle('Temporary Title'))

    expect(document.title).toBe('Temporary Title | H Chat')

    unmount()
    expect(document.title).toBe('Original Title')
  })

  it('handles empty string', () => {
    renderHook(() => useDocumentTitle(''))

    expect(document.title).toBe('H Chat')
  })

  it('appends suffix when provided', () => {
    renderHook(() => useDocumentTitle('Custom', { suffix: ' - My App' }))

    expect(document.title).toBe('Custom - My App')
  })

  it('works with template format', () => {
    renderHook(() => useDocumentTitle('Chat with Assistant'))

    expect(document.title).toBe('Chat with Assistant | H Chat')
  })

  it('does not restore on unmount when restoreOnUnmount is false', () => {
    const { unmount } = renderHook(() =>
      useDocumentTitle('No Restore', { restoreOnUnmount: false })
    )

    expect(document.title).toBe('No Restore | H Chat')

    unmount()
    expect(document.title).toBe('No Restore | H Chat')
  })

  it('handles multiple suffix combinations', () => {
    renderHook(() => useDocumentTitle('Page', { suffix: '' }))
    expect(document.title).toBe('Page')

    const { rerender } = renderHook(
      ({ title, suffix }) => useDocumentTitle(title, { suffix }),
      { initialProps: { title: 'Test', suffix: ' | Custom' } }
    )
    expect(document.title).toBe('Test | Custom')

    rerender({ title: 'Another', suffix: undefined })
    expect(document.title).toBe('Another | H Chat')
  })

  it('updates title when suffix changes', () => {
    const { rerender } = renderHook(
      ({ title, suffix }) => useDocumentTitle(title, { suffix }),
      { initialProps: { title: 'Page', suffix: ' | App1' } }
    )

    expect(document.title).toBe('Page | App1')

    rerender({ title: 'Page', suffix: ' | App2' })
    expect(document.title).toBe('Page | App2')
  })
})