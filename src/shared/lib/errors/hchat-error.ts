export type HChatErrorCode =
  // API errors
  | 'API_KEY_MISSING'
  | 'API_KEY_INVALID'
  | 'API_RATE_LIMIT'
  | 'API_QUOTA_EXCEEDED'
  | 'API_NETWORK_ERROR'
  | 'API_TIMEOUT'
  | 'API_SERVER_ERROR'
  // Content errors
  | 'CONTENT_TOO_LONG'
  | 'CONTENT_PARSE_ERROR'
  // Storage errors
  | 'STORAGE_QUOTA_EXCEEDED'
  | 'STORAGE_PARSE_ERROR'
  // General
  | 'UNKNOWN_ERROR'

export type HChatErrorAction = 'RETRY' | 'CHECK_SETTINGS' | 'UPGRADE' | 'DISMISS'

export interface ErrorMeta {
  message: string
  detail?: string
  severity: 'warn' | 'error'
  action: HChatErrorAction
}

export const ERROR_META: Record<HChatErrorCode, ErrorMeta> = {
  API_KEY_MISSING: { message: 'API credentials not configured', severity: 'warn', action: 'CHECK_SETTINGS' },
  API_KEY_INVALID: { message: 'Invalid API credentials', severity: 'error', action: 'CHECK_SETTINGS' },
  API_RATE_LIMIT: { message: 'Rate limited — please wait and retry', severity: 'warn', action: 'RETRY' },
  API_QUOTA_EXCEEDED: { message: 'API quota exceeded', detail: 'Check your account credits', severity: 'error', action: 'UPGRADE' },
  API_NETWORK_ERROR: { message: 'Network connection failed', severity: 'warn', action: 'RETRY' },
  API_TIMEOUT: { message: 'Request timed out', detail: 'The server took too long to respond', severity: 'warn', action: 'RETRY' },
  API_SERVER_ERROR: { message: 'Server error', severity: 'error', action: 'RETRY' },
  CONTENT_TOO_LONG: { message: 'Content exceeds token limit', detail: 'Try with a shorter input', severity: 'warn', action: 'DISMISS' },
  CONTENT_PARSE_ERROR: { message: 'Failed to parse response', severity: 'error', action: 'RETRY' },
  STORAGE_QUOTA_EXCEEDED: { message: 'Storage is full', detail: 'Delete old sessions to free space', severity: 'error', action: 'CHECK_SETTINGS' },
  STORAGE_PARSE_ERROR: { message: 'Failed to read stored data', severity: 'error', action: 'DISMISS' },
  UNKNOWN_ERROR: { message: 'An unexpected error occurred', severity: 'error', action: 'RETRY' },
}

export class HChatError extends Error {
  readonly code: HChatErrorCode
  readonly userMessage: string
  readonly action: HChatErrorAction
  readonly retryAfterMs?: number

  constructor(
    code: HChatErrorCode,
    options?: { userMessage?: string; retryAfterMs?: number },
  ) {
    const meta = ERROR_META[code]
    const userMessage = options?.userMessage ?? meta.message
    super(userMessage)
    this.name = 'HChatError'
    this.code = code
    this.userMessage = userMessage
    this.action = meta.action
    this.retryAfterMs = options?.retryAfterMs
  }
}

export function handleApiResponse(response: Response): void {
  if (response.ok) return

  switch (response.status) {
    case 401:
    case 403:
      throw new HChatError('API_KEY_INVALID')
    case 429: {
      const retryAfter = response.headers.get('retry-after')
      const retryAfterMs = retryAfter ? parseInt(retryAfter, 10) * 1000 : 60_000
      throw new HChatError('API_RATE_LIMIT', { retryAfterMs })
    }
    case 400:
      throw new HChatError('CONTENT_PARSE_ERROR', {
        userMessage: `Bad request: ${response.statusText}`,
      })
    case 408:
    case 504:
      throw new HChatError('API_TIMEOUT')
    default:
      if (response.status >= 500) {
        throw new HChatError('API_SERVER_ERROR', {
          userMessage: `Server error (${response.status})`,
        })
      }
      throw new HChatError('UNKNOWN_ERROR', {
        userMessage: `HTTP ${response.status}: ${response.statusText}`,
      })
  }
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: { maxAttempts?: number; onRetry?: (attempt: number, waitMs: number) => void } = {},
): Promise<T> {
  const { maxAttempts = 3, onRetry } = options
  let lastError: unknown

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error

      if (!(error instanceof HChatError)) throw error
      if (error.code !== 'API_RATE_LIMIT' && error.code !== 'API_SERVER_ERROR') throw error
      if (attempt === maxAttempts) throw error

      const waitMs = error.retryAfterMs ?? Math.min(1000 * Math.pow(2, attempt - 1), 10_000)
      onRetry?.(attempt, waitMs)
      await new Promise((r) => setTimeout(r, waitMs))
    }
  }

  throw lastError
}
