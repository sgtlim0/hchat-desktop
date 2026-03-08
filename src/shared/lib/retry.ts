/**
 * Retry utility with exponential backoff
 */

export interface RetryOptions {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number
  /** Base delay in milliseconds for first retry (default: 1000) */
  baseDelayMs?: number
  /** Maximum delay cap in milliseconds (default: 30000) */
  maxDelayMs?: number
  /** Backoff multiplier for each retry (default: 2) */
  backoffFactor?: number
  /** Custom function to determine if error should trigger retry */
  shouldRetry?: (error: Error, attempt: number) => boolean
  /** Callback function called before each retry attempt */
  onRetry?: (error: Error, attempt: number) => void
  /** AbortSignal to cancel retry attempts */
  signal?: AbortSignal
}

/**
 * Retry a function with exponential backoff
 *
 * @param fn - Async function to retry
 * @param options - Retry configuration options
 * @returns Promise resolving to function result or rejecting with last error
 *
 * @example
 * ```typescript
 * // Basic usage with defaults
 * const result = await retry(() => fetchData())
 *
 * // Custom configuration
 * const result = await retry(
 *   () => fetchData(),
 *   {
 *     maxRetries: 5,
 *     baseDelayMs: 500,
 *     shouldRetry: (error) => error.status !== 404,
 *     onRetry: (error, attempt) => console.log(`Retry ${attempt}: ${error.message}`)
 *   }
 * )
 * ```
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelayMs = 1000,
    maxDelayMs = 30000,
    backoffFactor = 2,
    shouldRetry = () => true,
    onRetry,
    signal
  } = options

  let lastError: Error

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Check if aborted before attempting
      if (signal?.aborted) {
        throw new Error('Retry aborted')
      }

      // Try to execute the function
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      // Don't retry if this was the last attempt
      if (attempt === maxRetries) {
        break
      }

      // Check if we should retry this error
      if (!shouldRetry(lastError, attempt + 1)) {
        throw lastError
      }

      // Call onRetry callback if provided
      if (onRetry) {
        onRetry(lastError, attempt + 1)
      }

      // Calculate delay with exponential backoff
      const baseDelay = baseDelayMs * Math.pow(backoffFactor, attempt)
      const cappedDelay = Math.min(baseDelay, maxDelayMs)

      // Add jitter (0-20% of delay) to prevent thundering herd
      const jitter = cappedDelay * Math.random() * 0.2
      const delayWithJitter = cappedDelay + jitter

      // Wait before next retry
      await delay(delayWithJitter, signal)
    }
  }

  // If we got here, all retries were exhausted
  throw lastError!
}

/**
 * Delay execution for specified milliseconds
 * @param ms - Milliseconds to delay
 * @param signal - Optional AbortSignal to cancel delay
 */
function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if already aborted
    if (signal?.aborted) {
      reject(new Error('Retry aborted'))
      return
    }

    const timeoutId = setTimeout(resolve, ms)

    // Listen for abort signal
    if (signal) {
      const abortHandler = () => {
        clearTimeout(timeoutId)
        reject(new Error('Retry aborted'))
      }
      signal.addEventListener('abort', abortHandler, { once: true })
    }
  })
}