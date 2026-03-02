import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { QuickActionChip } from '../QuickActionChip'
import { Sparkles } from 'lucide-react'

describe('QuickActionChip', () => {
  it('renders with label', () => {
    render(<QuickActionChip icon={Sparkles} label="Quick action" />)
    const button = screen.getByRole('button', { name: /quick action/i })
    expect(button).toBeInTheDocument()
  })

  it('renders label text', () => {
    render(<QuickActionChip icon={Sparkles} label="Summarize" />)
    expect(screen.getByText(/summarize/i)).toBeInTheDocument()
  })

  it('renders with icon', () => {
    const { container } = render(<QuickActionChip icon={Sparkles} label="Action" />)
    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
  })

  it('icon has correct size', () => {
    const { container } = render(<QuickActionChip icon={Sparkles} label="Action" />)
    const svg = container.querySelector('svg')
    expect(svg).toHaveAttribute('width', '14')
    expect(svg).toHaveAttribute('height', '14')
  })

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn()
    render(<QuickActionChip icon={Sparkles} label="Action" onClick={handleClick} />)
    const button = screen.getByRole('button', { name: /action/i })
    fireEvent.click(button)
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('does not crash when onClick is not provided', () => {
    render(<QuickActionChip icon={Sparkles} label="Action" />)
    const button = screen.getByRole('button', { name: /action/i })
    expect(() => {
      fireEvent.click(button)
    }).not.toThrow()
  })

  it('has correct base styling', () => {
    render(<QuickActionChip icon={Sparkles} label="Action" />)
    const button = screen.getByRole('button', { name: /action/i })
    expect(button).toHaveClass('rounded-full', 'border', 'border-border')
    expect(button).toHaveClass('px-3.5', 'py-2', 'gap-1.5')
    expect(button).toHaveClass('text-[13px]', 'font-medium')
  })

  it('has hover styles', () => {
    render(<QuickActionChip icon={Sparkles} label="Action" />)
    const button = screen.getByRole('button', { name: /action/i })
    expect(button).toHaveClass('hover:bg-hover', 'transition')
  })

  it('has inline-flex layout', () => {
    render(<QuickActionChip icon={Sparkles} label="Action" />)
    const button = screen.getByRole('button', { name: /action/i })
    expect(button).toHaveClass('inline-flex', 'items-center')
  })

  it('icon has text-secondary color', () => {
    const { container } = render(<QuickActionChip icon={Sparkles} label="Action" />)
    const svg = container.querySelector('svg')
    expect(svg).toHaveClass('text-text-secondary')
  })

  it('handles multiple clicks', () => {
    const handleClick = vi.fn()
    render(<QuickActionChip icon={Sparkles} label="Action" onClick={handleClick} />)
    const button = screen.getByRole('button', { name: /action/i })
    fireEvent.click(button)
    fireEvent.click(button)
    fireEvent.click(button)
    expect(handleClick).toHaveBeenCalledTimes(3)
  })

  it('renders different labels correctly', () => {
    const { rerender } = render(<QuickActionChip icon={Sparkles} label="First" />)
    expect(screen.getByText('First')).toBeInTheDocument()

    rerender(<QuickActionChip icon={Sparkles} label="Second" />)
    expect(screen.getByText('Second')).toBeInTheDocument()
    expect(screen.queryByText('First')).not.toBeInTheDocument()
  })
})
