import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ToolCallBlockItem } from '../ToolCallBlockItem'

describe('ToolCallBlockItem', () => {
  it('renders with tool name', () => {
    render(<ToolCallBlockItem toolName="fetchData" status="done" statusText="Completed" />)
    expect(screen.getByText(/fetchData/i)).toBeInTheDocument()
  })

  it('renders with status text', () => {
    render(<ToolCallBlockItem toolName="calculate" status="done" statusText="Completed successfully" />)
    expect(screen.getByText(/completed successfully/i)).toBeInTheDocument()
  })

  it('renders running status with primary color', () => {
    const { container } = render(<ToolCallBlockItem toolName="process" status="running" statusText="Processing..." />)
    const indicator = container.querySelector('.bg-primary')
    expect(indicator).toBeInTheDocument()
  })

  it('renders running status with pulse animation', () => {
    const { container } = render(<ToolCallBlockItem toolName="process" status="running" statusText="Processing..." />)
    const indicator = container.querySelector('.animate-pulse')
    expect(indicator).toBeInTheDocument()
  })

  it('renders done status with success color', () => {
    const { container } = render(<ToolCallBlockItem toolName="save" status="done" statusText="Done" />)
    const indicator = container.querySelector('.bg-success')
    expect(indicator).toBeInTheDocument()
  })

  it('renders done status without pulse animation', () => {
    const { container } = render(<ToolCallBlockItem toolName="save" status="done" statusText="Done" />)
    const indicator = container.querySelector('.bg-success')
    expect(indicator).not.toHaveClass('animate-pulse')
  })

  it('renders error status with danger color', () => {
    const { container } = render(<ToolCallBlockItem toolName="validate" status="error" statusText="Failed" />)
    const indicator = container.querySelector('.bg-danger')
    expect(indicator).toBeInTheDocument()
  })

  it('renders error status without pulse animation', () => {
    const { container } = render(<ToolCallBlockItem toolName="validate" status="error" statusText="Failed" />)
    const indicator = container.querySelector('.bg-danger')
    expect(indicator).not.toHaveClass('animate-pulse')
  })

  it('has correct base styling', () => {
    const { container } = render(<ToolCallBlockItem toolName="test" status="done" statusText="Done" />)
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper).toHaveClass('rounded-lg', 'bg-card', 'px-2.5', 'py-1.5', 'gap-2')
    expect(wrapper).toHaveClass('inline-flex', 'items-center', 'text-xs')
  })

  it('renders status indicator as rounded circle', () => {
    const { container } = render(<ToolCallBlockItem toolName="test" status="done" statusText="Done" />)
    const indicator = container.querySelector('.w-2.h-2.rounded-full')
    expect(indicator).toBeInTheDocument()
  })

  it('tool name has correct styling', () => {
    render(<ToolCallBlockItem toolName="myTool" status="done" statusText="Done" />)
    const toolName = screen.getByText(/myTool/i)
    expect(toolName).toHaveClass('font-medium', 'text-text-primary')
  })

  it('status text has correct styling', () => {
    render(<ToolCallBlockItem toolName="test" status="done" statusText="Success" />)
    const statusText = screen.getByText(/success/i)
    expect(statusText).toHaveClass('text-text-secondary')
  })

  it('changes status indicator color based on status', () => {
    const { container, rerender } = render(
      <ToolCallBlockItem toolName="test" status="running" statusText="Running" />
    )
    expect(container.querySelector('.bg-primary')).toBeInTheDocument()

    rerender(<ToolCallBlockItem toolName="test" status="done" statusText="Done" />)
    expect(container.querySelector('.bg-success')).toBeInTheDocument()

    rerender(<ToolCallBlockItem toolName="test" status="error" statusText="Error" />)
    expect(container.querySelector('.bg-danger')).toBeInTheDocument()
  })

  it('renders different tool names correctly', () => {
    const { rerender } = render(<ToolCallBlockItem toolName="first" status="done" statusText="Done" />)
    expect(screen.getByText('first')).toBeInTheDocument()

    rerender(<ToolCallBlockItem toolName="second" status="done" statusText="Done" />)
    expect(screen.getByText('second')).toBeInTheDocument()
    expect(screen.queryByText('first')).not.toBeInTheDocument()
  })

  it('renders different status texts correctly', () => {
    const { rerender } = render(<ToolCallBlockItem toolName="test" status="running" statusText="Starting..." />)
    expect(screen.getByText('Starting...')).toBeInTheDocument()

    rerender(<ToolCallBlockItem toolName="test" status="done" statusText="Finished" />)
    expect(screen.getByText('Finished')).toBeInTheDocument()
    expect(screen.queryByText('Starting...')).not.toBeInTheDocument()
  })
})
