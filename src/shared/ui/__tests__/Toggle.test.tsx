import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { Toggle } from '../Toggle'

describe('Toggle', () => {
  it('renders with checked state', () => {
    const handleChange = vi.fn()
    render(<Toggle checked={true} onChange={handleChange} ariaLabel="Toggle switch" />)
    const toggle = screen.getByRole('switch', { name: /toggle switch/i })
    expect(toggle).toBeInTheDocument()
    expect(toggle).toHaveAttribute('aria-checked', 'true')
  })

  it('renders with unchecked state', () => {
    const handleChange = vi.fn()
    render(<Toggle checked={false} onChange={handleChange} ariaLabel="Toggle switch" />)
    const toggle = screen.getByRole('switch', { name: /toggle switch/i })
    expect(toggle).toHaveAttribute('aria-checked', 'false')
  })

  it('applies checked background color', () => {
    const handleChange = vi.fn()
    render(<Toggle checked={true} onChange={handleChange} />)
    const toggle = screen.getByRole('switch')
    expect(toggle).toHaveClass('bg-primary')
  })

  it('applies unchecked background color', () => {
    const handleChange = vi.fn()
    render(<Toggle checked={false} onChange={handleChange} />)
    const toggle = screen.getByRole('switch')
    expect(toggle).toHaveClass('bg-border')
  })

  it('calls onChange with opposite value when clicked', () => {
    const handleChange = vi.fn()
    render(<Toggle checked={false} onChange={handleChange} />)
    const toggle = screen.getByRole('switch')
    fireEvent.click(toggle)
    expect(handleChange).toHaveBeenCalledWith(true)
  })

  it('calls onChange with false when checked and clicked', () => {
    const handleChange = vi.fn()
    render(<Toggle checked={true} onChange={handleChange} />)
    const toggle = screen.getByRole('switch')
    fireEvent.click(toggle)
    expect(handleChange).toHaveBeenCalledWith(false)
  })

  it('applies custom className', () => {
    const handleChange = vi.fn()
    render(<Toggle checked={false} onChange={handleChange} className="custom-toggle" />)
    const toggle = screen.getByRole('switch')
    expect(toggle).toHaveClass('custom-toggle')
  })

  it('sets aria-label when provided', () => {
    const handleChange = vi.fn()
    render(<Toggle checked={false} onChange={handleChange} ariaLabel="Dark mode toggle" />)
    const toggle = screen.getByRole('switch', { name: /dark mode toggle/i })
    expect(toggle).toBeInTheDocument()
  })

  it('has focus-visible outline classes', () => {
    const handleChange = vi.fn()
    render(<Toggle checked={false} onChange={handleChange} />)
    const toggle = screen.getByRole('switch')
    expect(toggle).toHaveClass('focus-visible:outline-2', 'focus-visible:outline-primary')
  })

  it('renders inner knob with correct translation when checked', () => {
    const handleChange = vi.fn()
    const { container } = render(<Toggle checked={true} onChange={handleChange} />)
    const knob = container.querySelector('.translate-x-\\[18px\\]')
    expect(knob).toBeInTheDocument()
  })

  it('renders inner knob with correct translation when unchecked', () => {
    const handleChange = vi.fn()
    const { container } = render(<Toggle checked={false} onChange={handleChange} />)
    const knob = container.querySelector('.translate-x-1')
    expect(knob).toBeInTheDocument()
  })
})
