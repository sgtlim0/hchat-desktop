import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { SidebarItem } from '../SidebarItem'
import { Home } from 'lucide-react'

describe('SidebarItem', () => {
  it('renders with label', () => {
    render(<SidebarItem icon={Home} label="Dashboard" />)
    const button = screen.getByRole('button', { name: /dashboard/i })
    expect(button).toBeInTheDocument()
  })

  it('renders label text', () => {
    render(<SidebarItem icon={Home} label="Settings" />)
    expect(screen.getByText(/settings/i)).toBeInTheDocument()
  })

  it('renders with icon', () => {
    const { container } = render(<SidebarItem icon={Home} label="Home" />)
    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
  })

  it('icon has correct size', () => {
    const { container } = render(<SidebarItem icon={Home} label="Home" />)
    const svg = container.querySelector('svg')
    expect(svg).toHaveAttribute('width', '16')
    expect(svg).toHaveAttribute('height', '16')
  })

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn()
    render(<SidebarItem icon={Home} label="Home" onClick={handleClick} />)
    const button = screen.getByRole('button', { name: /home/i })
    fireEvent.click(button)
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('renders in inactive state by default', () => {
    render(<SidebarItem icon={Home} label="Home" />)
    const button = screen.getByRole('button', { name: /home/i })
    expect(button).not.toHaveClass('bg-hover', 'font-medium')
    expect(button).toHaveClass('hover:bg-hover/50')
  })

  it('renders in active state when active prop is true', () => {
    render(<SidebarItem icon={Home} label="Home" active={true} />)
    const button = screen.getByRole('button', { name: /home/i })
    expect(button).toHaveClass('bg-hover', 'font-medium')
  })

  it('applies inactive hover styles when not active', () => {
    render(<SidebarItem icon={Home} label="Home" active={false} />)
    const button = screen.getByRole('button', { name: /home/i })
    expect(button).toHaveClass('hover:bg-hover/50')
  })

  it('applies custom className', () => {
    render(<SidebarItem icon={Home} label="Home" className="custom-sidebar" />)
    const button = screen.getByRole('button', { name: /home/i })
    expect(button).toHaveClass('custom-sidebar')
  })

  it('has correct base styling', () => {
    render(<SidebarItem icon={Home} label="Home" />)
    const button = screen.getByRole('button', { name: /home/i })
    expect(button).toHaveClass('w-full', 'rounded-lg', 'px-3', 'py-2', 'gap-2')
    expect(button).toHaveClass('text-[13px]', 'cursor-pointer', 'flex', 'items-center')
  })

  it('icon has text-secondary color', () => {
    const { container } = render(<SidebarItem icon={Home} label="Home" />)
    const svg = container.querySelector('svg')
    expect(svg).toHaveClass('text-text-secondary', 'flex-shrink-0')
  })

  it('label text truncates', () => {
    render(<SidebarItem icon={Home} label="Very long label text" />)
    const span = screen.getByText(/very long label text/i)
    expect(span).toHaveClass('truncate')
  })

  it('does not crash when onClick is not provided', () => {
    render(<SidebarItem icon={Home} label="Home" />)
    const button = screen.getByRole('button', { name: /home/i })
    expect(() => {
      fireEvent.click(button)
    }).not.toThrow()
  })

  it('handles multiple clicks', () => {
    const handleClick = vi.fn()
    render(<SidebarItem icon={Home} label="Home" onClick={handleClick} />)
    const button = screen.getByRole('button', { name: /home/i })
    fireEvent.click(button)
    fireEvent.click(button)
    expect(handleClick).toHaveBeenCalledTimes(2)
  })

  it('toggles between active and inactive states', () => {
    const { rerender } = render(<SidebarItem icon={Home} label="Home" active={false} />)
    let button = screen.getByRole('button', { name: /home/i })
    expect(button).toHaveClass('hover:bg-hover/50')

    rerender(<SidebarItem icon={Home} label="Home" active={true} />)
    button = screen.getByRole('button', { name: /home/i })
    expect(button).toHaveClass('bg-hover', 'font-medium')
  })
})
