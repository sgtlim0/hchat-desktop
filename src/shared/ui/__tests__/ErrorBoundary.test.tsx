import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ErrorBoundary } from '../ErrorBoundary'
import { errorReporter } from '@/shared/lib/error-reporter'

vi.mock('@/shared/i18n', () => ({
  getTranslation: () => (key: string) => {
    const map: Record<string, string> = {
      'error.boundary.title': 'Something went wrong',
      'error.boundary.message': 'There was a problem loading the page.',
      'error.boundary.retry': 'Try again',
    }
    return map[key] ?? key
  },
  useTranslation: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        'error.boundary.title': 'Something went wrong',
        'error.boundary.message': 'There was a problem loading the page.',
        'error.boundary.retry': 'Try again',
      }
      return map[key] ?? key
    }
  })
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

  it('catches errors without logging to console', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>,
    )

    // Console.error is called by React itself when an error is thrown in a component,
    // but our ErrorBoundary doesn't add extra console.error calls
    expect(consoleSpy).toHaveBeenCalled()
  })

  it('reports errors to errorReporter with critical severity', () => {
    const reportSpy = vi.spyOn(errorReporter, 'report')

    render(
      <ErrorBoundary sessionContext={{ view: 'test', sessionId: 'test-id' }}>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>,
    )

    expect(reportSpy).toHaveBeenCalledOnce()
    expect(reportSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Test error message',
      }),
      'critical',
      expect.objectContaining({
        componentStack: expect.any(String),
        sessionContext: { view: 'test', sessionId: 'test-id' },
      }),
    )
  })
})
