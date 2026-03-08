/**
 * Promise utility functions for common async patterns
 */

/**
 * Wraps a promise with a timeout
 * @param promise - The promise to wrap
 * @param ms - Timeout in milliseconds
 * @returns Promise that rejects if timeout is reached
 */
export async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Promise timed out after ${ms}ms`))
    }, ms)
  })

  return Promise.race([promise, timeoutPromise])
}

/**
 * Creates a promise that resolves after specified milliseconds
 * @param ms - Delay in milliseconds
 * @returns Promise that resolves after delay
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => {
    setTimeout(resolve, ms)
  })
}

/**
 * Executes promise-returning functions with limited concurrency
 * @param tasks - Array of functions that return promises
 * @param concurrency - Maximum number of concurrent executions
 * @returns Promise that resolves with all results in order
 */
export async function promisePool<T>(
  tasks: Array<() => Promise<T>>,
  concurrency: number
): Promise<T[]> {
  if (tasks.length === 0) {
    return []
  }

  const results: T[] = new Array(tasks.length)
  let taskIndex = 0

  async function runTask(index: number): Promise<void> {
    const result = await tasks[index]()
    results[index] = result
  }

  const workers: Promise<void>[] = []

  // Start initial batch of workers
  while (taskIndex < Math.min(concurrency, tasks.length)) {
    workers.push(runTask(taskIndex++))
  }

  // Process remaining tasks
  while (taskIndex < tasks.length) {
    // Wait for any worker to complete
    await Promise.race(workers)

    // Find and remove completed worker
    const completedIndex = await Promise.race(
      workers.map((w, i) => w.then(() => i).catch(() => i))
    )
    workers.splice(completedIndex, 1)

    // Start new task
    workers.push(runTask(taskIndex++))
  }

  // Wait for all remaining workers
  await Promise.all(workers)
  return results
}

/**
 * Like Promise.allSettled but with better typing
 * @param promises - Array of promises
 * @returns Array of results with status and value/reason
 */
export async function allSettledTyped<T>(
  promises: Promise<T>[]
): Promise<Array<
  | { status: 'fulfilled'; value: T }
  | { status: 'rejected'; reason: unknown }
>> {
  const results = await Promise.allSettled(promises)

  return results.map(result => {
    if (result.status === 'fulfilled') {
      return { status: 'fulfilled' as const, value: result.value }
    } else {
      return { status: 'rejected' as const, reason: result.reason }
    }
  })
}

/**
 * Retries a function up to maxAttempts times
 * @param fn - Async function to retry
 * @param maxAttempts - Maximum number of attempts
 * @param delayMs - Optional delay between retries in milliseconds
 * @returns Promise that resolves with function result or rejects after max attempts
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxAttempts: number,
  delayMs: number = 0
): Promise<T> {
  let lastError: unknown

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error

      if (attempt < maxAttempts && delayMs > 0) {
        await delay(delayMs)
      }
    }
  }

  throw lastError
}

/**
 * Type guard to check if a value is a Promise
 * @param value - Value to check
 * @returns True if value is a Promise or promise-like object
 */
export function isPromise(value: unknown): value is Promise<unknown> {
  return (
    value !== null &&
    typeof value === 'object' &&
    'then' in value &&
    typeof value.then === 'function'
  )
}

/**
 * Creates a deferred promise with external resolve/reject controls
 * @returns Object with promise, resolve, and reject functions
 */
export function deferred<T>(): {
  promise: Promise<T>
  resolve: (value: T) => void
  reject: (reason: unknown) => void
} {
  let resolve: (value: T) => void
  let reject: (reason: unknown) => void

  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })

  return {
    promise,
    resolve: resolve!,
    reject: reject!
  }
}