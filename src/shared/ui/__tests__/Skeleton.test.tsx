import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { SkeletonLine, SkeletonCircle, SkeletonBlock, SkeletonCard, SkeletonPage } from '../Skeleton'

describe('Skeleton', () => {
  describe('SkeletonLine', () => {
    it('renders with animate-pulse', () => {
      const { container } = render(<SkeletonLine />)
      expect(container.firstElementChild!.classList.contains('animate-pulse')).toBe(true)
    })

    it('renders with default h-4 height', () => {
      const { container } = render(<SkeletonLine />)
      expect(container.firstElementChild!.classList.contains('h-4')).toBe(true)
    })

    it('renders with custom width', () => {
      const { container } = render(<SkeletonLine width="50%" />)
      expect((container.firstElementChild as HTMLElement).style.width).toBe('50%')
    })

    it('renders with custom height', () => {
      const { container } = render(<SkeletonLine height="h-8" />)
      expect(container.firstElementChild!.classList.contains('h-8')).toBe(true)
    })

    it('accepts className', () => {
      const { container } = render(<SkeletonLine className="mt-2" />)
      expect(container.firstElementChild!.classList.contains('mt-2')).toBe(true)
    })
  })

  describe('SkeletonCircle', () => {
    it('renders with default size 40', () => {
      const { container } = render(<SkeletonCircle />)
      const el = container.firstElementChild as HTMLElement
      expect(el.style.width).toBe('40px')
      expect(el.style.height).toBe('40px')
    })

    it('renders with custom size', () => {
      const { container } = render(<SkeletonCircle size={24} />)
      const el = container.firstElementChild as HTMLElement
      expect(el.style.width).toBe('24px')
      expect(el.classList.contains('rounded-full')).toBe(true)
    })

    it('has animate-pulse', () => {
      const { container } = render(<SkeletonCircle />)
      expect(container.firstElementChild!.classList.contains('animate-pulse')).toBe(true)
    })
  })

  describe('SkeletonBlock', () => {
    it('renders default 3 rows', () => {
      const { container } = render(<SkeletonBlock />)
      const lines = container.querySelectorAll('.animate-pulse')
      expect(lines).toHaveLength(3)
    })

    it('renders custom row count', () => {
      const { container } = render(<SkeletonBlock rows={5} />)
      const lines = container.querySelectorAll('.animate-pulse')
      expect(lines).toHaveLength(5)
    })

    it('has gap-2 spacing', () => {
      const { container } = render(<SkeletonBlock />)
      expect(container.firstElementChild!.classList.contains('gap-2')).toBe(true)
    })
  })

  describe('SkeletonCard', () => {
    it('renders circle + block', () => {
      const { container } = render(<SkeletonCard />)
      const circles = container.querySelectorAll('.rounded-full')
      expect(circles.length).toBeGreaterThanOrEqual(1)
      const pulses = container.querySelectorAll('.animate-pulse')
      expect(pulses.length).toBeGreaterThanOrEqual(3)
    })
  })

  describe('SkeletonPage', () => {
    it('renders header + multiple cards', () => {
      const { container } = render(<SkeletonPage />)
      const pulses = container.querySelectorAll('.animate-pulse')
      expect(pulses.length).toBeGreaterThanOrEqual(10)
    })
  })
})
