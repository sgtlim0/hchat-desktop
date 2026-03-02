import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { SettingsTabItem } from '../SettingsTabItem'
import { Settings } from 'lucide-react'

describe('SettingsTabItem', () => {
  it('renders with label', () => {
    render(<SettingsTabItem icon={Settings} label="General" />)
    const button = screen.getByRole('button', { name: /general/i })
    expect(button).toBeInTheDocument()
  })

  it('renders label text', () => {
    render(<SettingsTabItem icon={Settings} label="Appearance" />)
    expect(screen.getByText(/appearance/i)).toBeInTheDocument()
  })

  it('renders with icon', () => {
    const { container } = render(<SettingsTabItem icon={Settings} label="General" />)
    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
  })

  it('icon has correct size', () => {
    const { container } = render(<SettingsTabItem icon={Settings} label="General" />)
    const svg = container.querySelector('svg')
    expect(svg).toHaveAttribute('width', '16')
    expect(svg).toHaveAttribute('height', '16')
  })

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn()
    render(<SettingsTabItem icon={Settings} label="General" onClick={handleClick} />)
    const button = screen.getByRole('button', { name: /general/i })
    fireEvent.click(button)
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('renders in inactive state by default', () => {
    render(<SettingsTabItem icon={Settings} label="General" />)
    const button = screen.getByRole('button', { name: /general/i })
    expect(button).toHaveClass('text-text-secondary', 'hover:bg-hover/50')
    expect(button).not.toHaveClass('bg-hover', 'font-medium', 'text-text-primary')
  })

  it('renders in active state when active prop is true', () => {
    render(<SettingsTabItem icon={Settings} label="General" active={true} />)
    const button = screen.getByRole('button', { name: /general/i })
    expect(button).toHaveClass('bg-hover', 'font-medium', 'text-text-primary')
  })

  it('applies inactive styles when not active', () => {
    render(<SettingsTabItem icon={Settings} label="General" active={false} />)
    const button = screen.getByRole('button', { name: /general/i })
    expect(button).toHaveClass('text-text-secondary', 'hover:bg-hover/50')
  })

  it('has correct base styling', () => {
    render(<SettingsTabItem icon={Settings} label="General" />)
    const button = screen.getByRole('button', { name: /general/i })
    expect(button).toHaveClass('w-full', 'rounded-lg', 'px-3', 'py-2', 'gap-2.5')
    expect(button).toHaveClass('text-[13px]', 'cursor-pointer', 'flex', 'items-center')
  })

  it('icon has flex-shrink-0', () => {
    const { container } = render(<SettingsTabItem icon={Settings} label="General" />)
    const svg = container.querySelector('svg')
    expect(svg).toHaveClass('flex-shrink-0')
  })

  it('does not crash when onClick is not provided', () => {
    render(<SettingsTabItem icon={Settings} label="General" />)
    const button = screen.getByRole('button', { name: /general/i })
    expect(() => {
      fireEvent.click(button)
    }).not.toThrow()
  })

  it('handles multiple clicks', () => {
    const handleClick = vi.fn()
    render(<SettingsTabItem icon={Settings} label="General" onClick={handleClick} />)
    const button = screen.getByRole('button', { name: /general/i })
    fireEvent.click(button)
    fireEvent.click(button)
    expect(handleClick).toHaveBeenCalledTimes(2)
  })

  it('toggles between active and inactive states', () => {
    const { rerender } = render(<SettingsTabItem icon={Settings} label="General" active={false} />)
    let button = screen.getByRole('button', { name: /general/i })
    expect(button).toHaveClass('text-text-secondary')

    rerender(<SettingsTabItem icon={Settings} label="General" active={true} />)
    button = screen.getByRole('button', { name: /general/i })
    expect(button).toHaveClass('bg-hover', 'font-medium', 'text-text-primary')
  })

  it('maintains full width', () => {
    render(<SettingsTabItem icon={Settings} label="General" />)
    const button = screen.getByRole('button', { name: /general/i })
    expect(button).toHaveClass('w-full')
  })

  it('renders different labels correctly', () => {
    const { rerender } = render(<SettingsTabItem icon={Settings} label="First" />)
    expect(screen.getByText('First')).toBeInTheDocument()

    rerender(<SettingsTabItem icon={Settings} label="Second" />)
    expect(screen.getByText('Second')).toBeInTheDocument()
    expect(screen.queryByText('First')).not.toBeInTheDocument()
  })
})
