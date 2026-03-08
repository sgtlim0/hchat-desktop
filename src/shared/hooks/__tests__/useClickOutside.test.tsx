import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { useClickOutside } from '../useClickOutside'

function TestComponent({ onClickOutside }: { onClickOutside: () => void }) {
  const ref = useClickOutside<HTMLDivElement>(onClickOutside)
  return (
    <div>
      <div ref={ref} data-testid="inside">Inside</div>
      <div data-testid="outside">Outside</div>
    </div>
  )
}

describe('useClickOutside', () => {
  it('calls handler when clicking outside', () => {
    const handler = vi.fn()
    const { getByTestId } = render(<TestComponent onClickOutside={handler} />)
    fireEvent.mouseDown(getByTestId('outside'))
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('does not call handler when clicking inside', () => {
    const handler = vi.fn()
    const { getByTestId } = render(<TestComponent onClickOutside={handler} />)
    fireEvent.mouseDown(getByTestId('inside'))
    expect(handler).not.toHaveBeenCalled()
  })

  it('handles touch events', () => {
    const handler = vi.fn()
    const { getByTestId } = render(<TestComponent onClickOutside={handler} />)
    fireEvent.touchStart(getByTestId('outside'))
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('does not call handler on touch inside', () => {
    const handler = vi.fn()
    const { getByTestId } = render(<TestComponent onClickOutside={handler} />)
    fireEvent.touchStart(getByTestId('inside'))
    expect(handler).not.toHaveBeenCalled()
  })

  it('cleans up listeners on unmount', () => {
    const handler = vi.fn()
    const removeMouseSpy = vi.spyOn(document, 'removeEventListener')
    const { unmount } = render(<TestComponent onClickOutside={handler} />)
    unmount()
    const calls = removeMouseSpy.mock.calls.filter(([e]) => e === 'mousedown' || e === 'touchstart')
    expect(calls.length).toBeGreaterThanOrEqual(2)
    removeMouseSpy.mockRestore()
  })
})
