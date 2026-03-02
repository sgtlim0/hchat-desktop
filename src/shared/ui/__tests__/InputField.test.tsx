import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { InputField } from '../InputField'
import { createRef } from 'react'

describe('InputField', () => {
  it('renders with placeholder', () => {
    render(<InputField placeholder="Type here..." />)
    const input = screen.getByPlaceholderText(/type here/i)
    expect(input).toBeInTheDocument()
  })

  it('renders with value', () => {
    render(<InputField value="Test value" />)
    const input = screen.getByDisplayValue(/test value/i)
    expect(input).toBeInTheDocument()
  })

  it('renders as text type', () => {
    render(<InputField />)
    const input = screen.getByRole('textbox')
    expect(input).toHaveAttribute('type', 'text')
  })

  it('calls onChange when value changes', () => {
    const handleChange = vi.fn()
    render(<InputField onChange={handleChange} />)
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'New value' } })
    expect(handleChange).toHaveBeenCalledTimes(1)
    const event = handleChange.mock.calls[0][0]
    expect(event).toBeDefined()
    expect(event.target).toBeDefined()
  })

  it('calls onKeyDown when key is pressed', () => {
    const handleKeyDown = vi.fn()
    render(<InputField onKeyDown={handleKeyDown} />)
    const input = screen.getByRole('textbox')
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(handleKeyDown).toHaveBeenCalledTimes(1)
  })

  it('handles Enter key press', () => {
    const handleKeyDown = vi.fn()
    render(<InputField onKeyDown={handleKeyDown} />)
    const input = screen.getByRole('textbox')
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' })
    expect(handleKeyDown).toHaveBeenCalled()
  })

  it('applies disabled state', () => {
    render(<InputField disabled />)
    const input = screen.getByRole('textbox')
    expect(input).toBeDisabled()
  })

  it('respects disabled attribute', () => {
    const handleChange = vi.fn()
    render(<InputField disabled onChange={handleChange} />)
    const input = screen.getByRole('textbox')
    expect(input).toBeDisabled()
    expect(input).toHaveAttribute('disabled')
  })

  it('applies custom className', () => {
    render(<InputField className="custom-field" />)
    const input = screen.getByRole('textbox')
    expect(input).toHaveClass('custom-field')
  })

  it('has correct base styling', () => {
    render(<InputField />)
    const input = screen.getByRole('textbox')
    expect(input).toHaveClass('rounded-xl', 'bg-input', 'border', 'border-border-input')
    expect(input).toHaveClass('px-4', 'py-3', 'text-sm')
  })

  it('has placeholder styling', () => {
    render(<InputField placeholder="Placeholder" />)
    const input = screen.getByRole('textbox')
    expect(input).toHaveClass('placeholder:text-text-tertiary')
  })

  it('has focus styles', () => {
    render(<InputField />)
    const input = screen.getByRole('textbox')
    expect(input).toHaveClass('focus:border-primary', 'focus:outline-none', 'focus:ring-1', 'focus:ring-primary/30')
  })

  it('forwards ref correctly', () => {
    const ref = createRef<HTMLInputElement>()
    render(<InputField ref={ref} />)
    expect(ref.current).toBeInstanceOf(HTMLInputElement)
  })

  it('allows ref to focus input', () => {
    const ref = createRef<HTMLInputElement>()
    render(<InputField ref={ref} />)
    ref.current?.focus()
    expect(document.activeElement).toBe(ref.current)
  })

  it('does not crash when onChange is not provided', () => {
    render(<InputField />)
    const input = screen.getByRole('textbox')
    expect(() => {
      fireEvent.change(input, { target: { value: 'test' } })
    }).not.toThrow()
  })

  it('does not crash when onKeyDown is not provided', () => {
    render(<InputField />)
    const input = screen.getByRole('textbox')
    expect(() => {
      fireEvent.keyDown(input, { key: 'Enter' })
    }).not.toThrow()
  })

  it('handles multiple keyboard events', () => {
    const handleKeyDown = vi.fn()
    render(<InputField onKeyDown={handleKeyDown} />)
    const input = screen.getByRole('textbox')
    fireEvent.keyDown(input, { key: 'a' })
    fireEvent.keyDown(input, { key: 'b' })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(handleKeyDown).toHaveBeenCalledTimes(3)
  })
})
