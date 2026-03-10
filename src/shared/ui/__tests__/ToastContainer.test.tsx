import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { ToastContainer } from '../ToastContainer'

const mockToasts: Array<{ id: string; message: string; type: 'success' | 'error' | 'warning' | 'info' }> = []
const mockRemoveToast = vi.fn()

vi.mock('@/shared/i18n', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

describe('ToastContainer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    mockToasts.length = 0
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should render nothing when no toasts', () => {
    const { container } = render(<ToastContainer toasts={[]} removeToast={mockRemoveToast} />)
    expect(container.querySelectorAll('[class*="pointer-events-auto"]')).toHaveLength(0)
  })

  it('should render toast messages', () => {
    mockToasts.push(
      { id: '1', message: 'Success message', type: 'success' },
      { id: '2', message: 'Error message', type: 'error' },
    )

    render(<ToastContainer toasts={mockToasts} removeToast={mockRemoveToast} />)

    expect(screen.getByText('Success message')).toBeDefined()
    expect(screen.getByText('Error message')).toBeDefined()
  })

  it('should apply correct border colors by type', () => {
    mockToasts.push(
      { id: '1', message: 'Success', type: 'success' },
      { id: '2', message: 'Error', type: 'error' },
      { id: '3', message: 'Warning', type: 'warning' },
      { id: '4', message: 'Info', type: 'info' },
    )

    const { container } = render(<ToastContainer toasts={mockToasts} removeToast={mockRemoveToast} />)
    const toastElements = container.querySelectorAll('[class*="pointer-events-auto"]')

    expect(toastElements[0].className).toContain('border-l-[#22C55E]')
    expect(toastElements[1].className).toContain('border-l-[#DC2626]')
    expect(toastElements[2].className).toContain('border-l-[#D97706]')
    expect(toastElements[3].className).toContain('border-l-[#3478FE]')
  })

  it('should call removeToast after close button click with delay', () => {
    mockToasts.push({ id: '1', message: 'Test toast', type: 'info' })

    render(<ToastContainer toasts={mockToasts} removeToast={mockRemoveToast} />)

    const closeButton = screen.getByRole('button', { name: 'toast.close' })
    fireEvent.click(closeButton)

    // Should not be removed immediately
    expect(mockRemoveToast).not.toHaveBeenCalled()

    // After 200ms animation delay
    act(() => {
      vi.advanceTimersByTime(200)
    })

    expect(mockRemoveToast).toHaveBeenCalledWith('1')
  })

  it('should render close buttons with aria-label', () => {
    mockToasts.push({ id: '1', message: 'Test', type: 'success' })

    render(<ToastContainer toasts={mockToasts} removeToast={mockRemoveToast} />)

    const button = screen.getByRole('button', { name: 'toast.close' })
    expect(button).toBeDefined()
  })
})
