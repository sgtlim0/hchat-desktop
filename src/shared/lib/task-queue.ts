interface QueuedTask<T> {
  fn: () => Promise<T>
  resolve: (value: T) => void
  reject: (reason: unknown) => void
}

export interface TaskQueueOptions {
  concurrency?: number
  autoStart?: boolean
}

type CompleteListener = (result: unknown) => void

export class TaskQueue {
  private queue: QueuedTask<unknown>[] = []
  private running = 0
  private paused: boolean
  private readonly concurrency: number
  private readonly completeListeners = new Set<CompleteListener>()
  private drainResolvers: Array<() => void> = []

  constructor(options?: TaskQueueOptions) {
    this.concurrency = options?.concurrency ?? 3
    this.paused = !(options?.autoStart ?? true)
  }

  enqueue<T>(task: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push({ fn: task as () => Promise<unknown>, resolve: resolve as (v: unknown) => void, reject })
      this.process()
    })
  }

  pause(): void {
    this.paused = true
  }

  resume(): void {
    this.paused = false
    this.process()
  }

  clear(): void {
    this.queue = []
  }

  async drain(): Promise<void> {
    if (this.queue.length === 0 && this.running === 0) return
    return new Promise<void>((resolve) => {
      this.drainResolvers.push(resolve)
    })
  }

  getQueueSize(): number {
    return this.queue.length
  }

  getRunningCount(): number {
    return this.running
  }

  onComplete(cb: CompleteListener): () => void {
    this.completeListeners.add(cb)
    return () => this.completeListeners.delete(cb)
  }

  private async process(): Promise<void> {
    if (this.paused) return
    while (this.running < this.concurrency && this.queue.length > 0) {
      const task = this.queue.shift()!
      this.running++
      task.fn()
        .then((result) => {
          task.resolve(result)
          for (const listener of this.completeListeners) listener(result)
        })
        .catch((err) => task.reject(err))
        .finally(() => {
          this.running--
          this.process()
          if (this.running === 0 && this.queue.length === 0) {
            for (const r of this.drainResolvers) r()
            this.drainResolvers = []
          }
        })
    }
  }
}

export function createTaskQueue(options?: TaskQueueOptions): TaskQueue {
  return new TaskQueue(options)
}
