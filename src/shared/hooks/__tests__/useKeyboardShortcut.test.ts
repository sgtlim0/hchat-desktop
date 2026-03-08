import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, cleanup } from '@testing-library/react'
import { useKeyboardShortcut } from '../useKeyboardShortcut'

describe('useKeyboardShortcut', () => {
  let callback: ReturnType<typeof vi.fn>

  beforeEach(() => {
    callback = vi.fn()
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('calls callback on matching key combo (Ctrl+S)', () => {
    renderHook(() => useKeyboardShortcut({
      key: 's',
      ctrl: true
    }, callback))

    const event = new KeyboardEvent('keydown', {
      key: 's',
      ctrlKey: true,
      metaKey: false,
      shiftKey: false,
      altKey: false
    })
    window.dispatchEvent(event)

    expect(callback).toHaveBeenCalledTimes(1)
  })

  it('does not call on non-matching key', () => {
    renderHook(() => useKeyboardShortcut({
      key: 's',
      ctrl: true
    }, callback))

    const event = new KeyboardEvent('keydown', {
      key: 'a',
      ctrlKey: true,
      metaKey: false,
      shiftKey: false,
      altKey: false
    })
    window.dispatchEvent(event)

    expect(callback).not.toHaveBeenCalled()
  })

  it('supports Meta key (Cmd on Mac)', () => {
    renderHook(() => useKeyboardShortcut({
      key: 'k',
      meta: true
    }, callback))

    const event = new KeyboardEvent('keydown', {
      key: 'k',
      ctrlKey: false,
      metaKey: true,
      shiftKey: false,
      altKey: false
    })
    window.dispatchEvent(event)

    expect(callback).toHaveBeenCalledTimes(1)
  })

  it('supports Shift modifier', () => {
    renderHook(() => useKeyboardShortcut({
      key: 'Enter',
      shift: true
    }, callback))

    const event = new KeyboardEvent('keydown', {
      key: 'Enter',
      ctrlKey: false,
      metaKey: false,
      shiftKey: true,
      altKey: false
    })
    window.dispatchEvent(event)

    expect(callback).toHaveBeenCalledTimes(1)
  })

  it('supports Alt modifier', () => {
    renderHook(() => useKeyboardShortcut({
      key: 'Tab',
      alt: true
    }, callback))

    const event = new KeyboardEvent('keydown', {
      key: 'Tab',
      ctrlKey: false,
      metaKey: false,
      shiftKey: false,
      altKey: true
    })
    window.dispatchEvent(event)

    expect(callback).toHaveBeenCalledTimes(1)
  })

  it('preventDefault is called by default', () => {
    renderHook(() => useKeyboardShortcut({
      key: 's',
      ctrl: true
    }, callback))

    const event = new KeyboardEvent('keydown', {
      key: 's',
      ctrlKey: true,
      metaKey: false,
      shiftKey: false,
      altKey: false
    })
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault')
    window.dispatchEvent(event)

    expect(preventDefaultSpy).toHaveBeenCalled()
  })

  it('does not call preventDefault when disabled', () => {
    renderHook(() => useKeyboardShortcut({
      key: 's',
      ctrl: true,
      preventDefault: false
    }, callback))

    const event = new KeyboardEvent('keydown', {
      key: 's',
      ctrlKey: true,
      metaKey: false,
      shiftKey: false,
      altKey: false
    })
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault')
    window.dispatchEvent(event)

    expect(preventDefaultSpy).not.toHaveBeenCalled()
  })

  it('disabled when enabled=false', () => {
    renderHook(() => useKeyboardShortcut({
      key: 's',
      ctrl: true,
      enabled: false
    }, callback))

    const event = new KeyboardEvent('keydown', {
      key: 's',
      ctrlKey: true,
      metaKey: false,
      shiftKey: false,
      altKey: false
    })
    window.dispatchEvent(event)

    expect(callback).not.toHaveBeenCalled()
  })

  it('cleans up on unmount', () => {
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener')
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')

    const { unmount } = renderHook(() => useKeyboardShortcut({
      key: 's',
      ctrl: true
    }, callback))

    expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function))

    unmount()

    expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function))
  })

  it('multiple shortcuts can coexist', () => {
    const callback1 = vi.fn()
    const callback2 = vi.fn()

    renderHook(() => useKeyboardShortcut({
      key: 's',
      ctrl: true
    }, callback1))

    renderHook(() => useKeyboardShortcut({
      key: 'k',
      meta: true
    }, callback2))

    // Trigger first shortcut
    const event1 = new KeyboardEvent('keydown', {
      key: 's',
      ctrlKey: true,
      metaKey: false,
      shiftKey: false,
      altKey: false
    })
    window.dispatchEvent(event1)

    expect(callback1).toHaveBeenCalledTimes(1)
    expect(callback2).not.toHaveBeenCalled()

    // Clear and trigger second shortcut
    callback1.mockClear()

    const event2 = new KeyboardEvent('keydown', {
      key: 'k',
      ctrlKey: false,
      metaKey: true,
      shiftKey: false,
      altKey: false
    })
    window.dispatchEvent(event2)

    expect(callback1).not.toHaveBeenCalled()
    expect(callback2).toHaveBeenCalledTimes(1)
  })

  it('requires exact modifier match', () => {
    renderHook(() => useKeyboardShortcut({
      key: 's',
      ctrl: true
    }, callback))

    // Extra modifier should not match
    const event = new KeyboardEvent('keydown', {
      key: 's',
      ctrlKey: true,
      metaKey: false,
      shiftKey: true, // Extra modifier
      altKey: false
    })
    window.dispatchEvent(event)

    expect(callback).not.toHaveBeenCalled()
  })

  it('handles multiple modifiers correctly', () => {
    renderHook(() => useKeyboardShortcut({
      key: 's',
      ctrl: true,
      shift: true,
      alt: true
    }, callback))

    // All modifiers must match
    const event = new KeyboardEvent('keydown', {
      key: 's',
      ctrlKey: true,
      metaKey: false,
      shiftKey: true,
      altKey: true
    })
    window.dispatchEvent(event)

    expect(callback).toHaveBeenCalledTimes(1)
  })
})