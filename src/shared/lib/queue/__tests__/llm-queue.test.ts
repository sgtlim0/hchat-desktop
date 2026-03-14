import { describe, it, expect, vi, beforeEach } from 'vitest'
import { LLMQueue } from '../llm-queue'

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

describe('LLMQueue', () => {
  let queue: LLMQueue

  beforeEach(() => {
    queue = new LLMQueue(2)
  })

  describe('basic enqueue', () => {
    it('should execute a single job', async () => {
      const result = await queue.enqueue('s1', 'chat', async () => 'hello')
      expect(result).toBe('hello')
    })

    it('should pass AbortSignal to job function', async () => {
      let receivedSignal: AbortSignal | null = null
      await queue.enqueue('s1', 'chat', async (signal) => {
        receivedSignal = signal
        return 'ok'
      })
      expect(receivedSignal).toBeInstanceOf(AbortSignal)
    })

    it('should execute jobs in FIFO order', async () => {
      const order: number[] = []
      const q = new LLMQueue(1)

      const p1 = q.enqueue('s1', 'chat', async () => { order.push(1); return 1 })
      const p2 = q.enqueue('s2', 'chat', async () => { order.push(2); return 2 })
      const p3 = q.enqueue('s3', 'chat', async () => { order.push(3); return 3 })

      await Promise.all([p1, p2, p3])
      expect(order).toEqual([1, 2, 3])
    })
  })

  describe('concurrency', () => {
    it('should respect max concurrent limit', async () => {
      let concurrent = 0
      let maxConcurrent = 0

      const job = async () => {
        concurrent++
        maxConcurrent = Math.max(maxConcurrent, concurrent)
        await delay(10)
        concurrent--
        return 'ok'
      }

      await Promise.all([
        queue.enqueue('s1', 'chat', job),
        queue.enqueue('s2', 'chat', job),
        queue.enqueue('s3', 'chat', job),
        queue.enqueue('s4', 'chat', job),
      ])

      expect(maxConcurrent).toBe(2)
    })

    it('should drain queue as jobs complete', async () => {
      const results: string[] = []
      const q = new LLMQueue(1)

      await Promise.all([
        q.enqueue('s1', 'chat', async () => { results.push('a'); return 'a' }),
        q.enqueue('s2', 'chat', async () => { results.push('b'); return 'b' }),
      ])

      expect(results).toEqual(['a', 'b'])
    })
  })

  describe('deduplication', () => {
    it('should cancel previous queued job with same key', async () => {
      const q = new LLMQueue(1)

      // First job runs, second is queued, third replaces second
      const p1 = q.enqueue('s1', 'chat', async () => 'first')
      const p2 = q.enqueue('s1', 'chat', async () => 'second') // queued, then cancelled

      // p2 was cancelled because p1 is running with same key and p2 replaces it
      // Actually p1 key = s1:chat, p2 key = s1:chat → p1 cancelled from queue
      const result2 = await p2
      expect(result2).toBe('second')
    })

    it('should not cancel jobs with different keys', async () => {
      const results: string[] = []

      await Promise.all([
        queue.enqueue('s1', 'chat', async () => { results.push('s1'); return 's1' }),
        queue.enqueue('s2', 'chat', async () => { results.push('s2'); return 's2' }),
      ])

      expect(results).toContain('s1')
      expect(results).toContain('s2')
    })

    it('should allow same session with different types', async () => {
      const results: string[] = []

      await Promise.all([
        queue.enqueue('s1', 'chat', async () => { results.push('chat'); return 'chat' }),
        queue.enqueue('s1', 'translate', async () => { results.push('translate'); return 'translate' }),
      ])

      expect(results).toContain('chat')
      expect(results).toContain('translate')
    })
  })

  describe('cancellation', () => {
    it('should cancel queued jobs for a session', () => {
      const q = new LLMQueue(1)

      // Enqueue jobs — first runs, second+third queued
      q.enqueue('s1', 'chat', async (signal) => {
        await new Promise((_, reject) => { signal.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError'))) })
      }).catch(() => {})
      q.enqueue('s1', 'translate', async () => 'b').catch(() => {})

      expect(q.pendingCount).toBe(1)
      q.cancelBySession('s1')
      expect(q.pendingCount).toBe(0)
    })

    it('should cancel all queued jobs', () => {
      queue.enqueue('s1', 'chat', async (signal) => {
        await new Promise((_, reject) => { signal.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError'))) })
      }).catch(() => {})
      queue.enqueue('s2', 'chat', async (signal) => {
        await new Promise((_, reject) => { signal.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError'))) })
      }).catch(() => {})
      queue.enqueue('s3', 'chat', async () => 'c').catch(() => {})

      queue.cancelAll()
      expect(queue.runningCount).toBe(0)
      expect(queue.pendingCount).toBe(0)
    })
  })

  describe('error handling', () => {
    it('should propagate job errors', async () => {
      await expect(
        queue.enqueue('s1', 'chat', async () => { throw new Error('fail') }),
      ).rejects.toThrow('fail')
    })

    it('should continue processing after a job fails', async () => {
      const q = new LLMQueue(1)

      const p1 = q.enqueue('s1', 'chat', async () => { throw new Error('fail') }).catch(() => 'caught')
      const p2 = q.enqueue('s2', 'chat', async () => 'success')

      expect(await p1).toBe('caught')
      expect(await p2).toBe('success')
    })
  })

  describe('metrics', () => {
    it('should track pending and running counts', async () => {
      const q = new LLMQueue(1)
      let resolveFirst!: () => void
      const blocker = new Promise<void>((r) => { resolveFirst = r })

      const p1 = q.enqueue('s1', 'chat', async () => { await blocker; return 'a' })
      q.enqueue('s2', 'chat', async () => 'b')

      // s1 running, s2 pending
      expect(q.runningCount).toBe(1)
      expect(q.pendingCount).toBe(1)

      resolveFirst()
      await p1
      await delay(5)

      expect(q.runningCount).toBe(0)
      expect(q.pendingCount).toBe(0)
    })
  })
})
