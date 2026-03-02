import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { FormLabel } from '../FormLabel'

describe('FormLabel', () => {
  it('renders with children text', () => {
    render(<FormLabel>Username</FormLabel>)
    const label = screen.getByText(/username/i)
    expect(label).toBeInTheDocument()
  })

  it('renders as label element', () => {
    const { container } = render(<FormLabel>Email</FormLabel>)
    const label = container.querySelector('label')
    expect(label).toBeInTheDocument()
  })

  it('sets htmlFor attribute when provided', () => {
    render(<FormLabel htmlFor="email-input">Email</FormLabel>)
    const label = screen.getByText(/email/i)
    expect(label).toHaveAttribute('for', 'email-input')
  })

  it('does not set htmlFor when not provided', () => {
    render(<FormLabel>Password</FormLabel>)
    const label = screen.getByText(/password/i)
    expect(label).not.toHaveAttribute('for')
  })

  it('applies custom className', () => {
    render(<FormLabel className="custom-label">Name</FormLabel>)
    const label = screen.getByText(/name/i)
    expect(label).toHaveClass('custom-label')
  })

  it('has correct base styling', () => {
    render(<FormLabel>Label</FormLabel>)
    const label = screen.getByText(/label/i)
    expect(label).toHaveClass('text-[13px]', 'font-semibold', 'text-text-primary')
  })

  it('renders complex children', () => {
    render(
      <FormLabel>
        <span>First Name</span>
        <span>(Optional)</span>
      </FormLabel>
    )
    expect(screen.getByText('First Name')).toBeInTheDocument()
    expect(screen.getByText('(Optional)')).toBeInTheDocument()
  })

  it('renders with empty children', () => {
    const { container } = render(<FormLabel>{''}</FormLabel>)
    const label = container.querySelector('label')
    expect(label).toBeInTheDocument()
    expect(label?.textContent).toBe('')
  })

  it('combines custom and base classes correctly', () => {
    render(<FormLabel className="mb-4">Field</FormLabel>)
    const label = screen.getByText(/field/i)
    expect(label).toHaveClass('text-[13px]', 'font-semibold', 'text-text-primary', 'mb-4')
  })

  it('works with associated input elements', () => {
    render(
      <div>
        <FormLabel htmlFor="test-input">Test Label</FormLabel>
        <input id="test-input" />
      </div>
    )
    const label = screen.getByText(/test label/i)
    const input = screen.getByRole('textbox')
    expect(label).toHaveAttribute('for', 'test-input')
    expect(input).toHaveAttribute('id', 'test-input')
  })
})
