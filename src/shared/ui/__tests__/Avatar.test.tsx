import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Avatar } from '../Avatar'

describe('Avatar', () => {
  it('renders with initials', () => {
    render(<Avatar initials="AB" />)
    const avatar = screen.getByText('AB')
    expect(avatar).toBeInTheDocument()
  })

  it('renders with default medium size', () => {
    const { container } = render(<Avatar initials="CD" />)
    const avatar = container.firstChild as HTMLElement
    expect(avatar).toHaveStyle({ width: '32px', height: '32px' })
    expect(avatar).toHaveClass('text-sm')
  })

  it('renders with small size', () => {
    const { container } = render(<Avatar initials="EF" size="sm" />)
    const avatar = container.firstChild as HTMLElement
    expect(avatar).toHaveStyle({ width: '24px', height: '24px' })
    expect(avatar).toHaveClass('text-xs')
  })

  it('renders with large size', () => {
    const { container } = render(<Avatar initials="GH" size="lg" />)
    const avatar = container.firstChild as HTMLElement
    expect(avatar).toHaveStyle({ width: '40px', height: '40px' })
    expect(avatar).toHaveClass('text-base')
  })

  it('has correct base styling', () => {
    const { container } = render(<Avatar initials="IJ" />)
    const avatar = container.firstChild as HTMLElement
    expect(avatar).toHaveClass('rounded-full', 'bg-primary', 'text-white', 'font-semibold')
    expect(avatar).toHaveClass('flex', 'items-center', 'justify-center')
  })

  it('applies custom className', () => {
    const { container } = render(<Avatar initials="KL" className="custom-avatar" />)
    const avatar = container.firstChild as HTMLElement
    expect(avatar).toHaveClass('custom-avatar')
  })

  it('displays single character initials', () => {
    render(<Avatar initials="M" />)
    expect(screen.getByText('M')).toBeInTheDocument()
  })

  it('displays three character initials', () => {
    render(<Avatar initials="ABC" />)
    expect(screen.getByText('ABC')).toBeInTheDocument()
  })

  it('renders with all size combinations', () => {
    const sizes: Array<{ size: 'sm' | 'md' | 'lg'; dimension: number; fontSize: string }> = [
      { size: 'sm', dimension: 24, fontSize: 'text-xs' },
      { size: 'md', dimension: 32, fontSize: 'text-sm' },
      { size: 'lg', dimension: 40, fontSize: 'text-base' },
    ]

    sizes.forEach(({ size, dimension, fontSize }) => {
      const { container, unmount } = render(<Avatar initials="X" size={size} />)
      const avatar = container.firstChild as HTMLElement
      expect(avatar).toHaveStyle({ width: `${dimension}px`, height: `${dimension}px` })
      expect(avatar).toHaveClass(fontSize)
      unmount()
    })
  })
})
