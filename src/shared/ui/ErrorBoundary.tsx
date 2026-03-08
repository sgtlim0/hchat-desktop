import { Component } from 'react'
import type { ReactNode, ErrorInfo } from 'react'
import { getTranslation } from '@/shared/i18n'
import { useSettingsStore } from '@/entities/settings/settings.store'
import { errorReporter } from '@/shared/lib/error-reporter'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

function ErrorFallback({ error, onReset }: { error: Error | null; onReset: () => void }) {
  const language = useSettingsStore((s) => s.language)
  const t = getTranslation(language)

  return (
    <div className="flex-1 flex items-center justify-center h-full p-6">
      <div className="flex flex-col items-center gap-4 max-w-md text-center">
        <div className="w-16 h-16 rounded-full bg-danger/10 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-danger"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
            />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-text-primary">
          {t('error.boundary.title')}
        </h2>
        <p className="text-sm text-text-secondary">
          {t('error.boundary.message')}
        </p>
        {error && (
          <p className="text-xs text-text-secondary/60 font-mono bg-surface-secondary rounded-lg p-3 w-full break-all">
            {error.message}
          </p>
        )}
        <button
          onClick={onReset}
          className="px-5 py-2.5 text-sm font-medium rounded-lg bg-primary text-white hover:opacity-90 transition cursor-pointer"
        >
          {t('error.boundary.retry')}
        </button>
      </div>
    </div>
  )
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    errorReporter.report(error, 'critical', {
      componentStack: errorInfo.componentStack,
    })
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null })
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} onReset={this.handleReset} />
    }
    return this.props.children
  }
}
