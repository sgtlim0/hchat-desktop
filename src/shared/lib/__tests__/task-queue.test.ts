import { describe, it, expect, vi } from 'vitest'
import { createTaskQueue } from '../task-queue'

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

describe('task-queue', () => {
  it('processes task', async () => {
    const q = createTaskQueue()
    const result = await q.enqueue(() => Promise.resolve(42))
    expect(result).toBe(42)
  })

  it('FIFO order with concurrency 1', async () => {
    const order: number[] = []
    const q = createTaskQueue({ concurrency: 1 })
    await Promise.all([
      q.enqueue(async () => { order.push(1) }),
      q.enqueue(async () => { order.push(2) }),
      q.enqueue(async () => { order.push(3) }),
    ])
    expect(order).toEqual([1, 2, 3])
  })

  it('respects concurrency', async () => {
    let max = 0, cur = 0
    const q = createTaskQueue({ concurrency: 2 })
    await Promise.all(Array.from({ length: 5 }, () =>
      q.enqueue(async () => { cur++; max = Math.max(max, cur); await delay(10); cur-- })
    ))
    expect(max).toBeLessThanOrEqual(2)
  })

  it('onComplete fires', async () => {
    const q = createTaskQueue()
    const cb = vi.fn()
    q.onComplete(cb)
    await q.enqueue(() => Promise.resolve('done'))
    expect(cb).toHaveBeenCalledWith('done')
  })

  it('clear removes pending', () => {
    const q = createTaskQueue({ concurrency: 1 })
    q.enqueue(() => delay(100))
    q.enqueue(() => delay(100))
    q.clear()
    expect(q.getQueueSize()).toBe(0)
  })

  it('drain waits for completion', async () => {
    const q = createTaskQueue()
    const results: number[] = []
    q.enqueue(async () => { await delay(10); results.push(1) })
    q.enqueue(async () => { await delay(10); results.push(2) })
    await q.drain()
    expect(results).toHaveLength(2)
  })

  it('getRunningCount tracks active', async () => {
    const q = createTaskQueue({ concurrency: 3 })
    q.enqueue(() => delay(50))
    q.enqueue(() => delay(50))
    await delay(5)
    expect(q.getRunningCount()).toBeGreaterThan(0)
  })
})
