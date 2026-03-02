import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BarChart } from '../BarChart'

describe('BarChart', () => {
  it('returns null when data is empty', () => {
    const { container } = render(<BarChart data={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders svg element with role="img"', () => {
    const data = [{ label: 'Day 1', value: 10 }]
    render(<BarChart data={data} />)

    const svg = screen.getByRole('img', { name: /bar chart/i })
    expect(svg).toBeInTheDocument()
    expect(svg.tagName).toBe('svg')
  })

  it('renders correct number of bars', () => {
    const data = [
      { label: 'Day 1', value: 10 },
      { label: 'Day 2', value: 20 },
      { label: 'Day 3', value: 15 },
    ]
    const { container } = render(<BarChart data={data} />)

    const bars = container.querySelectorAll('rect[rx="2"]') // bars have rounded corners
    expect(bars.length).toBeGreaterThanOrEqual(3) // at least 3 data bars (may include tooltip rects)
  })

  it('renders x-axis labels', () => {
    const data = [
      { label: 'Mon', value: 10 },
      { label: 'Tue', value: 20 },
    ]
    render(<BarChart data={data} />)

    expect(screen.getByText('Mon')).toBeInTheDocument()
    expect(screen.getByText('Tue')).toBeInTheDocument()
  })

  it('applies custom formatLabel', () => {
    const data = [{ label: '2026-03-01', value: 10 }]
    const formatLabel = (label: string) => label.slice(5) // MM-DD

    render(<BarChart data={data} formatLabel={formatLabel} />)

    expect(screen.getByText('03-01')).toBeInTheDocument()
  })

  it('renders y-axis grid lines', () => {
    const data = [{ label: 'Day 1', value: 100 }]
    const { container } = render(<BarChart data={data} />)

    const gridLines = container.querySelectorAll('line[stroke-dasharray="4 2"]')
    expect(gridLines.length).toBe(4) // 4 y-axis ticks
  })

  it('applies custom height', () => {
    const data = [{ label: 'Day 1', value: 10 }]
    const customHeight = 300

    const { container } = render(<BarChart data={data} height={customHeight} />)

    const svg = container.querySelector('svg')
    expect(svg?.getAttribute('height')).toBe(String(customHeight))
  })

  it('applies default formatValue for y-axis labels', () => {
    const data = [{ label: 'Day 1', value: 0.0123 }]
    render(<BarChart data={data} />)

    // Default format is $X.XXXX
    const valueText = screen.getByText(/\$0\.0123/)
    expect(valueText).toBeInTheDocument()
  })

  it('applies custom formatValue', () => {
    const data = [{ label: 'Day 1', value: 1500 }]
    const formatValue = (v: number) => `${v.toLocaleString()} req`

    render(<BarChart data={data} formatValue={formatValue} />)

    expect(screen.getByText(/1,500 req/)).toBeInTheDocument()
  })

  it('renders x and y axes', () => {
    const data = [{ label: 'Day 1', value: 10 }]
    const { container } = render(<BarChart data={data} />)

    const axes = container.querySelectorAll('line[stroke="var(--color-border)"]:not([stroke-dasharray])')
    expect(axes.length).toBeGreaterThanOrEqual(2) // x-axis and y-axis
  })

  it('calculates width based on data length', () => {
    const data = Array.from({ length: 20 }, (_, i) => ({
      label: `Day ${i + 1}`,
      value: Math.random() * 100,
    }))

    const { container } = render(<BarChart data={data} />)

    const svg = container.querySelector('svg')
    const width = Number(svg?.getAttribute('width'))
    expect(width).toBeGreaterThan(300) // minimum width
    expect(width).toBeGreaterThanOrEqual(data.length * 40) // width scales with data
  })

  it('handles single data point', () => {
    const data = [{ label: 'Only Day', value: 42 }]
    render(<BarChart data={data} />)

    const svg = screen.getByRole('img')
    expect(svg).toBeInTheDocument()
    expect(screen.getByText('Only Day')).toBeInTheDocument()
  })

  it('handles very small values', () => {
    const data = [{ label: 'Day 1', value: 0.0001 }]
    render(<BarChart data={data} />)

    const svg = screen.getByRole('img')
    expect(svg).toBeInTheDocument()
  })

  it('handles zero values', () => {
    const data = [
      { label: 'Day 1', value: 0 },
      { label: 'Day 2', value: 10 },
    ]
    render(<BarChart data={data} />)

    const svg = screen.getByRole('img')
    expect(svg).toBeInTheDocument()
  })

  it('wraps svg in scrollable container', () => {
    const data = [{ label: 'Day 1', value: 10 }]
    const { container } = render(<BarChart data={data} />)

    const wrapper = container.querySelector('.overflow-x-auto')
    expect(wrapper).toBeInTheDocument()
  })
})
