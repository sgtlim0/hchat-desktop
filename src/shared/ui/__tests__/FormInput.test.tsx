import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { FormInput } from '../FormInput'
import { createRef } from 'react'

describe('FormInput', () => {
  it('renders with placeholder', () => {
    render(<FormInput placeholder="Enter text" />)
    const input = screen.getByPlaceholderText(/enter text/i)
    expect(input).toBeInTheDocument()
  })

  it('renders with value', () => {
    render(<FormInput value="Hello" onChange={vi.fn()} />)
    const input = screen.getByDisplayValue(/hello/i)
    expect(input).toBeInTheDocument()
  })

  it('renders with default text type', () => {
    render(<FormInput />)
    const input = screen.getByRole('textbox')
    expect(input).toHaveAttribute('type', 'text')
  })

  it('renders with custom type', () => {
    render(<FormInput type="email" />)
    const input = screen.getByRole('textbox')
    expect(input).toHaveAttribute('type', 'email')
  })

  it('renders password type', () => {
    const { container } = render(<FormInput type="password" />)
    const input = container.querySelector('input[type="password"]')
    expect(input).toBeInTheDocument()
  })

  it('calls onChange with new value', () => {
    const handleChange = vi.fn()
    render(<FormInput value="" onChange={handleChange} />)
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'New text' } })
    expect(handleChange).toHaveBeenCalledWith('New text')
  })

  it('does not crash when onChange is not provided', () => {
    render(<FormInput />)
    const input = screen.getByRole('textbox')
    expect(() => {
      fireEvent.change(input, { target: { value: 'test' } })
    }).not.toThrow()
  })

  it('applies custom className', () => {
    render(<FormInput className="custom-input" />)
    const input = screen.getByRole('textbox')
    expect(input).toHaveClass('custom-input')
  })

  it('has correct base styling', () => {
    render(<FormInput />)
    const input = screen.getByRole('textbox')
    expect(input).toHaveClass('w-full', 'rounded-lg', 'bg-input', 'border', 'border-border-input')
    expect(input).toHaveClass('px-3.5', 'py-2.5', 'text-[13px]')
  })

  it('has focus styles', () => {
    render(<FormInput />)
    const input = screen.getByRole('textbox')
    expect(input).toHaveClass('focus:border-primary', 'focus:outline-none', 'focus:ring-1', 'focus:ring-primary/30')
  })

  it('forwards ref correctly', () => {
    const ref = createRef<HTMLInputElement>()
    render(<FormInput ref={ref} />)
    expect(ref.current).toBeInstanceOf(HTMLInputElement)
  })

  it('allows ref to access input methods', () => {
    const ref = createRef<HTMLInputElement>()
    render(<FormInput ref={ref} value="test" onChange={vi.fn()} />)
    expect(ref.current?.value).toBe('test')
  })

  it('handles multiple onChange events', () => {
    const handleChange = vi.fn()
    render(<FormInput onChange={handleChange} />)
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'first' } })
    fireEvent.change(input, { target: { value: 'second' } })
    expect(handleChange).toHaveBeenCalledTimes(2)
    expect(handleChange).toHaveBeenNthCalledWith(1, 'first')
    expect(handleChange).toHaveBeenNthCalledWith(2, 'second')
  })
})
