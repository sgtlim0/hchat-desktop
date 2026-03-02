import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { IconButton } from '../IconButton'
import { MessageSquare } from 'lucide-react'

describe('IconButton', () => {
  it('renders with icon', () => {
    render(<IconButton icon={MessageSquare} ariaLabel="Message" />)
    const button = screen.getByRole('button', { name: /message/i })
    expect(button).toBeInTheDocument()
  })

  it('renders with default size', () => {
    render(<IconButton icon={MessageSquare} ariaLabel="Message" />)
    const button = screen.getByRole('button', { name: /message/i })
    expect(button).toHaveStyle({ width: '32px', height: '32px' })
  })

  it('renders with custom size', () => {
    render(<IconButton icon={MessageSquare} ariaLabel="Message" size={48} />)
    const button = screen.getByRole('button', { name: /message/i })
    expect(button).toHaveStyle({ width: '48px', height: '48px' })
  })

  it('handles click events', () => {
    const handleClick = vi.fn()
    render(<IconButton icon={MessageSquare} onClick={handleClick} ariaLabel="Message" />)
    const button = screen.getByRole('button', { name: /message/i })
    fireEvent.click(button)
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('does not call onClick when disabled', () => {
    const handleClick = vi.fn()
    render(<IconButton icon={MessageSquare} onClick={handleClick} ariaLabel="Message" disabled />)
    const button = screen.getByRole('button', { name: /message/i })
    expect(button).toBeDisabled()
    fireEvent.click(button)
    expect(handleClick).not.toHaveBeenCalled()
  })

  it('sets aria-label from ariaLabel prop', () => {
    render(<IconButton icon={MessageSquare} ariaLabel="Send message" />)
    const button = screen.getByRole('button', { name: /send message/i })
    expect(button).toHaveAttribute('aria-label', 'Send message')
  })

  it('sets aria-label from tooltip when ariaLabel not provided', () => {
    render(<IconButton icon={MessageSquare} tooltip="Click to send" />)
    const button = screen.getByRole('button', { name: /click to send/i })
    expect(button).toHaveAttribute('aria-label', 'Click to send')
  })

  it('prefers ariaLabel over tooltip for aria-label', () => {
    render(<IconButton icon={MessageSquare} ariaLabel="Send" tooltip="Click to send" />)
    const button = screen.getByRole('button', { name: /^send$/i })
    expect(button).toHaveAttribute('aria-label', 'Send')
  })

  it('sets title attribute from tooltip', () => {
    render(<IconButton icon={MessageSquare} tooltip="Click to send" />)
    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('title', 'Click to send')
  })

  it('applies custom className', () => {
    render(<IconButton icon={MessageSquare} ariaLabel="Message" className="custom-icon-btn" />)
    const button = screen.getByRole('button', { name: /message/i })
    expect(button).toHaveClass('custom-icon-btn')
  })

  it('has correct base styling', () => {
    render(<IconButton icon={MessageSquare} ariaLabel="Message" />)
    const button = screen.getByRole('button', { name: /message/i })
    expect(button).toHaveClass('rounded-lg', 'bg-transparent', 'hover:bg-hover')
    expect(button).toHaveClass('transition', 'flex', 'items-center', 'justify-center')
  })

  it('renders icon with correct size prop', () => {
    const { container } = render(<IconButton icon={MessageSquare} ariaLabel="Message" />)
    const svg = container.querySelector('svg')
    expect(svg).toHaveAttribute('width', '16')
    expect(svg).toHaveAttribute('height', '16')
  })

  it('applies focus-visible styles', () => {
    render(<IconButton icon={MessageSquare} ariaLabel="Message" />)
    const button = screen.getByRole('button', { name: /message/i })
    expect(button).toHaveClass('focus-visible:outline-2', 'focus-visible:outline-primary')
  })
})
