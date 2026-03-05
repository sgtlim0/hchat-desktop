import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ErrorBoundary } from '../ErrorBoundary'

vi.mock('@/shared/i18n', () => ({
  getTranslation: () => (key: string) => {
    const map: Record<string, string> = {
      'error.boundary.title': 'Something went wrong',
      'error.boundary.message': 'There was a problem loading the page.',
      'error.boundary.retry': 'Try again',
    }
    return map[key] ?? key
  },
}))

vi.mock('@/entities/settings/settings.store', () => ({
  useSettingsStore: (selector: (s: Record<string, unknown>) => unknown) =>
    selector({ language: 'en' }),
}))

function ThrowingComponent({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error message')
  }
  return <div>Child content</div>
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div>Normal content</div>
      </ErrorBoundary>,
    )
    expect(screen.getByText('Normal content')).toBeInTheDocument()
  })

  it('renders fallback UI when a child throws an error', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>,
    )
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByText('There was a problem loading the page.')).toBeInTheDocument()
    expect(screen.getByText('Test error message')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
  })

  it('displays the error message from the caught error', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>,
    )
    expect(screen.getByText('Test error message')).toBeInTheDocument()
  })

  it('resets state and renders children again when retry button is clicked', () => {
    let shouldThrow = true
    function ConditionalThrow() {
      if (shouldThrow) {
        throw new Error('Temporary error')
      }
      return <div>Recovered content</div>
    }

    render(
      <ErrorBoundary>
        <ConditionalThrow />
      </ErrorBoundary>,
    )

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()

    shouldThrow = false
    fireEvent.click(screen.getByRole('button', { name: /try again/i }))

    expect(screen.getByText('Recovered content')).toBeInTheDocument()
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument()
  })

  it('logs the error via console.error in componentDidCatch', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>,
    )

    expect(consoleSpy).toHaveBeenCalled()
    const calls = consoleSpy.mock.calls
    const errorBoundaryCall = calls.find(
      (call) => typeof call[0] === 'string' && call[0].includes('ErrorBoundary'),
    )
    expect(errorBoundaryCall).toBeDefined()
  })
})
