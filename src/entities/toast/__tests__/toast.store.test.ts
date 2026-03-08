import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useToastStore } from '@/entities/toast/toast.store'

describe('ToastStore', () => {
  beforeEach(() => {
    // Reset store state and clear all timers
    vi.clearAllTimers()
    vi.useFakeTimers()
    useToastStore.setState({
      toasts: [],
    })
  })

  it('should add a toast with auto-generated id', () => {
    const { addToast } = useToastStore.getState()

    addToast({ type: 'success', message: 'Operation successful!' })

    const { toasts } = useToastStore.getState()
    expect(toasts).toHaveLength(1)
    expect(toasts[0].type).toBe('success')
    expect(toasts[0].message).toBe('Operation successful!')
    expect(toasts[0].id).toMatch(/^toast-\d+-[\d.]+$/)
  })

  it('should limit toasts to maximum 5', () => {
    const { addToast } = useToastStore.getState()

    for (let i = 1; i <= 7; i++) {
      addToast({ type: 'info', message: `Toast ${i}` })
    }

    const { toasts } = useToastStore.getState()
    expect(toasts).toHaveLength(5)
    expect(toasts[0].message).toBe('Toast 3')
    expect(toasts[4].message).toBe('Toast 7')
  })

  it('should auto-remove toast after default duration', () => {
    const { addToast } = useToastStore.getState()

    addToast({ type: 'info', message: 'Auto remove' })

    expect(useToastStore.getState().toasts).toHaveLength(1)

    // Fast forward 3000ms (default duration)
    vi.advanceTimersByTime(3000)

    expect(useToastStore.getState().toasts).toHaveLength(0)
  })

  it('should handle custom duration', () => {
    const { addToast } = useToastStore.getState()

    addToast({ type: 'warning', message: 'Custom duration', duration: 5000 })

    // After 3000ms, toast should still be there
    vi.advanceTimersByTime(3000)
    expect(useToastStore.getState().toasts).toHaveLength(1)

    // After 5000ms total, toast should be removed
    vi.advanceTimersByTime(2000)
    expect(useToastStore.getState().toasts).toHaveLength(0)
  })

  it('should not auto-remove toast with duration 0', () => {
    const { addToast } = useToastStore.getState()

    addToast({ type: 'error', message: 'Persistent toast', duration: 0 })

    vi.advanceTimersByTime(10000)

    const { toasts } = useToastStore.getState()
    expect(toasts).toHaveLength(1)
    expect(toasts[0].message).toBe('Persistent toast')
  })

  it('should manually remove a specific toast', () => {
    const { addToast, removeToast } = useToastStore.getState()

    addToast({ type: 'info', message: 'Toast 1', duration: 0 })
    addToast({ type: 'success', message: 'Toast 2', duration: 0 })
    addToast({ type: 'error', message: 'Toast 3', duration: 0 })

    const toast2Id = useToastStore.getState().toasts[1].id

    removeToast(toast2Id)

    const { toasts } = useToastStore.getState()
    expect(toasts).toHaveLength(2)
    expect(toasts[0].message).toBe('Toast 1')
    expect(toasts[1].message).toBe('Toast 3')
  })

  it('should clear all toasts', () => {
    const { addToast, clearAll } = useToastStore.getState()

    addToast({ type: 'info', message: 'Toast 1', duration: 0 })
    addToast({ type: 'success', message: 'Toast 2', duration: 0 })
    addToast({ type: 'warning', message: 'Toast 3', duration: 0 })

    expect(useToastStore.getState().toasts).toHaveLength(3)

    clearAll()

    expect(useToastStore.getState().toasts).toHaveLength(0)
  })

  it('should handle all toast types', () => {
    const { addToast } = useToastStore.getState()

    addToast({ type: 'success', message: 'Success message', duration: 0 })
    addToast({ type: 'error', message: 'Error message', duration: 0 })
    addToast({ type: 'warning', message: 'Warning message', duration: 0 })
    addToast({ type: 'info', message: 'Info message', duration: 0 })

    const { toasts } = useToastStore.getState()
    expect(toasts).toHaveLength(4)
    expect(toasts[0].type).toBe('success')
    expect(toasts[1].type).toBe('error')
    expect(toasts[2].type).toBe('warning')
    expect(toasts[3].type).toBe('info')
  })

  it('should support toast with action button', () => {
    const onClick = vi.fn()
    useToastStore.getState().addToast({
      type: 'info',
      message: 'Deleted',
      action: { label: 'Undo', onClick },
      duration: 0,
    })
    const toast = useToastStore.getState().toasts[0]
    expect(toast.action).toBeDefined()
    expect(toast.action!.label).toBe('Undo')
    toast.action!.onClick()
    expect(onClick).toHaveBeenCalled()
  })

  it('should support toast with progress bar', () => {
    useToastStore.getState().addToast({
      type: 'info',
      message: 'Uploading...',
      progress: 0,
      duration: 0,
    })
    expect(useToastStore.getState().toasts[0].progress).toBe(0)
  })

  it('should update progress on a toast', () => {
    useToastStore.getState().addToast({
      type: 'info',
      message: 'Processing...',
      progress: 0,
      duration: 0,
    })
    const id = useToastStore.getState().toasts[0].id
    useToastStore.getState().updateProgress(id, 50)
    expect(useToastStore.getState().toasts[0].progress).toBe(50)
  })

  it('should clamp progress between 0 and 100', () => {
    useToastStore.getState().addToast({
      type: 'info',
      message: 'Test',
      progress: 0,
      duration: 0,
    })
    const id = useToastStore.getState().toasts[0].id
    useToastStore.getState().updateProgress(id, 150)
    expect(useToastStore.getState().toasts[0].progress).toBe(100)
    useToastStore.getState().updateProgress(id, -10)
    expect(useToastStore.getState().toasts[0].progress).toBe(0)
  })
})