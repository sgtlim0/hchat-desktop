/**
 * LLM request queue with concurrency limit and deduplication.
 *
 * - Max N concurrent requests (default 2)
 * - Same key requests are deduplicated (previous cancelled)
 * - AbortController integration for cancellation
 * - Tab/session cleanup support
 */

type JobType = 'chat' | 'translate' | 'digest' | 'extract' | 'search'

interface QueuedJob<T> {
  key: string
  fn: (signal: AbortSignal) => Promise<T>
  resolve: (value: T) => void
  reject: (reason: unknown) => void
  controller: AbortController
}

export class LLMQueue {
  private queue: QueuedJob<unknown>[] = []
  private running = new Map<string, AbortController>()
  private readonly maxConcurrent: number

  constructor(maxConcurrent = 2) {
    this.maxConcurrent = maxConcurrent
  }

  async enqueue<T>(
    sessionId: string,
    type: JobType,
    fn: (signal: AbortSignal) => Promise<T>,
  ): Promise<T> {
    const key = `${sessionId}:${type}`

    this.cancelByKey(key)

    return new Promise<T>((resolve, reject) => {
      const controller = new AbortController()

      this.queue.push({
        key,
        fn: fn as (signal: AbortSignal) => Promise<unknown>,
        resolve: resolve as (value: unknown) => void,
        reject,
        controller,
      })

      this.drain()
    })
  }

  cancelByKey(key: string): void {
    // Cancel running job
    const runningController = this.running.get(key)
    if (runningController) {
      runningController.abort()
      this.running.delete(key)
    }

    // Remove from queue
    const idx = this.queue.findIndex((job) => job.key === key)
    if (idx !== -1) {
      const [removed] = this.queue.splice(idx, 1)
      removed.controller.abort()
      removed.reject(new DOMException('Cancelled: replaced by new request', 'AbortError'))
    }
  }

  cancelBySession(sessionId: string): void {
    // Cancel all jobs for a session
    const prefix = `${sessionId}:`

    // Cancel running
    for (const [key, controller] of this.running) {
      if (key.startsWith(prefix)) {
        controller.abort()
        this.running.delete(key)
      }
    }

    // Remove from queue
    const removed = this.queue.filter((job) => job.key.startsWith(prefix))
    this.queue = this.queue.filter((job) => !job.key.startsWith(prefix))
    for (const job of removed) {
      job.controller.abort()
      job.reject(new DOMException('Cancelled: session closed', 'AbortError'))
    }
  }

  cancelAll(): void {
    for (const controller of this.running.values()) {
      controller.abort()
    }
    this.running.clear()

    for (const job of this.queue) {
      job.controller.abort()
      job.reject(new DOMException('Cancelled: queue cleared', 'AbortError'))
    }
    this.queue = []
  }

  get pendingCount(): number {
    return this.queue.length
  }

  get runningCount(): number {
    return this.running.size
  }

  private drain(): void {
    while (this.running.size < this.maxConcurrent && this.queue.length > 0) {
      const job = this.queue.shift()!
      this.executeJob(job)
    }
  }

  private async executeJob(job: QueuedJob<unknown>): Promise<void> {
    this.running.set(job.key, job.controller)

    try {
      const result = await job.fn(job.controller.signal)
      if (!job.controller.signal.aborted) {
        job.resolve(result)
      }
    } catch (error) {
      if (!job.controller.signal.aborted) {
        job.reject(error)
      }
    } finally {
      this.running.delete(job.key)
      this.drain()
    }
  }
}

export const llmQueue = new LLMQueue(2)
